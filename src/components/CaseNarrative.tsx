import { useState } from "react";
import { BookOpen, ListOrdered, Info } from "lucide-react";
import { useT } from "../i18n/LocaleProvider";
import type { CaseHistory } from "../domain/caseTimeline";
import { buildNarrative } from "../lib/caseNarrative";
import { CaseTimeline } from "./CaseTimeline";

type View = "timeline" | "narrative";

export function CaseNarrative({
  history,
  defaultView = "timeline",
}: {
  history: CaseHistory;
  defaultView?: View;
}) {
  const { t, locale } = useT();
  const [view, setView] = useState<View>(defaultView);
  const paras = buildNarrative(history, locale);

  const btn = (v: View, label: string, Icon: typeof BookOpen) => (
    <button
      type="button"
      onClick={() => setView(v)}
      aria-pressed={view === v}
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition ${
        view === v
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background hover:bg-accent"
      }`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </button>
  );

  return (
    <section aria-label={t("case.timeline.title")}>
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            {t("case.timeline.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("case.timeline.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {btn("timeline", t("case.timeline.showTimeline"), ListOrdered)}
          {btn("narrative", t("case.timeline.showNarrative"), BookOpen)}
        </div>
      </header>

      {view === "timeline" ? (
        <CaseTimeline events={history.events} />
      ) : (
        <div className="space-y-4">
          <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
              <span>{t("case.narrative.disclaimer")}</span>
            </div>
          </div>
          {paras.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("case.narrative.empty")}
            </p>
          ) : (
            <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
              {paras.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
