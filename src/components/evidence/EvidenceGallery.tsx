import { useState } from "react";
import { Eye } from "lucide-react";
import type { EvidenceItem } from "../../domain/evidence";
import type { SafeIdAudience } from "../../domain/safeId";
import { isVisibleFor } from "../../domain/evidence";
import { VisibilityBadge } from "./VisibilityBadge";
import { SensitiveContentBadge } from "./SensitiveContentBadge";
import { useT } from "../../i18n/LocaleProvider";
import { auditLog } from "../../audit/auditLog";

interface Props {
  items: EvidenceItem[];
  audience: SafeIdAudience;
  actorOrg?: string;
  actorRole?: string;
  actorName?: string;
}

export function EvidenceGallery({
  items,
  audience,
  actorOrg,
  actorRole,
  actorName,
}: Props) {
  const { t } = useT();
  const visible = items.filter((it) => isVisibleFor(it, audience));

  if (visible.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
        {t("evidence.empty")}
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map((it) => (
        <EvidenceTile
          key={it.id}
          item={it}
          canReveal={audience === "institution" || audience === "authority"}
          actorOrg={actorOrg}
          actorRole={actorRole}
          actorName={actorName}
        />
      ))}
    </ul>
  );
}

function EvidenceTile({
  item,
  canReveal,
  actorOrg,
  actorRole,
  actorName,
}: {
  item: EvidenceItem;
  canReveal: boolean;
  actorOrg?: string;
  actorRole?: string;
  actorName?: string;
}) {
  const { t } = useT();
  const [revealed, setRevealed] = useState(false);
  const blurred = item.sensitive && !revealed;

  const reveal = () => {
    setRevealed(true);
    auditLog.record({
      actor: {
        operatorName: actorName ?? "Anónimo",
        orgName: actorOrg ?? "—",
        role: actorRole ?? "viewer",
      },
      action: "evidence.reveal",
      targetId: item.id,
      targetLabel: item.caption ?? item.kind,
    });
  };

  return (
    <li className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="relative aspect-video bg-muted">
        <img
          src={item.url}
          alt={item.caption ?? "Evidencia"}
          className={`h-full w-full object-cover transition ${blurred ? "scale-105 blur-xl" : ""}`}
        />
        {blurred && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 p-3 text-center">
            <p className="text-[11px] text-muted-foreground">
              {t("evidence.sensitive.hidden")}
            </p>
            {canReveal && (
              <button
                type="button"
                onClick={reveal}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Eye className="h-3 w-3" />
                {t("evidence.sensitive.reveal")}
              </button>
            )}
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <VisibilityBadge v={item.visibility} />
          {item.sensitive && <SensitiveContentBadge />}
        </div>
        {item.caption && (
          <p className="mt-2 text-xs text-foreground/90">{item.caption}</p>
        )}
        <p className="mt-1 text-[10px] text-muted-foreground">
          {item.uploadedBy}
        </p>
      </div>
    </li>
  );
}
