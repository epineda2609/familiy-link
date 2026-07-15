import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, HelpCircle, ShieldCheck } from "lucide-react";
import { DemoBanner } from "../components/DemoBanner";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SkipLink } from "../components/SkipLink";
import { RescueBadgePreview } from "../components/RescueBadgePreview";
import { CaseNarrative } from "../components/CaseNarrative";
import { getCaseHistoryByRescue } from "../repositories/CaseTimelineRepository";
import { useT } from "../i18n/LocaleProvider";
import type { MessageKey } from "../i18n/messages";
import { findRescueByCode } from "../data/mock/rescue";
import { findSafeIdByRescueCode } from "../data/mock/safeIds";

export const Route = createFileRoute("/rescue/$code")({
  loader: ({ params }) => {
    const record = findRescueByCode(params.code);
    if (!record) throw notFound();
    return { record };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.record.code} — Rescue Chain — BASUF`
          : "Rescue record — BASUF",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  notFoundComponent: RescueNotFound,
  component: RescueDetail,
});

function RescueNotFound() {
  const { t } = useT();
  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />
      <DemoBanner />
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto max-w-2xl px-4 py-20 text-center"
      >
        <HelpCircle className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold">{t("rescue.lookup.notFound")}</h1>
        <Link
          to="/rescue"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("rescue.title")}
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}

function RescueDetail() {
  const { t, locale } = useT();
  const { record } = Route.useLoaderData();
  const last = record.chain[record.chain.length - 1];
  const safeId = findSafeIdByRescueCode(record.code);

  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />
      <DemoBanner />
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-7xl px-4 py-10">
        <Link
          to="/rescue"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("rescue.title")}
        </Link>

        {/* Header */}
        <header className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {t("rescue.record.tempId")} · {record.tempId}
            </p>
            <h1 className="mt-1 font-mono text-4xl font-black tracking-wider sm:text-5xl">
              {record.code}
            </h1>
            {record.displayHint && (
              <p className="mt-2 text-sm text-muted-foreground">
                {record.displayHint}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <span
              className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                record.linkedPersonId
                  ? "bg-hope/25 text-hope-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {record.linkedPersonId && (
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              )}
              {record.linkedPersonId
                ? t("rescue.record.identified")
                : t("rescue.record.unidentified")}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("rescue.record.createdAt")}:{" "}
              {new Date(record.createdAt).toLocaleString(locale, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
        </header>

        {/* Grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Chain */}
          <section>
            <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("rescue.record.currentCustody")}
              </p>
              <p className="mt-1 text-sm font-semibold">{last.actorOrg}</p>
              <p className="text-xs text-muted-foreground">
                {t(`rescue.chain.event.${last.type}` as MessageKey)}
                {last.location ? ` · ${last.location}` : ""}
              </p>
            </div>

            {safeId && (
              <Link
                to="/safe-id/$code"
                params={{ code: safeId.shortCode }}
                className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 transition hover:bg-primary/10"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                    <ShieldCheck className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {t("safeId.title")}
                    </p>
                    <p className="font-mono text-sm">{safeId.shortCode}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-primary">
                  {t("safeId.link")}
                </span>
              </Link>
            )}


            {(() => {
              const history = getCaseHistoryByRescue(record.code);
              return history ? (
                <CaseNarrative history={history} defaultView="timeline" />
              ) : null;
            })()}

            {record.linkedPersonId && (
              <div className="mt-6">
                <Link
                  to="/person/$id"
                  params={{ id: record.linkedPersonId }}
                  className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
                >
                  {t("rescue.record.linkedPerson")}
                </Link>
              </div>
            )}
          </section>

          {/* Badge */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <RescueBadgePreview record={record} />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
