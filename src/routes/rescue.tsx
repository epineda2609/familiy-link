import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  QrCode,
  Search,
  ShieldAlert,
  WifiOff,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { DemoBanner } from "../components/DemoBanner";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SkipLink } from "../components/SkipLink";
import { DistributedContributions } from "../components/DistributedContributions";
import { WhatHappensNow } from "../components/ux/WhatHappensNow";
import { useT } from "../i18n/LocaleProvider";
import type { MessageKey } from "../i18n/messages";
import { rescueRepository } from "../repositories/RescueRepository";
import { peopleRepository } from "../repositories/PeopleRepository";
import type { PublicPersonCard, Disaster } from "../domain/types";

export const Route = createFileRoute("/rescue")({
  head: () => ({
    meta: [
      { title: "Rescue Intake Identity Chain — BASUF" },
      {
        name: "description",
        content:
          "Trazabilidad continua desde el rescate. Identifica a personas heridas o rescatadas incluso cuando aún no se conoce su nombre.",
      },
      { property: "og:title", content: "Rescue Intake Identity Chain — BASUF" },
      {
        property: "og:description",
        content:
          "Trazabilidad continua desde el rescate hasta la reunificación familiar.",
      },
    ],
  }),
  component: RescuePage,
});

// Real cases to feature (BASUF IDs from the production DB).
const REAL_CASE_CODES = [
  "BASUF-MX-643D", // Karla P.
  "BASUF-MX-E472", // Carla Perez
  "BASUF-MX-65DF", // Miguel T.
  "BASUF-VE-9AA3", // María S.
  "BASUF-CL-9D5F", // Diego H.
  "BASUF-BR-F7C3", // Camila R.
  "BASUF-VE-C3B6", // Lucía Guerrero
] as const;

interface RealCase {
  person: PublicPersonCard;
  disaster: Disaster | null;
}

function useRealCases() {
  const [cases, setCases] = useState<RealCase[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results: RealCase[] = [];
      const disasterCache = new Map<string, Disaster | null>();
      for (const code of REAL_CASE_CODES) {
        const person = await peopleRepository.getPublicByCaseCode(code);
        if (!person) continue;
        let disaster: Disaster | null = null;
        if (person.disasterId) {
          if (disasterCache.has(person.disasterId)) {
            disaster = disasterCache.get(person.disasterId) ?? null;
          } else {
            disaster = await peopleRepository.getDisasterById(person.disasterId);
            disasterCache.set(person.disasterId, disaster);
          }
        }
        results.push({ person, disaster });
      }
      if (!cancelled) setCases(results);
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return cases;
}


function RescuePage() {
  const { t, locale } = useT();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const records = useRescueList();
  const featured = useFeaturedRealCase();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const raw = code.trim();
    if (!raw) {
      setError(t("rescue.lookup.notFound"));
      return;
    }
    const normalized = raw.toUpperCase().replace(/\s+/g, "");
    setError(null);
    if (normalized.startsWith("BASUF-")) {
      setBusy(true);
      try {
        const person = await peopleRepository.getPublicByCaseCode(normalized);
        if (person) {
          navigate({ to: "/person/$id", params: { id: person.id } });
          return;
        }
        setError(t("rescue.lookup.notFound"));
      } finally {
        setBusy(false);
      }
      return;
    }
    const found = rescueRepository.find(raw);
    if (!found) {
      setError(t("rescue.lookup.notFound"));
      return;
    }
    navigate({ to: "/rescue/$code", params: { code: found.code } });
  }

  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />
      <DemoBanner />
      <SiteHeader />
      <main id="main-content">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-br from-urgent/10 via-background to-primary/10"
          />
          <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
            <div className="max-w-3xl">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-urgent/30 bg-urgent/10 px-3 py-1 text-xs font-medium text-urgent-foreground">
                <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
                {t("rescue.home.hint")}
              </p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {t("rescue.title")}
              </h1>
              <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                {t("rescue.subtitle")}
              </p>
              <div className="mt-6 rounded-xl border border-border bg-card p-5">
                <h2 className="text-base font-semibold">
                  {t("rescue.differentiator.title")}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("rescue.differentiator.desc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Lookup */}
        <section className="mx-auto max-w-3xl px-4 py-14">
          <div className="mb-6">
            <WhatHappensNow flow="rescue" />
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <QrCode className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-lg font-semibold">
                  {t("rescue.lookup.title")}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t("rescue.lookup.desc")}
                </p>
              </div>
            </div>
            <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="rescue-code" className="sr-only">
                {t("rescue.lookup.title")}
              </label>
              <input
                id="rescue-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t("rescue.lookup.placeholder")}
                className="h-11 flex-1 rounded-md border border-input bg-background px-3 font-mono uppercase text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                autoComplete="off"
                autoCapitalize="characters"
              />
              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                <Search className="h-4 w-4" aria-hidden />
                {t("rescue.lookup.submit")}
              </button>
            </form>
            {error && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              {t("rescue.lookup.altHint")}
            </p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <WifiOff className="h-3.5 w-3.5" aria-hidden />
              {t("rescue.lookup.offlineHint")}
            </p>
          </div>

          {/* Privacy card */}
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
            <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" aria-hidden />
            </span>
            <div className="text-xs text-muted-foreground">
              <p className="text-sm font-semibold text-foreground">
                {t("rescue.privacy.title")}
              </p>
              <p className="mt-1">{t("rescue.privacy.line1")}</p>
              <p className="mt-1">{t("rescue.privacy.line2")}</p>
            </div>
          </div>
        </section>

        {/* Records */}
        <section className="mx-auto max-w-7xl px-4 pb-14">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              {t("rescue.records.title")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("rescue.records.subtitle")}
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Featured: real connected case */}
            {featured.person && (
              <li>
                <Link
                  to="/person/$id"
                  params={{ id: featured.person.id }}
                  className="group flex h-full flex-col rounded-xl border-2 border-primary/50 bg-card p-5 shadow-sm transition hover:border-primary hover:shadow-md"
                >
                  <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    <BadgeCheck className="h-3 w-3" aria-hidden />
                    {t("rescue.records.featuredLabel")}
                  </span>
                  <h3 className="text-lg font-bold text-foreground">
                    {featured.person.displayName}
                  </h3>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("rescue.card.basufIdLabel")}
                  </p>
                  <p className="font-mono text-xl font-black tracking-wider text-foreground">
                    {featured.person.publicCaseCode ?? "—"}
                  </p>
                  <dl className="mt-4 space-y-1.5 text-xs">
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">
                        {t("rescue.featured.status")}
                      </dt>
                      <dd className="font-medium text-foreground">
                        {t(`status.${featured.person.status}` as MessageKey)}
                      </dd>
                    </div>
                    {featured.disaster && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">
                          {t("rescue.featured.disaster")}
                        </dt>
                        <dd className="text-right font-medium text-foreground">
                          {featured.disaster.name}
                        </dd>
                      </div>
                    )}
                    {featured.person.originOrgName && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">
                          {t("rescue.featured.org")}
                        </dt>
                        <dd className="text-right font-medium text-foreground">
                          {featured.person.originOrgName}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-2">
                      <dt className="text-muted-foreground">
                        {t("rescue.featured.match")}
                      </dt>
                      <dd className="text-right font-medium text-foreground">
                        {t("rescue.featured.matchPending")}
                      </dd>
                    </div>
                    {featured.person.reportedAt && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">
                          {t("rescue.featured.updatedAt")}
                        </dt>
                        <dd className="text-right font-medium text-foreground">
                          {new Date(featured.person.reportedAt).toLocaleDateString(
                            locale,
                            { dateStyle: "medium" },
                          )}
                        </dd>
                      </div>
                    )}
                  </dl>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    {t("rescue.featured.openChain")}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </Link>
              </li>
            )}

            {records.map((r) => {
              const last = r.chain[r.chain.length - 1];
              return (
                <li key={r.code}>
                  <Link
                    to="/rescue/$code"
                    params={{ code: r.code }}
                    className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
                  >
                    <span className="mb-2 inline-flex w-fit items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {t("rescue.records.demoLabel")}
                    </span>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("rescue.card.rescueCodeLabel")}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-2xl font-black tracking-wider text-foreground">
                        {r.code}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {t(
                          `rescue.chain.event.${r.currentStatus}` as MessageKey,
                        )}
                      </span>
                    </div>
                    {r.displayHint && (
                      <p className="mt-3 text-sm text-foreground/90">
                        {r.displayHint}
                      </p>
                    )}
                    <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                      <p className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        {new Date(last.at).toLocaleString(locale, {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                      {last.location && (
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          {last.location}
                        </p>
                      )}
                    </div>
                    <p className="mt-4 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                      {t("rescue.card.tempRefLabel")}:{" "}
                      <span className="font-mono normal-case tracking-normal">
                        {r.tempId}
                      </span>
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
                      {t("rescue.chain.title")}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <DistributedContributions />

        {/* Offline note */}
        <section className="border-t border-border bg-card">
          <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-10 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-urgent/15 text-urgent-foreground">
              <WifiOff className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="text-lg font-semibold">{t("rescue.offline.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("rescue.offline.desc")}
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

