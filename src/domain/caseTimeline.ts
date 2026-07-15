// BASUF — Timeline unificado de un caso (personas + rescate + matching).
import type { RescueEventType } from "./rescue";

export type CaseEventType =
  | RescueEventType
  | "reported_missing"
  | "partial_id"
  | "possible_match"
  | "critical_review"
  | "deceased_review";

export type CaseSourceKind =
  | "family"
  | "rescuer"
  | "hospital"
  | "shelter"
  | "ngo"
  | "authority"
  | "system";

export interface CaseEvent {
  id: string;
  type: CaseEventType;
  at: string; // ISO
  actorOrg: string;
  sourceKind: CaseSourceKind;
  location?: string;
  note?: string;
}

export interface CaseHistory {
  personId?: string;
  rescueCode?: string;
  events: CaseEvent[]; // sorted asc by at
}
