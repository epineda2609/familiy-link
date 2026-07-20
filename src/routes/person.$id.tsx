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
  Building2,
  Users,
  Link2,
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
import { getCaseHistoryByPerson, useCaseTimeline } from "../repositories/CaseTimelineRepository";
import { findSafeIdByPersonId } from "../data/mock/safeIds";
import { CaseEvidenceSection } from "../components/evidence/CaseEvidenceSection";
import { evidenceRepository } from "../repositories/EvidenceRepository";

import { resolveAudience, type SafeIdAudience } from "../domain/safeId";
import { useMode } from "../modes/OperationalModeProvider";
import { ShareDialog } from "../components/ShareDialog";
import { CaseUpdateDialog } from "../components/CaseUpdateDialog";
import { useCaseUpdates } from "../repositories/CaseUpdateRepository";
import { matchingRepository, type EnrichedMatch } from "../repositories/MatchingRepository";


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
  const [, forceTick] = useState(0);
  useEffect(
    () => evidenceRepository.subscribe(() => forceTick((v) => v + 1)),
    [],
  );
  const evidenceItems = evidenceRepository.listByCase(person.id);
  // Subscribe to citizen updates + cloud timeline hydration so the case history refreshes reactively.
  useCaseUpdates(person.id);
  useCaseTimeline(person.id);
  const [shareOpen, setShareOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  useEffect(() => {
    let alive = true;
    matchingRepository.list().then((all) => {
      if (!alive) return;
      setMatches(
        all.filter(
          (m) => m.personA_id === person.id || m.personB_id === person.id,
        ),
      );
    });
    return () => {
      alive = false;
    };
  }, [person.id]);
  const primaryMatch = matches[0];
  const orgTypeKey = person.originOrgType
    ? (`org.type.${person.originOrgType}` as MessageKey)
    : null;
  const matchOrgType = (() => {
    if (!primaryMatch) return null;
    const otherPerson =
      primaryMatch.personA?.id === person.id
        ? primaryMatch.personB
        : primaryMatch.personA;
    return otherPerson ?? null;
  })();


  const countryName =
    countries.find((c: Country) => c.code === person.country)?.name ??
    person.country;
  const statusKey = `status.${person.status}` as MessageKey;
  const genderKey = `gender.${person.gender}` as MessageKey;
  const disasterTypeKey = disaster
    ? (`disaster.${disaster.type}` as MessageKey)
    : null;

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const share = async () => {
    const url = shareUrl;
    const text = t("share.messageTemplate")
      .replace("{name}", person.displayName)
      .replace("{url}", url);
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: person.displayName, text, url });
        return;
      } catch (err) {
        // User cancelled or share not permitted: fall back to modal.
        if ((err as DOMException)?.name === "AbortError") return;
      }
    }
    setShareOpen(true);
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
              {t("person.actions.share")}
            </button>
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
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

        <ShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          url={shareUrl}
          name={person.displayName}
        />
        <CaseUpdateDialog
          open={infoOpen}
          onOpenChange={setInfoOpen}
          person={person}
        />



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

        {/* Origen del reporte */}
        <section className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {person.reportOrigin === "institution" ? (
              <Building2 className="h-4 w-4" aria-hidden />
            ) : (
              <Users className="h-4 w-4" aria-hidden />
            )}
            {t("person.origin.title")}
          </h2>
          {person.reportOrigin === "institution" ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">
                {t("person.origin.institution")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("person.origin.institutionDesc")}
              </p>
              <dl className="grid gap-2.5 text-sm sm:grid-cols-2">
                {person.originOrgName && (
                  <Row
                    label={t("person.origin.institutionField")}
                    value={person.originOrgName}
                  />
                )}
                {orgTypeKey && (
                  <Row
                    label={t("person.origin.institutionType")}
                    value={t(orgTypeKey)}
                  />
                )}
                {(person.originOrgRegion || person.originOrgCountry) && (
                  <Row
                    label={t("person.origin.region")}
                    value={[person.originOrgRegion, person.originOrgCountry]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                )}
                <Row
                  label={t("person.origin.reportedAt")}
                  value={person.reportedAt}
                />
              </dl>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                {t("person.origin.citizen")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("person.origin.citizenDesc")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("person.origin.reportedAt")}: {person.reportedAt}
              </p>
            </div>
          )}
        </section>

        {/* Posible coincidencia */}
        {primaryMatch && (
          <section className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-6">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
              <Link2 className="h-4 w-4" aria-hidden />
              {person.reportOrigin === "institution"
                ? t("person.match.civilTitle")
                : t("person.match.title")}
            </h2>
            <p className="text-sm text-foreground/90">
              {t("person.match.body")}
            </p>
            <dl className="mt-4 grid gap-2.5 text-sm sm:grid-cols-2">
              <Row
                label={t("person.match.confidence")}
                value={`${Math.round(primaryMatch.score)}%`}
              />
              <Row
                label={t("person.match.review")}
                value={t(
                  `person.match.status.${primaryMatch.status}` as MessageKey,
                )}
              />
              {primaryMatch.reviewedAt && (
                <Row
                  label={t("person.match.detectedAt")}
                  value={primaryMatch.reviewedAt}
                />
              )}
              {matchOrgType?.country && (
                <Row
                  label={t("person.match.region")}
                  value={matchOrgType.country}
                />
              )}
            </dl>
          </section>
        )}


        <CaseEvidenceSection
          person={person}
          history={getCaseHistoryByPerson(person.id)}
          evidence={evidenceItems}
          matches={matches}
          audience={evidenceAudience}
          onAudienceChange={setEvidenceAudience}
        />



        <section className="mt-10">
          {(() => {
            const history = getCaseHistoryByPerson(person.id);
            if (!history || history.events.length === 0) {
              return (
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="text-xl font-bold">{t("case.timeline.title")}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("case.timeline.empty")}
                  </p>
                </div>
              );
            }
            return <CaseNarrative history={history} />;
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
