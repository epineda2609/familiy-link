import { MapPin, Calendar, User } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { PublicPersonCard } from "../domain/types";
import { useT } from "../i18n/LocaleProvider";
import type { MessageKey } from "../i18n/messages";

const statusStyles: Record<PublicPersonCard["status"], string> = {
  missing: "bg-destructive/10 text-destructive border-destructive/30",
  searching: "bg-urgent/20 text-urgent-foreground border-urgent/40",
  found: "bg-primary/10 text-primary border-primary/30",
  reunited: "bg-hope/20 text-hope-foreground border-hope/40",
};

export function PersonCard({ person }: { person: PublicPersonCard }) {
  const { t } = useT();
  const statusKey = `status.${person.status}` as MessageKey;
  const genderKey = `gender.${person.gender}` as MessageKey;

  return (
    <Link
      to="/person/$id"
      params={{ id: person.id }}
      className="group flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <article className="contents">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-card-foreground">
            {person.displayName}
          </h3>
          <p className="text-xs text-muted-foreground">
            {person.approximateAge ? `~${person.approximateAge} · ` : ""}
            {t(genderKey)}
          </p>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyles[person.status]}`}
        >
          {t(statusKey)}
        </span>
      </div>

      <dl className="space-y-1.5 text-xs text-muted-foreground">
        {person.lastSeenLocation && (
          <div className="flex items-start gap-1.5">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{person.lastSeenLocation}</span>
          </div>
        )}
        {person.lastSeenAt && (
          <div className="flex items-start gap-1.5">
            <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{person.lastSeenAt}</span>
          </div>
        )}
        {person.distinctiveFeatures && (
          <div className="flex items-start gap-1.5">
            <User className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="line-clamp-2">{person.distinctiveFeatures}</span>
          </div>
        )}
      </dl>
    </article>
  );
}
