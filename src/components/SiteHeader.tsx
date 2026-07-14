import { Link } from "@tanstack/react-router";
import { Heart, Globe, Menu, X } from "lucide-react";
import { useState } from "react";
import { useT } from "../i18n/LocaleProvider";
import type { Locale } from "../i18n/messages";

export function SiteHeader() {
  const { t, locale, setLocale } = useT();
  const [open, setOpen] = useState(false);

  const linkCls =
    "text-sm font-medium text-foreground/80 hover:text-foreground transition-colors";
  const activeCls = "text-primary";
  const mobileLinkCls =
    "block rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-accent hover:text-foreground";

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2" onClick={close}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Heart className="h-5 w-5" aria-hidden />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-base font-bold tracking-tight">
              {t("app.name")}
            </span>
            <span className="hidden truncate text-[10px] text-muted-foreground sm:block">
              {t("app.tagline")}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label={t("nav.primary")}>
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
          <Link
            to="/institutional"
            className={linkCls}
            activeProps={{ className: `${linkCls} ${activeCls}` }}
          >
            {t("nav.institutional")}
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
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t("nav.close") : t("nav.open")}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-input bg-background text-foreground transition hover:bg-accent md:hidden"
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label={t("nav.primary")}
          className="border-t border-border bg-background md:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            <Link to="/" className={mobileLinkCls} onClick={close} activeOptions={{ exact: true }} activeProps={{ className: `${mobileLinkCls} ${activeCls}` }}>
              {t("nav.home")}
            </Link>
            <Link to="/search" className={mobileLinkCls} onClick={close} activeProps={{ className: `${mobileLinkCls} ${activeCls}` }}>
              {t("nav.search")}
            </Link>
            <Link to="/report" className={mobileLinkCls} onClick={close} activeProps={{ className: `${mobileLinkCls} ${activeCls}` }}>
              {t("nav.report")}
            </Link>
            <Link to="/institutional" className={mobileLinkCls} onClick={close} activeProps={{ className: `${mobileLinkCls} ${activeCls}` }}>
              {t("nav.institutional")}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
