import { Printer, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import type { SafeIdRecord } from "../../domain/safeId";
import { RescueQR } from "../RescueQR";
import { BarcodePseudo } from "./BarcodePseudo";
import { useT } from "../../i18n/LocaleProvider";
import { T } from "../../i18n/T";

export function SafeIdCard({
  record,
  onPrint,
  onShare,
  onCopy,
}: {
  record: SafeIdRecord;
  onPrint?: () => void;
  onShare?: () => void;
  onCopy?: () => void;
}) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(record.shortCode);
      setCopied(true);
      onCopy?.();
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: `BASUF · ${record.shortCode}`, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      onShare?.();
    } catch {
      /* user cancelled */
    }
  };

  const handlePrint = () => {
    onPrint?.();
    window.print();
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{t("safeId.title")}</h3>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-[11px] font-medium hover:bg-accent"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? t("safeId.action.copied") : t("safeId.action.copy")}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-[11px] font-medium hover:bg-accent"
          >
            <Share2 className="h-3 w-3" />
            {t("safeId.action.share")}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-[11px] font-medium hover:bg-accent"
          >
            <Printer className="h-3 w-3" />
            {t("safeId.action.print")}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-lg border-2 border-dashed border-border bg-white p-4 text-black">
        <div className="flex items-start gap-4">
          <RescueQR value={record.barcodeValue} size={128} />
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              <T k="audit.components.safeId.safeIdCard.bASUFDigitalSafeID" />
            </p>
            <p className="mt-1 font-mono text-2xl font-black tracking-wider">{record.shortCode}</p>
            <p className="mt-1 truncate font-mono text-[10px] text-neutral-600">
              {record.barcodeValue}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <BarcodePseudo value={record.shortCode} height={48} />
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">{t("safeId.print.subtitle")}</p>
    </div>
  );
}
