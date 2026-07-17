// BASUF — Modelo de dominio (compartido entre mocks y futuro Supabase).

export type DisasterType = "earthquake" | "war" | "flood";
export type PersonStatus = "missing" | "searching" | "found" | "reunited";
export type Gender = "f" | "m" | "o";

export interface Disaster {
  id: string;
  type: DisasterType;
  name: string;
  country: string;
  region?: string;
  startedAt: string; // ISO
  active: boolean;
  affectedEstimate?: number;
  magnitude?: string;
  fatalities?: number;
  missing?: number;
}

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
  lastSeenLocation?: string;
  lastSeenAt?: string; // ISO
  distinctiveFeatures?: string; // señas visibles no sensibles
  photoPublicUrl?: string; // solo si status !== 'deceased' y consentimiento
  reportedAt: string;
}

export interface Country {
  code: string;
  name: string;
}
