import type {
  Institution,
  InstitutionMembership,
  InstitutionType,
  InstitutionStatus,
} from "../../domain/institutions";
import { normalizeInstitutionName } from "../../domain/institutions";

// Seed inicial: 50 instituciones de referencia + subset aprobadas/pendientes/suspendida para demo.
// Datos ficticios (correos y teléfonos son marcadores de demostración).

type Seed = {
  id: string;
  name: string;
  acronym?: string;
  country: string;
  institutionType: InstitutionType;
  status: InstitutionStatus;
};

const seed: Seed[] = [
  // === APROBADAS PARA LA DEMO (10) ===
  { id: "inst-ocha", name: "Oficina de las Naciones Unidas para la Coordinación de Asuntos Humanitarios", acronym: "OCHA", country: "Internacional", institutionType: "un_agency", status: "approved" },
  { id: "inst-acnur", name: "Alto Comisionado de las Naciones Unidas para los Refugiados", acronym: "ACNUR", country: "Internacional", institutionType: "un_agency", status: "approved" },
  { id: "inst-unicef", name: "Fondo de las Naciones Unidas para la Infancia", acronym: "UNICEF", country: "Internacional", institutionType: "un_agency", status: "approved" },
  { id: "inst-ifrc", name: "Federación Internacional de Sociedades de la Cruz Roja y de la Media Luna Roja", acronym: "IFRC", country: "Internacional", institutionType: "red_cross", status: "approved" },
  { id: "inst-cicr", name: "Comité Internacional de la Cruz Roja", acronym: "CICR", country: "Internacional", institutionType: "red_cross", status: "approved" },
  { id: "inst-msf", name: "Médicos Sin Fronteras", acronym: "MSF", country: "Internacional", institutionType: "humanitarian", status: "approved" },
  { id: "inst-cr-arg", name: "Cruz Roja Argentina", acronym: "CRA", country: "Argentina", institutionType: "red_cross", status: "approved" },
  { id: "inst-cr-mex", name: "Cruz Roja Mexicana", acronym: "CRM", country: "México", institutionType: "red_cross", status: "approved" },
  { id: "inst-cr-ven", name: "Cruz Roja Venezolana", acronym: "CRV", country: "Venezuela", institutionType: "red_cross", status: "approved" },
  { id: "inst-dc-col", name: "Defensa Civil Colombiana", acronym: "DCC", country: "Colombia", institutionType: "civil_protection", status: "approved" },

  // === PENDIENTES (3) ===
  { id: "inst-wv", name: "World Vision International", acronym: "WVI", country: "Internacional", institutionType: "humanitarian", status: "pending" },
  { id: "inst-care", name: "CARE International", acronym: "CARE", country: "Internacional", institutionType: "humanitarian", status: "pending" },
  { id: "inst-adra", name: "ADRA International", acronym: "ADRA", country: "Internacional", institutionType: "humanitarian", status: "pending" },

  // === SUSPENDIDA (1) ===
  { id: "inst-cascos-arg", name: "Cascos Blancos de Argentina", acronym: "CB", country: "Argentina", institutionType: "government", status: "suspended" },

  // === REFERENCIA — restantes 36 ===
  { id: "inst-oim", name: "Organización Internacional para las Migraciones", acronym: "OIM", country: "Internacional", institutionType: "migration", status: "reference" },
  { id: "inst-ops", name: "Organización Panamericana de la Salud", acronym: "OPS", country: "Internacional", institutionType: "un_agency", status: "reference" },
  { id: "inst-pma", name: "Programa Mundial de Alimentos", acronym: "PMA", country: "Internacional", institutionType: "un_agency", status: "reference" },
  { id: "inst-pnud", name: "Programa de las Naciones Unidas para el Desarrollo", acronym: "PNUD", country: "Internacional", institutionType: "un_agency", status: "reference" },
  { id: "inst-unfpa", name: "Fondo de Población de las Naciones Unidas", acronym: "UNFPA", country: "Internacional", institutionType: "un_agency", status: "reference" },
  { id: "inst-rfl", name: "Restoring Family Links", acronym: "RFL", country: "Internacional", institutionType: "humanitarian", status: "reference" },
  { id: "inst-stc", name: "Save the Children", acronym: "STC", country: "Internacional", institutionType: "child_protection", status: "reference" },
  { id: "inst-caritas", name: "Cáritas Internationalis", acronym: "Cáritas", country: "Internacional", institutionType: "humanitarian", status: "reference" },
  { id: "inst-plan", name: "Plan International", acronym: "Plan", country: "Internacional", institutionType: "child_protection", status: "reference" },
  { id: "inst-mercy", name: "Mercy Corps", acronym: "Mercy", country: "Internacional", institutionType: "humanitarian", status: "reference" },
  { id: "inst-shelter", name: "ShelterBox", acronym: "SB", country: "Internacional", institutionType: "shelter", status: "reference" },
  { id: "inst-cr-bol", name: "Cruz Roja Boliviana", acronym: "CRB", country: "Bolivia", institutionType: "red_cross", status: "reference" },
  { id: "inst-cr-bra", name: "Cruz Roja Brasileña", acronym: "CVB", country: "Brasil", institutionType: "red_cross", status: "reference" },
  { id: "inst-cr-chi", name: "Cruz Roja Chilena", acronym: "CRC", country: "Chile", institutionType: "red_cross", status: "reference" },
  { id: "inst-cr-col", name: "Cruz Roja Colombiana", acronym: "CRCol", country: "Colombia", institutionType: "red_cross", status: "reference" },
  { id: "inst-cr-cr", name: "Cruz Roja Costarricense", acronym: "CRCR", country: "Costa Rica", institutionType: "red_cross", status: "reference" },
  { id: "inst-cr-ecu", name: "Cruz Roja Ecuatoriana", acronym: "CRE", country: "Ecuador", institutionType: "red_cross", status: "reference" },
  { id: "inst-cr-gua", name: "Cruz Roja Guatemalteca", acronym: "CRG", country: "Guatemala", institutionType: "red_cross", status: "reference" },
  { id: "inst-cr-hon", name: "Cruz Roja Hondureña", acronym: "CRH", country: "Honduras", institutionType: "red_cross", status: "reference" },
  { id: "inst-cr-pan", name: "Cruz Roja Panameña", acronym: "CRP", country: "Panamá", institutionType: "red_cross", status: "reference" },
  { id: "inst-cr-par", name: "Cruz Roja Paraguaya", acronym: "CRPy", country: "Paraguay", institutionType: "red_cross", status: "reference" },
  { id: "inst-cr-per", name: "Cruz Roja Peruana", acronym: "CRPe", country: "Perú", institutionType: "red_cross", status: "reference" },
  { id: "inst-cr-dom", name: "Cruz Roja Dominicana", acronym: "CRD", country: "República Dominicana", institutionType: "red_cross", status: "reference" },
  { id: "inst-cr-sal", name: "Cruz Roja Salvadoreña", acronym: "CRS", country: "El Salvador", institutionType: "red_cross", status: "reference" },
  { id: "inst-cr-uru", name: "Cruz Roja Uruguaya", acronym: "CRU", country: "Uruguay", institutionType: "red_cross", status: "reference" },
  { id: "inst-pc-mex", name: "Coordinación Nacional de Protección Civil de México", acronym: "CNPC", country: "México", institutionType: "civil_protection", status: "reference" },
  { id: "inst-erum-mx", name: "Equipo de Rescate y Urgencias Médicas de Ciudad de México", acronym: "ERUM", country: "México", institutionType: "usar", status: "reference" },
  { id: "inst-bmb-mx", name: "Heroico Cuerpo de Bomberos de la Ciudad de México", acronym: "HCB-CDMX", country: "México", institutionType: "fire", status: "reference" },
  { id: "inst-idiger", name: "Instituto Distrital de Gestión de Riesgos y Cambio Climático de Bogotá", acronym: "IDIGER", country: "Colombia", institutionType: "civil_protection", status: "reference" },
  { id: "inst-senapred", name: "Sistema Nacional de Prevención y Respuesta ante Desastres de Chile", acronym: "SENAPRED", country: "Chile", institutionType: "civil_protection", status: "reference" },
  { id: "inst-indeci", name: "Instituto Nacional de Defensa Civil del Perú", acronym: "INDECI", country: "Perú", institutionType: "civil_protection", status: "reference" },
  { id: "inst-sgr-ecu", name: "Servicio Nacional de Gestión de Riesgos y Emergencias del Ecuador", acronym: "SNGRE", country: "Ecuador", institutionType: "civil_protection", status: "reference" },
  { id: "inst-conred", name: "Secretaría de Gestión Integral de Riesgos y Protección Civil de Guatemala", acronym: "CONRED", country: "Guatemala", institutionType: "civil_protection", status: "reference" },
  { id: "inst-copeco", name: "Comisión Permanente de Contingencias de Honduras", acronym: "COPECO", country: "Honduras", institutionType: "civil_protection", status: "reference" },
  { id: "inst-cne-cr", name: "Comisión Nacional de Emergencias de Costa Rica", acronym: "CNE", country: "Costa Rica", institutionType: "civil_protection", status: "reference" },
  { id: "inst-sinaproc", name: "Sistema Nacional de Protección Civil de Panamá", acronym: "SINAPROC", country: "Panamá", institutionType: "civil_protection", status: "reference" },
];

const NOW_ISO = new Date("2026-07-01T12:00:00.000Z").toISOString();

function demoEmailFor(id: string): string {
  return `contacto+${id.replace(/^inst-/, "")}@basuf-demo.org`;
}

export const seedInstitutions: Institution[] = seed.map((s) => {
  const approved = s.status === "approved";
  return {
    id: s.id,
    name: s.name,
    acronym: s.acronym,
    normalizedName: normalizeInstitutionName(s.name),
    country: s.country,
    institutionType: s.institutionType,
    officialEmail: demoEmailFor(s.id),
    contactName: approved ? "Coordinación humanitaria (demo)" : undefined,
    contactEmail: approved ? demoEmailFor(s.id) : undefined,
    contactPhone: approved ? "+00 000 000 000" : undefined,
    website: approved ? `https://demo.basuf.org/${s.id}` : undefined,
    registrationNumber: undefined,
    address: undefined,
    description: `${s.name} — institución humanitaria de referencia (datos demostrativos).`,
    verificationNotes: approved ? "Verificación demo completada." : undefined,
    status: s.status,
    publicVisibility: approved,
    isReference: s.status === "reference",
    createdByOperator: "Sistema (seed)",
    approvedByOperator: approved ? "BASUF Master (demo)" : undefined,
    approvalNote: approved ? "Aprobada como parte del set demo del hackathon." : undefined,
    requestedAt: NOW_ISO,
    approvedAt: approved ? NOW_ISO : undefined,
    rejectedAt: undefined,
    updatedAt: NOW_ISO,
  };
});

export const seedMemberships: InstitutionMembership[] = [
  {
    id: "mem-demo-1",
    institutionId: "inst-cr-ven",
    userEmail: "revisor.crv@basuf-demo.org",
    userName: "Ana Ríos (demo)",
    institutionalRole: "reviewer",
    status: "active",
    invitedByOperator: "BASUF Master (demo)",
    invitedAt: NOW_ISO,
    activatedAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
  {
    id: "mem-demo-2",
    institutionId: "inst-cr-ven",
    userEmail: "consulta.crv@basuf-demo.org",
    userName: "Luis Peña (demo)",
    institutionalRole: "viewer",
    status: "active",
    invitedByOperator: "BASUF Master (demo)",
    invitedAt: NOW_ISO,
    activatedAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
  {
    id: "mem-demo-3",
    institutionId: "inst-acnur",
    userEmail: "revisor.acnur@basuf-demo.org",
    userName: "Marta Silva (demo)",
    institutionalRole: "reviewer",
    status: "active",
    invitedByOperator: "BASUF Master (demo)",
    invitedAt: NOW_ISO,
    activatedAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
  {
    id: "mem-demo-4",
    institutionId: "inst-unicef",
    userEmail: "consulta.unicef@basuf-demo.org",
    userName: "Diego Ortega (demo)",
    institutionalRole: "viewer",
    status: "active",
    invitedByOperator: "BASUF Master (demo)",
    invitedAt: NOW_ISO,
    activatedAt: NOW_ISO,
    updatedAt: NOW_ISO,
  },
];
