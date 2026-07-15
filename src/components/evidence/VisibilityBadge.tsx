import type { EvidenceVisibility } from "../../domain/evidence";
import { useT } from "../../i18n/LocaleProvider";
import type { MessageKey } from "../../i18n/messages";

const tint: Record<EvidenceVisibility, string> = {
  public: "bg-primary/10 text-primary border-primary/30",
  family_verified: "bg-hope/20 text-hope-foreground border-hope/40",
  institution: "bg-muted text-muted-foreground border-border",
  authority: "bg-urgent/20 text-urgent-foreground border-urgent/40",
  restricted: "bg-destructive/10 text-destructive border-destructive/30",
};

export function VisibilityBadge({ v }: { v: EvidenceVisibility }) {
  const { t } = useT();
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${tint[v]}`}
    >
      {t(`evidence.visibility.${v}` as MessageKey)}
    </span>
  );
}
