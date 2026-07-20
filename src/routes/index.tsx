import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Search,
  UserPlus,
  Waves,
  Flame,
  Zap,
  ArrowRight,
  QrCode,
  Cloud,
  Mountain,
  Wind,
  Flame as Fire,
  Activity,
  HeartHandshake,
  AlertOctagon,
  HelpCircle,
} from "lucide-react";
import { DemoBanner } from "../components/DemoBanner";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SkipLink } from "../components/SkipLink";
import { useT } from "../i18n/LocaleProvider";
import { peopleRepository } from "../repositories/PeopleRepository";
import { supabase } from "../integrations/supabase/client";
import type { Disaster } from "../domain/types";
import type { DisasterType } from "../domain/types";
import type { MessageKey } from "../i18n/messages";

interface EventCounters {
  registeredReports: number;
  potentialMatches: number;
  verifiedCases: number;
}

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
  tsunami: Waves,
  hurricane: Wind,
  storm: Cloud,
  landslide: Mountain,
  wildfire: Fire,
  volcano: Activity,
  humanitarian: HeartHandshake,
  accident: AlertOctagon,
  other: HelpCircle,
};

const disasterTypeLabels: Record<DisasterType, string> = {
  earthquake: "Sismo",
  war: "Conflicto",
  flood: "Inundación",
  tsunami: "Tsunami",
  hurricane: "Huracán / ciclón",
  storm: "Tormenta severa",
  landslide: "Deslizamiento",
  wildfire: "Incendio forestal",
  volcano: "Erupción volcánica",
  humanitarian: "Emergencia humanitaria",
  accident: "Accidente mayor",
  other: "Otro",
};

export function disasterTypeLabel(t: DisasterType): string {
  return disasterTypeLabels[t] ?? "Evento";
}

function Home() {
  const { t } = useT();
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [counters, setCounters] = useState<Record<string, EventCounters>>({});
  useEffect(() => {
    peopleRepository.listDisasters().then(setDisasters);
  }, []);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("event_case_counters");
      if (cancelled || error || !data) return;
      const map: Record<string, EventCounters> = {};
      for (const row of data as Array<{
        event_id: string;
        registered_reports: number | string;
        potential_matches: number | string;
        verified_cases: number | string;
      }>) {
        map[row.event_id] = {
          registeredReports: Number(row.registered_reports) || 0,
          potentialMatches: Number(row.potential_matches) || 0,
          verifiedCases: Number(row.verified_cases) || 0,
        };
      }
      setCounters(map);
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const activeDisasters = disasters
    .filter((d) => d.active)
    .slice()
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
    .slice(0, 4);

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
              {t("hero.kicker")}
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl whitespace-pre-line">
              {t("home.hero.title")}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              {t("home.hero.subtitle")}
            </p>
            <p className="mt-4 max-w-2xl border-s-2 border-primary/40 ps-4 text-sm italic text-muted-foreground/90">
              {t("hero.contextLine")}
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Link
                to="/search"
                className="group flex flex-col rounded-xl bg-primary p-5 text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <Search className="h-4 w-4" aria-hidden />
                  {t("home.cta.search")}
                </span>
                <span className="mt-2 text-xs opacity-90">
                  {t("home.cta.search.desc")}
                </span>
              </Link>
              <Link
                to="/report"
                className="group flex flex-col rounded-xl border border-input bg-card p-5 shadow-sm transition hover:bg-accent"
              >
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <UserPlus className="h-4 w-4" aria-hidden />
                  {t("home.cta.report")}
                </span>
                <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-primary">
                  {t("home.cta.report.audience")}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  {t("home.cta.report.desc")}
                </span>
              </Link>
              <Link
                to="/institutional"
                className="group flex flex-col rounded-xl border border-input bg-card p-5 shadow-sm transition hover:bg-accent"
              >
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  <HeartHandshake className="h-4 w-4" aria-hidden />
                  {t("home.cta.institutional")}
                </span>
                <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-primary">
                  {t("home.cta.institutional.audience")}
                </span>
                <span className="mt-1 text-xs text-muted-foreground">
                  {t("home.cta.institutional.desc")}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="border-b border-border bg-muted/40">
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

      {/* Rescue chain differentiator */}
      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 pb-16">
          <Link
            to="/rescue"
            className="group flex items-start gap-4 rounded-xl border border-urgent/30 bg-urgent/5 p-5 transition hover:border-urgent/50 hover:bg-urgent/10"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-urgent/20 text-urgent-foreground">
              <QrCode className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-urgent-foreground">
                {t("rescue.home.hint")}
              </p>
              <p className="mt-1 font-semibold">
                {t("rescue.differentiator.title")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("rescue.differentiator.desc")}
              </p>
            </div>
            <ArrowRight
              className="mt-2 h-5 w-5 shrink-0 text-urgent-foreground transition group-hover:translate-x-1"
              aria-hidden
            />
          </Link>
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
            const Icon = disasterIcon[d.type] ?? HelpCircle;
            const knownTypes = ["earthquake", "flood", "war"] as const;
            const isKnown = (knownTypes as readonly string[]).includes(d.type);
            const typeLabel = isKnown
              ? t(`disaster.${d.type}` as MessageKey)
              : (d.customType || disasterTypeLabel(d.type));

            const countryNameMap: Record<string, string> = {
              VE: "VENEZUELA",
              BR: "BRASIL",
              CL: "CHILE",
              MX: "MEXICO",
              CO: "COLOMBIA",
            };
            const countryDisplay = countryNameMap[d.country] || d.country;
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
                    {typeLabel}
                  </span>
                </div>
                <h3 className="font-semibold leading-tight">{d.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {d.region ? `${d.region} · ` : ""}
                  <span className="uppercase">{countryDisplay}</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(d.startedAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                {d.magnitude && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Magnitud:{" "}
                    <span className="font-semibold text-foreground">
                      {d.magnitude}
                    </span>
                  </p>
                )}
                {(() => {
                  const c = counters[d.id] ?? {
                    registeredReports: 0,
                    potentialMatches: 0,
                    verifiedCases: 0,
                  };
                  return (
                    <>
                      <p className="mt-3 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {c.registeredReports}
                        </span>{" "}
                        reportes registrados
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <span className="font-semibold text-destructive">
                          {c.potentialMatches}
                        </span>{" "}
                        posibles coincidencias
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <span className="font-semibold text-urgent-foreground">
                          {c.verifiedCases}
                        </span>{" "}
                        casos verificados
                      </p>
                    </>
                  );
                })()}
              </article>
            );
          })}
        </div>
      </section>



      </main>
      <SiteFooter />
    </div>
  );
}
