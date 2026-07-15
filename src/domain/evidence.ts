// BASUF — Evidencia visual y documentos con visibilidad por audiencia.
import type { SafeIdAudience } from "./safeId";

export type EvidenceVisibility =
  | "public"
  | "family_verified"
  | "institution"
  | "authority"
  | "restricted";

export type EvidenceKind =
  | "person_photo"
  | "document"
  | "institutional"
  | "clothing"
  | "location";

export interface EvidenceItem {
  id: string;
  caseRef: string; // person id or rescue code
  kind: EvidenceKind;
  visibility: EvidenceVisibility;
  url: string; // dataURL en demo o URL local
  caption?: string;
  sensitive: boolean;
  uploadedAt: string;
  uploadedBy: string;
}

const VIS_ORDER: readonly EvidenceVisibility[] = [
  "public",
  "family_verified",
  "institution",
  "authority",
  "restricted",
];

const AUD_TO_VIS: Record<SafeIdAudience, EvidenceVisibility> = {
  public: "public",
  family: "family_verified",
  institution: "institution",
  authority: "authority",
};

export function isVisibleFor(
  item: EvidenceItem,
  audience: SafeIdAudience,
): boolean {
  const audienceLevel = VIS_ORDER.indexOf(AUD_TO_VIS[audience]);
  const itemLevel = VIS_ORDER.indexOf(item.visibility);
  if (item.visibility === "restricted") return audience === "authority";
  // public sees only public and non-sensitive
  if (audience === "public" && item.sensitive) return false;
  if (audience === "public" && item.kind === "document") return false;
  return audienceLevel >= itemLevel;
}
