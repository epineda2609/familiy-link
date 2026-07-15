// BASUF — Pasaporte Humanitario Digital (Digital Safe ID).
import type { OperationalMode } from "../modes/OperationalMode";

export type SafeIdAudience = "public" | "family" | "institution" | "authority";

export type SafeIdAccessAction = "view" | "scan" | "print" | "share";

export interface SafeIdAccessEvent {
  id: string;
  at: string;
  audience: SafeIdAudience;
  action: SafeIdAccessAction;
  actorOrg?: string;
}

export interface SafeIdRecord {
  id: string;
  shortCode: string;         // e.g. "SID-8F2K"
  barcodeValue: string;      // e.g. "BASUF|SID-8F2K|R-4F7K"
  linkedRescueCode?: string;
  linkedPersonId?: string;
  disasterId?: string;
  createdAt: string;
}

const AUDIENCE_ORDER: readonly SafeIdAudience[] = [
  "public",
  "family",
  "institution",
  "authority",
];

export function audienceIncludes(
  audience: SafeIdAudience,
  minimum: SafeIdAudience,
): boolean {
  return AUDIENCE_ORDER.indexOf(audience) >= AUDIENCE_ORDER.indexOf(minimum);
}

export function resolveAudience(mode: OperationalMode): SafeIdAudience {
  switch (mode) {
    case "family":
      return "family";
    case "hospital":
    case "shelter":
    case "field":
    case "callcenter":
      return "institution";
    case "coord":
      return "authority";
    default:
      return "public";
  }
}
