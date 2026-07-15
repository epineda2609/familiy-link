import type { SafeIdAudience } from "../../domain/safeId";
import { useT } from "../../i18n/LocaleProvider";
import type { MessageKey } from "../../i18n/messages";

const AUDS: SafeIdAudience[] = ["public", "family", "institution", "authority"];

export function SafeIdAudienceSwitcher({
  value,
  onChange,
}: {
  value: SafeIdAudience;
  onChange: (a: SafeIdAudience) => void;
}) {
  const { t } = useT();
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {t("safeId.audience.label")}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {AUDS.map((a) => {
          const active = value === a;
          return (
            <button
              key={a}
              type="button"
              onClick={() => onChange(a)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                active
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-input bg-background text-muted-foreground hover:bg-accent"
              }`}
            >
              {t(`safeId.audience.${a}` as MessageKey)}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {t(`safeId.audience.desc.${value}` as MessageKey)}
      </p>
    </div>
  );
}
