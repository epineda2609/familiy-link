import {
  ShieldAlert,
  Stethoscope,
  Ambulance,
  Hospital,
  Repeat,
  Home,
  Link2,
  HeartHandshake,
  FileSearch,
  Flag,
  UserSearch,
  AlertOctagon,
  Skull,
  MessageSquarePlus,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { useT } from "../i18n/LocaleProvider";
import type { CaseEvent, CaseEventValidation } from "../domain/caseTimeline";
import type { MessageKey } from "../i18n/messages";

const iconMap: Record<string, LucideIcon> = {
  rescue: ShieldAlert,
  triage: Stethoscope,
  ambulance: Ambulance,
  hospital: Hospital,
  transfer: Repeat,
  shelter: Home,
  match: Link2,
  reunion: HeartHandshake,
  review: FileSearch,
  reported_missing: Flag,
  partial_id: UserSearch,
  possible_match: Link2,
  critical_review: AlertOctagon,
  deceased_review: Skull,
  citizen_update: MessageSquarePlus,
};

const tintMap: Record<string, string> = {
  rescue: "bg-urgent/20 text-urgent-foreground",
  triage: "bg-primary/15 text-primary",
  ambulance: "bg-primary/15 text-primary",
  hospital: "bg-primary/15 text-primary",
  transfer: "bg-muted text-foreground",
  shelter: "bg-hope/20 text-hope-foreground",
  match: "bg-primary/15 text-primary",
  reunion: "bg-hope/25 text-hope-foreground",
  review: "bg-muted text-muted-foreground",
  reported_missing: "bg-destructive/10 text-destructive",
  partial_id: "bg-primary/15 text-primary",
  possible_match: "bg-primary/15 text-primary",
  critical_review: "bg-urgent/20 text-urgent-foreground",
  deceased_review: "bg-muted text-muted-foreground",
  citizen_update: "bg-primary/10 text-primary",
};

const validationTint: Record<CaseEventValidation, string> = {
  pending: "border-urgent/40 bg-urgent/10 text-urgent-foreground",
  verified: "border-primary/40 bg-primary/10 text-primary",
  rejected: "border-destructive/40 bg-destructive/10 text-destructive",
};

// Public-friendly label lookup. Falls back to `case.event.generic` when no
// message matches — so unfamiliar DB event types never blank the timeline.
function eventLabelKey(raw: string): MessageKey {
  const rescueTypes = new Set([
    "rescue",
    "triage",
    "ambulance",
    "hospital",
    "transfer",
    "shelter",
    "match",
    "reunion",
    "review",
  ]);
  if (rescueTypes.has(raw)) return `rescue.chain.event.${raw}` as MessageKey;
  return `case.event.${raw}` as MessageKey;
}

function formatDT(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function CaseTimeline({ events }: { events: CaseEvent[] }) {
  const { t, locale } = useT();
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("case.timeline.empty")}</p>
    );
  }
  return (
    <ol className="relative space-y-4 border-s border-border ps-6">
      {events.map((e) => {
        const rawType = String(e.type);
        const Icon = iconMap[rawType] ?? Activity;
        const tint = tintMap[rawType] ?? "bg-muted text-foreground";
        const labelKey = eventLabelKey(rawType);
        const labelResolved = t(labelKey);
        // If translation returns the key untouched, fall back to summary/generic.
        const label =
          labelResolved && labelResolved !== labelKey
            ? labelResolved
            : e.summary || t("case.event.generic");
        return (
          <li key={e.id} className="relative">
            <span
              className={`absolute -start-[34px] grid h-8 w-8 place-items-center rounded-full border border-border ${tint}`}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-sm font-semibold">{label}</h4>
                <time className="text-xs text-muted-foreground">
                  {formatDT(e.at, locale)}
                </time>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {e.actorOrg} ·{" "}
                <span className="italic">
                  {t(`case.source.${e.sourceKind}` as MessageKey)}
                </span>
                {e.location ? ` · ${e.location}` : ""}
              </p>
              {e.validation && (
                <span
                  className={`mt-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${validationTint[e.validation]}`}
                >
                  {t(`case.validation.${e.validation}` as MessageKey)}
                </span>
              )}
              {e.proposedStatus && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("case.event.proposedStatus")}:{" "}
                  <span className="font-medium text-foreground">
                    {t(`status.${e.proposedStatus}` as MessageKey)}
                  </span>
                </p>
              )}
              {e.summary && e.summary !== label && (
                <p className="mt-2 text-sm text-foreground/90">{e.summary}</p>
              )}
              {e.note && (
                <p className="mt-2 text-sm text-foreground/90">{e.note}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

