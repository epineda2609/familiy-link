import { useSyncExternalStore } from "react";
import { mockPeople } from "../data/mock/people";
import { mockRescueRecords } from "../data/mock/rescue";
import { mockMatches } from "../data/mock/matches";
import type { CaseEvent, CaseEventType, CaseHistory, CaseSourceKind } from "../domain/caseTimeline";
import type { ActorKind } from "../domain/rescue";
import { caseUpdateRepository, type CaseUpdateRecord } from "./CaseUpdateRepository";
import { supabase } from "../integrations/supabase/client";

// ---------- Local synthesizers (mock/legacy sources) ----------

function summarizeUpdate(u: CaseUpdateRecord): string {
  const bits: string[] = [];
  const id = u.identity;
  if (id.knownName) bits.push(`Nombre: ${id.knownName}`);
  if (id.alias) bits.push(`Alias: ${id.alias}`);
  if (id.approximateAge) bits.push(`Edad ~${id.approximateAge}`);
  if (id.nationality) bits.push(`Nacionalidad: ${id.nationality}`);
  if (id.document) bits.push(`Doc: ${id.document}`);
  if (id.notes) bits.push(id.notes);
  const ls = u.lastSeen;
  const loc = [ls.location, ls.city, ls.country].filter(Boolean).join(", ");
  if (loc) bits.push(`Visto en: ${loc}`);
  if (ls.date || ls.time) bits.push(`${ls.date ?? ""} ${ls.time ?? ""}`.trim());
  if (ls.description) bits.push(ls.description);
  return bits.join(" · ");
}

function updateLocation(u: CaseUpdateRecord): string | undefined {
  const parts = [u.lastSeen.location, u.lastSeen.city, u.lastSeen.country].filter(Boolean);
  return parts.length ? parts.join(", ") : undefined;
}

function updateActor(u: CaseUpdateRecord): string {
  if (u.reporter.anonymous) return "Aporte anónimo";
  return u.reporter.name || "Aporte ciudadano";
}

function actorKindToSource(k: ActorKind): CaseSourceKind {
  switch (k) {
    case "rescuer":
      return "rescuer";
    case "medic":
    case "hospital":
      return "hospital";
    case "shelter":
      return "shelter";
    case "ngo":
      return "ngo";
    case "authority":
      return "authority";
    case "family":
      return "family";
    default:
      return "system";
  }
}

// ---------- Cloud cache (case_timeline) ----------

interface TimelineRow {
  id: string;
  person_id: string;
  event_type: string;
  title: string;
  description: string | null;
  event_date: string;
  location: string | null;
  visibility: string | null;
  source_entity_type: string | null;
  source_entity_id: string | null;
}

const cloudCache = new Map<string, CaseEvent[]>();
const loaded = new Set<string>();
const inflight = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

// Map raw DB event_type strings to a public, human-friendly domain type.
// Unknown values are kept as-is; CaseTimeline renders them with a safe fallback.
function normEventType(raw: string): CaseEventType {
  const known = new Set<string>([
    "rescue", "triage", "ambulance", "hospital", "transfer", "shelter",
    "match", "reunion", "review",
    "reported_missing", "partial_id", "possible_match",
    "critical_review", "deceased_review", "citizen_update",
    "last_seen", "report_received", "case_created",
    "received_by_organization", "transferred_to_organization",
    "status_changed", "located", "possible_match_detected",
    "match_review_started", "match_review_pending", "reunited",
  ]);
  const lower = raw.toLowerCase().replace(/\./g, "_");
  if (known.has(lower)) return lower as CaseEventType;
  return lower as CaseEventType;
}

function sourceKindFromType(type: string): CaseSourceKind {
  if (type.includes("citizen") || type.includes("report_received")) return "citizen";
  if (type.includes("hospital") || type.includes("received_by")) return "hospital";
  if (type.includes("shelter") || type.includes("transferred")) return "shelter";
  if (type.includes("rescue")) return "rescuer";
  if (type.includes("match") || type.includes("review")) return "ngo";
  return "system";
}

function rowToEvent(r: TimelineRow): CaseEvent {
  const type = normEventType(r.event_type);
  return {
    id: r.id,
    type,
    at: r.event_date,
    actorOrg: r.source_entity_type ?? "BASUF",
    sourceKind: sourceKindFromType(String(type)),
    location: r.location ?? undefined,
    note: r.description ?? undefined,
    summary: r.title,
  };
}

async function hydratePerson(personId: string): Promise<void> {
  if (loaded.has(personId) || typeof window === "undefined") return;
  if (!isUuid(personId)) {
    loaded.add(personId);
    return;
  }
  const existing = inflight.get(personId);
  if (existing) return existing;
  const p = (async () => {
    try {
      const { data, error } = await supabase
        .from("case_timeline")
        .select(
          "id, person_id, event_type, title, description, event_date, location, visibility, source_entity_type, source_entity_id",
        )
        .eq("person_id", personId)
        .order("event_date", { ascending: true })
        .returns<TimelineRow[]>();
      if (!error && data) {
        cloudCache.set(personId, data.map(rowToEvent));
        notify();
      }
    } catch {
      /* silent */
    } finally {
      loaded.add(personId);
      inflight.delete(personId);
    }
  })();
  inflight.set(personId, p);
  return p;
}

// ---------- Public API ----------

/** Build a unified case history for a given person id (public). Sync — returns whatever is cached. */
export function getCaseHistoryByPerson(personId: string): CaseHistory | null {
  const person = mockPeople.find((p) => p.id === personId);
  const cloudEvents = cloudCache.get(personId) ?? [];
  // Not in mocks and no cloud events yet — bail if there's truly nothing to render.
  if (!person && cloudEvents.length === 0) {
    // Kick off hydration for the next render.
    void hydratePerson(personId);
    return null;
  }

  const events: CaseEvent[] = [...cloudEvents];

  if (person) {
    events.push({
      id: `e-report-${person.id}`,
      type: "reported_missing",
      at: `${person.reportedAt}T00:00:00Z`,
      actorOrg: "Reportante familiar",
      sourceKind: "family",
      location: person.lastSeenLocation,
      note: person.distinctiveFeatures,
    });

    const rescue = mockRescueRecords.find((r) => r.linkedPersonId === person.id);
    if (rescue) {
      for (const c of rescue.chain) {
        events.push({
          id: `${rescue.code}-${c.id}`,
          type: c.type,
          at: c.at,
          actorOrg: c.actorOrg,
          sourceKind: actorKindToSource(c.actorKind),
          location: c.location,
          note: c.note,
        });
      }
    }

    const approvedMatches = mockMatches.filter(
      (m) =>
        m.status === "approved" &&
        (m.personA_id === person.id || m.personB_id === person.id),
    );
    for (const m of approvedMatches) {
      events.push({
        id: `mrev-${m.id}`,
        type: "possible_match",
        at: `${m.reviewedAt ?? new Date().toISOString().slice(0, 10)}T00:00:00Z`,
        actorOrg: m.reviewedBy ?? "BASUF",
        sourceKind: "ngo",
        note: m.note,
      });
    }

    for (const u of caseUpdateRepository.listByCase(person.id)) {
      events.push({
        id: `cu-${u.id}`,
        type: "citizen_update",
        at: u.createdAt,
        actorOrg: updateActor(u),
        sourceKind: "citizen",
        location: updateLocation(u),
        summary: summarizeUpdate(u),
        validation: u.validation,
        proposedStatus: u.proposedStatus || undefined,
      });
    }
  }

  // De-dup by id (cloud may already carry mirrors of the same event)
  const seen = new Set<string>();
  const deduped = events.filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));
  deduped.sort((a, b) => (a.at < b.at ? -1 : 1));

  // Kick off async cloud hydration on first access.
  void hydratePerson(personId);

  const rescue = person ? mockRescueRecords.find((r) => r.linkedPersonId === person.id) : undefined;
  return {
    personId,
    rescueCode: rescue?.code,
    events: deduped,
  };
}

/** Build a unified case history for a given rescue short code. */
export function getCaseHistoryByRescue(code: string): CaseHistory | null {
  const rescue = mockRescueRecords.find((r) => r.code === code);
  if (!rescue) return null;

  const events: CaseEvent[] = rescue.chain.map((c) => ({
    id: `${rescue.code}-${c.id}`,
    type: c.type,
    at: c.at,
    actorOrg: c.actorOrg,
    sourceKind: actorKindToSource(c.actorKind),
    location: c.location,
    note: c.note,
  }));

  if (rescue.linkedPersonId) {
    const person = mockPeople.find((p) => p.id === rescue.linkedPersonId);
    if (person) {
      events.unshift({
        id: `e-report-${person.id}`,
        type: "reported_missing",
        at: `${person.reportedAt}T00:00:00Z`,
        actorOrg: "Reportante familiar",
        sourceKind: "family",
        location: person.lastSeenLocation,
        note: person.distinctiveFeatures,
      });
      // Merge cloud events for the linked person
      for (const ev of cloudCache.get(person.id) ?? []) events.push(ev);
      void hydratePerson(person.id);
    }
  }

  events.sort((a, b) => (a.at < b.at ? -1 : 1));

  return {
    personId: rescue.linkedPersonId,
    rescueCode: rescue.code,
    events,
  };
}

/**
 * React hook that hydrates the Cloud-backed case_timeline cache for a person
 * and re-renders when new events arrive. Consumers still call
 * `getCaseHistoryByPerson(id)` for the merged data.
 */
export function useCaseTimeline(personId: string | undefined): void {
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      if (personId) void hydratePerson(personId);
      return () => listeners.delete(cb);
    },
    () => (personId ? loaded.has(personId) : true),
    () => true,
  );
}
