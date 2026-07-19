// BASUF — Capa de persistencia hacia Lovable Cloud.
// Los repositorios siguen manteniendo su cache local (mock/localStorage) para
// mantener la UX actual, pero cualquier acción relevante también se persiste
// en la base de datos para que sobreviva a recargas y esté disponible para
// paneles institucionales, auditoría y coincidencias.
import { supabase } from "@/integrations/supabase/client";
import type { PublicPersonCard, Disaster } from "@/domain/types";
import type { CaseUpdateRecord } from "@/repositories/CaseUpdateRepository";
import type { AuditEntry } from "@/audit/auditLog";

const isBrowser = typeof window !== "undefined";

/** Fire-and-forget: registra errores pero no lanza para no romper la UI. */
async function safe<T>(builder: PromiseLike<T>): Promise<T | null> {
  try {
    return await builder;
  } catch (err) {
    if (isBrowser) console.warn("[cloudSync]", (err as Error)?.message ?? err);
    return null;
  }
}

export const cloudSync = {
  async persistPerson(p: PublicPersonCard, extra?: {
    reporterName?: string;
    reporterContact?: string;
  }) {
    if (!isBrowser) return;
    await safe(
      supabase
        .from("persons")
        .insert({
          display_name: p.displayName,
          approximate_age: p.approximateAge ?? null,
          gender: p.gender,
          country: p.country,
          nationality: p.nationality ?? null,
          document_number: p.documentId ?? null,
          distinguishing_features: p.distinctiveFeatures ?? null,
          current_status: p.status === "missing" ? "missing"
            : p.status === "searching" ? "searching"
            : p.status === "found" ? "located"
            : p.status === "reunited" ? "reunited" : "missing",
          privacy_level: "public",
          reporter_name: extra?.reporterName ?? null,
          reporter_contact: extra?.reporterContact ?? null,
        })
        .select("id")
        .maybeSingle(),
    );
  },

  async persistDisaster(d: Disaster) {
    if (!isBrowser) return;
    await safe(
      supabase.from("disaster_events").insert({
        name: d.name,
        event_type: d.type,
        custom_type: d.customType ?? null,
        country: d.country,
        region: d.region ?? null,
        start_date: d.startedAt,
        status: (d.state ?? "active") as "active" | "closed" | "archived",
        magnitude: d.magnitude ?? null,
        affected_estimate: d.affectedEstimate ?? null,
        fatalities: d.fatalities ?? null,
        missing_count: d.missing ?? null,
        description: d.description ?? null,
      }),
    );
  },

  async persistCaseUpdate(u: CaseUpdateRecord) {
    if (!isBrowser) return;
    // Resolver person_id desde el public_case_code / id local: para casos
    // demo (p-xxx) no existirá en Cloud todavía; en ese caso se omite.
    const res = await safe(
      supabase
        .from("persons")
        .select("id")
        .or(`id.eq.${u.caseId},public_case_code.eq.${u.caseId}`)
        .maybeSingle(),
    );
    const person = res?.data ?? null;
    if (!person) return;
    await safe(
      supabase.from("additional_information_reports").insert({
        person_id: person.id,
        submitted_by_name: u.reporter.anonymous ? null : u.reporter.name ?? null,
        submitted_by_email: u.reporter.anonymous ? null : u.reporter.email ?? null,
        submitted_by_phone: u.reporter.anonymous ? null : u.reporter.phone ?? null,
        information_type: u.proposedStatus || "sighting",
        description: [u.lastSeen.description, u.identity.notes].filter(Boolean).join("\n\n") || "Aporte ciudadano",
        sighting_date: u.lastSeen.date ? new Date(u.lastSeen.date).toISOString() : null,
        sighting_location: [u.lastSeen.city, u.lastSeen.location].filter(Boolean).join(" · ") || null,
        anonymity_requested: u.reporter.anonymous,
        status: "received",
      }),
    );
  },

  async persistAudit(entry: AuditEntry) {
    if (!isBrowser) return;
    await safe(
      supabase.from("audit_logs").insert({
        actor_name: entry.actor.operatorName,
        actor_org: entry.actor.orgName,
        actor_role: entry.actor.role,
        action: entry.action,
        entity_id: entry.targetId && /^[0-9a-f-]{36}$/i.test(entry.targetId) ? entry.targetId : null,
        target_label: entry.targetLabel ?? entry.targetId ?? null,
        metadata: entry.metadata ?? null,
      }),
    );
  },

  /** Lista organizaciones aprobadas desde Cloud (para el selector institucional). */
  async listApprovedOrganizations() {
    if (!isBrowser) return [];
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name, short_name, country, organization_type, status")
      .eq("status", "approved")
      .order("name");
    if (error) {
      console.warn("[cloudSync] listApprovedOrganizations", error.message);
      return [];
    }
    return data ?? [];
  },
};
