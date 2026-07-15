import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  X,
  RotateCcw,
  ExternalLink,
  Users,
} from "lucide-react";
import { useT } from "../i18n/LocaleProvider";
import { useInstitutionalSession } from "../auth/InstitutionalSession";
import {
  matchingRepository,
  type EnrichedMatch,
} from "../repositories/MatchingRepository";
import type { MatchStatus } from "../data/mock/matches";
import type { PublicPersonCard, PersonStatus } from "../domain/types";
import type { MessageKey } from "../i18n/messages";
import { auditLog } from "../audit/auditLog";
import { integrations } from "../integrations/simulatedIntegrations";
import { toast } from "../components/Toast";
import { EmptyState } from "../components/EmptyState";
import { Inbox } from "lucide-react";
import { ConfidenceScore } from "../components/matching/ConfidenceScore";
import { MatchExplanationList } from "../components/matching/MatchExplanation";
import { ContradictionList } from "../components/matching/ContradictionList";
import { ReviewBadge } from "../components/matching/ReviewBadge";
import { RecommendedActionBanner } from "../components/matching/RecommendedAction";

export const Route = createFileRoute("/institutional/matches")({
  head: () => ({
    meta: [
      { title: "Coincidencias — Panel BASUF" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MatchesPage,
});

const statuses: MatchStatus[] = ["pending", "approved", "rejected"];

const statusStyles: Record<MatchStatus, string> = {
  pending: "bg-urgent/20 text-urgent-foreground border-urgent/40",
  approved: "bg-hope/20 text-hope-foreground border-hope/40",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

const personStatusPill: Record<PersonStatus, string> = {
  missing: "bg-destructive/10 text-destructive border-destructive/30",
  searching: "bg-urgent/20 text-urgent-foreground border-urgent/40",
  found: "bg-primary/10 text-primary border-primary/30",
  reunited: "bg-hope/20 text-hope-foreground border-hope/40",
};

function MatchesPage() {
  const { t } = useT();
  const { session } = useInstitutionalSession();
  const canReview = session?.role === "admin" || session?.role === "reviewer";
  const reviewer = session ? `${session.operatorName} · ${session.orgName}` : "";

  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [statusFilter, setStatusFilter] = useState<MatchStatus | "">("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const refresh = () => matchingRepository.list().then(setMatches);
  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(
    () => (statusFilter ? matches.filter((m) => m.status === statusFilter) : matches),
    [matches, statusFilter],
  );

  const actor = session
    ? { operatorName: session.operatorName, orgName: session.orgName, role: session.role }
    : null;

  const logMatch = (
    action: "match.approve" | "match.reject" | "match.reset",
    m: EnrichedMatch,
    note?: string,
  ) => {
    if (!actor) return;
    auditLog.record({
      actor,
      action,
      targetId: m.id,
      targetLabel: `${m.personA?.displayName ?? "?"} ↔ ${m.personB?.displayName ?? "?"}`,
      metadata: { score: String(m.score), note },
    });
  };

  const dispatchReunion = (m: EnrichedMatch) => {
    const persons = [m.personA, m.personB].filter(Boolean) as NonNullable<
      EnrichedMatch["personA"]
    >[];
    persons.forEach((p) => {
      integrations.dispatch({
        integrationId: "whatsapp-humanitarian",
        channel: "whatsapp",
        recipientLabel: `Reportante de ${p.displayName}`,
        subject: "Coincidencia aprobada",
        body: `Se aprobó una coincidencia para ${p.displayName}. Un revisor humano coordinará el contacto.`,
        relatedCaseId: p.id,
        relatedMatchId: m.id,
      });
      integrations.dispatch({
        integrationId: "sms-broadcast",
        channel: "sms",
        recipientLabel: `Contacto de ${p.displayName}`,
        subject: "BASUF",
        body: `BASUF: coincidencia aprobada para ${p.displayName}. Espera contacto de un aliado.`,
        relatedCaseId: p.id,
        relatedMatchId: m.id,
      });
    });
  };

  const approve = async (id: string) => {
    const m = matches.find((x) => x.id === id);
    await matchingRepository.approve(id, reviewer, notes[id]);
    if (m) {
      logMatch("match.approve", m, notes[id]);
      dispatchReunion(m);
      toast.success(
        t("toast.match.approved"),
        `${m.personA?.displayName ?? "?"} ↔ ${m.personB?.displayName ?? "?"}`,
      );
      toast.info(t("toast.match.dispatched"));
    }
    refresh();
  };
  const reject = async (id: string) => {
    const m = matches.find((x) => x.id === id);
    await matchingRepository.reject(id, reviewer, notes[id]);
    if (m) {
      logMatch("match.reject", m, notes[id]);
      toast.info(t("toast.match.rejected"));
    }
    refresh();
  };
  const reset = async (id: string) => {
    const m = matches.find((x) => x.id === id);
    await matchingRepository.reset(id);
    if (m) {
      logMatch("match.reset", m);
      toast.info(t("toast.match.reset"));
    }
    refresh();
  };

  return (
    <>
      <header className="mb-4">
        <h2 className="text-lg font-semibold">{t("match.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("match.subtitle")}</p>
      </header>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="mstatus" className="text-xs font-medium text-muted-foreground">
            {t("match.filter.status")}
          </label>
          <select
            id="mstatus"
            className="rounded-md border border-input bg-card px-2 py-1 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as MatchStatus | "")}
          >
            <option value="">{t("match.filter.all")}</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {t(`match.status.${s}` as MessageKey)}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-muted-foreground">
          {filtered.length} · {matches.length}
        </span>
      </div>

      {!canReview && (
        <p className="mb-4 rounded-md border border-urgent/40 bg-urgent/10 px-3 py-2 text-xs text-muted-foreground">
          {t("match.readonly.notice")}
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={t("empty.matches.title")}
          description={t("empty.matches.desc")}
        />
      ) : (
        <div className="space-y-4 animate-in fade-in duration-300">
          {filtered.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              note={notes[m.id] ?? ""}
              onNoteChange={(v) => setNotes((n) => ({ ...n, [m.id]: v }))}
              canReview={canReview}
              onApprove={() => approve(m.id)}
              onReject={() => reject(m.id)}
              onReset={() => reset(m.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function MatchCard({
  match,
  note,
  onNoteChange,
  canReview,
  onApprove,
  onReject,
  onReset,
}: {
  match: EnrichedMatch;
  note: string;
  onNoteChange: (v: string) => void;
  canReview: boolean;
  onApprove: () => void;
  onReject: () => void;
  onReset: () => void;
}) {
  const { t } = useT();

  return (
    <article className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <ReviewBadge state={match.explanation.reviewState} />
          <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {t(`match.kind.${match.explanation.kind}` as MessageKey)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {t("match.reportedBy")}: {match.explanation.reportedBy}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" aria-hidden />
          {match.id}
        </span>
      </header>

      <div className="mb-4">
        <ConfidenceScore score={match.explanation.score} />
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        <PersonPanel label={t("match.personA")} person={match.personA} />
        <div className="hidden items-center justify-center md:flex">
          <ArrowRight className="h-5 w-5 text-muted-foreground" aria-hidden />
        </div>
        <PersonPanel label={t("match.personB")} person={match.personB} />
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("match.fields.title")}
        </p>
        <MatchExplanationList fields={match.explanation.fields} />
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("match.contradictions.title")}
        </p>
        <ContradictionList items={match.explanation.contradictions} />
      </div>

      <div className="mt-5">
        <RecommendedActionBanner action={match.explanation.recommendedAction} />
      </div>

      {match.status !== "pending" && (
        <div className="mt-4 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <div>
            <span className="font-medium">{t("match.reviewedBy")}:</span>{" "}
            {match.reviewedBy ?? "—"}
          </div>
          <div>
            <span className="font-medium">{t("match.reviewedAt")}:</span>{" "}
            {match.reviewedAt ?? "—"}
          </div>
          {match.note && (
            <div className="mt-1">
              <span className="font-medium">{t("match.note")}:</span> {match.note}
            </div>
          )}
        </div>
      )}

      {canReview && match.status === "pending" && (
        <div className="mt-4 space-y-3">
          <label className="text-xs font-medium text-muted-foreground" htmlFor={`note-${match.id}`}>
            {t("match.note")}
          </label>
          <textarea
            id={`note-${match.id}`}
            rows={2}
            placeholder={t("match.note.ph")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">{t("match.approvedNotice")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onApprove}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <Check className="h-4 w-4" aria-hidden />
              {t("match.action.approve")}
            </button>
            <button
              type="button"
              onClick={onReject}
              className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-1.5 text-sm font-medium text-destructive transition hover:bg-destructive/10"
            >
              <X className="h-4 w-4" aria-hidden />
              {t("match.action.reject")}
            </button>
          </div>
        </div>
      )}

      {canReview && match.status !== "pending" && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-accent"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            {t("match.action.reset")}
          </button>
        </div>
      )}
    </article>
  );
}

function PersonPanel({
  label,
  person,
}: {
  label: string;
  person: PublicPersonCard | null;
}) {
  const { t } = useT();
  if (!person) {
    return (
      <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
        —
      </div>
    );
  }
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{person.displayName}</p>
          <p className="text-xs text-muted-foreground">
            {person.approximateAge ? `~${person.approximateAge} · ` : ""}
            {person.country}
          </p>
          {person.lastSeenLocation && (
            <p className="mt-1 text-xs text-muted-foreground">
              {person.lastSeenLocation}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${personStatusPill[person.status]}`}
        >
          {t(`status.${person.status}` as MessageKey)}
        </span>
      </div>
      <Link
        to="/person/$id"
        params={{ id: person.id }}
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
      >
        <ExternalLink className="h-3 w-3" aria-hidden />
        {t("inst.action.viewPublic")}
      </Link>
    </div>
  );
}

function readableReason(code: string, t: (k: MessageKey) => string): string {
  if (code.startsWith("age_diff_")) {
    const n = code.slice("age_diff_".length);
    return `${t("match.reason.age_diff")}: ${n}`;
  }
  const key = `match.reason.${code}` as MessageKey;
  const val = t(key);
  return val === key ? code : val;
}
