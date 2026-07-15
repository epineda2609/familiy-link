import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  ShieldAlert,
  ShieldCheck,
  Share2,
  MessageSquare,
  Flag,
  Camera,
} from "lucide-react";
import { DemoBanner } from "../components/DemoBanner";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SkipLink } from "../components/SkipLink";
import { useT } from "../i18n/LocaleProvider";
import { peopleRepository } from "../repositories/PeopleRepository";
import type {
  PublicPersonCard,
  Disaster,
  Country,
} from "../domain/types";
import type { MessageKey } from "../i18n/messages";
import { CaseNarrative } from "../components/CaseNarrative";
import { getCaseHistoryByPerson } from "../repositories/CaseTimelineRepository";
import { findSafeIdByPersonId } from "../data/mock/safeIds";
import { EvidenceGallery } from "../components/evidence/EvidenceGallery";
import { AudiencePreviewTabs } from "../components/evidence/AudiencePreviewTabs";
import { evidenceRepository } from "../repositories/EvidenceRepository";
import { resolveAudience, type SafeIdAudience } from "../domain/safeId";
import { useMode } from "../modes/OperationalModeProvider";

export const Route = createFileRoute("/person/$id")({
  loader: async ({ params }) => {
    const person = await peopleRepository.getPublicById(params.id);
    if (!person) throw notFound();
    const [disaster, countries] = await Promise.all([
      peopleRepository.getDisasterById(person.disasterId),
      peopleRepository.listCountries(),
    ]);
    return { person, disaster, countries };
  },
  head: ({ loaderData }) => {
    const title = loaderData
      ? `${loaderData.person.displayName} — BASUF`
      : "Ficha — BASUF";
    const description = loaderData
      ? `Ficha pública humanitaria — ${loaderData.person.displayName}. Solo información autorizada.`
      : "Ficha pública humanitaria BASUF.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "noindex" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: PersonDetailPage,
  notFoundComponent: PersonNotFound,
});

const statusStyles: Record<PublicPersonCard["status"], string> = {
  missing: "bg-destructive/10 text-destructive border-destructive/30",
  searching: "bg-urgent/20 text-urgent-foreground border-urgent/40",
  found: "bg-primary/10 text-primary border-primary/30",
  reunited: "bg-hope/20 text-hope-foreground border-hope/40",
};

function PersonDetailPage() {
  const { t } = useT();
  const { mode } = useMode();
  const data = Route.useLoaderData() as {
    person: PublicPersonCard;
    disaster: Disaster | null;
    countries: Country[];
  };
  const { person, disaster, countries } = data;
  const safeId = findSafeIdByPersonId(person.id);
  const [evidenceAudience, setEvidenceAudience] = useState<SafeIdAudience>(() =>
    resolveAudience(mode),
  );
  const evidenceItems = evidenceRepository.listByCase(person.id);


  const countryName =
    countries.find((c: Country) => c.code === person.country)?.name ??
    person.country;
  const statusKey = `status.${person.status}` as MessageKey;
  const genderKey = `gender.${person.gender}` as MessageKey;
  const disasterTypeKey = disaster
    ? (`disaster.${disaster.type}` as MessageKey)
    : null;

  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(id);
  }, [copied]);

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: person.displayName, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />
      <DemoBanner />
      <SiteHeader />

      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8">
        <Link
          to="/search"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("person.back")}
        </Link>

        <header className="mt-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {person.displayName}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {person.approximateAge ? `~${person.approximateAge} · ` : ""}
                {t(genderKey)} · {countryName}
              </p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyles[person.status]}`}
            >
              {t(statusKey)}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={share}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              <Share2 className="h-4 w-4" aria-hidden />
              {copied ? "✓" : t("person.actions.share")}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <MessageSquare className="h-4 w-4" aria-hidden />
              {t("person.actions.report")}
            </button>
            {safeId && (
              <Link
                to="/safe-id/$code"
                params={{ code: safeId.shortCode }}
                className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/10"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden />
                {t("safeId.link")} · {safeId.shortCode}
              </Link>
            )}
          </div>
        </header>


        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <User className="h-4 w-4" aria-hidden />
              {t("person.section.identity")}
            </h2>
            <dl className="space-y-2.5 text-sm">
              <Row label={t("person.field.age")} value={person.approximateAge ? `~${person.approximateAge}` : "—"} />
              <Row label={t("person.field.gender")} value={t(genderKey)} />
              <Row label={t("person.field.status")} value={t(statusKey)} />
              <Row label={t("person.field.country")} value={countryName} />
              <Row
                label={t("person.field.reportedAt")}
                value={person.reportedAt}
              />
            </dl>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <MapPin className="h-4 w-4" aria-hidden />
              {t("person.section.lastSeen")}
            </h2>
            <dl className="space-y-2.5 text-sm">
              <Row
                label={t("person.field.location")}
                value={person.lastSeenLocation ?? "—"}
              />
              <Row
                label={t("person.field.date")}
                value={person.lastSeenAt ?? "—"}
                icon={<Calendar className="h-3.5 w-3.5" aria-hidden />}
              />
            </dl>
          </section>

          {person.distinctiveFeatures && (
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm md:col-span-2">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                <Flag className="h-4 w-4" aria-hidden />
                {t("person.section.features")}
              </h2>
              <p className="text-sm text-foreground/90">
                {person.distinctiveFeatures}
              </p>
            </section>
          )}

          {disaster && disasterTypeKey && (
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm md:col-span-2">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("person.section.context")}
              </h2>
              <dl className="grid gap-2.5 text-sm sm:grid-cols-2">
                <Row label={t("person.field.disaster")} value={disaster.name} />
                <Row
                  label={t("search.field.disaster")}
                  value={t(disasterTypeKey)}
                />
                {disaster.region && (
                  <Row label="Región" value={disaster.region} />
                )}
                <Row label={t("person.field.date")} value={disaster.startedAt} />
              </dl>
            </section>
          )}

          <aside className="rounded-xl border border-primary/30 bg-primary/5 p-6 md:col-span-2">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {t("person.privacy.title")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("person.privacy.desc")}
                </p>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-10">
          {(() => {
            const history = getCaseHistoryByPerson(person.id);
            if (!history) return null;
            return <CaseNarrative history={history} defaultView="narrative" />;
          })()}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function Row({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="flex items-center gap-1.5 text-right text-foreground">
        {icon}
        <span>{value}</span>
      </dd>
    </div>
  );
}

function PersonNotFound() {
  const { t } = useT();
  return (
    <div className="min-h-dvh bg-background">
      <DemoBanner />
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">{t("person.notFound.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("person.notFound.desc")}
        </p>
        <div className="mt-6">
          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
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
