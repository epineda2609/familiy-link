import { useT } from "../../i18n/LocaleProvider";
import type { MessageKey } from "../../i18n/messages";

type Level = "pending" | "partial" | "verified";

const tint: Record<Level, string> = {
  pending: "bg-muted text-muted-foreground border-border",
  partial: "bg-primary/10 text-primary border-primary/30",
  verified: "bg-hope/20 text-hope-foreground border-hope/40",
};

export function UncertaintyPill({ level }: { level: Level }) {
  const { t } = useT();
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${tint[level]}`}
    >
      {t(`ux.uncertainty.${level}` as MessageKey)}
    </span>
  );
}
