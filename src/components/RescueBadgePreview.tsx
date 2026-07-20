import { Printer, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { RescueRecord } from "../domain/rescue";
import { RescueQR } from "./RescueQR";
import { useT } from "../i18n/LocaleProvider";
import { findSafeIdByRescueCode } from "../data/mock/safeIds";
import { T } from "../i18n/T";

export function RescueBadgePreview({ record }: { record: RescueRecord }) {
  const { t } = useT();
  const safeId = findSafeIdByRescueCode(record.code);
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{t("rescue.badge.title")}</h3>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
        >
          <Printer className="h-3.5 w-3.5" aria-hidden />
          {t("rescue.badge.print")}
        </button>
      </div>

      <div className="mt-4 rounded-lg border-2 border-dashed border-border bg-white p-4 text-black">
        <div className="flex items-start gap-4">
          <RescueQR value={`${record.tempId}|${record.code}`} size={128} />
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              <T k="audit.components.rescueBadgePreview.bASUFRescueIntake" />
            </p>
            <p className="mt-1 font-mono text-3xl font-black tracking-wider">{record.code}</p>
            <p className="mt-1 truncate font-mono text-[11px] text-neutral-600">{record.tempId}</p>
            {record.displayHint && (
              <p className="mt-3 text-xs leading-snug text-neutral-700">{record.displayHint}</p>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">{t("rescue.badge.desc")}</p>

      {safeId && (
        <Link
          to="/safe-id/$code"
          params={{ code: safeId.shortCode }}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
        >
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          {t("safeId.link")} · {safeId.shortCode}
        </Link>
      )}
    </div>
  );
}
