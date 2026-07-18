import type {
  Institution,
  InstitutionMembership,
  InstitutionStatus,
  InstitutionType,
  MembershipRole,
} from "../domain/institutions";
import { normalizeInstitutionName } from "../domain/institutions";
import {
  seedInstitutions,
  seedMemberships,
} from "../data/mock/institutions";

const INST_KEY = "basuf.institutions.v1";
const MEM_KEY = "basuf.institution_memberships.v1";

type Store = {
  institutions: Institution[];
  memberships: InstitutionMembership[];
};

function readStore(): Store {
  if (typeof window === "undefined") {
    return {
      institutions: [...seedInstitutions],
      memberships: [...seedMemberships],
    };
  }
  try {
    const rawI = window.localStorage.getItem(INST_KEY);
    const rawM = window.localStorage.getItem(MEM_KEY);
    const institutions =
      rawI ? (JSON.parse(rawI) as Institution[]) : [...seedInstitutions];
    const memberships =
      rawM ? (JSON.parse(rawM) as InstitutionMembership[]) : [...seedMemberships];
    return { institutions, memberships };
  } catch {
    return {
      institutions: [...seedInstitutions],
      memberships: [...seedMemberships],
    };
  }
}

function persist(store: Store) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(INST_KEY, JSON.stringify(store.institutions));
    window.localStorage.setItem(MEM_KEY, JSON.stringify(store.memberships));
  } catch {
    /* ignore */
  }
}

let store: Store = readStore();
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

function isoNow() {
  return new Date().toISOString();
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
          const hay =
            `${i.name} ${i.acronym ?? ""} ${i.country}`.toLowerCase();
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
    const dup = store.institutions.find(
      (i) =>
        (i.normalizedName === normalized && i.country === country) ||
        i.officialEmail.toLowerCase() === input.officialEmail.trim().toLowerCase() ||
        (!!input.registrationNumber &&
          i.registrationNumber === input.registrationNumber),
    );
    if (dup) throw new DuplicateInstitutionError();

    const now = isoNow();
    const record: Institution = {
      id: genId("inst"),
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
    store.institutions = [record, ...store.institutions];
    persist(store);
    notify();
    return record;
  },

  updateStatus(
    id: string,
    next: InstitutionStatus,
    operator: string,
    note?: string,
  ): Institution | null {
    const idx = store.institutions.findIndex((i) => i.id === id);
    if (idx < 0) return null;
    const now = isoNow();
    const prev = store.institutions[idx];
    const updated: Institution = {
      ...prev,
      status: next,
      publicVisibility: next === "approved",
      isReference: next === "reference" ? true : prev.isReference,
      approvedByOperator:
        next === "approved" ? operator : prev.approvedByOperator,
      approvalNote: next === "approved" ? note ?? prev.approvalNote : prev.approvalNote,
      approvedAt: next === "approved" ? now : prev.approvedAt,
      rejectedAt: next === "rejected" ? now : prev.rejectedAt,
      updatedAt: now,
    };
    store.institutions = [
      ...store.institutions.slice(0, idx),
      updated,
      ...store.institutions.slice(idx + 1),
    ];
    persist(store);
    notify();
    return updated;
  },

  update(id: string, patch: Partial<CreateInstitutionInput>): Institution | null {
    const idx = store.institutions.findIndex((i) => i.id === id);
    if (idx < 0) return null;
    const prev = store.institutions[idx];
    const now = isoNow();
    const nextName = patch.name?.trim() ?? prev.name;
    const updated: Institution = {
      ...prev,
      ...patch,
      name: nextName,
      normalizedName: normalizeInstitutionName(nextName),
      updatedAt: now,
    };
    store.institutions = [
      ...store.institutions.slice(0, idx),
      updated,
      ...store.institutions.slice(idx + 1),
    ];
    persist(store);
    notify();
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
    // Un correo único, y en una sola institución.
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
      id: genId("mem"),
      institutionId: input.institutionId,
      userEmail: email,
      userName: input.userName.trim(),
      institutionalRole: input.institutionalRole,
      status: "invited",
      inviteToken: genId("tok"),
      invitedByOperator: input.invitedByOperator,
      invitedAt: now,
      updatedAt: now,
    };
    store.memberships = [record, ...store.memberships];
    persist(store);
    notify();
    return record;
  },

  activateInvite(token: string): InstitutionMembership | null {
    const idx = store.memberships.findIndex((m) => m.inviteToken === token);
    if (idx < 0) return null;
    const prev = store.memberships[idx];
    if (prev.status !== "invited") return prev;
    const now = isoNow();
    const updated: InstitutionMembership = {
      ...prev,
      status: "active",
      activatedAt: now,
      updatedAt: now,
    };
    store.memberships = [
      ...store.memberships.slice(0, idx),
      updated,
      ...store.memberships.slice(idx + 1),
    ];
    persist(store);
    notify();
    return updated;
  },

  revokeMembership(id: string): InstitutionMembership | null {
    const idx = store.memberships.findIndex((m) => m.id === id);
    if (idx < 0) return null;
    const now = isoNow();
    const updated: InstitutionMembership = {
      ...store.memberships[idx],
      status: "revoked",
      updatedAt: now,
    };
    store.memberships = [
      ...store.memberships.slice(0, idx),
      updated,
      ...store.memberships.slice(idx + 1),
    ];
    persist(store);
    notify();
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
    if (!mem)
      return { ok: false, reason: "membership_not_found", institution: inst };
    if (mem.status !== "active")
      return {
        ok: false,
        reason: "membership_inactive",
        institution: inst,
        membership: mem,
      };
    if (mem.institutionalRole !== input.role)
      return {
        ok: false,
        reason: "role_mismatch",
        institution: inst,
        membership: mem,
      };
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
