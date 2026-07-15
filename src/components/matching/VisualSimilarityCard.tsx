import { ScanFace, Info } from "lucide-react";
import type { VisualSimilarity } from "../../domain/match";
import { useT } from "../../i18n/LocaleProvider";
import type { MessageKey } from "../../i18n/messages";

const tint: Record<VisualSimilarity["level"], string> = {
  low: "border-border bg-muted/40 text-muted-foreground",
  medium: "border-primary/40 bg-primary/10 text-primary",
  high: "border-primary/50 bg-primary/15 text-primary",
};

export function VisualSimilarityCard({ vs }: { vs: VisualSimilarity }) {
  const { t } = useT();
  return (
    <div className={`rounded-md border p-3 ${tint[vs.level]}`}>
      <div className="flex items-center gap-2">
        <ScanFace className="h-4 w-4 shrink-0" aria-hidden />
        <p className="text-[10px] font-semibold uppercase tracking-wide">
          {t("match.visual.title")}
        </p>
        <span className="ms-auto rounded-full border border-current/40 px-2 py-0.5 text-[10px] font-medium">
          {t(`match.visual.level.${vs.level}` as MessageKey)}
        </span>
      </div>
      {vs.note && (
        <p className="mt-2 text-xs text-foreground/90">{vs.note}</p>
      )}
      <p className="mt-2 flex items-start gap-1.5 text-[11px] text-muted-foreground">
        <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
        {t("match.visual.disclaimer")}
      </p>
      <p className="mt-1 text-[11px] font-medium text-urgent-foreground">
        · {t("match.visual.needsHuman")}
      </p>
    </div>
  );
}
