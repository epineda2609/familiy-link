import { AlertTriangle } from "lucide-react";
import { useT } from "../../i18n/LocaleProvider";

export function SensitiveContentBadge() {
  const { t } = useT();
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-destructive">
      <AlertTriangle className="h-3 w-3" aria-hidden />
      {t("evidence.sensitive.badge")}
    </span>
  );
}
