// BASUF — Modos operativos por contexto de crisis.
// Cada modo es una preferencia de interfaz, NO un rol de seguridad.
import type { MessageKey } from "../i18n/messages";

export type OperationalMode =
  | "family"
  | "callcenter"
  | "field"
  | "hospital"
  | "shelter"
  | "coord";

export type ModeDensity = "comfortable" | "compact" | "touch";
export type ModeTone = "warm" | "neutral" | "clinical";

export interface ModeCTA {
  labelKey: MessageKey;
  to: "/search" | "/report" | "/rescue" | "/institutional" | "/modes" | "/";
}

export interface ModeConfig {
  id: OperationalMode;
  labelKey: MessageKey;
  descKey: MessageKey;
  density: ModeDensity;
  tone: ModeTone;
  ctas: ModeCTA[]; // in priority order
}

export const MODES: readonly ModeConfig[] = [
  {
    id: "family",
    labelKey: "mode.family",
    descKey: "mode.family.desc",
    density: "comfortable",
    tone: "warm",
    ctas: [
      { labelKey: "nav.search", to: "/search" },
      { labelKey: "nav.report", to: "/report" },
      { labelKey: "nav.rescue", to: "/rescue" },
    ],
  },
  {
    id: "callcenter",
    labelKey: "mode.callcenter",
    descKey: "mode.callcenter.desc",
    density: "compact",
    tone: "neutral",
    ctas: [
      { labelKey: "nav.report", to: "/report" },
      { labelKey: "nav.search", to: "/search" },
      { labelKey: "nav.institutional", to: "/institutional" },
    ],
  },
  {
    id: "field",
    labelKey: "mode.field",
    descKey: "mode.field.desc",
    density: "touch",
    tone: "neutral",
    ctas: [
      { labelKey: "nav.rescue", to: "/rescue" },
      { labelKey: "nav.report", to: "/report" },
      { labelKey: "nav.search", to: "/search" },
    ],
  },
  {
    id: "hospital",
    labelKey: "mode.hospital",
    descKey: "mode.hospital.desc",
    density: "compact",
    tone: "clinical",
    ctas: [
      { labelKey: "nav.rescue", to: "/rescue" },
      { labelKey: "nav.institutional", to: "/institutional" },
      { labelKey: "nav.search", to: "/search" },
    ],
  },
  {
    id: "shelter",
    labelKey: "mode.shelter",
    descKey: "mode.shelter.desc",
    density: "comfortable",
    tone: "warm",
    ctas: [
      { labelKey: "nav.rescue", to: "/rescue" },
      { labelKey: "nav.search", to: "/search" },
      { labelKey: "nav.report", to: "/report" },
    ],
  },
  {
    id: "coord",
    labelKey: "mode.coord",
    descKey: "mode.coord.desc",
    density: "compact",
    tone: "neutral",
    ctas: [
      { labelKey: "nav.institutional", to: "/institutional" },
      { labelKey: "nav.search", to: "/search" },
      { labelKey: "nav.rescue", to: "/rescue" },
    ],
  },
] as const;

export const DEFAULT_MODE: OperationalMode = "family";

export function getModeConfig(id: OperationalMode): ModeConfig {
  return MODES.find((m) => m.id === id) ?? MODES[0];
}

export function isMode(v: string): v is OperationalMode {
  return MODES.some((m) => m.id === v);
}
