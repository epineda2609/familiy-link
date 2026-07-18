import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Trash2, ScrollText, ClipboardList } from "lucide-react";
import { useT } from "../i18n/LocaleProvider";
import { useInstitutionalSession } from "../auth/InstitutionalSession";
import { auditLog, type AuditAction } from "../audit/auditLog";
import { useAuditLog } from "../audit/useAuditLog";
import { toast } from "../components/Toast";
import { EmptyState } from "../components/EmptyState";
import type { MessageKey } from "../i18n/messages";

export const Route = createFileRoute("/institutional/audit")({
  head: () => ({
    meta: [
      { title: "Auditoría — Panel BASUF" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuditPage,
});

const ACTIONS: AuditAction[] = [
  "auth.signIn",
  "auth.signOut",
  "case.statusChange",
  "case.verify",
  "case.unverify",
  "sensitive.reveal",
  "match.approve",
  "match.reject",
  "match.reset",
  "safeId.view",
  "safeId.scan",
  "safeId.print",
  "safeId.share",
  "safeId.audience.change",
  "evidence.upload",
  "evidence.reveal",
  "disaster.create",
];

const actionTone: Record<AuditAction, string> = {
  "auth.signIn": "bg-primary/10 text-primary border-primary/30",
  "auth.signOut": "bg-muted text-muted-foreground border-border",
  "case.statusChange": "bg-primary/10 text-primary border-primary/30",
  "case.verify": "bg-hope/20 text-hope-foreground border-hope/40",
  "case.unverify": "bg-urgent/20 text-urgent-foreground border-urgent/40",
  "sensitive.reveal": "bg-destructive/10 text-destructive border-destructive/30",
  "match.approve": "bg-hope/20 text-hope-foreground border-hope/40",
  "match.reject": "bg-destructive/10 text-destructive border-destructive/30",
  "match.reset": "bg-muted text-muted-foreground border-border",
  "safeId.view": "bg-primary/10 text-primary border-primary/30",
  "safeId.scan": "bg-primary/10 text-primary border-primary/30",
  "safeId.print": "bg-muted text-muted-foreground border-border",
  "safeId.share": "bg-primary/10 text-primary border-primary/30",
  "safeId.audience.change": "bg-muted text-muted-foreground border-border",
  "evidence.upload": "bg-primary/10 text-primary border-primary/30",
  "evidence.reveal": "bg-destructive/10 text-destructive border-destructive/30",
  "disaster.create": "bg-hope/20 text-hope-foreground border-hope/40",
  "institution.create": "bg-primary/10 text-primary border-primary/30",
  "institution.edit": "bg-muted text-muted-foreground border-border",
  "institution.approve": "bg-hope/20 text-hope-foreground border-hope/40",
  "institution.reject": "bg-destructive/10 text-destructive border-destructive/30",
  "institution.suspend": "bg-urgent/20 text-urgent-foreground border-urgent/40",
  "institution.reactivate": "bg-primary/10 text-primary border-primary/30",
  "institution.archive": "bg-muted text-muted-foreground border-border",
  "institution.invite": "bg-primary/10 text-primary border-primary/30",
  "institution.membership.activate": "bg-hope/20 text-hope-foreground border-hope/40",
  "institution.membership.revoke": "bg-destructive/10 text-destructive border-destructive/30",
};

function AuditPage() {
  const { t } = useT();
  const { session } = useInstitutionalSession();
  const entries = useAuditLog();
  const isAdmin = session?.role === "admin";

  const [actionFilter, setActionFilter] = useState<AuditAction | "">("");
  const [operatorFilter, setOperatorFilter] = useState<string>("");

  const operators = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => set.add(e.actor.operatorName));
    return Array.from(set).sort();
  }, [entries]);

  const filtered = useMemo(
    () =>
      entries.filter(
        (e) =>
          (!actionFilter || e.action === actionFilter) &&
          (!operatorFilter || e.actor.operatorName === operatorFilter),
      ),
    [entries, actionFilter, operatorFilter],
  );

  const download = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `basuf-audit-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("toast.audit.exported"), `${entries.length}`);
  };

  const clear = () => {
    if (!isAdmin) return;
    if (window.confirm(t("audit.clear.confirm"))) {
      auditLog.clear();
      toast.info(t("toast.audit.cleared"));
    }
  };

  return (
    <>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ScrollText className="h-5 w-5 text-primary" aria-hidden />
            {t("audit.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("audit.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={download}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium transition hover:bg-accent"
          >
            <Download className="h-3.5 w-3.5" aria-hidden />
            {t("audit.export")}
          </button>
          <button
            type="button"
            onClick={clear}
            disabled={!isAdmin}
            className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            {t("audit.clear")}
          </button>
        </div>
      </header>

      {!isAdmin && (
        <p className="mb-4 rounded-md border border-urgent/40 bg-urgent/10 px-3 py-2 text-xs text-muted-foreground">
          {t("audit.adminOnly")}
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="afilter" className="text-xs font-medium text-muted-foreground">
            {t("audit.filter.action")}
          </label>
          <select
            id="afilter"
            className="rounded-md border border-input bg-card px-2 py-1 text-sm"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as AuditAction | "")}
          >
            <option value="">{t("audit.filter.all")}</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {t(`audit.action.${a}` as MessageKey)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="ofilter" className="text-xs font-medium text-muted-foreground">
            {t("audit.filter.operator")}
          </label>
          <select
            id="ofilter"
            className="rounded-md border border-input bg-card px-2 py-1 text-sm"
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
          >
            <option value="">{t("audit.filter.all")}</option>
            {operators.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {t("audit.count").replace("{n}", String(filtered.length))}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={t("empty.audit.title")}
          description={t("empty.audit.desc")}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm animate-in fade-in duration-300">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">{t("audit.col.time")}</th>
                <th className="px-4 py-3 font-medium">{t("audit.col.actor")}</th>
                <th className="px-4 py-3 font-medium">{t("audit.col.action")}</th>
                <th className="px-4 py-3 font-medium">{t("audit.col.target")}</th>
                <th className="px-4 py-3 font-medium">{t("audit.col.metadata")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="font-medium text-foreground">
                      {e.actor.operatorName}
                    </div>
                    <div className="text-muted-foreground">
                      {e.actor.orgName} · {e.actor.role}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${actionTone[e.action]}`}
                    >
                      {t(`audit.action.${e.action}` as MessageKey)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {e.targetLabel ? (
                      <div>
                        <div className="font-medium text-foreground">{e.targetLabel}</div>
                        {e.targetId && (
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {e.targetId}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {e.metadata ? (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(e.metadata)
                          .filter(([, v]) => v !== undefined && v !== "")
                          .map(([k, v]) => (
                            <span
                              key={k}
                              className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px]"
                            >
                              <span className="font-medium text-foreground">{k}:</span>{" "}
                              {String(v)}
                            </span>
                          ))}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
