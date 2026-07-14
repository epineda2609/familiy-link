import type { PersonStatus } from "../../domain/types";
import { mockPeople } from "./people";

export type MatchStatus = "pending" | "approved" | "rejected";

export interface MatchCandidate {
  id: string;
  personA_id: string; // typically "missing" or "searching"
  personB_id: string; // typically "found" or "searching"
  score: number; // 0-100
  reasons: string[]; // i18n-agnostic reason codes
  status: MatchStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  note?: string;
}

// Motor de matching simulado — determinístico, sin ML real.
// Regla: mismo desastre + mismo género + edad ±5 años + estados complementarios.
function computeCandidates(): MatchCandidate[] {
  const complementary = (a: PersonStatus, b: PersonStatus) =>
    (a === "missing" && (b === "found" || b === "searching")) ||
    (a === "searching" && b === "found");

  const out: MatchCandidate[] = [];
  for (let i = 0; i < mockPeople.length; i++) {
    for (let j = 0; j < mockPeople.length; j++) {
      if (i === j) continue;
      const a = mockPeople[i];
      const b = mockPeople[j];
      if (a.disasterId !== b.disasterId) continue;
      if (a.gender !== b.gender) continue;
      if (!complementary(a.status, b.status)) continue;

      const ageA = a.approximateAge ?? -100;
      const ageB = b.approximateAge ?? 100;
      const ageDiff = Math.abs(ageA - ageB);
      if (ageDiff > 5) continue;

      const reasons: string[] = [
        "same_disaster",
        "same_gender",
        `age_diff_${ageDiff}`,
      ];
      let score = 100 - ageDiff * 8;
      if (
        a.lastSeenLocation &&
        b.lastSeenLocation &&
        a.lastSeenLocation
          .toLowerCase()
          .split(",")[0]
          .trim() ===
          b.lastSeenLocation
            .toLowerCase()
            .split(",")[0]
            .trim()
      ) {
        score += 10;
        reasons.push("same_location");
      }
      score = Math.max(0, Math.min(100, score));

      out.push({
        id: `m-${a.id}-${b.id}`,
        personA_id: a.id,
        personB_id: b.id,
        score,
        reasons,
        status: "pending",
      });
    }
  }
  // Dedupe symmetric pairs — keep the higher-scored direction only.
  const seen = new Map<string, MatchCandidate>();
  for (const m of out) {
    const key = [m.personA_id, m.personB_id].sort().join("|");
    const prev = seen.get(key);
    if (!prev || m.score > prev.score) seen.set(key, m);
  }
  return Array.from(seen.values()).sort((a, b) => b.score - a.score);
}

// In-memory mutable list (mock).
export const mockMatches: MatchCandidate[] = computeCandidates();

// Semillas: un match aprobado y uno rechazado para poblar el histórico.
if (mockMatches[0]) {
  mockMatches[0] = {
    ...mockMatches[0],
    status: "approved",
    reviewedBy: "Cruz Roja Latinoamérica",
    reviewedAt: "2025-05-10",
  };
}
if (mockMatches[mockMatches.length - 1] && mockMatches.length > 1) {
  const last = mockMatches.length - 1;
  mockMatches[last] = {
    ...mockMatches[last],
    status: "rejected",
    reviewedBy: "ACNUR Regional",
    reviewedAt: "2025-05-11",
    note: "No coincide edad exacta reportada por familiar.",
  };
}
