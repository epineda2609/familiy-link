import { AlertTriangle } from "lucide-react";
import { useT } from "../../i18n/LocaleProvider";
import type { MatchField } from "../../domain/match";
import type { MessageKey } from "../../i18n/messages";

export function ContradictionList({ items }: { items: MatchField[] }) {
  const { t } = useT();
  if (items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        {t("match.contradictions.none")}
      </p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {items.map((f) => (
        <li
          key={f.key}
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            <strong className="font-semibold">
              {t(`match.field.${f.key}` as MessageKey)}:
            </strong>{" "}
            {f.valueA} <span className="opacity-60">↔</span> {f.valueB}
          </span>
        </li>
      ))}
    </ul>
  );
}
