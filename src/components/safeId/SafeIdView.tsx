import { Link } from "@tanstack/react-router";
import type { SafeIdAudience, SafeIdRecord } from "../../domain/safeId";
import type { RescueRecord } from "../../domain/rescue";
import { useT } from "../../i18n/LocaleProvider";
import type { MessageKey } from "../../i18n/messages";
import { audienceIncludes } from "../../domain/safeId";

interface Props {
  record: SafeIdRecord;
  audience: SafeIdAudience;
  rescue?: RescueRecord;
}

export function SafeIdView({ record, audience, rescue }: Props) {
  const { t } = useT();
  const showFamily = audienceIncludes(audience, "family");
  const showInstitution = audienceIncludes(audience, "institution");
  const showAuthority = audienceIncludes(audience, "authority");

  const last = rescue?.chain[rescue.chain.length - 1];

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">
          {t(`safeId.audience.${audience}` as MessageKey)}
        </h3>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {t("safeId.audience.preview")}
        </span>
      </header>

      <dl className="mt-3 space-y-2 text-sm">
        <Row label={t("safeId.short")} value={record.shortCode} mono />
        {last && (
          <Row
            label={t("rescue.record.status")}
            value={t(`rescue.chain.event.${last.type}` as MessageKey) ?? last.type}
          />
        )}

        {showFamily && (
          <>
            {last?.location && (
              <Row label={t("person.field.location")} value={last.location} />
            )}
            {rescue?.displayHint && (
              <Row label={t("rescue.record.hint")} value={rescue.displayHint} />
            )}
            <Row
              label={t("person.field.reportedAt")}
              value={new Date(record.createdAt).toLocaleString()}
            />
          </>
        )}

        {showInstitution && rescue && (
          <div className="pt-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("rescue.chain.title")}
            </p>
            <ul className="mt-1 space-y-1 text-xs text-foreground/90">
              {rescue.chain.slice(0, 4).map((e) => (
                <li key={e.id} className="flex justify-between gap-2">
                  <span>{t(`rescue.chain.event.${e.type}` as MessageKey)}</span>
                  <span className="text-muted-foreground">{e.actorOrg}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {showAuthority && record.linkedPersonId && (
          <div className="pt-2">
            <Link
              to="/person/$id"
              params={{ id: record.linkedPersonId }}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {t("rescue.record.linkedPerson")}
            </Link>
          </div>
        )}
      </dl>
    </section>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-1.5 last:border-0 last:pb-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className={`text-right text-foreground ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
