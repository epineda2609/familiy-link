import { mockPeople } from "../data/mock/people";
import { mockRescueRecords } from "../data/mock/rescue";
import { mockMatches } from "../data/mock/matches";
import type { CaseEvent, CaseHistory, CaseSourceKind } from "../domain/caseTimeline";
import type { ActorKind } from "../domain/rescue";
import { caseUpdateRepository, type CaseUpdateRecord } from "./CaseUpdateRepository";

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

/** Build a unified case history for a given person id (public). */
export function getCaseHistoryByPerson(personId: string): CaseHistory | null {
  const person = mockPeople.find((p) => p.id === personId);
  if (!person) return null;

  const events: CaseEvent[] = [];

  events.push({
    id: `e-report-${person.id}`,
    type: "reported_missing",
    at: `${person.reportedAt}T00:00:00Z`,
    actorOrg: "Reportante familiar",
    sourceKind: "family",
    location: person.lastSeenLocation,
    note: person.distinctiveFeatures,
  });

  // Any rescue record linked to this person?
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

  // Approved matches involving this person
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

  // Citizen updates ("Tengo información") linked to this case
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

  events.sort((a, b) => (a.at < b.at ? -1 : 1));

  return {
    personId: person.id,
    rescueCode: rescue?.code,
    events,
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

  // If linked to a person, prepend the "reported missing" event.
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
    }
  }

  events.sort((a, b) => (a.at < b.at ? -1 : 1));

  return {
    personId: rescue.linkedPersonId,
    rescueCode: rescue.code,
    events,
  };
}
