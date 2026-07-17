// BASUF — Timeline unificado de un caso (personas + rescate + matching).
import type { RescueEventType } from "./rescue";

export type CaseEventType =
  | RescueEventType
  | "reported_missing"
  | "partial_id"
  | "possible_match"
  | "critical_review"
  | "deceased_review"
  | "citizen_update";

export type CaseSourceKind =
  | "family"
  | "rescuer"
  | "hospital"
  | "shelter"
  | "ngo"
  | "authority"
  | "system"
  | "citizen";

export type CaseEventValidation = "pending" | "verified" | "rejected";

export interface CaseEvent {
  id: string;
  type: CaseEventType;
  at: string; // ISO
  actorOrg: string;
  sourceKind: CaseSourceKind;
  location?: string;
  note?: string;
  validation?: CaseEventValidation;
  summary?: string;
  proposedStatus?: string;
}

export interface CaseHistory {
  personId?: string;
  rescueCode?: string;
  events: CaseEvent[]; // sorted asc by at
}
