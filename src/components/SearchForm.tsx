import { Search, RotateCcw } from "lucide-react";
import { useT } from "../i18n/LocaleProvider";
import type { Disaster, Country } from "../domain/types";
import type { SearchFilters } from "../repositories/PeopleRepository";
import type { MessageKey } from "../i18n/messages";

type Props = {
  value: SearchFilters;
  onChange: (v: SearchFilters) => void;
  onSubmit: () => void;
  onReset: () => void;
  countries: Country[];
  disasters: Disaster[];
  nationalities: Country[];
  compact?: boolean;
};

const statuses: Array<PublicStatus> = ["missing", "searching", "found", "reunited"];
type PublicStatus = "missing" | "searching" | "found" | "reunited";
const genders = ["f", "m", "o"] as const;

const fieldCls =
  "w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const labelCls = "text-xs font-medium text-muted-foreground";

export function SearchForm({
  value,
  onChange,
  onSubmit,
  onReset,
  countries,
  disasters,
  nationalities,
  compact,
}: Props) {
  const { t } = useT();
  const set = <K extends keyof SearchFilters>(k: K, v: SearchFilters[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div
        className={`grid gap-3 ${compact ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3"}`}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="f-name" className={labelCls}>
            {t("search.field.name")}
          </label>
          <input
            id="f-name"
            type="text"
            className={fieldCls}
            placeholder={t("search.field.name.ph")}
            value={value.name ?? ""}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="f-country" className={labelCls}>
            {t("search.field.country")}
          </label>
          <select
            id="f-country"
            className={fieldCls}
            value={value.country ?? ""}
            onChange={(e) => set("country", e.target.value || undefined)}
          >
            <option value="">{t("search.field.any")}</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="f-disaster" className={labelCls}>
            {t("search.field.disaster")}
          </label>
          <select
            id="f-disaster"
            className={fieldCls}
            value={value.disasterId ?? ""}
            onChange={(e) => set("disasterId", e.target.value || undefined)}
          >
            <option value="">{t("search.field.any")}</option>
            {disasters.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="f-status" className={labelCls}>
            {t("search.field.status")}
          </label>
          <select
            id="f-status"
            className={fieldCls}
            value={value.status ?? ""}
            onChange={(e) => set("status", e.target.value || undefined)}
          >
            <option value="">{t("search.field.any")}</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {t(`status.${s}` as MessageKey)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="f-gender" className={labelCls}>
            {t("search.field.gender")}
          </label>
          <select
            id="f-gender"
            className={fieldCls}
            value={value.gender ?? ""}
            onChange={(e) => set("gender", e.target.value || undefined)}
          >
            <option value="">{t("search.field.any")}</option>
            {genders.map((g) => (
              <option key={g} value={g}>
                {t(`gender.${g}` as MessageKey)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className={labelCls}>{t("search.field.ageRange")}</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={120}
              placeholder="0"
              className={fieldCls}
              value={value.ageMin ?? ""}
              onChange={(e) =>
                set("ageMin", e.target.value ? Number(e.target.value) : undefined)
              }
            />
            <span className="text-muted-foreground">–</span>
            <input
              type="number"
              min={0}
              max={120}
              placeholder="120"
              className={fieldCls}
              value={value.ageMax ?? ""}
              onChange={(e) =>
                set("ageMax", e.target.value ? Number(e.target.value) : undefined)
              }
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="f-nationality" className={labelCls}>
            {t("search.field.nationality")}
          </label>
          <select
            id="f-nationality"
            className={fieldCls}
            value={value.nationality ?? ""}
            onChange={(e) => set("nationality", e.target.value || undefined)}
          >
            <option value="">{t("report.field.nationality.placeholder")}</option>
            {nationalities.map((c) => (
              <option key={`nat-${c.code}`} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="f-documentId" className={labelCls}>
            {t("search.field.documentId")}
          </label>
          <input
            id="f-documentId"
            type="text"
            inputMode="text"
            pattern="[A-Za-z0-9\s-]*"
            className={fieldCls}
            placeholder={t("search.field.documentId.ph")}
            value={value.documentId ?? ""}
            onChange={(e) => set("documentId", e.target.value || undefined)}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          <Search className="h-4 w-4" aria-hidden />
          {t("search.submit")}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          {t("search.reset")}
        </button>
      </div>
    </form>
  );
}
