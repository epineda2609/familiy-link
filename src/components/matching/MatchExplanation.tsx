import { Check, X, HelpCircle, Minus } from "lucide-react";
import { useT } from "../../i18n/LocaleProvider";
import type { MatchField } from "../../domain/match";
import type { MessageKey } from "../../i18n/messages";

const agreeStyle: Record<MatchField["agreement"], string> = {
  match: "border-hope/40 bg-hope/10 text-hope-foreground",
  partial: "border-primary/40 bg-primary/10 text-primary",
  contradict: "border-destructive/40 bg-destructive/10 text-destructive",
  unknown: "border-border bg-muted/50 text-muted-foreground",
};

const AgreeIcon: Record<MatchField["agreement"], typeof Check> = {
  match: Check,
  partial: Minus,
  contradict: X,
  unknown: HelpCircle,
};

export function MatchExplanationList({ fields }: { fields: MatchField[] }) {
  const { t } = useT();
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {fields.map((f) => {
        const Icon = AgreeIcon[f.agreement];
        return (
          <li
            key={f.key}
            className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${agreeStyle[f.agreement]}`}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                {t(`match.field.${f.key}` as MessageKey)} ·{" "}
                {t(`match.agree.${f.agreement}` as MessageKey)}
              </p>
              <p className="mt-0.5 truncate text-foreground/90" title={`${f.valueA} ↔ ${f.valueB}`}>
                {f.valueA}{" "}
                <span className="opacity-60">↔</span> {f.valueB}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
