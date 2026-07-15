import type { EvidenceItem } from "../../domain/evidence";

// Placeholder URL served from public/. Never real photos of deceased people.
const PH = "/placeholder.svg";

export const mockEvidence: EvidenceItem[] = [
  {
    id: "ev-1",
    caseRef: "p-001",
    kind: "person_photo",
    visibility: "public",
    url: PH,
    caption: "Foto pública aportada por la familia (demo).",
    sensitive: false,
    uploadedAt: "2026-06-24T14:00:00Z",
    uploadedBy: "Familia · reportante",
  },
  {
    id: "ev-2",
    caseRef: "p-001",
    kind: "clothing",
    visibility: "family_verified",
    url: PH,
    caption: "Camisa gris con logotipo — última vestimenta reportada.",
    sensitive: false,
    uploadedAt: "2026-06-24T15:22:00Z",
    uploadedBy: "Familia · reportante",
  },
  {
    id: "ev-3",
    caseRef: "p-001",
    kind: "document",
    visibility: "institution",
    url: PH,
    caption: "Copia parcial de cédula (demo).",
    sensitive: true,
    uploadedAt: "2026-06-25T09:41:00Z",
    uploadedBy: "Cruz Roja Venezolana",
  },
  {
    id: "ev-4",
    caseRef: "p-001",
    kind: "institutional",
    visibility: "authority",
    url: PH,
    caption: "Reporte clínico de ingreso — solo autoridad.",
    sensitive: true,
    uploadedAt: "2026-06-25T18:05:00Z",
    uploadedBy: "Protección Civil",
  },
];
