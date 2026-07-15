import { Compass } from "lucide-react";
import { useT } from "../../i18n/LocaleProvider";
import type { MessageKey } from "../../i18n/messages";

type Flow = "search" | "report" | "rescue";

export function WhatHappensNow({ flow }: { flow: Flow }) {
  const { t } = useT();
  const steps: MessageKey[] = [
    `ux.whatHappensNow.${flow}.1` as MessageKey,
    `ux.whatHappensNow.${flow}.2` as MessageKey,
    `ux.whatHappensNow.${flow}.3` as MessageKey,
  ];
  return (
    <aside className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center gap-2">
        <Compass className="h-4 w-4 text-primary" aria-hidden />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
          {t("ux.whatHappensNow.title")}
        </p>
      </div>
      <ol className="mt-2 space-y-1 text-sm text-foreground/90">
        {steps.map((k, i) => (
          <li key={k} className="flex gap-2">
            <span className="text-xs font-semibold text-primary">{i + 1}.</span>
            <span>{t(k)}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
