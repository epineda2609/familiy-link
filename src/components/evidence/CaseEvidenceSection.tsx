import { useState } from "react";
import {
  Camera,
  FileText,
  Hospital,
  Ambulance,
  MapPin,
  IdCard,
  Users,
  Link2,
  ShieldAlert,
  Building2,
  ShieldCheck,
} from "lucide-react";
import type { CaseHistory, CaseEvent } from "../../domain/caseTimeline";
import type { EvidenceItem } from "../../domain/evidence";
import type { PublicPersonCard } from "../../domain/types";
import type { SafeIdAudience } from "../../domain/safeId";
import type { EnrichedMatch } from "../../repositories/MatchingRepository";
import { AudiencePreviewTabs } from "./AudiencePreviewTabs";
import { useT } from "../../i18n/LocaleProvider";
import type { MessageKey } from "../../i18n/messages";

interface Props {
  person: PublicPersonCard;
  history: CaseHistory | null;
  evidence: EvidenceItem[];
  matches: EnrichedMatch[];
  audience: SafeIdAudience;
  onAudienceChange: (a: SafeIdAudience) => void;
}

type ItemIcon =
  | "report"
  | "photo"
  | "hospital"
  | "transfer"
  | "location"
  | "document"
  | "family"
  | "match"
  | "chain";

interface EvidenceRow {
  id: string;
  icon: ItemIcon;
  label: string;
  date?: string;
  detail?: string;
  audience: SafeIdAudience; // minimum audience allowed
  origin?: string;
}

function iconFor(kind: ItemIcon) {
  const cls = "h-4 w-4 text-primary";
  switch (kind) {
    case "report":
      return <FileText className={cls} aria-hidden />;
    case "photo":
      return <Camera className={cls} aria-hidden />;
    case "hospital":
      return <Hospital className={cls} aria-hidden />;
    case "transfer":
      return <Ambulance className={cls} aria-hidden />;
    case "location":
      return <MapPin className={cls} aria-hidden />;
    case "document":
      return <IdCard className={cls} aria-hidden />;
    case "family":
      return <Users className={cls} aria-hidden />;
    case "match":
      return <Link2 className={cls} aria-hidden />;
    case "chain":
      return <ShieldCheck className={cls} aria-hidden />;
  }
}

function fmtDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function classifyEvent(ev: CaseEvent): {
  icon: ItemIcon;
  labelKey: MessageKey;
  audience: SafeIdAudience;
} {
  const t = String(ev.type);
  if (t.includes("report_received") || t.includes("citizen_update"))
    return { icon: "report", labelKey: "evidence.item.citizenReport", audience: "public" };
  if (t.includes("reported_missing"))
    return { icon: "report", labelKey: "evidence.item.citizenReport", audience: "public" };
  if (t.includes("last_seen"))
    return { icon: "location", labelKey: "evidence.item.lastSeen", audience: "public" };
  if (t.includes("case_created"))
    return { icon: "report", labelKey: "evidence.item.caseCreated", audience: "public" };
  if (t.includes("hospital") || t.includes("received_by"))
    return { icon: "hospital", labelKey: "evidence.item.institutionalRecord", audience: "institution" };
  if (t.includes("transfer") || t.includes("shelter") || t.includes("ambulance"))
    return { icon: "transfer", labelKey: "evidence.item.transferRecord", audience: "institution" };
  if (t.includes("rescue") || t.includes("triage"))
    return { icon: "chain", labelKey: "evidence.item.rescueChain", audience: "institution" };
  if (t.includes("match"))
    return { icon: "match", labelKey: "evidence.item.match", audience: "institution" };
  if (t.includes("review"))
    return { icon: "chain", labelKey: "evidence.item.review", audience: "institution" };
  if (t.includes("located") || t.includes("reunited"))
    return { icon: "chain", labelKey: "evidence.item.rescueChain", audience: "public" };
  return { icon: "report", labelKey: "evidence.item.citizenReport", audience: "public" };
}

const AUD_RANK: Record<SafeIdAudience, number> = {
  public: 0,
  family: 1,
  institution: 2,
  authority: 3,
};

export function CaseEvidenceSection({
  person,
  history,
  evidence,
  matches,
  audience,
  onAudienceChange,
}: Props) {
  const { t } = useT();

  // Real organisation names sourced from the case data (no hardcoding).
  // - "receivedBy": the organisation that first received/registered the person
  //   (either the ficha's own origin org or, for civil-side cases, the org
  //   linked through the pending match).
  // - "transferredTo": inferred from any transfer / shelter timeline event.
  const receivedByOrg =
    person.originOrgName ??
    matches
      .map((m) =>
        m.personA?.id === person.id
          ? m.personB?.originOrgName
          : m.personA?.originOrgName,
      )
      .find((n): n is string => !!n) ??
    null;
  const transferEvent = (history?.events ?? []).find((ev) => {
    const t = String(ev.type).toLowerCase();
    return (
      t.includes("transfer") ||
      t.includes("shelter") ||
      t.includes("received_by") ||
      t.includes("hospital")
    );
  });
  const transferredToOrg =
    transferEvent && transferEvent.actorOrg && transferEvent.actorOrg !== receivedByOrg
      ? transferEvent.actorOrg
      : null;


  // Build unified evidence rows from timeline + attachments.
  const rows: EvidenceRow[] = [];
  const events = history?.events ?? [];
  for (const ev of events) {
    const c = classifyEvent(ev);
    rows.push({
      id: `ev-${ev.id}`,
      icon: c.icon,
      label: t(c.labelKey),
      date: fmtDate(ev.at),
      detail: ev.summary || ev.note || ev.location,
      audience: c.audience,
      origin: ev.actorOrg,
    });
  }

  for (const it of evidence) {
    const vis: SafeIdAudience =
      it.visibility === "public"
        ? "public"
        : it.visibility === "family_verified"
          ? "family"
          : it.visibility === "authority" || it.visibility === "restricted"
            ? "authority"
            : "institution";
    const icon: ItemIcon =
      it.kind === "person_photo"
        ? "photo"
        : it.kind === "document"
          ? "document"
          : it.kind === "location"
            ? "location"
            : it.kind === "institutional"
              ? "hospital"
              : "photo";
    rows.push({
      id: `att-${it.id}`,
      icon,
      label:
        icon === "photo"
          ? t("evidence.item.photo")
          : icon === "document"
            ? t("evidence.item.document")
            : icon === "location"
              ? t("evidence.item.location")
              : t("evidence.item.institutionalRecord"),
      date: fmtDate(it.uploadedAt),
      detail: it.caption,
      audience: vis,
      origin: it.uploadedBy,
    });
  }

  rows.sort((a, b) => (a.date && b.date ? (a.date < b.date ? 1 : -1) : 0));

  // Counters
  const publicRecords = rows.filter(
    (r) => r.audience === "public" && r.icon !== "photo" && r.icon !== "document",
  ).length;
  const publicPhotos = evidence.filter(
    (e) => e.visibility === "public" && e.kind === "person_photo",
  ).length;
  const publicDocs = evidence.filter(
    (e) => e.visibility === "public" && e.kind === "document",
  ).length;
  const institutionalRowCount = rows.filter(
    (r) => AUD_RANK[r.audience] >= AUD_RANK.institution,
  ).length;
  // A person tied to an institution and/or with pending matches always has at
  // least one institutional record. This avoids the "0" inconsistency when the
  // civil-side case has an active institutional match but no institutional
  // timeline events of its own.
  const hasInstitutionalRelation =
    !!person.originOrgName || matches.length > 0;
  const institutionalRecords = Math.max(
    institutionalRowCount,
    hasInstitutionalRelation ? Math.max(1, matches.length) : 0,
  );
  const matchCount = matches.length;

  const localizedPerson =
    person.status === "found" || person.status === "reunited";

  return (
    <section className="mt-10 space-y-6">
      {/* Summary card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("evidence.summary.title")}
          </h2>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          {t("evidence.summary.subtitle")}
        </p>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Counter label={t("evidence.summary.publicRecords")} value={publicRecords} />
          <Counter label={t("evidence.summary.publicPhotos")} value={publicPhotos} />
          <Counter label={t("evidence.summary.publicDocs")} value={publicDocs} />
          <Counter label={t("evidence.summary.institutional")} value={institutionalRecords} />
          <Counter label={t("evidence.summary.matches")} value={matchCount} />
        </dl>
      </div>

      {/* Tabs + audience panels */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("evidence.title")}
          </h2>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          {t("evidence.subtitle")}
        </p>

        <div className="mb-5">
          <AudiencePreviewTabs value={audience} onChange={onAudienceChange} />
        </div>

        {audience === "public" && (
          <PublicPanel
            rows={rows.filter((r) => r.audience === "public")}
            hasPublicPhotos={publicPhotos > 0}
          />
        )}

        {audience === "family" && <FamilyPanel />}

        {audience === "institution" && (
          <InstitutionalPanel
            rows={rows}
            localized={localizedPerson}
            person={person}
            receivedByOrg={receivedByOrg}
            transferredToOrg={transferredToOrg}
          />
        )}

        {audience === "authority" && <AuthorityPanel />}
      </div>
    </section>
  );
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/50 p-3">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-xl font-bold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}

function PublicPanel({
  rows,
  hasPublicPhotos,
}: {
  rows: EvidenceRow[];
  hasPublicPhotos: boolean;
}) {
  const { t } = useT();
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("evidence.public.listTitle")}
      </h3>
      <ul className="divide-y divide-border/70 rounded-lg border border-border/70">
        {rows.length === 0 ? (
          <li className="p-4 text-xs text-muted-foreground">
            {t("evidence.item.citizenReport")}
          </li>
        ) : (
          rows.map((r) => <EvidenceRowLI key={r.id} row={r} />)
        )}
        {!hasPublicPhotos && (
          <li className="flex items-start gap-3 p-4">
            <Camera className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="text-xs text-muted-foreground">
              {t("evidence.public.emptyPhotos")}
            </div>
          </li>
        )}
      </ul>
    </div>
  );
}

function FamilyPanel() {
  const { t } = useT();
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-5">
      <div className="flex items-start gap-3">
        <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t("evidence.family.title")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("evidence.family.body")}
          </p>
        </div>
      </div>
    </div>
  );
}

function InstitutionalPanel({
  rows,
  localized,
  person,
  receivedByOrg,
  transferredToOrg,
}: {
  rows: EvidenceRow[];
  localized: boolean;
  person: PublicPersonCard;
  receivedByOrg: string | null;
  transferredToOrg: string | null;
}) {
  const { t } = useT();
  const items: {
    icon: ItemIcon;
    label: string;
    state: string;
  }[] = [
    {
      icon: "hospital",
      label: receivedByOrg ?? t("evidence.institution.hospital"),
      state: t("evidence.institution.hospitalState"),
    },
    {
      icon: "photo",
      label: t("evidence.institution.photos"),
      state: t("evidence.institution.photosState"),
    },
    {
      icon: "report",
      label: t("evidence.institution.report"),
      state: t("evidence.institution.reportState"),
    },
    {
      icon: "transfer",
      label: transferredToOrg ?? t("evidence.institution.transfer"),
      state: t("evidence.institution.transferState"),
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("evidence.institution.title")}
      </h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((it) => (
          <li
            key={it.label}
            className="flex items-start gap-3 rounded-lg border border-border/70 bg-background/50 p-3"
          >
            <span className="mt-0.5">{iconFor(it.icon)}</span>
            <div>
              <p className="text-sm font-semibold text-foreground">{it.label}</p>
              <p className="text-xs text-muted-foreground">{it.state}</p>
            </div>
          </li>
        ))}
      </ul>

      {localized && (
        <div className="rounded-lg border border-border/70 bg-background/50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" aria-hidden />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("evidence.reception.title")}
            </h4>
          </div>
          <dl className="grid gap-2.5 text-sm sm:grid-cols-2">
            {person.originOrgName && (
              <div className="flex items-start justify-between gap-4">
                <dt className="text-xs text-muted-foreground">
                  {t("evidence.reception.received")}
                </dt>
                <dd className="text-right text-foreground">{person.originOrgName}</dd>
              </div>
            )}
            {person.originOrgType && (
              <div className="flex items-start justify-between gap-4">
                <dt className="text-xs text-muted-foreground">
                  {t("evidence.reception.type")}
                </dt>
                <dd className="text-right text-foreground">
                  {t(`org.type.${person.originOrgType}` as MessageKey)}
                </dd>
              </div>
            )}
            <div className="flex items-start justify-between gap-4">
              <dt className="text-xs text-muted-foreground">
                {t("evidence.reception.receivedAt")}
              </dt>
              <dd className="text-right text-foreground">{person.reportedAt}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
        {t("evidence.institution.note")}
      </div>

      {rows.filter((r) => AUD_RANK[r.audience] >= AUD_RANK.institution).length >
        0 && (
        <ul className="divide-y divide-border/70 rounded-lg border border-border/70">
          {rows
            .filter((r) => AUD_RANK[r.audience] >= AUD_RANK.institution)
            .map((r) => (
              <EvidenceRowLI key={r.id} row={r} restricted />
            ))}
        </ul>
      )}
    </div>
  );
}

function AuthorityPanel() {
  const { t } = useT();
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-5">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">
          {t("evidence.authority.body")}
        </p>
      </div>
    </div>
  );
}

function EvidenceRowLI({
  row,
  restricted,
}: {
  row: EvidenceRow;
  restricted?: boolean;
}) {
  const { t } = useT();
  return (
    <li className="flex items-start gap-3 p-3">
      <span className="mt-0.5">{iconFor(row.icon)}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{row.label}</p>
          {row.date && (
            <span className="text-[11px] text-muted-foreground">{row.date}</span>
          )}
        </div>
        {row.detail && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
            {row.detail}
          </p>
        )}
        {row.origin && (
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground/80">
            {row.origin}
          </p>
        )}
        {restricted && row.audience !== "public" && (
          <p className="mt-1 text-[11px] text-primary/80">
            {t("evidence.institution.note")}
          </p>
        )}
      </div>
    </li>
  );
}

// Small helper so we can share the icon renderer with sub-components
export { iconFor as evidenceIconFor };
