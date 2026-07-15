// BASUF — Evidence repo (demo). LocalStorage persistence for uploads made in-session.
import type { EvidenceItem } from "../domain/evidence";
import { mockEvidence } from "../data/mock/evidence";

const STORAGE_KEY = "basuf.evidence.user";

function loadUser(): EvidenceItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EvidenceItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistUser(items: EvidenceItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

let userItems: EvidenceItem[] = loadUser();
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}

function id() {
  return `ev-u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export const evidenceRepository = {
  listByCase(caseRef: string): EvidenceItem[] {
    return [...mockEvidence, ...userItems]
      .filter((e) => e.caseRef === caseRef)
      .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
  },
  add(input: Omit<EvidenceItem, "id" | "uploadedAt">): EvidenceItem {
    const item: EvidenceItem = {
      ...input,
      id: id(),
      uploadedAt: new Date().toISOString(),
    };
    userItems = [item, ...userItems];
    persistUser(userItems);
    notify();
    return item;
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
