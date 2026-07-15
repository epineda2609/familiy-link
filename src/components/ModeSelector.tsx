import { useState, useRef, useEffect } from "react";
import { Users2, ChevronDown, Check } from "lucide-react";
import { useMode } from "../modes/OperationalModeProvider";
import { MODES } from "../modes/OperationalMode";
import { useT } from "../i18n/LocaleProvider";

export function ModeSelector() {
  const { t } = useT();
  const { mode, setMode, config } = useMode();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("mode.selector.label")}
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-background px-2 text-xs font-medium transition hover:bg-accent"
      >
        <Users2 className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">{t(config.labelKey)}</span>
        <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />
      </button>
      {open && (
        <ul
          role="menu"
          aria-label={t("mode.selector.label")}
          className="absolute end-0 mt-1 w-72 overflow-hidden rounded-md border border-border bg-card shadow-lg z-50"
        >
          <li
            className="border-b border-border bg-muted/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {t("mode.selector.label")}
          </li>
          {MODES.map((m) => {
            const active = m.id === mode;
            return (
              <li key={m.id} role="none">
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    setMode(m.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-start gap-2 px-3 py-2 text-start text-sm transition hover:bg-accent ${
                    active ? "bg-accent/50" : ""
                  }`}
                >
                  <Check
                    className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "text-primary" : "opacity-0"}`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{t(m.labelKey)}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {t(m.descKey)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
