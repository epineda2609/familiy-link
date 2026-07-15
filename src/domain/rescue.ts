// BASUF — Cadena de Identidad de Rescate (Rescue Intake Identity Chain).

export type RescueEventType =
  | "rescue"
  | "triage"
  | "ambulance"
  | "hospital"
  | "transfer"
  | "shelter"
  | "match"
  | "reunion"
  | "review";

export type ActorKind =
  | "rescuer"
  | "medic"
  | "hospital"
  | "shelter"
  | "ngo"
  | "authority"
  | "family";

export interface ChainEvent {
  id: string;
  type: RescueEventType;
  at: string; // ISO
  location?: string;
  actorKind: ActorKind;
  actorOrg: string;
  note?: string;
}

export interface RescueRecord {
  /** Human-friendly short code printed on wristband (e.g. "R-4F7K"). */
  code: string;
  /** Temporary ID before real identity is known (e.g. "TMP-2026-0714-004"). */
  tempId: string;
  createdAt: string;
  /** Optional link once identity is confirmed. */
  linkedPersonId?: string;
  displayHint?: string; // e.g. "Mujer, ~30 años, remera azul"
  currentStatus: RescueEventType;
  chain: ChainEvent[];
}

/** Deterministic short code generator (demo, not cryptographic). */
export function generateShortCode(seed: string): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += alphabet[hash % alphabet.length];
    hash = Math.floor(hash / alphabet.length) + 7;
  }
  return `R-${out}`;
}
