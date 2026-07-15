import type { SafeIdRecord } from "../../domain/safeId";

// Deterministic short-code helper for demo.
function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}
function shortFromSeed(seed: string): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let h = hash(seed);
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += alphabet[h % alphabet.length];
    h = Math.floor(h / alphabet.length) + 11;
  }
  return `SID-${out}`;
}

export const mockSafeIds: SafeIdRecord[] = [
  {
    id: "sid-1",
    shortCode: shortFromSeed("R-4F7K"),
    barcodeValue: `BASUF|${shortFromSeed("R-4F7K")}|R-4F7K`,
    linkedRescueCode: "R-4F7K",
    disasterId: "d-ve-2026-sismo-yaracuy",
    createdAt: "2026-06-24T09:12:00Z",
  },
  {
    id: "sid-2",
    shortCode: shortFromSeed("R-8QN2"),
    barcodeValue: `BASUF|${shortFromSeed("R-8QN2")}|R-8QN2`,
    linkedRescueCode: "R-8QN2",
    disasterId: "d-ve-2026-sismo-yaracuy",
    createdAt: "2026-06-24T11:40:00Z",
  },
  {
    id: "sid-3",
    shortCode: shortFromSeed("R-2XM9"),
    barcodeValue: `BASUF|${shortFromSeed("R-2XM9")}|R-2XM9`,
    linkedRescueCode: "R-2XM9",
    linkedPersonId: "p-001",
    disasterId: "d-ve-2026-sismo-yaracuy",
    createdAt: "2026-06-24T13:55:00Z",
  },
];

export function findSafeIdByCode(code: string): SafeIdRecord | undefined {
  const norm = code.trim().toUpperCase().replace(/\s+/g, "");
  return mockSafeIds.find(
    (s) =>
      s.shortCode.toUpperCase() === norm ||
      s.linkedRescueCode?.toUpperCase() === norm,
  );
}

export function findSafeIdByRescueCode(rescueCode: string) {
  return mockSafeIds.find((s) => s.linkedRescueCode === rescueCode);
}

export function findSafeIdByPersonId(personId: string) {
  return mockSafeIds.find((s) => s.linkedPersonId === personId);
}
