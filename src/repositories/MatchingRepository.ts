// BASUF — Matching repository backed by Lovable Cloud.
// Reads/writes potential_matches (Cloud is the source of truth). The cloud
// `explanation` JSONB stores the full MatchExplanation object when available;
// otherwise we synthesize a minimal explanation from match_score + persons.
import { supabase } from "../integrations/supabase/client";
import type { PublicPersonCard, PersonStatus, Gender } from "../domain/types";
import {
  confidenceLevel,
  type MatchExplanation,
  type MatchField,
  type MatchKind,
  type RecommendedAction,
  type ReviewState,
} from "../domain/match";

export type MatchStatus = "pending" | "approved" | "rejected";

export interface MatchCandidate {
  id: string;
  personA_id: string;
  personB_id: string;
  score: number;
  reasons: string[];
  status: MatchStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  note?: string;
  explanation: MatchExplanation;
}

export interface EnrichedMatch extends MatchCandidate {
  personA: PublicPersonCard | null;
  personB: PublicPersonCard | null;
}

export interface IMatchingRepository {
  list(): Promise<EnrichedMatch[]>;
  approve(id: string, reviewedBy: string, note?: string): Promise<EnrichedMatch | null>;
  reject(id: string, reviewedBy: string, note?: string): Promise<EnrichedMatch | null>;
  reset(id: string): Promise<EnrichedMatch | null>;
}

// ---------- Status mapping ----------
type CloudStatus = "suggested" | "pending_review" | "confirmed" | "rejected" | "merged";

function toUiStatus(s: CloudStatus): MatchStatus {
  if (s === "confirmed" || s === "merged") return "approved";
  if (s === "rejected") return "rejected";
  return "pending";
}

// ---------- Person mapping (Cloud persons row → PublicPersonCard) ----------
type CloudPersonRow = {
  id: string;
  display_name: string;
  approximate_age: number | null;
  gender: string | null;
  current_status: string | null;
  event_id: string | null;
  country: string;
  nationality: string | null;
  document_number: string | null;
  distinguishing_features: string | null;
  photo_url: string | null;
  reported_at: string | null;
};

function normGender(g: string | null): Gender {
  return g === "male" ? "m" : g === "female" ? "f" : "o";
}

function normStatus(s: string | null): PersonStatus {
  switch (s) {
    case "reunited":
      return "reunited";
    case "located":
    case "identified":
    case "contacted":
    case "found":
      return "found";
    case "searching":
    case "possible_match":
    case "information_received":
      return "searching";
    default:
      return "missing";
  }
}

function mapPerson(row: CloudPersonRow | null | undefined): PublicPersonCard | null {
  if (!row) return null;
  return {
    id: row.id,
    displayName: row.display_name,
    approximateAge: row.approximate_age ?? undefined,
    gender: normGender(row.gender),
    status: normStatus(row.current_status),
    disasterId: row.event_id ?? "",
    country: row.country,
    nationality: row.nationality ?? undefined,
    documentId: row.document_number ?? undefined,
    distinctiveFeatures: row.distinguishing_features ?? undefined,
    photoPublicUrl: row.photo_url ?? undefined,
    reportedAt: (row.reported_at ?? "").slice(0, 10),
  };
}

// ---------- Explanation synthesis (when cloud row has none) ----------
function locFirst(s?: string): string {
  return (s ?? "").toLowerCase().split(",")[0].trim();
}

function buildFields(a: PublicPersonCard, b: PublicPersonCard): MatchField[] {
  const fields: MatchField[] = [];
  const ageA = a.approximateAge;
  const ageB = b.approximateAge;
  if (ageA != null && ageB != null) {
    const diff = Math.abs(ageA - ageB);
    fields.push({
      key: "age",
      valueA: `~${ageA}`,
      valueB: `~${ageB}`,
      agreement: diff === 0 ? "match" : diff <= 5 ? "partial" : "contradict",
    });
  }
  fields.push({
    key: "gender",
    valueA: a.gender,
    valueB: b.gender,
    agreement: a.gender === b.gender ? "match" : "contradict",
  });
  const la = locFirst(a.lastSeenLocation);
  const lb = locFirst(b.lastSeenLocation);
  if (la && lb) {
    fields.push({
      key: "location",
      valueA: a.lastSeenLocation ?? "—",
      valueB: b.lastSeenLocation ?? "—",
      agreement: la === lb ? "match" : "contradict",
    });
  }
  fields.push({
    key: "disaster",
    valueA: a.disasterId,
    valueB: b.disasterId,
    agreement: a.disasterId === b.disasterId ? "match" : "contradict",
  });
  if (a.documentId && b.documentId) {
    fields.push({
      key: "document",
      valueA: a.documentId,
      valueB: b.documentId,
      agreement: a.documentId === b.documentId ? "match" : "contradict",
    });
  }
  return fields;
}

function recommendedFor(score: number, hasContradiction: boolean): RecommendedAction {
  if (hasContradiction) return "needsAuthority";
  const level = confidenceLevel(score);
  if (level === "high") return "approve";
  if (level === "medium") return "review";
  return "reject";
}

function synthesizeExplanation(
  score: number,
  reviewState: ReviewState,
  personA: PublicPersonCard | null,
  personB: PublicPersonCard | null,
  matchingFields: Record<string, unknown> | null,
): MatchExplanation {
  const fields = personA && personB ? buildFields(personA, personB) : [];
  const contradictions = fields.filter((f) => f.agreement === "contradict");
  const kind: MatchKind =
    matchingFields && matchingFields.doc_match ? "exact" : "probabilistic";
  return {
    kind,
    score,
    fields,
    contradictions,
    reportedBy: "rule_engine_v1",
    reviewState,
    recommendedAction: recommendedFor(score, contradictions.length > 0),
  };
}

// ---------- Row → EnrichedMatch ----------
type MatchRow = {
  id: string;
  source_person_id: string;
  matched_person_id: string;
  match_score: number;
  matching_fields: Record<string, unknown> | null;
  explanation: unknown; // stored MatchExplanation JSON or plain text
  status: CloudStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  source_person: CloudPersonRow | null;
  matched_person: CloudPersonRow | null;
};

function isFullExplanation(x: unknown): x is MatchExplanation {
  return (
    !!x &&
    typeof x === "object" &&
    "fields" in (x as object) &&
    "kind" in (x as object) &&
    Array.isArray((x as { fields: unknown }).fields)
  );
}

function toEnriched(row: MatchRow): EnrichedMatch {
  const personA = mapPerson(row.source_person);
  const personB = mapPerson(row.matched_person);
  const uiStatus = toUiStatus(row.status);
  const reviewState: ReviewState =
    uiStatus === "approved" ? "approved" : uiStatus === "rejected" ? "rejected" : "pending";
  const score = Number(row.match_score) || 0;
  const explanation: MatchExplanation = isFullExplanation(row.explanation)
    ? { ...row.explanation, reviewState }
    : synthesizeExplanation(score, reviewState, personA, personB, row.matching_fields);

  // Persist reviewer note if it lives inside explanation
  const note =
    isFullExplanation(row.explanation) &&
    typeof (row.explanation as { note?: unknown }).note === "string"
      ? ((row.explanation as { note?: string }).note as string)
      : undefined;

  return {
    id: row.id,
    personA_id: row.source_person_id,
    personB_id: row.matched_person_id,
    score,
    reasons: [],
    status: uiStatus,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ? row.reviewed_at.slice(0, 10) : undefined,
    note,
    explanation,
    personA,
    personB,
  };
}

const PERSON_COLS =
  "id, display_name, approximate_age, gender, current_status, event_id, country, nationality, document_number, distinguishing_features, photo_url, reported_at";

const SELECT_MATCH =
  `id, source_person_id, matched_person_id, match_score, matching_fields, explanation, status, reviewed_by, reviewed_at,` +
  ` source_person:persons!potential_matches_source_person_id_fkey(${PERSON_COLS}),` +
  ` matched_person:persons!potential_matches_matched_person_id_fkey(${PERSON_COLS})`;

class CloudMatchingRepository implements IMatchingRepository {
  async list(): Promise<EnrichedMatch[]> {
    const { data, error } = await supabase
      .from("potential_matches")
      .select(SELECT_MATCH)
      .order("match_score", { ascending: false });
    if (error) {
      console.warn("[matching] list failed:", error.message);
      return [];
    }
    return (data as unknown as MatchRow[]).map(toEnriched);
  }

  private async fetchOne(id: string): Promise<EnrichedMatch | null> {
    const { data, error } = await supabase
      .from("potential_matches")
      .select(SELECT_MATCH)
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return toEnriched(data as unknown as MatchRow);
  }

  private async persist(
    id: string,
    patch: {
      status: CloudStatus;
      reviewedBy?: string;
      reviewState: ReviewState;
      note?: string;
    },
  ): Promise<EnrichedMatch | null> {
    // Read current explanation to preserve full object if present
    const { data: current } = await supabase
      .from("potential_matches")
      .select("explanation")
      .eq("id", id)
      .maybeSingle();
    let nextExplanation: unknown = current?.explanation ?? null;
    if (isFullExplanation(nextExplanation)) {
      nextExplanation = {
        ...(nextExplanation as MatchExplanation),
        reviewState: patch.reviewState,
        note: patch.note ?? undefined,
      };
    } else {
      // preserve as text but attach reviewState + note as a JSON wrapper
      nextExplanation = {
        text: typeof current?.explanation === "string" ? current.explanation : null,
        reviewState: patch.reviewState,
        note: patch.note ?? undefined,
      };
    }

    const update: Record<string, unknown> = {
      status: patch.status,
      reviewed_by: patch.reviewedBy ?? null,
      reviewed_at:
        patch.status === "suggested" ? null : new Date().toISOString(),
      explanation: nextExplanation,
    };
    const { error } = await supabase
      .from("potential_matches")
      .update(update)
      .eq("id", id);
    if (error) {
      console.warn("[matching] update failed:", error.message);
      return null;
    }
    return this.fetchOne(id);
  }

  private async markReunited(personId: string) {
    const { error } = await supabase
      .from("persons")
      .update({ current_status: "reunited" })
      .eq("id", personId);
    if (error) console.warn("[matching] reunite update failed:", error.message);
  }

  async approve(id: string, reviewedBy: string, note?: string) {
    const enriched = await this.fetchOne(id);
    if (!enriched) return null;
    await this.markReunited(enriched.personA_id);
    await this.markReunited(enriched.personB_id);
    return this.persist(id, {
      status: "confirmed",
      reviewedBy,
      reviewState: "approved",
      note,
    });
  }

  async reject(id: string, reviewedBy: string, note?: string) {
    return this.persist(id, {
      status: "rejected",
      reviewedBy,
      reviewState: "rejected",
      note,
    });
  }

  async reset(id: string) {
    return this.persist(id, {
      status: "suggested",
      reviewedBy: undefined,
      reviewState: "pending",
      note: undefined,
    });
  }
}

export const matchingRepository: IMatchingRepository = new CloudMatchingRepository();
