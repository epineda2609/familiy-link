import { useT } from "../../i18n/LocaleProvider";
import type { ReviewState } from "../../domain/match";
import type { MessageKey } from "../../i18n/messages";

const styles: Record<ReviewState, string> = {
  pending: "bg-urgent/15 text-urgent-foreground border-urgent/30",
  approved: "bg-hope/20 text-hope-foreground border-hope/40",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  needsAuthority: "bg-primary/10 text-primary border-primary/30",
};

const keyMap: Record<ReviewState, MessageKey> = {
  pending: "match.status.pending",
  approved: "match.status.approved",
  rejected: "match.status.rejected",
  needsAuthority: "match.review.needsAuthority",
};

export function ReviewBadge({ state }: { state: ReviewState }) {
  const { t } = useT();
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${styles[state]}`}
    >
      {t(keyMap[state])}
    </span>
  );
}
