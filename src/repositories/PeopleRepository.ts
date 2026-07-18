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
  nationality?: string;
  documentId?: string;
}

const normalizeDoc = (s: string) =>
  s.trim().toLowerCase().replace(/[\s-]+/g, "");

// Contrato del repositorio — implementable en el futuro contra Supabase.
export interface ReportPersonInput {
  displayName: string;
  approximateAge?: number;
  gender: "f" | "m" | "o";
  country: string;
  nationality?: string;
  documentId?: string;
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
    const doc = f.documentId ? normalizeDoc(f.documentId) : "";
    return mockPeople.filter((p) => {
      if (q && !p.displayName.toLowerCase().includes(q)) return false;
      if (f.country && p.country !== f.country) return false;
      if (f.disasterId && p.disasterId !== f.disasterId) return false;
      if (f.status && p.status !== f.status) return false;
      if (f.gender && p.gender !== f.gender) return false;
      if (f.ageMin != null && (p.approximateAge ?? 0) < f.ageMin) return false;
      if (f.ageMax != null && (p.approximateAge ?? 999) > f.ageMax) return false;
      if (f.nationality && p.nationality !== f.nationality) return false;
      if (doc) {
        if (!p.documentId) return false;
        if (!normalizeDoc(p.documentId).includes(doc)) return false;
      }
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
      documentId: input.documentId?.trim() || undefined,
      lastSeenLocation: input.lastSeenLocation,
      lastSeenAt: input.lastSeenAt,
      distinctiveFeatures: input.distinctiveFeatures,
      reportedAt: new Date().toISOString().slice(0, 10),
    };
    mockPeople.unshift(record);
    return record;
  }
  async createDisaster(input: CreateDisasterInput): Promise<Disaster> {
    const name = input.name.trim();
    const region = input.region.trim();
    const country = input.country.trim();
    if (!name || !input.type || !country || !region || !input.startedAt) {
      throw new Error("missing_required_fields");
    }
    const duplicate = mockDisasters.find(
      (d) =>
        d.name.trim().toLowerCase() === name.toLowerCase() &&
        d.country.trim().toLowerCase() === country.toLowerCase() &&
        d.startedAt === input.startedAt,
    );
    if (duplicate) throw new DuplicateDisasterError();
    const record: Disaster = {
      id: `d-local-${Date.now()}`,
      type: input.type,
      customType: input.type === "other" ? input.customType?.trim() : undefined,
      name,
      country,
      region,
      startedAt: input.startedAt,
      active: true,
      state: "active",
      description: input.description?.trim() || undefined,
      magnitude:
        input.type === "earthquake" && input.magnitude?.trim()
          ? input.magnitude.trim()
          : undefined,
      affectedEstimate: input.affectedEstimate,
      fatalities: input.fatalities,
      missing: input.missing,
      createdAt: new Date().toISOString(),
      createdByOperator: input.createdByOperator,
      createdByOrg: input.createdByOrg,
    };
    mockDisasters.unshift(record);
    return record;
  }
}

export const peopleRepository: IPeopleRepository = new MockPeopleRepository();
