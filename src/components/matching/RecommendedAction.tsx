import { Sparkles } from "lucide-react";
import { useT } from "../../i18n/LocaleProvider";
import type { RecommendedAction } from "../../domain/match";
import type { MessageKey } from "../../i18n/messages";

const keyMap: Record<RecommendedAction, MessageKey> = {
  requestValidation: "match.action.requestValidation",
  markNoMatch: "match.action.markNoMatch",
  escalateAuthority: "match.action.escalateAuthority",
  approveNow: "match.action.approveNow",
};

export function RecommendedActionBanner({
  action,
}: {
  action: RecommendedAction;
}) {
  const { t } = useT();
  return (
    <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 flex-1 text-xs">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
          {t("match.action.recommended")}
        </p>
        <p className="mt-0.5 text-foreground/90">{t(keyMap[action])}</p>
      </div>
    </div>
  );
}
