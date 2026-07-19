// BASUF — Safe ID access log backed by Lovable Cloud (audit_logs).
// The audit_logs table is the source of truth. This repo is a thin adapter
// that funnels safeId.* events into auditLog and exposes them shaped as
// SafeIdAccessEvent for the UI.
import { auditLog, type AuditEntry } from "../audit/auditLog";
import type {
  SafeIdAccessEvent,
  SafeIdAccessAction,
  SafeIdAudience,
} from "../domain/safeId";

const ACTION_MAP: Record<SafeIdAccessAction, "safeId.view" | "safeId.scan" | "safeId.print" | "safeId.share"> = {
  view: "safeId.view",
  scan: "safeId.scan",
  print: "safeId.print",
  share: "safeId.share",
};

function entryToEvent(e: AuditEntry): SafeIdAccessEvent | null {
  if (!e.action.startsWith("safeId.")) return null;
  const action = e.action.slice("safeId.".length) as SafeIdAccessAction;
  if (!["view", "scan", "print", "share"].includes(action)) return null;
  const audience = (e.metadata?.audience as SafeIdAudience | undefined) ?? "public";
  return {
    id: e.id,
    at: e.timestamp,
    audience,
    action,
    actorOrg: e.actor.orgName !== "—" ? e.actor.orgName : undefined,
  };
}

export const safeIdRepository = {
  record(
    shortCode: string,
    audience: SafeIdAudience,
    action: SafeIdAccessAction,
    actorOrg?: string,
  ): SafeIdAccessEvent {
    auditLog.record({
      actor: {
        operatorName: "Anónimo",
        orgName: actorOrg ?? "—",
        role: "public",
      },
      action: ACTION_MAP[action],
      targetId: shortCode,
      targetLabel: shortCode,
      metadata: { audience },
    });
    // Return the optimistic event (matches what the audit cache just prepended).
    return {
      id: `sae-${Date.now().toString(36)}`,
      at: new Date().toISOString(),
      audience,
      action,
      actorOrg,
    };
  },
  list(shortCode: string): SafeIdAccessEvent[] {
    return auditLog
      .list()
      .filter((e) => e.targetId === shortCode && e.action.startsWith("safeId."))
      .map(entryToEvent)
      .filter((x): x is SafeIdAccessEvent => x !== null)
      .slice(0, 20);
  },
  subscribe(fn: () => void) {
    return auditLog.subscribe(fn);
  },
};
