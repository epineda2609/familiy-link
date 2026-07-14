import type { PublicPersonCard, Disaster, Country } from "../domain/types";
import { mockPeople } from "../data/mock/people";
import { mockDisasters, mockCountries } from "../data/mock/disasters";

export interface SearchFilters {
  name?: string;
  country?: string;
  disasterId?: string;
  status?: string;
  gender?: string;
  ageMin?: number;
  ageMax?: number;
}

// Contrato del repositorio — implementable en el futuro contra Supabase.
export interface IPeopleRepository {
  searchPublic(filters: SearchFilters): Promise<PublicPersonCard[]>;
  getPublicById(id: string): Promise<PublicPersonCard | null>;
  getDisasterById(id: string): Promise<Disaster | null>;
  listDisasters(): Promise<Disaster[]>;
  listCountries(): Promise<Country[]>;
}

class MockPeopleRepository implements IPeopleRepository {
  async searchPublic(f: SearchFilters): Promise<PublicPersonCard[]> {
    const q = (f.name ?? "").trim().toLowerCase();
    return mockPeople.filter((p) => {
      if (q && !p.displayName.toLowerCase().includes(q)) return false;
      if (f.country && p.country !== f.country) return false;
      if (f.disasterId && p.disasterId !== f.disasterId) return false;
      if (f.status && p.status !== f.status) return false;
      if (f.gender && p.gender !== f.gender) return false;
      if (f.ageMin != null && (p.approximateAge ?? 0) < f.ageMin) return false;
      if (f.ageMax != null && (p.approximateAge ?? 999) > f.ageMax) return false;
      return true;
    });
  }
  async getPublicById(id: string) {
    return mockPeople.find((p) => p.id === id) ?? null;
  }
  async getDisasterById(id: string) {
    return mockDisasters.find((d) => d.id === id) ?? null;
  }
  async listDisasters() {
    return mockDisasters;
  }
  async listCountries() {
    return mockCountries;
  }
}

export const peopleRepository: IPeopleRepository = new MockPeopleRepository();
