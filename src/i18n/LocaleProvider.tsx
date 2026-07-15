import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  messages,
  isLocale,
  localeMeta,
  type Locale,
  type MessageKey,
} from "./messages";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey) => string;
  dir: "ltr" | "rtl";
};

const LocaleContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "basuf.locale";

function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return "es";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && isLocale(saved)) return saved;
  } catch {
    /* ignore */
  }
  const nav = window.navigator?.language?.slice(0, 2).toLowerCase() ?? "";
  if (isLocale(nav)) return nav;
  return "es";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  // SSR-safe initial state; real detection runs post-hydration.
  const [locale, setLocaleState] = useState<Locale>("es");

  useEffect(() => {
    const detected = detectInitialLocale();
    if (detected !== locale) setLocaleState(detected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dir = localeMeta[locale].dir;

  // Sync <html lang> and <html dir> for screen readers and layout.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.dir = dir;
    }
  }, [locale, dir]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  };

  const t = (key: MessageKey) => messages[locale][key] ?? key;

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useT must be used inside <LocaleProvider>");
  return ctx;
}
