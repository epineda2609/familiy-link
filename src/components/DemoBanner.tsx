import { AlertTriangle } from "lucide-react";
import { useT } from "../i18n/LocaleProvider";

export function DemoBanner() {
  const { t } = useT();
  return (
    <div
      role="status"
      className="w-full bg-demo text-demo-foreground border-b border-border"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-xs sm:text-sm">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
        <span className="font-medium">{t("demo.banner")}</span>
      </div>
    </div>
  );
}
