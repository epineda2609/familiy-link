// BASUF — In-memory Safe ID access log (demo).
import type {
  SafeIdAccessEvent,
  SafeIdAccessAction,
  SafeIdAudience,
} from "../domain/safeId";

const log: Record<string, SafeIdAccessEvent[]> = {};

function id() {
  return `sae-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export const safeIdRepository = {
  record(
    shortCode: string,
    audience: SafeIdAudience,
    action: SafeIdAccessAction,
    actorOrg?: string,
  ): SafeIdAccessEvent {
    const evt: SafeIdAccessEvent = {
      id: id(),
      at: new Date().toISOString(),
      audience,
      action,
      actorOrg,
    };
    log[shortCode] = [evt, ...(log[shortCode] ?? [])].slice(0, 20);
    return evt;
  },
  list(shortCode: string): SafeIdAccessEvent[] {
    return log[shortCode] ?? [];
  },
};
