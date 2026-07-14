import type { PublicPersonCard, PersonStatus } from "../domain/types";
import { mockPeople } from "../data/mock/people";
import { mockSensitive, type SensitivePersonData } from "../data/mock/sensitive";

export interface InstitutionalCase extends PublicPersonCard {
  sensitive: SensitivePersonData | null;
}

// Contrato del repositorio institucional — acceso a datos sensibles restringido.
// En producción, este repo requeriría autenticación con rol validado.
export interface IInstitutionalRepository {
  listAll(): Promise<InstitutionalCase[]>;
  getById(id: string): Promise<InstitutionalCase | null>;
  updateStatus(id: string, status: PersonStatus): Promise<InstitutionalCase | null>;
  setVerified(id: string, verified: boolean): Promise<InstitutionalCase | null>;
}

function decorate(p: PublicPersonCard): InstitutionalCase {
  return { ...p, sensitive: mockSensitive[p.id] ?? null };
}

class MockInstitutionalRepository implements IInstitutionalRepository {
  async listAll() {
    return mockPeople.map(decorate);
  }
  async getById(id: string) {
    const p = mockPeople.find((x) => x.id === id);
    return p ? decorate(p) : null;
  }
  async updateStatus(id: string, status: PersonStatus) {
    const p = mockPeople.find((x) => x.id === id);
    if (!p) return null;
    p.status = status;
    return decorate(p);
  }
  async setVerified(id: string, verified: boolean) {
    const p = mockPeople.find((x) => x.id === id);
    if (!p) return null;
    const existing = mockSensitive[id];
    if (existing) {
      mockSensitive[id] = { ...existing, verified };
    }
    return decorate(p);
  }
}

export const institutionalRepository: IInstitutionalRepository =
  new MockInstitutionalRepository();
