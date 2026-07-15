import { useEffect, useRef, useState } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useT } from "../i18n/LocaleProvider";
import { localeMeta, supportedLocales, type Locale } from "../i18n/messages";

export function LanguageSelector({
  variant = "compact",
}: {
  variant?: "compact" | "full";
}) {
  const { locale, setLocale, t } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const current = localeMeta[locale];

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (l: Locale) => {
    setLocale(l);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("nav.language")}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md border border-input bg-card px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:bg-accent"
      >
        <Globe className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        <span aria-hidden>{current.flag}</span>
        <span className={variant === "compact" ? "hidden sm:inline" : ""}>
          {current.nativeName}
        </span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("nav.language")}
          className="absolute end-0 z-50 mt-2 max-h-80 w-48 overflow-y-auto rounded-md border border-border bg-popover p-1 text-sm shadow-lg animate-in fade-in-0 zoom-in-95"
        >
          {supportedLocales.map((code) => {
            const meta = localeMeta[code];
            const selected = code === locale;
            return (
              <li key={code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => choose(code)}
                  className={`flex w-full items-center gap-2 rounded px-2 py-2 text-start transition hover:bg-accent ${
                    selected ? "bg-accent/60 font-semibold" : ""
                  }`}
                >
                  <span aria-hidden className="text-base">
                    {meta.flag}
                  </span>
                  <span className="flex-1 truncate">{meta.nativeName}</span>
                  {selected && (
                    <Check
                      className="h-4 w-4 text-primary"
                      aria-hidden
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
