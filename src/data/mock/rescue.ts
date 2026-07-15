import type { RescueRecord } from "../../domain/rescue";

// Ficticios. Cadena de rescate para demo — Cadena de Identidad de Rescate.
export const mockRescueRecords: RescueRecord[] = [
  {
    code: "R-4F7K",
    tempId: "TMP-2026-0624-014",
    createdAt: "2026-06-24T09:12:00Z",
    displayHint: "Mujer, ~30 años, remera azul",
    currentStatus: "hospital",
    chain: [
      {
        id: "e1",
        type: "rescue",
        at: "2026-06-24T09:12:00Z",
        location: "Caracas, Petare — Edificio 4",
        actorKind: "rescuer",
        actorOrg: "Brigada Voluntaria Petare",
        note: "Rescatada entre escombros. Consciente, deshidratada.",
      },
      {
        id: "e2",
        type: "triage",
        at: "2026-06-24T09:38:00Z",
        location: "Punto de triaje móvil A",
        actorKind: "medic",
        actorOrg: "Cruz Roja Venezolana",
        note: "Triaje amarillo. Fractura probable en tobillo.",
      },
      {
        id: "e3",
        type: "ambulance",
        at: "2026-06-24T10:05:00Z",
        actorKind: "medic",
        actorOrg: "Ambulancia CR-07",
      },
      {
        id: "e4",
        type: "hospital",
        at: "2026-06-24T10:42:00Z",
        location: "Hospital Universitario de Caracas",
        actorKind: "hospital",
        actorOrg: "HUC — Urgencias",
        note: "Ingreso estable. Pendiente identificación.",
      },
    ],
  },
  {
    code: "R-8QN2",
    tempId: "TMP-2026-0624-027",
    createdAt: "2026-06-24T11:40:00Z",
    displayHint: "Niño, ~7 años, mochila roja",
    currentStatus: "shelter",
    chain: [
      {
        id: "e1",
        type: "rescue",
        at: "2026-06-24T11:40:00Z",
        location: "Los Teques — Escuela José Martí",
        actorKind: "rescuer",
        actorOrg: "Bomberos Los Teques",
      },
      {
        id: "e2",
        type: "triage",
        at: "2026-06-24T12:02:00Z",
        actorKind: "medic",
        actorOrg: "MSF",
        note: "Triaje verde. Sin lesiones visibles.",
      },
      {
        id: "e3",
        type: "shelter",
        at: "2026-06-24T14:20:00Z",
        location: "Refugio Municipal Los Teques",
        actorKind: "shelter",
        actorOrg: "Alcaldía / UNICEF",
        note: "Bajo custodia de trabajadora social.",
      },
      {
        id: "e4",
        type: "match",
        at: "2026-06-25T08:15:00Z",
        actorKind: "ngo",
        actorOrg: "BASUF — Motor de coincidencias",
        note: "Posible coincidencia con reporte P-014 (madre).",
      },
    ],
  },
  {
    code: "R-2XM9",
    tempId: "TMP-2026-0624-041",
    createdAt: "2026-06-24T13:55:00Z",
    displayHint: "Hombre adulto mayor, camisa gris",
    currentStatus: "reunion",
    linkedPersonId: "p-001",
    chain: [
      {
        id: "e1",
        type: "rescue",
        at: "2026-06-24T13:55:00Z",
        location: "Caracas, Chacao",
        actorKind: "rescuer",
        actorOrg: "Defensa Civil",
      },
      {
        id: "e2",
        type: "hospital",
        at: "2026-06-24T15:10:00Z",
        location: "Hospital de Clínicas Caracas",
        actorKind: "hospital",
        actorOrg: "HCC",
      },
      {
        id: "e3",
        type: "match",
        at: "2026-06-25T09:40:00Z",
        actorKind: "ngo",
        actorOrg: "BASUF",
        note: "Coincidencia validada con familia reportante.",
      },
      {
        id: "e4",
        type: "reunion",
        at: "2026-06-25T18:22:00Z",
        location: "HCC — Sala de familias",
        actorKind: "authority",
        actorOrg: "Protección Civil",
        note: "Reunificación confirmada. Firma de familiar directo.",
      },
    ],
  },
];

export function findRescueByCode(code: string): RescueRecord | undefined {
  const norm = code.trim().toUpperCase().replace(/\s+/g, "");
  return mockRescueRecords.find(
    (r) =>
      r.code.toUpperCase() === norm ||
      r.code.toUpperCase().replace("R-", "") === norm ||
      r.tempId.toUpperCase() === norm,
  );
}
