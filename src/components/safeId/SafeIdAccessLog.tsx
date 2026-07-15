import type { SafeIdAccessEvent } from "../../domain/safeId";
import { useT } from "../../i18n/LocaleProvider";
import type { MessageKey } from "../../i18n/messages";
import { Activity } from "lucide-react";

export function SafeIdAccessLog({ events }: { events: SafeIdAccessEvent[] }) {
  const { t, locale } = useT();
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" aria-hidden />
        <h3 className="text-sm font-semibold">{t("safeId.access.title")}</h3>
      </div>
      {events.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {t("safeId.access.empty")}
        </p>
      ) : (
        <ul className="space-y-1.5 text-xs">
          {events.slice(0, 10).map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-2 border-b border-border/50 pb-1.5 last:border-0 last:pb-0"
            >
              <span className="font-medium">
                {t(`safeId.access.action.${e.action}` as MessageKey)}
              </span>
              <span className="text-muted-foreground">
                {t(`safeId.audience.${e.audience}` as MessageKey)}
              </span>
              <span className="text-muted-foreground">
                {new Date(e.at).toLocaleTimeString(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
