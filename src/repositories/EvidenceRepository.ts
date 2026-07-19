// BASUF — Evidence repo backed by Lovable Cloud (attachments table).
// Keeps a reactive in-memory cache to preserve the current sync UI shape.
// Falls back to bundled mock evidence when Cloud has no rows for a case (demo).
import type { EvidenceItem, EvidenceKind, EvidenceVisibility } from "../domain/evidence";
import { mockEvidence } from "../data/mock/evidence";
import { supabase } from "../integrations/supabase/client";

// case_ref -> items (freshest first)
const cache = new Map<string, EvidenceItem[]>();
const loaded = new Set<string>();
const inflight = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

interface AttachmentRow {
  id: string;
  entity_type: string;
  entity_id: string;
  file_name: string;
  file_type: string | null;
  file_url: string | null;
  visibility: EvidenceVisibility | null;
  is_sensitive: boolean;
  created_at: string;
  uploaded_by: string | null;
}

// Attachments use a controlled enum for visibility (see visibility_level).
// Our UI has richer values; map them to the DB-safe values.
const VIS_TO_DB: Record<EvidenceVisibility, "public" | "institutional" | "restricted"> = {
  public: "public",
  family_verified: "institutional",
  institution: "institutional",
  authority: "restricted",
  restricted: "restricted",
};

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function rowToItem(r: AttachmentRow, caseRef: string): EvidenceItem {
  const kind: EvidenceKind =
    (r.file_type as EvidenceKind) === "person_photo" ||
    (r.file_type as EvidenceKind) === "document" ||
    (r.file_type as EvidenceKind) === "institutional" ||
    (r.file_type as EvidenceKind) === "clothing" ||
    (r.file_type as EvidenceKind) === "location"
      ? (r.file_type as EvidenceKind)
      : "person_photo";
  return {
    id: r.id,
    caseRef,
    kind,
    visibility: (r.visibility ?? "institution") as EvidenceVisibility,
    url: r.file_url ?? "",
    caption: r.file_name || undefined,
    sensitive: !!r.is_sensitive,
    uploadedAt: r.created_at,
    uploadedBy: r.uploaded_by ?? "—",
  };
}

async function hydrate(caseRef: string): Promise<void> {
  if (loaded.has(caseRef) || typeof window === "undefined") return;
  const existing = inflight.get(caseRef);
  if (existing) return existing;
  // Only case refs that look like UUIDs are stored in Cloud (persons.id).
  // For legacy demo refs (e.g. rescue codes), keep the mock fallback.
  if (!isUuid(caseRef)) {
    loaded.add(caseRef);
    return;
  }
  const p = (async () => {
    try {
      const { data, error } = await supabase
        .from("attachments")
        .select(
          "id, entity_type, entity_id, file_name, file_type, file_url, visibility, is_sensitive, created_at, uploaded_by",
        )
        .eq("entity_id", caseRef)
        .order("created_at", { ascending: false })
        .returns<AttachmentRow[]>();
      if (!error && data) {
        const items = data.map((r) => rowToItem(r, caseRef));
        cache.set(caseRef, items);
        notify();
      }
    } catch {
      /* silent — fall back to mocks */
    } finally {
      loaded.add(caseRef);
      inflight.delete(caseRef);
    }
  })();
  inflight.set(caseRef, p);
  return p;
}

export const evidenceRepository = {
  listByCase(caseRef: string): EvidenceItem[] {
    // Kick off async hydration on first access (fire-and-forget).
    void hydrate(caseRef);
    const cloud = cache.get(caseRef) ?? [];
    const seed = mockEvidence.filter((e) => e.caseRef === caseRef);
    // De-dup by id (cloud wins if same id somehow)
    const seenIds = new Set(cloud.map((c) => c.id));
    const merged = [...cloud, ...seed.filter((s) => !seenIds.has(s.id))];
    return merged.sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
  },
  async add(
    input: Omit<EvidenceItem, "id" | "uploadedAt">,
  ): Promise<EvidenceItem> {
    const now = new Date().toISOString();
    const optimistic: EvidenceItem = {
      ...input,
      id: `ev-tmp-${Date.now().toString(36)}`,
      uploadedAt: now,
    };
    const current = cache.get(input.caseRef) ?? [];
    cache.set(input.caseRef, [optimistic, ...current]);
    notify();

    if (typeof window === "undefined" || !isUuid(input.caseRef)) {
      return optimistic;
    }

    try {
      const { data: sess } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("attachments")
        .insert({
          entity_type: "person",
          entity_id: input.caseRef,
          file_name: input.caption ?? "evidence",
          file_type: input.kind,
          file_url: input.url,
          visibility: VIS_TO_DB[input.visibility],
          is_sensitive: input.sensitive,
          uploaded_by: sess.user?.id ?? null,
        })
        .select(
          "id, entity_type, entity_id, file_name, file_type, file_url, visibility, is_sensitive, created_at, uploaded_by",
        )
        .maybeSingle();

      if (!error && data) {
        const persisted = rowToItem(data as AttachmentRow, input.caseRef);
        const list = (cache.get(input.caseRef) ?? []).map((e) =>
          e.id === optimistic.id ? persisted : e,
        );
        cache.set(input.caseRef, list);
        notify();
        return persisted;
      }
    } catch {
      /* keep optimistic entry */
    }
    return optimistic;
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
