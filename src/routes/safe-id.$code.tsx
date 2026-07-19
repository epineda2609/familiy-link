import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { DemoBanner } from "../components/DemoBanner";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SkipLink } from "../components/SkipLink";
import { SafeIdCard } from "../components/safeId/SafeIdCard";
import { SafeIdView } from "../components/safeId/SafeIdView";
import { SafeIdAudienceSwitcher } from "../components/safeId/SafeIdAudienceSwitcher";
import { SafeIdAccessLog } from "../components/safeId/SafeIdAccessLog";
import { PrivacyInline } from "../components/ux/PrivacyInline";
import { findSafeIdByCode } from "../data/mock/safeIds";
import { findRescueByCode } from "../data/mock/rescue";
import { safeIdRepository } from "../repositories/SafeIdRepository";
import { resolveAudience, type SafeIdAudience } from "../domain/safeId";
import { useMode } from "../modes/OperationalModeProvider";
import { useT } from "../i18n/LocaleProvider";
import { auditLog } from "../audit/auditLog";

export const Route = createFileRoute("/safe-id/$code")({
  loader: ({ params }) => {
    const record = findSafeIdByCode(params.code);
    if (!record) throw notFound();
    return { record };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.record.shortCode} — Digital Safe ID — BASUF`
          : "Digital Safe ID — BASUF",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  notFoundComponent: SafeIdNotFound,
  component: SafeIdDetail,
});

function SafeIdNotFound() {
  const { t } = useT();
  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />
      <DemoBanner />
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold">{t("safeId.notFound")}</h1>
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

function SafeIdDetail() {
  const { t } = useT();
  const { record } = Route.useLoaderData();
  const { mode } = useMode();
  const [audience, setAudience] = useState<SafeIdAudience>(() =>
    resolveAudience(mode),
  );
  const [tick, setTick] = useState(0);

  const rescue = record.linkedRescueCode
    ? findRescueByCode(record.linkedRescueCode)
    : undefined;

  // record view on mount + audience changes (audit_logs is source of truth)
  useEffect(() => {
    safeIdRepository.record(record.shortCode, audience, "view");
    setTick((v) => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record.shortCode, audience]);

  // Re-render when new safeId events land in the audit log cache
  useEffect(() => safeIdRepository.subscribe(() => setTick((v) => v + 1)), []);

  const events = safeIdRepository.list(record.shortCode);

  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />
      <DemoBanner />
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-10">
        {record.linkedRescueCode && (
          <Link
            to="/rescue/$code"
            params={{ code: record.linkedRescueCode }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {record.linkedRescueCode}
          </Link>
        )}

        <header className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {t("safeId.title")}
          </p>
          <h1 className="mt-1 font-mono text-3xl font-black tracking-wider sm:text-4xl">
            {record.shortCode}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {t("safeId.subtitle")}
          </p>
          <div className="mt-3">
            <PrivacyInline />
          </div>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <SafeIdAudienceSwitcher value={audience} onChange={setAudience} />
            <SafeIdView record={record} audience={audience} rescue={rescue} />
            <SafeIdAccessLog key={tick} events={events} />
          </div>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <SafeIdCard
              record={record}
              onPrint={() => {
                safeIdRepository.record(record.shortCode, audience, "print");
                auditLog.record({
                  actor: { operatorName: "Anónimo", orgName: "—", role: mode },
                  action: "safeId.print",
                  targetId: record.shortCode,
                });
                setTick((v) => v + 1);
              }}
              onShare={() => {
                safeIdRepository.record(record.shortCode, audience, "share");
                auditLog.record({
                  actor: { operatorName: "Anónimo", orgName: "—", role: mode },
                  action: "safeId.share",
                  targetId: record.shortCode,
                });
                setTick((v) => v + 1);
              }}
            />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
