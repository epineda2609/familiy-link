import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Radio,
  RefreshCw,
  Power,
  MessageCircle,
  Mail,
  Smartphone,
  Database,
  Send,
  Trash2,
} from "lucide-react";
import { useT } from "../i18n/LocaleProvider";
import { useInstitutionalSession } from "../auth/InstitutionalSession";
import {
  integrations,
  type DispatchChannel,
  type IntegrationDescriptor,
  type IntegrationStatus,
} from "../integrations/simulatedIntegrations";
import {
  useIntegrationLog,
  useIntegrationRegistry,
} from "../integrations/useIntegrations";
import { auditLog } from "../audit/auditLog";
import { toast } from "../components/Toast";
import { EmptyState } from "../components/EmptyState";
import { Inbox } from "lucide-react";
import type { MessageKey } from "../i18n/messages";

export const Route = createFileRoute("/institutional/integrations")({
  head: () => ({
    meta: [
      { title: "Integraciones — Panel BASUF" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: IntegrationsPage,
});

const statusStyles: Record<IntegrationStatus, string> = {
  connected: "bg-hope/20 text-hope-foreground border-hope/40",
  degraded: "bg-urgent/20 text-urgent-foreground border-urgent/40",
  offline: "bg-destructive/10 text-destructive border-destructive/30",
};

const channelIcon = {
  sms: Smartphone,
  whatsapp: MessageCircle,
  email: Mail,
} as const;

function IntegrationsPage() {
  const { t } = useT();
  const { session } = useInstitutionalSession();
  const registry = useIntegrationRegistry();
  const dispatches = useIntegrationLog();
  const canEdit = session?.role === "admin" || session?.role === "reviewer";
  const isAdmin = session?.role === "admin";

  const [testTarget, setTestTarget] = useState("");
  const [testChannel, setTestChannel] = useState<DispatchChannel>("whatsapp");
  const [testMessage, setTestMessage] = useState("");

  const messagingConnectors = useMemo(
    () => registry.filter((r) => r.kind === "messaging"),
    [registry],
  );

  const resync = (r: IntegrationDescriptor) => {
    if (!canEdit || !session) return;
    integrations.resync(r.id);
    auditLog.record({
      actor: {
        operatorName: session.operatorName,
        orgName: session.orgName,
        role: session.role,
      },
      action: "auth.signIn", // reuse generic; specific "integration" action omitted for MVP
      targetId: r.id,
      targetLabel: `Resync ${r.name}`,
    });
    toast.success(t("toast.integration.resync"), r.name);
  };

  const toggle = (r: IntegrationDescriptor) => {
    if (!isAdmin) return;
    integrations.toggle(r.id);
    toast.info(t("toast.integration.toggled"), r.name);
  };

  const sendTest = () => {
    if (!canEdit || !testTarget.trim() || !testMessage.trim()) return;
    const conn = messagingConnectors.find(
      (c) =>
        (c.id === "whatsapp-humanitarian" && testChannel === "whatsapp") ||
        (c.id === "sms-broadcast" && testChannel === "sms") ||
        (c.id === "email-transactional" && testChannel === "email"),
    );
    if (!conn) return;
    integrations.dispatch({
      integrationId: conn.id,
      channel: testChannel,
      recipientLabel: testTarget,
      subject: "Mensaje de prueba",
      body: testMessage,
    });
    toast.success(t("toast.integration.testSent"), testTarget);
    setTestTarget("");
    setTestMessage("");
  };

  return (
    <>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Radio className="h-5 w-5 text-primary" aria-hidden />
            {t("integrations.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("integrations.subtitle")}
          </p>
        </div>
      </header>

      <p className="mb-4 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
        {t("integrations.notice")}
      </p>

      <section className="mb-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {registry.map((r) => {
          const Icon = r.kind === "registry" ? Database : Radio;
          return (
            <article
              key={r.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <header className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-tight">{r.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {r.provider} · {r.region}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyles[r.status]}`}
                >
                  {t(`integrations.status.${r.status}` as MessageKey)}
                </span>
              </header>
              <p className="text-[11px] text-muted-foreground">
                <span className="font-medium">{t("integrations.lastSync")}:</span>{" "}
                {r.lastSyncAt ? new Date(r.lastSyncAt).toLocaleString() : "—"}
              </p>
              {canEdit && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => resync(r)}
                    className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-xs font-medium transition hover:bg-accent"
                  >
                    <RefreshCw className="h-3 w-3" aria-hidden />
                    {t("integrations.action.resync")}
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => toggle(r)}
                      className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-xs font-medium transition hover:bg-accent"
                    >
                      <Power className="h-3 w-3" aria-hidden />
                      {r.status === "offline"
                        ? t("integrations.action.enable")
                        : t("integrations.action.disable")}
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </section>

      {canEdit && (
        <section className="mb-8 rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Send className="h-4 w-4 text-primary" aria-hidden />
            {t("integrations.test.title")}
          </h3>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="tch" className="text-xs font-medium text-muted-foreground">
                {t("integrations.test.channel")}
              </label>
              <select
                id="tch"
                value={testChannel}
                onChange={(e) => setTestChannel(e.target.value as DispatchChannel)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 md:col-span-2">
              <label htmlFor="ttg" className="text-xs font-medium text-muted-foreground">
                {t("integrations.test.recipient")}
              </label>
              <input
                id="ttg"
                type="text"
                placeholder={t("integrations.test.recipient.ph")}
                value={testTarget}
                onChange={(e) => setTestTarget(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1">
            <label htmlFor="tmsg" className="text-xs font-medium text-muted-foreground">
              {t("integrations.test.message")}
            </label>
            <textarea
              id="tmsg"
              rows={2}
              placeholder={t("integrations.test.message.ph")}
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={sendTest}
            disabled={!testTarget.trim() || !testMessage.trim()}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" aria-hidden />
            {t("integrations.test.send")}
          </button>
        </section>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("integrations.log.title")}</h3>
        {isAdmin && dispatches.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(t("integrations.log.clearConfirm")))
                integrations.clearLog();
            }}
            className="inline-flex items-center gap-1 rounded-md border border-destructive/40 bg-destructive/5 px-2 py-1 text-xs font-medium text-destructive transition hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" aria-hidden />
            {t("integrations.log.clear")}
          </button>
        )}
      </div>

      {dispatches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          {t("integrations.log.empty")}
        </div>
      ) : (
        <ul className="space-y-2">
          {dispatches.map((d) => {
            const Icon = channelIcon[d.channel];
            const tone =
              d.status === "sent"
                ? "border-hope/40 bg-hope/10"
                : d.status === "queued"
                  ? "border-urgent/40 bg-urgent/10"
                  : "border-destructive/30 bg-destructive/10";
            return (
              <li
                key={d.id}
                className={`rounded-lg border px-4 py-3 text-sm ${tone}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden />
                    <div>
                      <p className="font-medium">{d.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.recipientLabel} · {d.channel.toUpperCase()}
                      </p>
                      <p className="mt-1 text-xs">{d.body}</p>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-muted-foreground">
                    <div className="font-mono">
                      {new Date(d.timestamp).toLocaleString()}
                    </div>
                    <div className="mt-1 font-semibold uppercase tracking-wide">
                      {t(`integrations.dispatch.${d.status}` as MessageKey)}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
