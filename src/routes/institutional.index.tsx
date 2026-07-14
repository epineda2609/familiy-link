import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ShieldCheck,
  LogOut,
  UserCog,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { DemoBanner } from "../components/DemoBanner";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { useT } from "../i18n/LocaleProvider";
import {
  useInstitutionalSession,
  type InstitutionalRole,
} from "../auth/InstitutionalSession";
import {
  institutionalRepository,
  type InstitutionalCase,
} from "../repositories/InstitutionalRepository";
import { peopleRepository } from "../repositories/PeopleRepository";
import type { Disaster, PersonStatus } from "../domain/types";
import type { MessageKey } from "../i18n/messages";

export const Route = createFileRoute("/institutional/")({
  head: () => ({
    meta: [
      { title: "Panel institucional — BASUF" },
      {
        name: "description",
        content:
          "Panel restringido para organizaciones aliadas verificadas. Acceso a casos y datos sensibles.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: InstitutionalPage,
});

const roles: InstitutionalRole[] = ["admin", "reviewer", "viewer"];
const statuses: PersonStatus[] = ["missing", "searching", "found", "reunited"];

const statusPill: Record<PersonStatus, string> = {
  missing: "bg-destructive/10 text-destructive border-destructive/30",
  searching: "bg-urgent/20 text-urgent-foreground border-urgent/40",
  found: "bg-primary/10 text-primary border-primary/30",
  reunited: "bg-hope/20 text-hope-foreground border-hope/40",
};

function InstitutionalPage() {
  const { session } = useInstitutionalSession();
  if (!session) return <SignInGate />;
  return <Dashboard />;
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
            <p className="text-xs text-muted-foreground">
              {t("inst.login.desc")}
            </p>
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

function Dashboard() {
  const { t } = useT();
  const { session, signOut } = useInstitutionalSession();
  const [cases, setCases] = useState<InstitutionalCase[]>([]);
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [statusFilter, setStatusFilter] = useState<PersonStatus | "">("");

  const canEdit = session?.role === "admin" || session?.role === "reviewer";

  const refresh = () =>
    institutionalRepository.listAll().then(setCases);

  useEffect(() => {
    refresh();
    peopleRepository.listDisasters().then(setDisasters);
  }, []);

  const disasterName = (id: string) =>
    disasters.find((d) => d.id === id)?.name ?? id;

  const stats = useMemo(() => {
    const total = cases.length;
    const missing = cases.filter((c) => c.status === "missing").length;
    const searching = cases.filter((c) => c.status === "searching").length;
    const reunited = cases.filter((c) => c.status === "reunited").length;
    const pending = cases.filter((c) => c.sensitive && !c.sensitive.verified).length;
    return { total, missing, searching, reunited, pending };
  }, [cases]);

  const filtered = statusFilter
    ? cases.filter((c) => c.status === statusFilter)
    : cases;

  const changeStatus = async (id: string, next: PersonStatus) => {
    await institutionalRepository.updateStatus(id, next);
    refresh();
  };
  const toggleVerified = async (c: InstitutionalCase) => {
    if (!c.sensitive) return;
    await institutionalRepository.setVerified(c.id, !c.sensitive.verified);
    refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      <DemoBanner />
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Session bar */}
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

        {/* Stats */}
        <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label={t("inst.stats.total")} value={stats.total} tone="default" />
          <StatCard
            label={t("inst.stats.missing")}
            value={stats.missing}
            tone="destructive"
          />
          <StatCard
            label={t("inst.stats.searching")}
            value={stats.searching}
            tone="urgent"
          />
          <StatCard
            label={t("inst.stats.reunited")}
            value={stats.reunited}
            tone="hope"
          />
          <StatCard
            label={t("inst.stats.pending")}
            value={stats.pending}
            tone="urgent"
          />
        </section>

        {/* Filter */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{t("inst.cases.title")}</h2>
          <div className="flex items-center gap-2">
            <label
              htmlFor="status-filter"
              className="text-xs font-medium text-muted-foreground"
            >
              {t("inst.cases.filter")}
            </label>
            <select
              id="status-filter"
              className="rounded-md border border-input bg-card px-2 py-1 text-sm"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as PersonStatus | "")
              }
            >
              <option value="">{t("inst.cases.all")}</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {t(`status.${s}` as MessageKey)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!canEdit && (
          <p className="mb-4 rounded-md border border-urgent/40 bg-urgent/10 px-3 py-2 text-xs text-muted-foreground">
            {t("inst.readonly.notice")}
          </p>
        )}

        {/* Cases table */}
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">{t("inst.col.person")}</th>
                <th className="px-4 py-3 font-medium">{t("inst.col.status")}</th>
                <th className="px-4 py-3 font-medium">{t("inst.col.disaster")}</th>
                <th className="px-4 py-3 font-medium">{t("inst.col.reporter")}</th>
                <th className="px-4 py-3 font-medium">{t("inst.col.verified")}</th>
                <th className="px-4 py-3 font-medium">{t("inst.col.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.displayName}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.approximateAge ? `~${c.approximateAge} · ` : ""}
                      {c.country}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <select
                        value={c.status}
                        onChange={(e) =>
                          changeStatus(c.id, e.target.value as PersonStatus)
                        }
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusPill[c.status]}`}
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {t(`status.${s}` as MessageKey)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusPill[c.status]}`}
                      >
                        {t(`status.${c.status}` as MessageKey)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {disasterName(c.disasterId)}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {c.sensitive ? (
                      <>
                        <div className="font-medium text-foreground">
                          {c.sensitive.reporterName}
                        </div>
                        <div className="text-muted-foreground">
                          {c.sensitive.reporterContact}
                        </div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {c.sensitive ? (
                      c.sensitive.verified ? (
                        <span className="inline-flex items-center gap-1 text-hope-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                          {t("inst.verified.yes")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-urgent-foreground">
                          <XCircle className="h-3.5 w-3.5" aria-hidden />
                          {t("inst.verified.no")}
                        </span>
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to="/person/$id"
                        params={{ id: c.id }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        {t("inst.action.viewPublic")}
                      </Link>
                      {canEdit && c.sensitive && (
                        <button
                          type="button"
                          onClick={() => toggleVerified(c)}
                          className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs font-medium transition hover:bg-accent"
                        >
                          {c.sensitive.verified
                            ? t("inst.action.unverify")
                            : t("inst.action.verify")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "destructive" | "urgent" | "hope";
}) {
  const toneCls: Record<typeof tone, string> = {
    default: "text-primary",
    destructive: "text-destructive",
    urgent: "text-urgent-foreground",
    hope: "text-hope-foreground",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-bold ${toneCls[tone]}`}>{value}</p>
    </div>
  );
}
