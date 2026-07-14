import { Link } from "@tanstack/react-router";
import { Heart, Globe } from "lucide-react";
import { useT } from "../i18n/LocaleProvider";
import type { Locale } from "../i18n/messages";

export function SiteHeader() {
  const { t, locale, setLocale } = useT();

  const linkCls =
    "text-sm font-medium text-foreground/80 hover:text-foreground transition-colors";
  const activeCls = "text-primary";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Heart className="h-5 w-5" aria-hidden />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight">
              {t("app.name")}
            </span>
            <span className="hidden text-[10px] text-muted-foreground sm:block">
              {t("app.tagline")}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Principal">
          <Link
            to="/"
            className={linkCls}
            activeProps={{ className: `${linkCls} ${activeCls}` }}
            activeOptions={{ exact: true }}
          >
            {t("nav.home")}
          </Link>
          <Link
            to="/search"
            className={linkCls}
            activeProps={{ className: `${linkCls} ${activeCls}` }}
          >
            {t("nav.search")}
          </Link>
          <Link
            to="/report"
            className={linkCls}
            activeProps={{ className: `${linkCls} ${activeCls}` }}
          >
            {t("nav.report")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="locale-select">
            {t("nav.language")}
          </label>
          <div className="flex items-center gap-1 rounded-md border border-input bg-card px-2 py-1">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            <select
              id="locale-select"
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="bg-transparent text-xs font-medium focus:outline-none"
            >
              <option value="es">ES</option>
              <option value="pt">PT</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
