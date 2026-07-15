// BASUF — Registro de auditoría simulado.
// Persiste en localStorage y notifica a suscriptores para vistas reactivas.
// En producción, este log sería inmutable y firmado en el backend.

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
  | "evidence.reveal";

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

const STORAGE_KEY = "basuf.audit.log";
const MAX_ENTRIES = 500;

let entries: AuditEntry[] = load();
const listeners = new Set<() => void>();

function load(): AuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as AuditEntry[];
    return Array.isArray(parsed) ? parsed : seed();
  } catch {
    return seed();
  }
}

function seed(): AuditEntry[] {
  // Semilla mínima para que el panel de auditoría no aparezca vacío en el prototipo.
  const now = Date.now();
  const iso = (ms: number) => new Date(now - ms).toISOString();
  const initial: AuditEntry[] = [
    {
      id: `a-seed-1`,
      timestamp: iso(1000 * 60 * 60 * 26),
      actor: { operatorName: "Sistema", orgName: "BASUF", role: "system" },
      action: "auth.signIn",
      metadata: { note: "Inicialización del entorno de demostración" },
    },
    {
      id: `a-seed-2`,
      timestamp: iso(1000 * 60 * 60 * 20),
      actor: { operatorName: "L. Ortega", orgName: "Cruz Roja LATAM", role: "reviewer" },
      action: "match.approve",
      targetId: "m-001",
      targetLabel: "Coincidencia p-001 ↔ p-004",
      metadata: { score: "88" },
    },
    {
      id: `a-seed-3`,
      timestamp: iso(1000 * 60 * 60 * 8),
      actor: { operatorName: "M. Silva", orgName: "ACNUR LATAM", role: "admin" },
      action: "case.verify",
      targetId: "p-005",
      targetLabel: "Caso p-005",
    },
  ];
  persist(initial);
  return initial;
}

function persist(list: AuditEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function notify() {
  listeners.forEach((l) => l());
}

function genId() {
  return `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const auditLog = {
  record(input: Omit<AuditEntry, "id" | "timestamp">) {
    const entry: AuditEntry = {
      ...input,
      id: genId(),
      timestamp: new Date().toISOString(),
    };
    entries = [entry, ...entries].slice(0, MAX_ENTRIES);
    persist(entries);
    notify();
  },
  list(): AuditEntry[] {
    return entries;
  },
  clear() {
    entries = [];
    persist(entries);
    notify();
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  getSnapshot(): AuditEntry[] {
    return entries;
  },
};
