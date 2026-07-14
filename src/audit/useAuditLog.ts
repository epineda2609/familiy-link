import { useSyncExternalStore } from "react";
import { auditLog, type AuditEntry } from "./auditLog";

export function useAuditLog(): AuditEntry[] {
  return useSyncExternalStore(
    auditLog.subscribe,
    auditLog.getSnapshot,
    () => [] as AuditEntry[],
  );
}
