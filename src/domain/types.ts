// BASUF — Modelo de dominio (compartido entre mocks y futuro Supabase).

export type DisasterType =
  | "earthquake"
  | "war"
  | "flood"
  | "tsunami"
  | "hurricane"
  | "storm"
  | "landslide"
  | "wildfire"
  | "volcano"
  | "humanitarian"
  | "accident"
  | "other";

export type DisasterState = "active" | "closed" | "archived";
export type PersonStatus = "missing" | "searching" | "found" | "reunited";
export type Gender = "f" | "m" | "o";

export interface Disaster {
  id: string;
  type: DisasterType;
  customType?: string;
  name: string;
  country: string;
  region?: string;
  startedAt: string; // ISO
  active: boolean;
  state?: DisasterState;
  description?: string;
  affectedEstimate?: number;
  magnitude?: string;
  fatalities?: number;
  missing?: number;
  createdAt?: string;
  createdByOperator?: string;
  createdByOrg?: string;
}

export type ReportOrigin = "citizen" | "institution";

/** Perfil público — SIN datos sensibles. Nunca incluye fotos de fallecidos ni contactos. */
export interface PublicPersonCard {
  id: string;
  displayName: string; // nombre o apodo público
  approximateAge?: number;
  gender: Gender;
  status: PersonStatus;
  disasterId: string;
  country: string;
  nationality?: string;
  documentId?: string;
  lastSeenLocation?: string;
  lastSeenAt?: string; // ISO
  distinctiveFeatures?: string; // señas visibles no sensibles
  photoPublicUrl?: string; // solo si status !== 'deceased' y consentimiento
  reportedAt: string;
  // Origen público del reporte — visible en la ficha, sin revelar datos privados
  // del reportante civil ni del personal institucional.
  reportOrigin?: ReportOrigin;
  originOrgId?: string;
  originOrgName?: string;
  originOrgType?: string; // enum institution_type
  originOrgCountry?: string;
  originOrgRegion?: string;
}

export interface Country {
  code: string;
  name: string;
}
