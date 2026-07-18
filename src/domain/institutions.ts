// BASUF — Modelo de dominio de Instituciones Aprobadas.

export type InstitutionType =
  | "un_agency"
  | "red_cross"
  | "civil_protection"
  | "fire"
  | "usar"
  | "hospital"
  | "forensic"
  | "shelter"
  | "humanitarian"
  | "child_protection"
  | "migration"
  | "government"
  | "other";

export type InstitutionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "suspended"
  | "archived"
  | "reference";

export type MembershipRole = "reviewer" | "viewer";
export type MembershipStatus = "invited" | "active" | "suspended" | "revoked";

export interface Institution {
  id: string;
  name: string;
  acronym?: string;
  normalizedName: string;
  country: string;
  institutionType: InstitutionType;
  officialEmail: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  registrationNumber?: string;
  address?: string;
  description?: string;
  verificationNotes?: string;
  status: InstitutionStatus;
  publicVisibility: boolean;
  isReference: boolean;
  createdByOperator?: string;
  approvedByOperator?: string;
  approvalNote?: string;
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  updatedAt: string;
}

export interface InstitutionMembership {
  id: string;
  institutionId: string;
  userEmail: string;
  userName: string;
  institutionalRole: MembershipRole;
  status: MembershipStatus;
  inviteToken?: string;
  invitedByOperator: string;
  invitedAt: string;
  activatedAt?: string;
  updatedAt: string;
}

export const INSTITUTION_TYPE_LABELS_ES: Record<InstitutionType, string> = {
  un_agency: "Agencia de Naciones Unidas",
  red_cross: "Cruz Roja / Media Luna Roja",
  civil_protection: "Protección civil",
  fire: "Bomberos",
  usar: "Equipo USAR",
  hospital: "Hospital / Red de salud",
  forensic: "Medicina legal / Forense",
  shelter: "Refugio / Campamento",
  humanitarian: "Organización humanitaria",
  child_protection: "Protección infantil",
  migration: "Migración / Desplazamiento",
  government: "Entidad gubernamental",
  other: "Otra",
};

export const INSTITUTION_STATUS_LABELS_ES: Record<InstitutionStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
  suspended: "Suspendida",
  archived: "Archivada",
  reference: "Referencia",
};

export function normalizeInstitutionName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Verificación básica / intermedia / completa: reglas simples informativas. */
export function verificationLevel(
  i: Institution,
): "basic" | "intermediate" | "complete" {
  let score = 0;
  if (i.officialEmail) score++;
  if (i.contactName && i.contactEmail) score++;
  if (i.registrationNumber) score++;
  if (i.website) score++;
  if (i.verificationNotes && i.status === "approved") score++;
  if (score >= 5) return "complete";
  if (score >= 3) return "intermediate";
  return "basic";
}
