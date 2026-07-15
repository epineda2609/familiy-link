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
  type LucideIcon,
} from "lucide-react";
import type { ChainEvent, RescueEventType } from "../domain/rescue";
import { useT } from "../i18n/LocaleProvider";
import type { MessageKey } from "../i18n/messages";

const iconMap: Record<RescueEventType, LucideIcon> = {
  rescue: ShieldAlert,
  triage: Stethoscope,
  ambulance: Ambulance,
  hospital: Hospital,
  transfer: Repeat,
  shelter: Home,
  match: Link2,
  reunion: HeartHandshake,
  review: FileSearch,
};

const tintMap: Record<RescueEventType, string> = {
  rescue: "bg-urgent/20 text-urgent-foreground",
  triage: "bg-primary/15 text-primary",
  ambulance: "bg-primary/15 text-primary",
  hospital: "bg-primary/15 text-primary",
  transfer: "bg-muted text-foreground",
  shelter: "bg-hope/20 text-hope-foreground",
  match: "bg-primary/15 text-primary",
  reunion: "bg-hope/25 text-hope-foreground",
  review: "bg-muted text-muted-foreground",
};

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

export function RescueChainTimeline({ events }: { events: ChainEvent[] }) {
  const { t, locale } = useT();
  return (
    <ol className="relative space-y-4 border-s border-border ps-6">
      {events.map((e) => {
        const Icon = iconMap[e.type];
        const tint = tintMap[e.type];
        return (
          <li key={e.id} className="relative">
            <span
              className={`absolute -start-[34px] grid h-8 w-8 place-items-center rounded-full border border-border ${tint}`}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-sm font-semibold">
                  {t(`rescue.chain.event.${e.type}` as MessageKey)}
                </h4>
                <time className="text-xs text-muted-foreground">
                  {formatDT(e.at, locale)}
                </time>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {e.actorOrg}
                {e.location ? ` · ${e.location}` : ""}
              </p>
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
