// BASUF — Aportes ciudadanos ("Tengo información") persistidos en Lovable Cloud
// vía la tabla `additional_information_reports`. Se conserva una caché reactiva
// en memoria para que la UI (timeline, ficha) siga siendo síncrona.
import { useSyncExternalStore, useMemo } from "react";
import type { Gender, PersonStatus } from "../domain/types";
import { supabase } from "../integrations/supabase/client";

export type CaseUpdateValidation = "pending" | "verified" | "rejected";

export interface CaseUpdateInput {
  caseId: string;
  identity: {
    knownName?: string;
    alias?: string;
    approximateAge?: string;
    nationality?: string;
    document?: string;
    gender?: Gender | "";
    notes?: string;
  };
  lastSeen: {
    date?: string;
    time?: string;
    country?: string;
    city?: string;
    location?: string;
    description?: string;
  };
  proposedStatus?: PersonStatus | "";
  reporter: {
    anonymous: boolean;
    name?: string;
    email?: string;
    phone?: string;
    relation?: string;
  };
}

export interface CaseUpdateRecord extends CaseUpdateInput {
  id: string;
  createdAt: string; // ISO
  validation: CaseUpdateValidation;
}

interface ReportRow {
  id: string;
  person_id: string;
  submitted_by_name: string | null;
  submitted_by_email: string | null;
  submitted_by_phone: string | null;
  information_type: string | null;
  description: string;
  sighting_date: string | null;
  sighting_location: string | null;
  anonymity_requested: boolean;
  status: string;
  created_at: string;
}

type Listener = () => void;

const listeners = new Set<Listener>();
const cache = new Map<string, CaseUpdateRecord[]>();
const loaded = new Set<string>();
const inflight = new Map<string, Promise<void>>();
let version = 0;

function emit() {
  version += 1;
  for (const l of listeners) l();
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

const VALID_STATUSES: PersonStatus[] = [
  "missing",
  "searching",
  "found",
  "reunited",
];

function rowToRecord(r: ReportRow): CaseUpdateRecord {
  const proposed = r.information_type && (VALID_STATUSES as string[]).includes(r.information_type)
    ? (r.information_type as PersonStatus)
    : "";
  const validation: CaseUpdateValidation =
    r.status === "verified" || r.status === "confirmed"
      ? "verified"
      : r.status === "rejected" || r.status === "discarded"
        ? "rejected"
        : "pending";
  return {
    id: r.id,
    caseId: r.person_id,
    createdAt: r.created_at,
    validation,
    identity: {
      notes: r.description ?? undefined,
    },
    lastSeen: {
      date: r.sighting_date ? r.sighting_date.slice(0, 10) : undefined,
      location: r.sighting_location ?? undefined,
      description: r.description ?? undefined,
    },
    proposedStatus: proposed,
    reporter: {
      anonymous: r.anonymity_requested,
      name: r.submitted_by_name ?? undefined,
      email: r.submitted_by_email ?? undefined,
      phone: r.submitted_by_phone ?? undefined,
    },
  };
}

async function hydrate(caseId: string): Promise<void> {
  if (loaded.has(caseId) || typeof window === "undefined") return;
  if (!isUuid(caseId)) {
    loaded.add(caseId);
    return;
  }
  const existing = inflight.get(caseId);
  if (existing) return existing;
  const p = (async () => {
    try {
      const { data, error } = await supabase
        .from("additional_information_reports")
        .select(
          "id, person_id, submitted_by_name, submitted_by_email, submitted_by_phone, information_type, description, sighting_date, sighting_location, anonymity_requested, status, created_at",
        )
        .eq("person_id", caseId)
        .order("created_at", { ascending: false })
        .returns<ReportRow[]>();
      if (!error && data) {
        cache.set(caseId, data.map(rowToRecord));
        emit();
      }
    } catch {
      /* silent */
    } finally {
      loaded.add(caseId);
      inflight.delete(caseId);
    }
  })();
  inflight.set(caseId, p);
  return p;
}

export const caseUpdateRepository = {
  async create(input: CaseUpdateInput): Promise<CaseUpdateRecord> {
    const now = new Date().toISOString();
    const optimistic: CaseUpdateRecord = {
      ...input,
      id: `cu_tmp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
      validation: "pending",
    };
    const current = cache.get(input.caseId) ?? [];
    cache.set(input.caseId, [optimistic, ...current]);
    emit();

    if (typeof window === "undefined" || !isUuid(input.caseId)) {
      return optimistic;
    }

    try {
      const description =
        [input.lastSeen.description, input.identity.notes]
          .map((s) => (s ?? "").trim())
          .filter(Boolean)
          .join("\n\n") || "Aporte ciudadano";
      const { data: sess } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("additional_information_reports")
        .insert({
          person_id: input.caseId,
          submitted_by_user_id: sess.user?.id ?? null,
          submitted_by_name: input.reporter.anonymous ? null : input.reporter.name ?? null,
          submitted_by_email: input.reporter.anonymous ? null : input.reporter.email ?? null,
          submitted_by_phone: input.reporter.anonymous ? null : input.reporter.phone ?? null,
          information_type: input.proposedStatus || "sighting",
          description,
          sighting_date: input.lastSeen.date ? new Date(input.lastSeen.date).toISOString() : null,
          sighting_location:
            [input.lastSeen.city, input.lastSeen.location].filter(Boolean).join(" · ") || null,
          anonymity_requested: input.reporter.anonymous,
          source_type: "citizen",
        })
        .select(
          "id, person_id, submitted_by_name, submitted_by_email, submitted_by_phone, information_type, description, sighting_date, sighting_location, anonymity_requested, status, created_at",
        )
        .maybeSingle();
      if (!error && data) {
        const persisted = rowToRecord(data as ReportRow);
        // Preserve the richer client-side identity/lastSeen fields (Cloud only
        // stores the summarized description).
        const merged: CaseUpdateRecord = {
          ...persisted,
          identity: { ...input.identity, notes: persisted.identity.notes },
          lastSeen: { ...input.lastSeen, date: persisted.lastSeen.date ?? input.lastSeen.date },
          reporter: { ...input.reporter },
        };
        const list = (cache.get(input.caseId) ?? []).map((r) =>
          r.id === optimistic.id ? merged : r,
        );
        cache.set(input.caseId, list);
        emit();
        return merged;
      }
    } catch {
      /* keep optimistic entry */
    }
    return optimistic;
  },
  listByCase(caseId: string): CaseUpdateRecord[] {
    void hydrate(caseId);
    return cache.get(caseId) ?? [];
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  getVersion() {
    return version;
  },
};

export function useCaseUpdates(caseId: string): CaseUpdateRecord[] {
  const v = useSyncExternalStore(
    (l) => caseUpdateRepository.subscribe(l),
    () => caseUpdateRepository.getVersion(),
    () => 0,
  );
  return useMemo(() => caseUpdateRepository.listByCase(caseId), [caseId, v]);
}
