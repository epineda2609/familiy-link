import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  ShieldCheck,
  LogOut,
  UserCog,
  Lock,
  AlertTriangle,
  LayoutDashboard,
  GitCompareArrows,
  ScrollText,
} from "lucide-react";
import { DemoBanner } from "../components/DemoBanner";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { useT } from "../i18n/LocaleProvider";
import {
  useInstitutionalSession,
  type InstitutionalRole,
} from "../auth/InstitutionalSession";
import type { MessageKey } from "../i18n/messages";

export const Route = createFileRoute("/institutional")({
  head: () => ({
    meta: [
      { title: "Panel institucional — BASUF" },
      {
        name: "description",
        content:
          "Panel restringido para organizaciones aliadas verificadas. Acceso a casos, coincidencias y datos sensibles.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: InstitutionalLayout,
});

const roles: InstitutionalRole[] = ["admin", "reviewer", "viewer"];

function InstitutionalLayout() {
  const { session } = useInstitutionalSession();
  if (!session) return <SignInGate />;
  return <Shell />;
}

function SignInGate() {
  const { t } = useT();
  const { signIn } = useInstitutionalSession();
  const [orgName, setOrgName] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [role, setRole] = useState<InstitutionalRole>("reviewer");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !operatorName.trim()) return;
    signIn({ orgName: orgName.trim(), operatorName: operatorName.trim(), role });
  };

  return (
    <div className="min-h-screen bg-background">
      <DemoBanner />
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-14">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
              <Lock className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-bold">{t("inst.login.title")}</h1>
              <p className="text-xs text-muted-foreground">{t("inst.title")}</p>
            </div>
          </div>

          <div className="mb-5 flex items-start gap-2 rounded-md border border-urgent/40 bg-urgent/10 p-3">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-urgent-foreground"
              aria-hidden
            />
            <p className="text-xs text-muted-foreground">{t("inst.login.desc")}</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="org">
                {t("inst.login.org")}
              </label>
              <input
                id="org"
                type="text"
                required
                placeholder={t("inst.login.orgPh")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="op">
                {t("inst.login.operator")}
              </label>
              <input
                id="op"
                type="text"
                required
                placeholder={t("inst.login.operatorPh")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="role">
                {t("inst.login.role")}
              </label>
              <select
                id="role"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={role}
                onChange={(e) => setRole(e.target.value as InstitutionalRole)}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {t(`inst.role.${r}` as MessageKey)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden />
              {t("inst.login.submit")}
            </button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Shell() {
  const { t } = useT();
  const { session, signOut } = useInstitutionalSession();

  const tabCls =
    "inline-flex items-center gap-1.5 rounded-md border border-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-accent";
  const activeTabCls = "border-border bg-card text-foreground shadow-sm";

  return (
    <div className="min-h-screen bg-background">
      <DemoBanner />
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
              <UserCog className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("inst.signedInAs")}
              </p>
              <p className="text-sm font-semibold">
                {session?.operatorName} · {session?.orgName}
              </p>
              <p className="text-xs text-muted-foreground">
                {t(`inst.role.${session!.role}` as MessageKey)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium transition hover:bg-accent"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {t("inst.signOut")}
          </button>
        </div>

        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("inst.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("inst.subtitle")}</p>
        </header>

        <nav className="mb-6 flex flex-wrap gap-1" aria-label="Secciones institucionales">
          <Link
            to="/institutional"
            className={tabCls}
            activeProps={{ className: `${tabCls} ${activeTabCls}` }}
            activeOptions={{ exact: true }}
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden />
            {t("inst.tab.cases")}
          </Link>
          <Link
            to="/institutional/matches"
            className={tabCls}
            activeProps={{ className: `${tabCls} ${activeTabCls}` }}
          >
            <GitCompareArrows className="h-4 w-4" aria-hidden />
            {t("inst.tab.matches")}
          </Link>
        </nav>

        <Outlet />
      </main>

      <SiteFooter />
    </div>
  );
}
