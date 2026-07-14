import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { messages, type Locale, type MessageKey } from "./messages";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey) => string;
};

const LocaleContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "basuf.locale";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");

  // Read persisted locale after hydration only (avoid SSR mismatch).
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "es" || saved === "pt") setLocaleState(saved);
    } catch {
      /* ignore */
    }
  }, []);

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
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useT must be used inside <LocaleProvider>");
  return ctx;
}
