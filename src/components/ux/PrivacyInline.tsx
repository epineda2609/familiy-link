import { ShieldCheck } from "lucide-react";
import { useT } from "../../i18n/LocaleProvider";

export function PrivacyInline() {
  const { t } = useT();
  return (
    <p className="inline-flex items-start gap-1.5 text-xs text-muted-foreground">
      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
      {t("ux.privacy.short")}
    </p>
  );
}
