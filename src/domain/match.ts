// BASUF — Modelo explicable de coincidencias.
export type MatchKind =
  | "exact"
  | "probabilistic"
  | "narrative"
  | "visual"
  | "human";

export type FieldAgreement = "match" | "contradict" | "partial" | "unknown";

export interface MatchField {
  key: "age" | "gender" | "location" | "disaster" | "features";
  valueA: string;
  valueB: string;
  agreement: FieldAgreement;
}

export type ReviewState = "pending" | "approved" | "rejected" | "needsAuthority";
export type RecommendedAction =
  | "requestValidation"
  | "markNoMatch"
  | "escalateAuthority"
  | "approveNow";

export type VisualSimilarityLevel = "low" | "medium" | "high";

export interface VisualSimilarity {
  level: VisualSimilarityLevel;
  note: string;
}

export interface MatchExplanation {
  kind: MatchKind;
  score: number; // 0-100
  fields: MatchField[]; // includes matching + partial
  contradictions: MatchField[]; // subset with agreement === "contradict"
  reportedBy: string;
  reviewState: ReviewState;
  recommendedAction: RecommendedAction;
  visualSimilarity?: VisualSimilarity;
}

export function confidenceLevel(score: number): "high" | "medium" | "low" {
  if (score >= 80) return "high";
  if (score >= 50) return "medium";
  return "low";
}
