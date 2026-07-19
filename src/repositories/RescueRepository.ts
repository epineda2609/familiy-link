// BASUF — Rescue Intake repo backed by Lovable Cloud (rescue_intakes table).
// Reactive in-memory cache preserves the current sync UI shape.
// Falls back to bundled mocks when Cloud has no rows yet (demo).
import type { ChainEvent, RescueEventType, RescueRecord } from "../domain/rescue";
import { mockRescueRecords } from "../data/mock/rescue";
import { supabase } from "../integrations/supabase/client";
import { useEffect, useSyncExternalStore } from "react";

interface RescueRow {
  id: string;
  code: string;
  person_id: string | null;
  intake_location: string | null;
  intake_at: string;
  rescuer_name: string | null;
  rescuer_organization: string | null;
  notes: string | null;
  chain_events: unknown;
  created_at: string;
}

const cache = new Map<string, RescueRecord>();
let hydrated = false;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

// Seed cache with mocks so the first paint has data even before hydration.
mockRescueRecords.forEach((r) => cache.set(r.code.toUpperCase(), r));

function notify() {
  listeners.forEach((l) => l());
}

function isChainEvent(v: unknown): v is ChainEvent {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.type === "string" && typeof o.at === "string";
}

function normalizeChain(raw: unknown): ChainEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isChainEvent);
}

function rowToRecord(r: RescueRow): RescueRecord {
  const chain = normalizeChain(r.chain_events);
  const last = chain[chain.length - 1];
  const tempIdFromChain = chain
    .map((e) => (e as ChainEvent & { tempId?: string }).tempId)
    .find(Boolean);
  return {
    code: r.code,
    tempId: tempIdFromChain ?? `TMP-${new Date(r.intake_at).toISOString().slice(0, 10).replace(/-/g, "")}-${r.code.slice(-4)}`,
    createdAt: r.created_at ?? r.intake_at,
    displayHint: r.notes ?? undefined,
    linkedPersonId: r.person_id ?? undefined,
    currentStatus: (last?.type as RescueEventType) ?? "rescue",
    chain,
  };
}

async function hydrate(): Promise<void> {
  if (hydrated || typeof window === "undefined") return;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const { data, error } = await supabase
        .from("rescue_intakes")
        .select(
          "id, code, person_id, intake_location, intake_at, rescuer_name, rescuer_organization, notes, chain_events, created_at",
        )
        .order("intake_at", { ascending: false })
        .returns<RescueRow[]>();
      if (!error && data) {
        for (const row of data) {
          const rec = rowToRecord(row);
          if (rec.chain.length > 0) cache.set(rec.code.toUpperCase(), rec);
        }
        notify();
      }
    } catch {
      /* fall back to mocks */
    } finally {
      hydrated = true;
      inflight = null;
    }
  })();
  return inflight;
}

function normalizeCode(code: string): string {
  const raw = code.trim().toUpperCase().replace(/\s+/g, "");
  if (raw.startsWith("R-")) return raw;
  if (raw.startsWith("TMP-")) return raw;
  return `R-${raw}`;
}

export const rescueRepository = {
  list(): RescueRecord[] {
    void hydrate();
    return Array.from(cache.values()).sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
  },
  find(code: string): RescueRecord | undefined {
    void hydrate();
    const norm = normalizeCode(code);
    const direct = cache.get(norm);
    if (direct) return direct;
    // Fallback: match by tempId or bare 4-char suffix.
    const bare = code.trim().toUpperCase().replace(/\s+/g, "");
    for (const rec of cache.values()) {
      if (rec.tempId.toUpperCase() === bare) return rec;
      if (rec.code.toUpperCase().replace("R-", "") === bare) return rec;
    }
    return undefined;
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

/** React hook: returns a live snapshot of all rescue records. */
export function useRescueList(): RescueRecord[] {
  useEffect(() => {
    void hydrate();
  }, []);
  return useSyncExternalStore(
    (cb) => rescueRepository.subscribe(cb),
    () => rescueRepository.list(),
    () => rescueRepository.list(),
  );
}

/** React hook: subscribes to updates for a single rescue code. */
export function useRescue(code: string): RescueRecord | undefined {
  useEffect(() => {
    void hydrate();
  }, []);
  return useSyncExternalStore(
    (cb) => rescueRepository.subscribe(cb),
    () => rescueRepository.find(code),
    () => rescueRepository.find(code),
  );
}
