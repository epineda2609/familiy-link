import type { PersonStatus, PublicPersonCard } from "../../domain/types";
import {
  confidenceLevel,
  type MatchExplanation,
  type MatchField,
  type RecommendedAction,
  type ReviewState,
} from "../../domain/match";
import { mockPeople } from "./people";

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

function locFirst(s?: string): string {
  return (s ?? "").toLowerCase().split(",")[0].trim();
}

function buildFields(a: PublicPersonCard, b: PublicPersonCard): MatchField[] {
  const fields: MatchField[] = [];
  // Age
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
  } else {
    fields.push({
      key: "age",
      valueA: ageA ? `~${ageA}` : "—",
      valueB: ageB ? `~${ageB}` : "—",
      agreement: "unknown",
    });
  }
  // Gender
  fields.push({
    key: "gender",
    valueA: a.gender,
    valueB: b.gender,
    agreement: a.gender === b.gender ? "match" : "contradict",
  });
  // Location
  const la = locFirst(a.lastSeenLocation);
  const lb = locFirst(b.lastSeenLocation);
  if (la && lb) {
    fields.push({
      key: "location",
      valueA: a.lastSeenLocation ?? "—",
      valueB: b.lastSeenLocation ?? "—",
      agreement: la === lb ? "match" : "contradict",
    });
  } else {
    fields.push({
      key: "location",
      valueA: a.lastSeenLocation ?? "—",
      valueB: b.lastSeenLocation ?? "—",
      agreement: "unknown",
    });
  }
  // Disaster
  fields.push({
    key: "disaster",
    valueA: a.disasterId,
    valueB: b.disasterId,
    agreement: a.disasterId === b.disasterId ? "match" : "contradict",
  });
  // Features
  const fa = a.distinctiveFeatures?.trim() ?? "";
  const fb = b.distinctiveFeatures?.trim() ?? "";
  if (fa && fb) {
    const overlap = fa
      .toLowerCase()
      .split(/[\s,]+/)
      .some((w) => w.length > 3 && fb.toLowerCase().includes(w));
    fields.push({
      key: "features",
      valueA: fa,
      valueB: fb,
      agreement: overlap ? "partial" : "contradict",
    });
  } else {
    fields.push({
      key: "features",
      valueA: fa || "—",
      valueB: fb || "—",
      agreement: "unknown",
    });
  }
  return fields;
}

function recommendation(
  score: number,
  contradictions: number,
): { review: ReviewState; action: RecommendedAction } {
  if (contradictions >= 2) {
    return { review: "pending", action: "markNoMatch" };
  }
  if (score >= 85 && contradictions === 0) {
    return { review: "pending", action: "approveNow" };
  }
  if (score >= 60) {
    return { review: "pending", action: "requestValidation" };
  }
  return { review: "needsAuthority", action: "escalateAuthority" };
}

function computeCandidates(): MatchCandidate[] {
  const complementary = (a: PersonStatus, b: PersonStatus) =>
    (a === "missing" && (b === "found" || b === "searching")) ||
    (a === "searching" && b === "found");

  const out: MatchCandidate[] = [];
  for (let i = 0; i < mockPeople.length; i++) {
    for (let j = 0; j < mockPeople.length; j++) {
      if (i === j) continue;
      const a = mockPeople[i];
      const b = mockPeople[j];
      if (a.disasterId !== b.disasterId) continue;
      if (a.gender !== b.gender) continue;
      if (!complementary(a.status, b.status)) continue;

      const ageA = a.approximateAge ?? -100;
      const ageB = b.approximateAge ?? 100;
      const ageDiff = Math.abs(ageA - ageB);
      if (ageDiff > 5) continue;

      const reasons: string[] = [
        "same_disaster",
        "same_gender",
        `age_diff_${ageDiff}`,
      ];
      let score = 100 - ageDiff * 8;
      if (locFirst(a.lastSeenLocation) && locFirst(a.lastSeenLocation) === locFirst(b.lastSeenLocation)) {
        score += 10;
        reasons.push("same_location");
      }
      score = Math.max(0, Math.min(100, score));

      const fields = buildFields(a, b);
      const contradictions = fields.filter((f) => f.agreement === "contradict");
      const { review, action } = recommendation(score, contradictions.length);

      // Determine kind: exact if all match; probabilistic if any partial; narrative if features carry weight.
      const allMatch = fields.every(
        (f) => f.agreement === "match" || f.agreement === "unknown",
      );
      const hasFeaturesSignal = fields.find(
        (f) => f.key === "features" && f.agreement !== "unknown",
      );
      const kind = allMatch
        ? "exact"
        : hasFeaturesSignal
          ? "narrative"
          : "probabilistic";

      out.push({
        id: `m-${a.id}-${b.id}`,
        personA_id: a.id,
        personB_id: b.id,
        score,
        reasons,
        status: "pending",
        explanation: {
          kind,
          score,
          fields,
          contradictions,
          reportedBy: `BASUF · ${confidenceLevel(score)}-signal engine`,
          reviewState: review,
          recommendedAction: action,
        },
      });
    }
  }
  const seen = new Map<string, MatchCandidate>();
  for (const m of out) {
    const key = [m.personA_id, m.personB_id].sort().join("|");
    const prev = seen.get(key);
    if (!prev || m.score > prev.score) seen.set(key, m);
  }
  return Array.from(seen.values()).sort((a, b) => b.score - a.score);
}

export const mockMatches: MatchCandidate[] = computeCandidates();

if (mockMatches[0]) {
  mockMatches[0] = {
    ...mockMatches[0],
    status: "approved",
    reviewedBy: "Cruz Roja Latinoamérica",
    reviewedAt: "2025-05-10",
    explanation: {
      ...mockMatches[0].explanation,
      reviewState: "approved",
      visualSimilarity: {
        level: "medium",
        note: "Rasgos generales compatibles (cabello, contorno facial).",
      },
    },
  };
}
if (mockMatches[1]) {
  mockMatches[1] = {
    ...mockMatches[1],
    explanation: {
      ...mockMatches[1].explanation,
      visualSimilarity: {
        level: "low",
        note: "Baja similitud visual — foto de baja calidad.",
      },
    },
  };
}
if (mockMatches[mockMatches.length - 1] && mockMatches.length > 1) {
  const last = mockMatches.length - 1;
  mockMatches[last] = {
    ...mockMatches[last],
    status: "rejected",
    reviewedBy: "ACNUR Regional",
    reviewedAt: "2025-05-11",
    note: "No coincide edad exacta reportada por familiar.",
    explanation: { ...mockMatches[last].explanation, reviewState: "rejected" },
  };
}
