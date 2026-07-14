// Datos sensibles simulados asociados a fichas.
// NUNCA se exponen en el panel público — solo en el módulo institucional.
export interface SensitivePersonData {
  reporterName: string;
  reporterContact: string;
  internalNotes?: string;
  verified: boolean;
}

export const mockSensitive: Record<string, SensitivePersonData> = {
  "p-001": {
    reporterName: "Rosa S. (hermana)",
    reporterContact: "+52 55 0000 0001",
    internalNotes: "Última llamada el 2024-11-03 a las 14:20.",
    verified: true,
  },
  "p-002": {
    reporterName: "Ana P. (madre)",
    reporterContact: "ana.p@example.org",
    internalNotes: "Reportado por escuela; niño acudía a clases habitualmente.",
    verified: true,
  },
  "p-003": {
    reporterName: "Refugio Viña",
    reporterContact: "refugio@example.org",
    verified: true,
  },
  "p-004": {
    reporterName: "Maria M. (esposa)",
    reporterContact: "+55 51 0000 0004",
    internalNotes: "Reencuentro confirmado en albergue Sarandi.",
    verified: true,
  },
  "p-005": {
    reporterName: "Escuela Municipal Canoas",
    reporterContact: "direcao@example.org",
    verified: false,
  },
  "p-006": {
    reporterName: "Junta comunal Jamundí",
    reporterContact: "+57 300 000 0006",
    verified: true,
  },
  "p-007": {
    reporterName: "ONG Frontera Sur",
    reporterContact: "contacto@example.org",
    internalNotes: "Caso en revisión por comité de protección.",
    verified: false,
  },
  "p-008": {
    reporterName: "Bomberos Valparaíso",
    reporterContact: "central@example.org",
    verified: true,
  },
};
