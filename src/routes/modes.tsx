import { createFileRoute } from "@tanstack/react-router";
import { Check, Users2 } from "lucide-react";
import { DemoBanner } from "../components/DemoBanner";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SkipLink } from "../components/SkipLink";
import { useT } from "../i18n/LocaleProvider";
import { useMode } from "../modes/OperationalModeProvider";
import { MODES } from "../modes/OperationalMode";
import type { MessageKey } from "../i18n/messages";

export const Route = createFileRoute("/modes")({
  head: () => ({
    meta: [
      { title: "Modos de uso — BASUF" },
      {
        name: "description",
        content:
          "Modos operativos diferenciados por contexto: familia, call center, campo, hospital, refugio y coordinación.",
      },
      { property: "og:title", content: "Modos operativos — BASUF" },
      {
        property: "og:description",
        content:
          "BASUF se adapta al contexto real de quien lo usa: familias, brigadas, hospitales, refugios y coordinación.",
      },
    ],
  }),
  component: ModesPage,
});

function ModesPage() {
  const { t } = useT();
  const { mode, setMode } = useMode();

  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />
      <DemoBanner />
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8 max-w-3xl">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Users2 className="h-3.5 w-3.5" aria-hidden />
            {t("mode.selector.label")}
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("mode.title")}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {t("mode.subtitle")}
          </p>
        </header>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODES.map((m) => {
            const active = m.id === mode;
            return (
              <li key={m.id}>
                <article
                  className={`flex h-full flex-col rounded-xl border p-5 shadow-sm transition ${
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold">{t(m.labelKey)}</h2>
                    {active && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                        <Check className="h-3 w-3" aria-hidden />
                        {t("mode.applied")}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(m.descKey)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-foreground">
                      {t(`mode.density.${m.density}` as MessageKey)}
                    </span>
                  </div>
                  <div className="mt-4 flex-1" />
                  <button
                    type="button"
                    onClick={() => setMode(m.id)}
                    disabled={active}
                    className={`mt-4 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "cursor-default bg-muted text-muted-foreground"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {active ? t("mode.applied") : t("mode.apply")}
                  </button>
                </article>
              </li>
            );
          })}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
