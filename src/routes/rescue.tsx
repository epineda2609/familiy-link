import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  QrCode,
  Search,
  ShieldAlert,
  WifiOff,
  ArrowRight,
  Clock,
  MapPin,
} from "lucide-react";
import { DemoBanner } from "../components/DemoBanner";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SkipLink } from "../components/SkipLink";
import { DistributedContributions } from "../components/DistributedContributions";
import { WhatHappensNow } from "../components/ux/WhatHappensNow";
import { useT } from "../i18n/LocaleProvider";
import type { MessageKey } from "../i18n/messages";
import { rescueRepository, useRescueList } from "../repositories/RescueRepository";

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

function RescuePage() {
  const { t, locale } = useT();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    const found = findRescueByCode(code);
    if (!found) {
      setError(t("rescue.lookup.notFound"));
      return;
    }
    setError(null);
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
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
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
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <WifiOff className="h-3.5 w-3.5" aria-hidden />
              {t("rescue.lookup.offlineHint")}
            </p>
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
            {mockRescueRecords.map((r) => {
              const last = r.chain[r.chain.length - 1];
              return (
                <li key={r.code}>
                  <Link
                    to="/rescue/$code"
                    params={{ code: r.code }}
                    className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
                  >
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
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      {r.tempId}
                    </p>
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
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
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
