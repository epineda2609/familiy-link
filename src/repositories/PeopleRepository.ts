// BASUF — People/Disasters repository backed by Lovable Cloud.
// Reads (persons, disaster_events) are served directly from Cloud; static
// reference data (countries, nationalities) stays as bundled mocks.
import type {
  PublicPersonCard,
  Disaster,
  Country,
  DisasterType,
  PersonStatus,
  Gender,
} from "../domain/types";
import { mockCountries } from "../data/mock/disasters";
import { mockNationalities } from "../data/mock/nationalities";
import { supabase } from "../integrations/supabase/client";

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

export interface ReportPersonInput {
  displayName: string;
  approximateAge?: number;
  gender: Gender;
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

// --- Mapping helpers ------------------------------------------------------

interface PersonRow {
  id: string;
  display_name: string;
  approximate_age: number | null;
  gender: string | null;
  current_status: string;
  event_id: string | null;
  country: string;
  nationality: string | null;
  document_number: string | null;
  distinguishing_features: string | null;
  photo_url: string | null;
  reported_at: string;
  disappearance_details:
    | { last_seen_location: string | null; last_seen_date: string | null }[]
    | null;
}

interface EventRow {
  id: string;
  name: string;
  event_type: string;
  custom_type: string | null;
  country: string;
  region: string | null;
  start_date: string;
  status: string;
  description: string | null;
  magnitude: string | null;
  affected_estimate: number | null;
  fatalities: number | null;
  missing_count: number | null;
  created_at: string;
}

function normGender(g: string | null): Gender {
  return g === "f" || g === "m" || g === "o" ? g : "o";
}

function normStatus(s: string): PersonStatus {
  return s === "missing" || s === "searching" || s === "found" || s === "reunited"
    ? s
    : "missing";
}

function normEventType(t: string): DisasterType {
  const allowed: DisasterType[] = [
    "earthquake",
    "war",
    "flood",
    "tsunami",
    "hurricane",
    "storm",
    "landslide",
    "wildfire",
    "volcano",
    "humanitarian",
    "accident",
    "other",
  ];
  return (allowed as string[]).includes(t) ? (t as DisasterType) : "other";
}

function mapPerson(row: PersonRow): PublicPersonCard {
  const dd = row.disappearance_details?.[0];
  return {
    id: row.id,
    displayName: row.display_name,
    approximateAge: row.approximate_age ?? undefined,
    gender: normGender(row.gender),
    status: normStatus(row.current_status),
    disasterId: row.event_id ?? "",
    country: row.country,
    nationality: row.nationality ?? undefined,
    documentId: row.document_number ?? undefined,
    lastSeenLocation: dd?.last_seen_location ?? undefined,
    lastSeenAt: dd?.last_seen_date ?? undefined,
    distinctiveFeatures: row.distinguishing_features ?? undefined,
    photoPublicUrl: row.photo_url ?? undefined,
    reportedAt: (row.reported_at ?? "").slice(0, 10),
  };
}

function mapDisaster(row: EventRow): Disaster {
  const activeStatuses = new Set(["active", "monitoring"]);
  return {
    id: row.id,
    type: normEventType(row.event_type),
    customType: row.custom_type ?? undefined,
    name: row.name,
    country: row.country,
    region: row.region ?? undefined,
    startedAt: row.start_date,
    active: activeStatuses.has(row.status),
    state: row.status === "closed" ? "closed" : row.status === "archived" ? "archived" : "active",
    description: row.description ?? undefined,
    magnitude: row.magnitude ?? undefined,
    affectedEstimate: row.affected_estimate ?? undefined,
    fatalities: row.fatalities ?? undefined,
    missing: row.missing_count ?? undefined,
    createdAt: row.created_at,
  };
}

const PERSON_SELECT =
  "id, display_name, approximate_age, gender, current_status, event_id, country, nationality, document_number, distinguishing_features, photo_url, reported_at, disappearance_details(last_seen_location, last_seen_date)";
const EVENT_SELECT =
  "id, name, event_type, custom_type, country, region, start_date, status, description, magnitude, affected_estimate, fatalities, missing_count, created_at";

const normalizeDoc = (s: string) => s.trim().toLowerCase().replace(/[\s-]+/g, "");

// --- Repository -----------------------------------------------------------

class CloudPeopleRepository implements IPeopleRepository {
  async searchPublic(f: SearchFilters): Promise<PublicPersonCard[]> {
    // Keep the select as a plain string so supabase-js doesn't parse the
    // relational literal at the type level (huge tsc slowdown).
    const sel: string = PERSON_SELECT;
    let q = supabase
      .from("persons")
      .select(sel)
      .is("archived_at", null)
      .order("reported_at", { ascending: false })
      .limit(200);

    if (f.name?.trim()) q = q.ilike("display_name", `%${f.name.trim()}%`);
    if (f.country) q = q.eq("country", f.country);
    if (f.disasterId) q = q.eq("event_id", f.disasterId);
    if (f.status) q = q.eq("current_status", f.status as PersonStatus);
    if (f.gender) q = q.eq("gender", f.gender);
    if (f.ageMin != null) q = q.gte("approximate_age", f.ageMin);
    if (f.ageMax != null) q = q.lte("approximate_age", f.ageMax);
    if (f.nationality) q = q.eq("nationality", f.nationality);
    if (f.documentId?.trim()) {
      q = q.ilike("document_number", `%${normalizeDoc(f.documentId)}%`);
    }

    const { data, error } = await q.returns<PersonRow[]>();
    if (error) {
      console.error("[people.searchPublic]", error);
      return [];
    }
    return (data ?? []).map(mapPerson);
  }

  async getPublicById(id: string): Promise<PublicPersonCard | null> {
    const sel: string = PERSON_SELECT;
    const { data, error } = await supabase
      .from("persons")
      .select(sel)
      .eq("id", id)
      .maybeSingle()
      .returns<PersonRow | null>();
    if (error) {
      console.error("[people.getPublicById]", error);
      return null;
    }
    return data ? mapPerson(data) : null;
  }

  async getDisasterById(id: string): Promise<Disaster | null> {
    if (!id) return null;
    const sel: string = EVENT_SELECT;
    const { data, error } = await supabase
      .from("disaster_events")
      .select(sel)
      .eq("id", id)
      .maybeSingle()
      .returns<EventRow | null>();
    if (error) {
      console.error("[people.getDisasterById]", error);
      return null;
    }
    return data ? mapDisaster(data) : null;
  }

  async listDisasters(): Promise<Disaster[]> {
    const sel: string = EVENT_SELECT;
    const { data, error } = await supabase
      .from("disaster_events")
      .select(sel)
      .is("archived_at", null)
      .order("start_date", { ascending: false })
      .returns<EventRow[]>();
    if (error) {
      console.error("[people.listDisasters]", error);
      return [];
    }
    return (data ?? []).map(mapDisaster);
  }

  async listCountries(): Promise<Country[]> {
    return mockCountries;
  }

  async listNationalities(): Promise<Country[]> {
    return mockNationalities;
  }

  async createReport(input: ReportPersonInput): Promise<PublicPersonCard> {
    const { data, error } = await supabase
      .from("persons")
      .insert({
        display_name: input.displayName.trim(),
        approximate_age: input.approximateAge ?? null,
        gender: input.gender,
        country: input.country,
        nationality: input.nationality?.trim() || null,
        document_number: input.documentId?.trim() || null,
        event_id: input.disasterId || null,
        distinguishing_features: input.distinctiveFeatures?.trim() || null,
        reporter_name: input.reporterName.trim(),
        reporter_contact: input.reporterContact.trim(),
        current_status: "missing",
        privacy_level: "public",
      })
      .select("id")
      .single();
    if (error || !data) {
      console.error("[people.createReport]", error);
      throw new Error("create_report_failed");
    }
    // Best-effort side write for last-seen info.
    if (input.lastSeenLocation || input.lastSeenAt) {
      await supabase.from("disappearance_details").insert({
        person_id: data.id,
        last_seen_location: input.lastSeenLocation?.trim() || null,
        last_seen_date: input.lastSeenAt || null,
      });
    }
    const created = await this.getPublicById(data.id);
    if (!created) throw new Error("create_report_reload_failed");
    return created;
  }

  async createDisaster(input: CreateDisasterInput): Promise<Disaster> {
    const name = input.name.trim();
    const region = input.region.trim();
    const country = input.country.trim();
    if (!name || !input.type || !country || !region || !input.startedAt) {
      throw new Error("missing_required_fields");
    }
    // Duplicate check (same name + country + start date).
    const { data: existing } = await supabase
      .from("disaster_events")
      .select("id")
      .ilike("name", name)
      .eq("country", country)
      .eq("start_date", input.startedAt)
      .maybeSingle();
    if (existing) throw new DuplicateDisasterError();

    const { data, error } = await supabase
      .from("disaster_events")
      .insert({
        name,
        event_type: input.type,
        custom_type: input.type === "other" ? input.customType?.trim() || null : null,
        country,
        region,
        start_date: input.startedAt,
        description: input.description?.trim() || null,
        magnitude:
          input.type === "earthquake" && input.magnitude?.trim()
            ? input.magnitude.trim()
            : null,
        affected_estimate: input.affectedEstimate ?? null,
        fatalities: input.fatalities ?? null,
        missing_count: input.missing ?? null,
        status: "active",
      })
      .select(EVENT_SELECT)
      .single()
      .returns<EventRow | null>();
    if (error || !data) {
      console.error("[people.createDisaster]", error);
      // RLS only allows admins; surface a clearer error.
      throw new Error(
        error?.code === "42501"
          ? "not_authorized_admin_only"
          : "create_disaster_failed",
      );
    }
    return mapDisaster(data);
  }
}

export const peopleRepository: IPeopleRepository = new CloudPeopleRepository();
