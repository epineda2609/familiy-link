// BASUF — Aportes ciudadanos sobre un caso existente ("Tengo información").
// Cada envío queda almacenado como una nueva actualización asociada al caso,
// sin sobrescribir los datos oficiales. Repositorio en memoria (mock).
import { useSyncExternalStore, useMemo } from "react";
import type { Gender, PersonStatus } from "../domain/types";
import { cloudSync } from "../lib/cloudSync";

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

type Listener = () => void;

const listeners = new Set<Listener>();
let records: CaseUpdateRecord[] = [];
let version = 0;

function emit() {
  version += 1;
  for (const l of listeners) l();
}

export const caseUpdateRepository = {
  create(input: CaseUpdateInput): CaseUpdateRecord {
    const record: CaseUpdateRecord = {
      ...input,
      id: `cu_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      validation: "pending",
    };
    records = [...records, record];
    emit();
    return record;
  },
  listByCase(caseId: string): CaseUpdateRecord[] {
    return records.filter((r) => r.caseId === caseId);
  },
  all(): CaseUpdateRecord[] {
    return records;
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
