import type {
  Institution,
  InstitutionMembership,
  InstitutionStatus,
  InstitutionType,
  MembershipRole,
  MembershipStatus,
} from "../domain/institutions";
import { normalizeInstitutionName } from "../domain/institutions";
import { supabase } from "../integrations/supabase/client";

// ---------------------------------------------------------------------------
// Cloud-first InstitutionsRepository (Fase 4a)
// - Fuente de verdad: tablas `organizations` y `organization_memberships`.
// - Se hidrata la caché al montar (lectura anon permitida por RLS).
// - Los métodos de lectura siguen siendo síncronos contra la caché para
//   preservar la API existente; las escrituras son optimistas + upsert Cloud.
// - Sin localStorage ni seeds mock.
// ---------------------------------------------------------------------------

type OrgRow = {
  id: string;
  name: string;
  short_name: string | null;
  normalized_name: string;
  country: string;
  organization_type: InstitutionType;
  official_email: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  registration_code: string | null;
  address: string | null;
  description: string | null;
  verification_notes: string | null;
  status: InstitutionStatus;
  public_visibility: boolean;
  is_reference: boolean;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  updated_at: string;
};

type MemRow = {
  id: string;
  organization_id: string;
  user_email: string;
  user_name: string | null;
  institutional_role: MembershipRole;
  status: MembershipStatus;
  invite_token: string | null;
  invited_at: string;
  activated_at: string | null;
  updated_at: string;
};

function toInstitution(r: OrgRow): Institution {
  return {
    id: r.id,
    name: r.name,
    acronym: r.short_name ?? undefined,
    normalizedName: r.normalized_name,
    country: r.country,
    institutionType: r.organization_type,
    officialEmail: r.official_email ?? "",
    contactName: r.contact_name ?? undefined,
    contactEmail: r.contact_email ?? undefined,
    contactPhone: r.contact_phone ?? undefined,
    website: r.website ?? undefined,
    registrationNumber: r.registration_code ?? undefined,
    address: r.address ?? undefined,
    description: r.description ?? undefined,
    verificationNotes: r.verification_notes ?? undefined,
    status: r.status,
    publicVisibility: r.public_visibility,
    isReference: r.is_reference,
    createdByOperator: undefined,
    approvedByOperator: undefined,
    approvalNote: undefined,
    requestedAt: r.created_at,
    approvedAt: r.approved_at ?? undefined,
    rejectedAt: r.rejected_at ?? undefined,
    updatedAt: r.updated_at,
  };
}

function toMembership(r: MemRow): InstitutionMembership {
  return {
    id: r.id,
    institutionId: r.organization_id,
    userEmail: r.user_email,
    userName: r.user_name ?? r.user_email,
    institutionalRole: r.institutional_role,
    status: r.status,
    inviteToken: r.invite_token ?? undefined,
    invitedByOperator: "",
    invitedAt: r.invited_at,
    activatedAt: r.activated_at ?? undefined,
    updatedAt: r.updated_at,
  };
}

type Store = {
  institutions: Institution[];
  memberships: InstitutionMembership[];
};

let store: Store = { institutions: [], memberships: [] };
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}

function upsertInstitution(next: Institution) {
  const idx = store.institutions.findIndex((i) => i.id === next.id);
  store.institutions =
    idx < 0
      ? [next, ...store.institutions]
      : [
          ...store.institutions.slice(0, idx),
          next,
          ...store.institutions.slice(idx + 1),
        ];
}

function upsertMembership(next: InstitutionMembership) {
  const idx = store.memberships.findIndex((m) => m.id === next.id);
  store.memberships =
    idx < 0
      ? [next, ...store.memberships]
      : [
          ...store.memberships.slice(0, idx),
          next,
          ...store.memberships.slice(idx + 1),
        ];
}

let hydrated = false;
let hydrationPromise: Promise<void> | null = null;

async function hydrate(): Promise<void> {
  if (typeof window === "undefined") return;
  if (hydrated) return;
  if (hydrationPromise) return hydrationPromise;
  hydrationPromise = (async () => {
    const [{ data: orgs }, { data: mems }] = await Promise.all([
      supabase
        .from("organizations")
        .select(
          "id,name,short_name,normalized_name,country,organization_type,official_email,contact_name,contact_email,contact_phone,website,registration_code,address,description,verification_notes,status,public_visibility,is_reference,approved_at,rejected_at,created_at,updated_at",
        )
        .is("archived_at", null)
        .returns<OrgRow[]>(),
      supabase
        .from("organization_memberships")
        .select(
          "id,organization_id,user_email,user_name,institutional_role,status,invite_token,invited_at,activated_at,updated_at",
        )
        .returns<MemRow[]>(),
    ]);
    store = {
      institutions: (orgs ?? []).map(toInstitution),
      memberships: (mems ?? []).map(toMembership),
    };
    hydrated = true;
    notify();
  })();
  return hydrationPromise;
}

// Kick off hydration in the browser.
if (typeof window !== "undefined") {
  void hydrate();
}

function isoNow() {
  return new Date().toISOString();
}
function genId() {
  const c = globalThis.crypto as Crypto | undefined;
  return c?.randomUUID ? c.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
function genToken() {
  return `tok-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export class DuplicateInstitutionError extends Error {
  constructor() {
    super("duplicate_institution");
    this.name = "DuplicateInstitutionError";
  }
}
export class DuplicateMembershipError extends Error {
  constructor() {
    super("duplicate_membership");
    this.name = "DuplicateMembershipError";
  }
}

export interface CreateInstitutionInput {
  name: string;
  acronym?: string;
  country: string;
  institutionType: InstitutionType;
  officialEmail: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  registrationNumber?: string;
  address?: string;
  description?: string;
  verificationNotes?: string;
  createdByOperator: string;
}

export interface InviteUserInput {
  institutionId: string;
  userName: string;
  userEmail: string;
  institutionalRole: MembershipRole;
  invitedByOperator: string;
}

export interface ListFilters {
  status?: InstitutionStatus | "";
  country?: string;
  institutionType?: InstitutionType | "";
  q?: string;
}

export interface AuthenticateInput {
  institutionId: string;
  userEmail: string;
  role: MembershipRole;
}

export interface AuthenticateResult {
  ok: boolean;
  reason?:
    | "institution_not_found"
    | "institution_not_approved"
    | "membership_not_found"
    | "membership_inactive"
    | "role_mismatch";
  institution?: Institution;
  membership?: InstitutionMembership;
}

export const institutionsRepository = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  /** Fuerza re-hidratación desde Cloud. */
  async refresh() {
    hydrated = false;
    hydrationPromise = null;
    await hydrate();
  },

  ready: hydrate,

  // Institutions ---------------------------------------------------------
  list(filters: ListFilters = {}): Institution[] {
    const q = (filters.q ?? "").trim().toLowerCase();
    return store.institutions
      .filter((i) => {
        if (filters.status && i.status !== filters.status) return false;
        if (filters.country && i.country !== filters.country) return false;
        if (filters.institutionType && i.institutionType !== filters.institutionType)
          return false;
        if (q) {
          const hay = `${i.name} ${i.acronym ?? ""} ${i.country}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  },

  listApproved(): Institution[] {
    return store.institutions
      .filter((i) => i.status === "approved" && i.publicVisibility)
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  },

  getById(id: string): Institution | null {
    return store.institutions.find((i) => i.id === id) ?? null;
  },

  create(input: CreateInstitutionInput): Institution {
    const name = input.name.trim();
    const country = input.country.trim();
    if (!name || !country || !input.officialEmail.trim()) {
      throw new Error("missing_required_fields");
    }
    const normalized = normalizeInstitutionName(name);
    const email = input.officialEmail.trim().toLowerCase();
    const dup = store.institutions.find(
      (i) =>
        (i.normalizedName === normalized && i.country === country) ||
        i.officialEmail.toLowerCase() === email ||
        (!!input.registrationNumber && i.registrationNumber === input.registrationNumber),
    );
    if (dup) throw new DuplicateInstitutionError();

    const now = isoNow();
    const record: Institution = {
      id: genId(),
      name,
      acronym: input.acronym?.trim() || undefined,
      normalizedName: normalized,
      country,
      institutionType: input.institutionType,
      officialEmail: input.officialEmail.trim(),
      contactName: input.contactName?.trim() || undefined,
      contactEmail: input.contactEmail?.trim() || undefined,
      contactPhone: input.contactPhone?.trim() || undefined,
      website: input.website?.trim() || undefined,
      registrationNumber: input.registrationNumber?.trim() || undefined,
      address: input.address?.trim() || undefined,
      description: input.description?.trim() || undefined,
      verificationNotes: input.verificationNotes?.trim() || undefined,
      status: "pending",
      publicVisibility: false,
      isReference: false,
      createdByOperator: input.createdByOperator,
      requestedAt: now,
      updatedAt: now,
    };
    upsertInstitution(record);
    notify();

    void supabase
      .from("organizations")
      .insert({
        id: record.id,
        name: record.name,
        short_name: record.acronym ?? null,
        normalized_name: record.normalizedName,
        country: record.country,
        organization_type: record.institutionType,
        official_email: record.officialEmail,
        contact_name: record.contactName ?? null,
        contact_email: record.contactEmail ?? null,
        contact_phone: record.contactPhone ?? null,
        website: record.website ?? null,
        registration_code: record.registrationNumber ?? null,
        address: record.address ?? null,
        description: record.description ?? null,
        verification_notes: record.verificationNotes ?? null,
        status: "pending",
        public_visibility: false,
        is_reference: false,
      })
      .then(({ error }) => {
        if (error) console.warn("[institutions.create] cloud insert failed:", error.message);
      });
    return record;
  },

  updateStatus(
    id: string,
    next: InstitutionStatus,
    operator: string,
    note?: string,
  ): Institution | null {
    const prev = store.institutions.find((i) => i.id === id);
    if (!prev) return null;
    const now = isoNow();
    const updated: Institution = {
      ...prev,
      status: next,
      publicVisibility: next === "approved",
      isReference: next === "reference" ? true : prev.isReference,
      approvedByOperator: next === "approved" ? operator : prev.approvedByOperator,
      approvalNote: next === "approved" ? note ?? prev.approvalNote : prev.approvalNote,
      approvedAt: next === "approved" ? now : prev.approvedAt,
      rejectedAt: next === "rejected" ? now : prev.rejectedAt,
      updatedAt: now,
    };
    upsertInstitution(updated);
    notify();

    void supabase
      .from("organizations")
      .update({
        status: next,
        public_visibility: next === "approved",
        is_reference: next === "reference" ? true : prev.isReference,
        approved_at: next === "approved" ? now : prev.approvedAt ?? null,
        rejected_at: next === "rejected" ? now : prev.rejectedAt ?? null,
        verification_notes: next === "approved" && note ? note : prev.verificationNotes ?? null,
      })
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.warn("[institutions.updateStatus] cloud update failed:", error.message);
      });
    return updated;
  },

  update(id: string, patch: Partial<CreateInstitutionInput>): Institution | null {
    const prev = store.institutions.find((i) => i.id === id);
    if (!prev) return null;
    const now = isoNow();
    const nextName = patch.name?.trim() ?? prev.name;
    const updated: Institution = {
      ...prev,
      ...patch,
      name: nextName,
      normalizedName: normalizeInstitutionName(nextName),
      updatedAt: now,
    };
    upsertInstitution(updated);
    notify();

    void supabase
      .from("organizations")
      .update({
        name: updated.name,
        short_name: updated.acronym ?? null,
        normalized_name: updated.normalizedName,
        country: updated.country,
        organization_type: updated.institutionType,
        official_email: updated.officialEmail || null,
        contact_name: updated.contactName ?? null,
        contact_email: updated.contactEmail ?? null,
        contact_phone: updated.contactPhone ?? null,
        website: updated.website ?? null,
        registration_code: updated.registrationNumber ?? null,
        address: updated.address ?? null,
        description: updated.description ?? null,
        verification_notes: updated.verificationNotes ?? null,
      })
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.warn("[institutions.update] cloud update failed:", error.message);
      });
    return updated;
  },

  // Memberships ----------------------------------------------------------
  listMemberships(institutionId?: string): InstitutionMembership[] {
    return store.memberships.filter(
      (m) => !institutionId || m.institutionId === institutionId,
    );
  },

  countUsers(institutionId: string): number {
    return store.memberships.filter(
      (m) => m.institutionId === institutionId && m.status === "active",
    ).length;
  },

  inviteUser(input: InviteUserInput): InstitutionMembership {
    const email = input.userEmail.trim().toLowerCase();
    if (!email || !input.userName.trim()) {
      throw new Error("missing_required_fields");
    }
    const existing = store.memberships.find(
      (m) => m.userEmail.toLowerCase() === email,
    );
    if (existing) throw new DuplicateMembershipError();

    const inst = store.institutions.find((i) => i.id === input.institutionId);
    if (!inst || inst.status !== "approved") {
      throw new Error("institution_not_approved");
    }

    const now = isoNow();
    const record: InstitutionMembership = {
      id: genId(),
      institutionId: input.institutionId,
      userEmail: email,
      userName: input.userName.trim(),
      institutionalRole: input.institutionalRole,
      status: "invited",
      inviteToken: genToken(),
      invitedByOperator: input.invitedByOperator,
      invitedAt: now,
      updatedAt: now,
    };
    upsertMembership(record);
    notify();

    void supabase
      .from("organization_memberships")
      .insert({
        id: record.id,
        organization_id: record.institutionId,
        user_email: record.userEmail,
        user_name: record.userName,
        institutional_role: record.institutionalRole,
        status: "invited",
        invite_token: record.inviteToken ?? null,
        invited_at: now,
      })
      .then(({ error }) => {
        if (error) console.warn("[institutions.invite] cloud insert failed:", error.message);
      });
    return record;
  },

  activateInvite(token: string): InstitutionMembership | null {
    const prev = store.memberships.find((m) => m.inviteToken === token);
    if (!prev) return null;
    if (prev.status !== "invited") return prev;
    const now = isoNow();
    const updated: InstitutionMembership = {
      ...prev,
      status: "active",
      activatedAt: now,
      updatedAt: now,
    };
    upsertMembership(updated);
    notify();

    void supabase
      .from("organization_memberships")
      .update({ status: "active", activated_at: now })
      .eq("id", prev.id)
      .then(({ error }) => {
        if (error) console.warn("[institutions.activate] cloud update failed:", error.message);
      });
    return updated;
  },

  revokeMembership(id: string): InstitutionMembership | null {
    const prev = store.memberships.find((m) => m.id === id);
    if (!prev) return null;
    const now = isoNow();
    const updated: InstitutionMembership = { ...prev, status: "revoked", updatedAt: now };
    upsertMembership(updated);
    notify();

    void supabase
      .from("organization_memberships")
      .update({ status: "revoked" })
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.warn("[institutions.revoke] cloud update failed:", error.message);
      });
    return updated;
  },

  authenticate(input: AuthenticateInput): AuthenticateResult {
    const inst = store.institutions.find((i) => i.id === input.institutionId);
    if (!inst) return { ok: false, reason: "institution_not_found" };
    if (inst.status !== "approved")
      return { ok: false, reason: "institution_not_approved", institution: inst };

    const email = input.userEmail.trim().toLowerCase();
    const mem = store.memberships.find(
      (m) =>
        m.institutionId === input.institutionId &&
        m.userEmail.toLowerCase() === email,
    );
    if (!mem) return { ok: false, reason: "membership_not_found", institution: inst };
    if (mem.status !== "active")
      return { ok: false, reason: "membership_inactive", institution: inst, membership: mem };
    if (mem.institutionalRole !== input.role)
      return { ok: false, reason: "role_mismatch", institution: inst, membership: mem };
    return { ok: true, institution: inst, membership: mem };
  },

  // Stats ----------------------------------------------------------------
  stats() {
    const s = store.institutions;
    return {
      approved: s.filter((i) => i.status === "approved").length,
      pending: s.filter((i) => i.status === "pending").length,
      suspended: s.filter((i) => i.status === "suspended").length,
      reference: s.filter((i) => i.status === "reference").length,
      total: s.length,
      activeUsers: store.memberships.filter((m) => m.status === "active").length,
      countries: new Set(s.map((i) => i.country)).size,
    };
  },
};
