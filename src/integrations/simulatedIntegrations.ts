// BASUF — Integraciones simuladas.
// Emula conectores con registros externos (Cruz Roja, ACNUR) y canales de
// notificación (SMS/WhatsApp/Email). En producción, estos conectores usarían
// APIs firmadas y colas de mensajes.

export type IntegrationId =
  | "cruz-roja-registry"
  | "acnur-registry"
  | "whatsapp-humanitarian"
  | "sms-broadcast"
  | "email-transactional";

export type IntegrationKind = "registry" | "messaging";
export type IntegrationStatus = "connected" | "degraded" | "offline";

export interface IntegrationDescriptor {
  id: IntegrationId;
  kind: IntegrationKind;
  name: string;
  provider: string;
  status: IntegrationStatus;
  lastSyncAt?: string;
  region: string;
}

export type DispatchChannel = "sms" | "whatsapp" | "email";
export type DispatchStatus = "queued" | "sent" | "failed";

export interface DispatchMessage {
  id: string;
  timestamp: string;
  integrationId: IntegrationId;
  channel: DispatchChannel;
  recipientLabel: string; // enmascarado para privacidad
  subject: string;
  body: string;
  status: DispatchStatus;
  relatedCaseId?: string;
  relatedMatchId?: string;
}

const STORAGE_KEY = "basuf.integrations.log";
const REG_KEY = "basuf.integrations.registry";
const MAX = 300;

const seedRegistry: IntegrationDescriptor[] = [
  {
    id: "cruz-roja-registry",
    kind: "registry",
    name: "Registro de Cruz Roja LATAM",
    provider: "Cruz Roja Internacional",
    status: "connected",
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    region: "Latinoamérica",
  },
  {
    id: "acnur-registry",
    kind: "registry",
    name: "Base ACNUR — Movilidad forzada",
    provider: "ACNUR",
    status: "degraded",
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    region: "LATAM · Frontera",
  },
  {
    id: "whatsapp-humanitarian",
    kind: "messaging",
    name: "WhatsApp Humanitario",
    provider: "Meta for Nonprofits",
    status: "connected",
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    region: "Global",
  },
  {
    id: "sms-broadcast",
    kind: "messaging",
    name: "SMS Broadcast",
    provider: "Operadoras LATAM",
    status: "connected",
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    region: "MX · CO · BR · CL",
  },
  {
    id: "email-transactional",
    kind: "messaging",
    name: "Correo transaccional",
    provider: "BASUF Ops",
    status: "offline",
    region: "Global",
  },
];

function loadRegistry(): IntegrationDescriptor[] {
  if (typeof window === "undefined") return seedRegistry;
  try {
    const raw = window.localStorage.getItem(REG_KEY);
    if (!raw) {
      window.localStorage.setItem(REG_KEY, JSON.stringify(seedRegistry));
      return seedRegistry;
    }
    return JSON.parse(raw) as IntegrationDescriptor[];
  } catch {
    return seedRegistry;
  }
}

function loadLog(): DispatchMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedLog();
    return JSON.parse(raw) as DispatchMessage[];
  } catch {
    return [];
  }
}

function seedLog(): DispatchMessage[] {
  const now = Date.now();
  const initial: DispatchMessage[] = [
    {
      id: "d-seed-1",
      timestamp: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
      integrationId: "whatsapp-humanitarian",
      channel: "whatsapp",
      recipientLabel: "+52 55 •••• 0001",
      subject: "Posible reencuentro",
      body: "Hemos identificado una posible coincidencia para tu ficha en BASUF.",
      status: "sent",
      relatedCaseId: "p-001",
    },
    {
      id: "d-seed-2",
      timestamp: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
      integrationId: "sms-broadcast",
      channel: "sms",
      recipientLabel: "+55 51 •••• 0004",
      subject: "Reencuentro confirmado",
      body: "Un revisor humano confirmó el reencuentro. Un aliado te contactará.",
      status: "sent",
      relatedCaseId: "p-004",
    },
  ];
  persistLog(initial);
  return initial;
}

let registry: IntegrationDescriptor[] = loadRegistry();
let log: DispatchMessage[] = loadLog();
const listeners = new Set<() => void>();

function persistLog(l: DispatchMessage[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(l));
  } catch {
    /* ignore */
  }
}
function persistRegistry(r: IntegrationDescriptor[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(REG_KEY, JSON.stringify(r));
  } catch {
    /* ignore */
  }
}
function notify() {
  listeners.forEach((l) => l());
}
function genId() {
  return `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const integrations = {
  listConnectors(): IntegrationDescriptor[] {
    return registry;
  },
  listLog(): DispatchMessage[] {
    return log;
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  getLogSnapshot(): DispatchMessage[] {
    return log;
  },
  getRegistrySnapshot(): IntegrationDescriptor[] {
    return registry;
  },
  dispatch(input: Omit<DispatchMessage, "id" | "timestamp" | "status">) {
    const conn = registry.find((r) => r.id === input.integrationId);
    const status: DispatchStatus =
      conn?.status === "offline"
        ? "failed"
        : conn?.status === "degraded"
          ? "queued"
          : "sent";
    const entry: DispatchMessage = {
      ...input,
      id: genId(),
      timestamp: new Date().toISOString(),
      status,
    };
    log = [entry, ...log].slice(0, MAX);
    persistLog(log);
    notify();
    return entry;
  },
  resync(id: IntegrationId) {
    registry = registry.map((r) =>
      r.id === id
        ? {
            ...r,
            status: r.status === "offline" ? "degraded" : "connected",
            lastSyncAt: new Date().toISOString(),
          }
        : r,
    );
    persistRegistry(registry);
    notify();
  },
  toggle(id: IntegrationId) {
    registry = registry.map((r) =>
      r.id === id
        ? {
            ...r,
            status: r.status === "offline" ? "connected" : "offline",
            lastSyncAt:
              r.status === "offline" ? new Date().toISOString() : r.lastSyncAt,
          }
        : r,
    );
    persistRegistry(registry);
    notify();
  },
  clearLog() {
    log = [];
    persistLog(log);
    notify();
  },
};
