// BASUF — Índice i18n. Cada locale vive en ./locales/{code}.ts
import { es, type MessageDict, type MessageKey } from "./locales/es";
import { en } from "./locales/en";
import { pt } from "./locales/pt";
import { fr } from "./locales/fr";
import { ar } from "./locales/ar";
import { da } from "./locales/da";
import { it } from "./locales/it";
import { de } from "./locales/de";
import { tr } from "./locales/tr";
import { ja } from "./locales/ja";

export type Locale =
  | "es"
  | "en"
  | "pt"
  | "fr"
  | "ar"
  | "da"
  | "it"
  | "de"
  | "tr"
  | "ja";

export type { MessageDict, MessageKey };

export const messages: Record<Locale, MessageDict> = {
  es,
  en,
  pt,
  fr,
  ar,
  da,
  it,
  de,
  tr,
  ja,
};

export type LocaleMeta = {
  code: Locale;
  nativeName: string;
  flag: string;
  dir: "ltr" | "rtl";
};

export const localeMeta: Record<Locale, LocaleMeta> = {
  es: { code: "es", nativeName: "Español", flag: "🇪🇸", dir: "ltr" },
  en: { code: "en", nativeName: "English", flag: "🇬🇧", dir: "ltr" },
  pt: { code: "pt", nativeName: "Português", flag: "🇧🇷", dir: "ltr" },
  fr: { code: "fr", nativeName: "Français", flag: "🇫🇷", dir: "ltr" },
  ar: { code: "ar", nativeName: "العربية", flag: "🇸🇦", dir: "rtl" },
  da: { code: "da", nativeName: "Dansk", flag: "🇩🇰", dir: "ltr" },
  it: { code: "it", nativeName: "Italiano", flag: "🇮🇹", dir: "ltr" },
  de: { code: "de", nativeName: "Deutsch", flag: "🇩🇪", dir: "ltr" },
  tr: { code: "tr", nativeName: "Türkçe", flag: "🇹🇷", dir: "ltr" },
  ja: { code: "ja", nativeName: "日本語", flag: "🇯🇵", dir: "ltr" },
};

export const supportedLocales: Locale[] = Object.keys(localeMeta) as Locale[];

export function isLocale(value: string): value is Locale {
  return (supportedLocales as string[]).includes(value);
}
