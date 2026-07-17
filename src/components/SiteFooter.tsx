import { Link } from "@tanstack/react-router";
import { useT } from "../i18n/LocaleProvider";

export function SiteFooter() {
  const { t } = useT();
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-muted-foreground">
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <div>
            <p className="font-semibold text-foreground">{t("app.name")}</p>
            <p className="text-xs">{t("app.tagline")}</p>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <li>
              <Link
                to="/privacy"
                className="underline-offset-2 hover:text-foreground hover:underline"
              >
                {t("footer.privacy")}
              </Link>
            </li>
            <li>
              <Link
                to="/protocols"
                className="underline-offset-2 hover:text-foreground hover:underline"
              >
                {t("footer.protocols")}
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="underline-offset-2 hover:text-foreground hover:underline"
              >
                {t("footer.contact")}
              </Link>
            </li>
          </ul>
        </div>
        <p className="mt-6 text-xs">{t("footer.rights")}</p>
      </div>
    </footer>
  );
}
