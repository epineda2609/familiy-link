// BASUF — Registro de auditoría respaldado en Lovable Cloud (tabla audit_logs).
// Mantiene una caché en memoria para vistas reactivas; la fuente de verdad es Cloud.
import { supabase } from "@/integrations/supabase/client";

export type AuditAction =
  | "auth.signIn"
  | "auth.signOut"
  | "case.statusChange"
  | "case.verify"
  | "case.unverify"
  | "sensitive.reveal"
  | "match.approve"
  | "match.reject"
  | "match.reset"
  | "safeId.view"
  | "safeId.scan"
  | "safeId.print"
  | "safeId.share"
  | "safeId.audience.change"
  | "evidence.upload"
  | "evidence.reveal"
  | "disaster.create"
  | "institution.create"
  | "institution.edit"
  | "institution.approve"
  | "institution.reject"
  | "institution.suspend"
  | "institution.reactivate"
  | "institution.archive"
  | "institution.invite"
  | "institution.membership.activate"
  | "institution.membership.revoke";

export interface AuditActor {
  operatorName: string;
  orgName: string;
  role: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: AuditActor;
  action: AuditAction;
  targetId?: string;
  targetLabel?: string;
  metadata?: Record<string, string | undefined>;
}

const MAX_ENTRIES = 500;

let entries: AuditEntry[] = [];
const listeners = new Set<() => void>();
let loaded = false;
let loadingPromise: Promise<void> | null = null;

interface AuditRow {
  id: string;
  created_at: string;
  actor_name: string | null;
  actor_org: string | null;
  actor_role: string | null;
  action: string;
  entity_id: string | null;
  target_label: string | null;
  metadata: Record<string, string | undefined> | null;
}

function rowToEntry(r: AuditRow): AuditEntry {
  return {
    id: r.id,
    timestamp: r.created_at,
    actor: {
      operatorName: r.actor_name ?? "Sistema",
      orgName: r.actor_org ?? "BASUF",
      role: r.actor_role ?? "system",
    },
    action: r.action as AuditAction,
    targetId: r.entity_id ?? undefined,
    targetLabel: r.target_label ?? undefined,
    metadata: r.metadata ?? undefined,
  };
}

function notify() {
  listeners.forEach((l) => l());
}

async function loadFromCloud(): Promise<void> {
  if (loaded || typeof window === "undefined") return;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select(
          "id, created_at, actor_name, actor_org, actor_role, action, entity_id, target_label, metadata",
        )
        .order("created_at", { ascending: false })
        .limit(MAX_ENTRIES)
        .returns<AuditRow[]>();
      if (!error && data) {
        entries = data.map(rowToEntry);
        loaded = true;
        notify();
      }
    } catch {
      /* solo lectura; los inserts siguen funcionando */
    }
  })();
  return loadingPromise;
}

// Kick off initial load in the browser.
if (typeof window !== "undefined") {
  void loadFromCloud();
}

function tempId() {
  return `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const auditLog = {
  record(input: Omit<AuditEntry, "id" | "timestamp">) {
    const optimistic: AuditEntry = {
      ...input,
      id: tempId(),
      timestamp: new Date().toISOString(),
    };
    entries = [optimistic, ...entries].slice(0, MAX_ENTRIES);
    notify();

    if (typeof window === "undefined") return;
    void (async () => {
      try {
        const { data } = await supabase
          .from("audit_logs")
          .insert({
            actor_name: input.actor.operatorName,
            actor_org: input.actor.orgName,
            actor_role: input.actor.role,
            action: input.action,
            target_label: input.targetLabel ?? null,
            metadata: input.metadata ?? null,
          })
          .select("id, created_at")
          .maybeSingle();
        if (data?.id) {
          entries = entries.map((e) =>
            e.id === optimistic.id
              ? { ...e, id: data.id, timestamp: data.created_at ?? e.timestamp }
              : e,
          );
          notify();
        }
      } catch {
        /* mantener entrada optimista; la UI ya la muestra */
      }
    })();
  },
  list(): AuditEntry[] {
    return entries;
  },
  async refresh() {
    loaded = false;
    loadingPromise = null;
    await loadFromCloud();
  },
  clear() {
    // Solo limpia la vista local; los registros persistidos son inmutables.
    entries = [];
    notify();
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    // Asegura carga inicial si un consumidor se suscribe temprano.
    void loadFromCloud();
    return () => {
      listeners.delete(fn);
    };
  },
  getSnapshot(): AuditEntry[] {
    return entries;
  },
};
