import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  UserPlus,
  Waves,
  Flame,
  Zap,
  ArrowRight,
  HeartHandshake,
  ShieldCheck,
  Sunrise,
} from "lucide-react";
import { DemoBanner } from "../components/DemoBanner";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SkipLink } from "../components/SkipLink";
import { useT } from "../i18n/LocaleProvider";
import { mockDisasters } from "../data/mock/disasters";
import type { DisasterType } from "../domain/types";
import type { MessageKey } from "../i18n/messages";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BASUF — Brother And Sister Uniendo Familias" },
      {
        name: "description",
        content:
          "Red humanitaria para reconectar familias separadas por sismos, guerras e inundaciones en Latinoamérica.",
      },
      {
        property: "og:title",
        content: "BASUF — Brother And Sister Uniendo Familias",
      },
      {
        property: "og:description",
        content:
          "Red humanitaria para reconectar familias separadas por sismos, guerras e inundaciones en Latinoamérica.",
      },
    ],
  }),
  component: Home,
});

const disasterIcon: Record<DisasterType, typeof Waves> = {
  earthquake: Zap,
  war: Flame,
  flood: Waves,
};

function Home() {
  const { t } = useT();
  const activeDisasters = mockDisasters.filter((d) => d.active).slice(0, 4);

  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />
      <DemoBanner />
      <SiteHeader />
      <main id="main-content">

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-hope/10"
        />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              {t("app.tagline")}
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t("home.hero.title")}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              {t("home.hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/search"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                <Search className="h-4 w-4" aria-hidden />
                {t("home.cta.search")}
              </Link>
              <Link
                to="/report"
                className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
              >
                <UserPlus className="h-4 w-4" aria-hidden />
                {t("home.cta.report")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4">
          {[
            { k: "home.stats.cases", v: "1.284" },
            { k: "home.stats.reunions", v: "312" },
            { k: "home.stats.orgs", v: "47" },
            { k: "home.stats.countries", v: "8" },
          ].map((s) => (
            <div key={s.k} className="text-center">
              <p className="text-3xl font-bold text-primary">{s.v}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                {t(s.k as MessageKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Emergencias activas */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("home.disasters.title")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("home.disasters.subtitle")}
            </p>
          </div>
          <Link
            to="/search"
            className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
          >
            {t("nav.search")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {activeDisasters.map((d) => {
            const Icon = disasterIcon[d.type];
            const typeKey = `disaster.${d.type === "earthquake" ? "earthquake" : d.type === "flood" ? "flood" : "war"}` as MessageKey;
            return (
              <article
                key={d.id}
                className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-urgent/20 text-urgent-foreground">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t(typeKey)}
                  </span>
                </div>
                <h3 className="font-semibold leading-tight">{d.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {d.region ? `${d.region} · ` : ""}
                  {d.country}
                </p>
                {d.affectedEstimate && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {d.affectedEstimate.toLocaleString()}
                    </span>{" "}
                    afectadas (est.)
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl">
            {t("home.how.title")}
          </h2>
          <ol className="grid gap-6 sm:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <li
                key={n}
                className="relative rounded-xl border border-border bg-card p-6 shadow-sm"
              >
                <span className="absolute -top-3 left-6 grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {n}
                </span>
                <h3 className="mt-2 font-semibold">
                  {t(`home.how.step${n}.title` as MessageKey)}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t(`home.how.step${n}.desc` as MessageKey)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      </main>
      <SiteFooter />
    </div>
  );
}
