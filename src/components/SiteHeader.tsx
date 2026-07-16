import { Link } from "@tanstack/react-router";
import { Heart, Menu, X } from "lucide-react";
import { useState } from "react";
import { useT } from "../i18n/LocaleProvider";
import { LanguageSelector } from "./LanguageSelector";
import { useMode } from "../modes/OperationalModeProvider";

export function SiteHeader() {
  const { t } = useT();
  const { config } = useMode();
  const [open, setOpen] = useState(false);

  const linkCls =
    "text-sm font-medium text-foreground/80 hover:text-foreground transition-colors";
  const activeCls = "text-primary";
  const mobileLinkCls =
    "block rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-accent hover:text-foreground";

  const close = () => setOpen(false);

  // Reorder desktop nav items by current mode's CTA priority (top 3).
  const linkFor = (to: string) => {
    switch (to) {
      case "/search":
        return { to: "/search" as const, label: t("nav.search") };
      case "/report":
        return { to: "/report" as const, label: t("nav.report") };
      case "/rescue":
        return { to: "/rescue" as const, label: t("nav.rescue") };
      case "/institutional":
        return { to: "/institutional" as const, label: t("nav.institutional") };
      default:
        return null;
    }
  };
  const priorityLinks = config.ctas
    .map((c) => linkFor(c.to))
    .filter((v): v is { to: "/search" | "/report" | "/rescue" | "/institutional"; label: string } => v !== null);
  const seenTo = new Set(priorityLinks.map((l) => l.to));
  const rest = (
    [
      { to: "/search" as const, label: t("nav.search") },
      { to: "/rescue" as const, label: t("nav.rescue") },
      { to: "/report" as const, label: t("nav.report") },
      { to: "/institutional" as const, label: t("nav.institutional") },
    ] as const
  ).filter((l) => !seenTo.has(l.to));
  const navLinks = [...priorityLinks, ...rest];

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
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={linkCls}
              activeProps={{ className: `${linkCls} ${activeCls}` }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/about"
            className={linkCls}
            activeProps={{ className: `${linkCls} ${activeCls}` }}
          >
            {t("nav.about")}
          </Link>
          <Link
            to="/modes"
            className={linkCls}
            activeProps={{ className: `${linkCls} ${activeCls}` }}
          >
            {t("nav.modes")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSelector />
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
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={mobileLinkCls}
                onClick={close}
                activeProps={{ className: `${mobileLinkCls} ${activeCls}` }}
              >
                {l.label}
              </Link>
            ))}
            <Link
              to="/about"
              className={mobileLinkCls}
              onClick={close}
              activeProps={{ className: `${mobileLinkCls} ${activeCls}` }}
            >
              {t("nav.about")}
            </Link>
            <Link
              to="/modes"
              className={mobileLinkCls}
              onClick={close}
              activeProps={{ className: `${mobileLinkCls} ${activeCls}` }}
            >
              {t("nav.modes")}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
