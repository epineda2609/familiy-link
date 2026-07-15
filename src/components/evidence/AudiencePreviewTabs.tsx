import type { SafeIdAudience } from "../../domain/safeId";
import { useT } from "../../i18n/LocaleProvider";
import type { MessageKey } from "../../i18n/messages";

const AUDS: SafeIdAudience[] = ["public", "family", "institution", "authority"];
const visKey: Record<SafeIdAudience, string> = {
  public: "public",
  family: "family_verified",
  institution: "institution",
  authority: "authority",
};

export function AudiencePreviewTabs({
  value,
  onChange,
}: {
  value: SafeIdAudience;
  onChange: (a: SafeIdAudience) => void;
}) {
  const { t } = useT();
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {t("evidence.preview.tabs")}
      </p>
      <div
        role="tablist"
        className="mt-2 flex flex-wrap gap-1.5"
      >
        {AUDS.map((a) => {
          const active = value === a;
          return (
            <button
              key={a}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(a)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                active
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-input bg-background text-muted-foreground hover:bg-accent"
              }`}
            >
              {t(`evidence.visibility.${visKey[a]}` as MessageKey)}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {t(`evidence.preview.desc.${visKey[value]}` as MessageKey)}
      </p>
    </div>
  );
}
