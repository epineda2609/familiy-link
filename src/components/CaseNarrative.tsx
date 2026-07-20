import { useT } from "../i18n/LocaleProvider";
import type { CaseHistory } from "../domain/caseTimeline";
import { CaseTimeline } from "./CaseTimeline";

export function CaseNarrative({
  history,
}: {
  history: CaseHistory;
}) {
  const { t } = useT();

  return (
    <section aria-label={t("case.timeline.title")}>
      <header className="mb-4">
        <h2 className="text-xl font-bold tracking-tight">
          {t("case.timeline.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("case.timeline.subtitle")}
        </p>
      </header>

      <CaseTimeline events={history.events} />
    </section>
  );
}
