// BASUF — Institutional repository backed by Lovable Cloud.
// Reads the same 18 consolidated `persons` rows the public search sees, and
// decorates each with reporter/organization info that is only visible to
// authenticated institutional users (RLS enforces this on the server).
import type { PublicPersonCard, PersonStatus, Gender } from "../domain/types";
import { supabase } from "../integrations/supabase/client";

export interface SensitivePersonData {
  reporterName: string;
  reporterContact: string;
  internalNotes?: string;
  verified: boolean;
}

export interface InstitutionalCase extends PublicPersonCard {
  sensitive: SensitivePersonData | null;
}

export interface IInstitutionalRepository {
  listAll(): Promise<InstitutionalCase[]>;
  getById(id: string): Promise<InstitutionalCase | null>;
  updateStatus(id: string, status: PersonStatus): Promise<InstitutionalCase | null>;
  setVerified(id: string, verified: boolean): Promise<InstitutionalCase | null>;
}

interface Row {
  id: string;
  display_name: string;
  approximate_age: number | null;
  gender: string | null;
  current_status: string;
  event_id: string | null;
  country: string;
  nationality: string | null;
  document_number: string | null;
  distinguishing_features: string | null;
  photo_url: string | null;
  reported_at: string;
  reporter_name: string | null;
  reporter_contact: string | null;
  reported_by_organization_id: string | null;
  disappearance_details:
    | { last_seen_location: string | null; last_seen_date: string | null }[]
    | null;
  organizations: { name: string } | { name: string }[] | null;
  verification_reviews: { decision: string }[] | null;
}

const SELECT =
  "id, display_name, approximate_age, gender, current_status, event_id, country, nationality, document_number, distinguishing_features, photo_url, reported_at, reporter_name, reporter_contact, reported_by_organization_id, disappearance_details(last_seen_location, last_seen_date), organizations:reported_by_organization_id(name), verification_reviews(decision)";

function normGender(g: string | null): Gender {
  return g === "f" || g === "m" || g === "o" ? g : "o";
}
function normStatus(s: string): PersonStatus {
  if (s === "reunited") return "reunited";
  if (s === "searching" || s === "possible_match" || s === "information_received")
    return "searching";
  if (s === "found" || s === "located" || s === "identified" || s === "contacted")
    return "found";
  return "missing";
}

function mapRow(row: Row): InstitutionalCase {
  const dd = row.disappearance_details?.[0];
  const org = Array.isArray(row.organizations)
    ? row.organizations[0]
    : row.organizations;
  const reporterName =
    row.reporter_name?.trim() || org?.name || "Reporte institucional";
  const reporterContact = row.reporter_contact?.trim() || "";
  const hasSensitive = Boolean(reporterName || reporterContact);
  const verified = (row.verification_reviews ?? []).some(
    (r) => r.decision === "approved",
  );
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
    lastSeenLocation: dd?.last_seen_location ?? undefined,
    lastSeenAt: dd?.last_seen_date ?? undefined,
    distinctiveFeatures: row.distinguishing_features ?? undefined,
    photoPublicUrl: row.photo_url ?? undefined,
    reportedAt: (row.reported_at ?? "").slice(0, 10),
    sensitive: hasSensitive
      ? {
          reporterName,
          reporterContact: reporterContact || "—",
          internalNotes: org ? `Organización: ${org.name}` : undefined,
          verified,
        }
      : null,
  };
}

// Public → DB state. We keep public state ("found") mapped to DB "located"
// so the institutional canonical wording matches the schema.
function toDbStatus(s: PersonStatus): string {
  return s === "found" ? "located" : s;
}

class CloudInstitutionalRepository implements IInstitutionalRepository {
  async listAll(): Promise<InstitutionalCase[]> {
    const sel: string = SELECT;
    const { data, error } = await supabase
      .from("persons")
      .select(sel)
      .is("archived_at", null)
      .order("reported_at", { ascending: false })
      .limit(200)
      .returns<Row[]>();
    if (error) {
      console.error("[institutional.listAll]", error);
      return [];
    }
    return (data ?? []).map(mapRow);
  }
  async getById(id: string): Promise<InstitutionalCase | null> {
    const sel: string = SELECT;
    const { data, error } = await supabase
      .from("persons")
      .select(sel)
      .eq("id", id)
      .maybeSingle()
      .returns<Row | null>();
    if (error) {
      console.error("[institutional.getById]", error);
      return null;
    }
    return data ? mapRow(data) : null;
  }
  async updateStatus(id: string, status: PersonStatus) {
    const { error } = await supabase
      .from("persons")
      .update({ current_status: toDbStatus(status) as PersonStatus })
      .eq("id", id);
    if (error) console.error("[institutional.updateStatus]", error);
    return this.getById(id);
  }
  async setVerified(id: string, verified: boolean) {
    if (verified) {
      const { error } = await supabase.from("verification_reviews").insert({
        person_id: id,
        decision: "approved",
      });
      if (error) console.error("[institutional.setVerified.insert]", error);
    } else {
      const { error } = await supabase
        .from("verification_reviews")
        .delete()
        .eq("person_id", id)
        .eq("decision", "approved");
      if (error) console.error("[institutional.setVerified.delete]", error);
    }
    return this.getById(id);
  }
}

export const institutionalRepository: IInstitutionalRepository =
  new CloudInstitutionalRepository();
