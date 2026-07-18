import type {
  PublicPersonCard,
  Disaster,
  Country,
  DisasterType,
} from "../domain/types";
import { mockPeople } from "../data/mock/people";
import { mockDisasters, mockCountries } from "../data/mock/disasters";
import { mockNationalities } from "../data/mock/nationalities";

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
export interface ReportPersonInput {
  displayName: string;
  approximateAge?: number;
  gender: "f" | "m" | "o";
  country: string;
  nationality?: string;
  disasterId: string;
  lastSeenLocation?: string;
  lastSeenAt?: string;
  distinctiveFeatures?: string;
  reporterName: string;
  reporterContact: string;
  consent: boolean;
}

export interface CreateDisasterInput {
  name: string;
  type: DisasterType;
  customType?: string;
  country: string;
  region: string;
  startedAt: string;
  description?: string;
  magnitude?: string;
  affectedEstimate?: number;
  fatalities?: number;
  missing?: number;
  createdByOperator?: string;
  createdByOrg?: string;
}

export class DuplicateDisasterError extends Error {
  constructor() {
    super("duplicate_disaster");
    this.name = "DuplicateDisasterError";
  }
}



export interface IPeopleRepository {
  searchPublic(filters: SearchFilters): Promise<PublicPersonCard[]>;
  getPublicById(id: string): Promise<PublicPersonCard | null>;
  getDisasterById(id: string): Promise<Disaster | null>;
  listDisasters(): Promise<Disaster[]>;
  listCountries(): Promise<Country[]>;
  listNationalities(): Promise<Country[]>;
  createReport(input: ReportPersonInput): Promise<PublicPersonCard>;
  createDisaster(input: CreateDisasterInput): Promise<Disaster>;
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
  async listNationalities() {
    return mockNationalities;
  }
  async createReport(input: ReportPersonInput) {
    const id = `p-local-${Date.now()}`;
    const record: PublicPersonCard = {
      id,
      displayName: input.displayName,
      approximateAge: input.approximateAge,
      gender: input.gender,
      status: "missing",
      disasterId: input.disasterId,
      country: input.country,
      nationality: input.nationality,
      lastSeenLocation: input.lastSeenLocation,
      lastSeenAt: input.lastSeenAt,
      distinctiveFeatures: input.distinctiveFeatures,
      reportedAt: new Date().toISOString().slice(0, 10),
    };
    mockPeople.unshift(record);
    return record;
  }
}

export const peopleRepository: IPeopleRepository = new MockPeopleRepository();
