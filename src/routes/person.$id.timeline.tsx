import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { DemoBanner } from "../components/DemoBanner";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SkipLink } from "../components/SkipLink";
import { CaseTimeline } from "../components/CaseTimeline";
import { useT } from "../i18n/LocaleProvider";
import { peopleRepository } from "../repositories/PeopleRepository";
import { getCaseHistoryByPerson, useCaseTimeline } from "../repositories/CaseTimelineRepository";
import type { PublicPersonCard } from "../domain/types";
import type { MessageKey } from "../i18n/messages";
import { supabase } from "../integrations/supabase/client";

export const Route = createFileRoute("/person/$id/timeline")({
  loader: async ({ params }) => {
    const person = await peopleRepository.getPublicById(params.id);
    if (!person) throw notFound();
    return { person };
  },
  head: ({ loaderData }) => {
    const title = loaderData
      ? `${loaderData.person.displayName} — Línea temporal — BASUF`
      : "Línea temporal — BASUF";
    return {
      meta: [
        { title },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: PersonTimelinePage,
  errorComponent: TimelineError,
  notFoundComponent: PersonNotFound,
});

function PersonTimelinePage() {
  const { t } = useT();
  const { person } = Route.useLoaderData() as { person: PublicPersonCard };
  useCaseTimeline(person.id);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const history = getCaseHistoryByPerson(person.id);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    // Ensure hydration completes at least once before showing "empty".
    void supabase
      .from("case_timeline")
      .select("id")
      .eq("person_id", person.id)
      .limit(1)
      .then(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [person.id, tick]);

  const statusKey = `status.${person.status}` as MessageKey;

  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />
      <DemoBanner />
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-3xl px-4 py-10">
        <Link
          to="/person/$id"
          params={{ id: person.id }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("case.timeline.back")}
        </Link>

        <header className="mt-4">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("case.timeline.pageTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("case.timeline.pageSubtitle")}
          </p>
          <div className="mt-4 rounded-lg border border-border bg-card p-4 text-sm">
            <p className="font-semibold">{person.displayName}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {person.approximateAge ? `~${person.approximateAge} · ` : ""}
              {t(statusKey)} · {person.country}
            </p>
          </div>
        </header>

        <section className="mt-8">
          {loading ? (
            <p className="text-sm text-muted-foreground">
              {t("case.timeline.loading")}
            </p>
          ) : history && history.events.length > 0 ? (
            <CaseTimeline events={history.events} />
          ) : (
            <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              {t("case.timeline.empty")}
            </div>
          )}
        </section>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => setTick((v) => v + 1)}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium transition hover:bg-accent"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            {t("case.timeline.retry")}
          </button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function TimelineError({ reset }: { error: Error; reset: () => void }) {
  const { t } = useT();
  return (
    <div className="min-h-dvh bg-background">
      <DemoBanner />
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold">{t("case.timeline.error")}</h1>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          {t("case.timeline.retry")}
        </button>
      </main>
      <SiteFooter />
    </div>
  );
}

function PersonNotFound() {
  const { t } = useT();
  return (
    <div className="min-h-dvh bg-background">
      <DemoBanner />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">{t("person.notFound.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("person.notFound.desc")}
        </p>
        <div className="mt-6">
          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t("person.back")}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
