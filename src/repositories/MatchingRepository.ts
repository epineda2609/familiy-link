import { mockMatches, type MatchCandidate, type MatchStatus } from "../data/mock/matches";
import { mockPeople } from "../data/mock/people";
import type { PublicPersonCard } from "../domain/types";

export interface EnrichedMatch extends MatchCandidate {
  personA: PublicPersonCard | null;
  personB: PublicPersonCard | null;
}

export interface IMatchingRepository {
  list(): Promise<EnrichedMatch[]>;
  approve(id: string, reviewedBy: string, note?: string): Promise<EnrichedMatch | null>;
  reject(id: string, reviewedBy: string, note?: string): Promise<EnrichedMatch | null>;
  reset(id: string): Promise<EnrichedMatch | null>;
}

function enrich(m: MatchCandidate): EnrichedMatch {
  return {
    ...m,
    personA: mockPeople.find((p) => p.id === m.personA_id) ?? null,
    personB: mockPeople.find((p) => p.id === m.personB_id) ?? null,
  };
}

function markReunited(personId: string) {
  const p = mockPeople.find((x) => x.id === personId);
  if (p) p.status = "reunited";
}

class MockMatchingRepository implements IMatchingRepository {
  async list() {
    return mockMatches.map(enrich);
  }
  private update(id: string, patch: Partial<MatchCandidate>) {
    const idx = mockMatches.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    mockMatches[idx] = { ...mockMatches[idx], ...patch };
    return enrich(mockMatches[idx]);
  }
  async approve(id: string, reviewedBy: string, note?: string) {
    const m = mockMatches.find((x) => x.id === id);
    if (!m) return null;
    markReunited(m.personA_id);
    markReunited(m.personB_id);
    return this.update(id, {
      status: "approved",
      reviewedBy,
      reviewedAt: new Date().toISOString().slice(0, 10),
      note,
      explanation: { ...m.explanation, reviewState: "approved" },
    });
  }
  async reject(id: string, reviewedBy: string, note?: string) {
    const m = mockMatches.find((x) => x.id === id);
    if (!m) return null;
    return this.update(id, {
      status: "rejected",
      reviewedBy,
      reviewedAt: new Date().toISOString().slice(0, 10),
      note,
      explanation: { ...m.explanation, reviewState: "rejected" },
    });
  }
  async reset(id: string) {
    const m = mockMatches.find((x) => x.id === id);
    if (!m) return null;
    return this.update(id, {
      status: "pending",
      reviewedBy: undefined,
      reviewedAt: undefined,
      note: undefined,
      explanation: { ...m.explanation, reviewState: "pending" },
    });
  }
}

export const matchingRepository: IMatchingRepository = new MockMatchingRepository();
export type { MatchStatus, MatchCandidate };
