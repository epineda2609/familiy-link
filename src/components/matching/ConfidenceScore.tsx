import { ShieldCheck } from "lucide-react";
import { useT } from "../../i18n/LocaleProvider";
import { confidenceLevel } from "../../domain/match";
import type { MessageKey } from "../../i18n/messages";

const tints: Record<"high" | "medium" | "low", string> = {
  high: "text-hope-foreground bg-hope/20 border-hope/40",
  medium: "text-primary bg-primary/10 border-primary/30",
  low: "text-urgent-foreground bg-urgent/10 border-urgent/40",
};

export function ConfidenceScore({ score }: { score: number }) {
  const { t } = useT();
  const level = confidenceLevel(score);
  const labelKey = `match.confidence.${level}` as MessageKey;
  const pct = Math.max(0, Math.min(100, score));

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${tints[level]}`}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={`${t("match.confidence.title")} · ${t(labelKey)}`}
    >
      <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden />
      <div className="flex min-w-0 flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
          {t("match.confidence.title")}
        </span>
        <span className="text-sm font-bold leading-tight">
          {t(labelKey)} · {pct}
        </span>
      </div>
      <div
        className="ms-auto h-2 w-20 overflow-hidden rounded-full bg-background/60"
        aria-hidden
      >
        <div
          className="h-full rounded-full bg-current"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
