import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Plus,
  X,
} from "lucide-react";
import { useT } from "../i18n/LocaleProvider";
import { useInstitutionalSession } from "../auth/InstitutionalSession";
import {
  institutionalRepository,
  type InstitutionalCase,
} from "../repositories/InstitutionalRepository";
import {
  peopleRepository,
  DuplicateDisasterError,
  type CreateDisasterInput,
} from "../repositories/PeopleRepository";
import type { Disaster, DisasterType, PersonStatus } from "../domain/types";
import type { MessageKey } from "../i18n/messages";
import { auditLog } from "../audit/auditLog";
import type { AuditActor } from "../audit/auditLog";
import { toast } from "../components/Toast";

export const Route = createFileRoute("/institutional/")({
  head: () => ({
    meta: [
      { title: "Panel institucional — BASUF" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DashboardPage,
});

const statuses: PersonStatus[] = ["missing", "searching", "found", "reunited"];

const statusPill: Record<PersonStatus, string> = {
  missing: "bg-destructive/10 text-destructive border-destructive/30",
  searching: "bg-urgent/20 text-urgent-foreground border-urgent/40",
  found: "bg-primary/10 text-primary border-primary/30",
  reunited: "bg-hope/20 text-hope-foreground border-hope/40",
};

function maskContact(v: string) {
  if (v.includes("@")) {
    const [user, domain] = v.split("@");
    return `${user.slice(0, 2)}•••@${domain}`;
  }
  return v.replace(/.(?=.{3})/g, "•");
}

function DashboardPage() {
  const { t } = useT();
  const { session } = useInstitutionalSession();
  const [cases, setCases] = useState<InstitutionalCase[]>([]);
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [statusFilter, setStatusFilter] = useState<PersonStatus | "">("");
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);

  const canCreateDisaster = session?.role === "admin";
  const refreshDisasters = () =>
    peopleRepository.listDisasters().then(setDisasters);

  const canEdit = session?.role === "admin" || session?.role === "reviewer";
  const actor: AuditActor | null = session
    ? {
        operatorName: session.operatorName,
        orgName: session.orgName,
        role: session.role,
      }
    : null;

  const refresh = () => institutionalRepository.listAll().then(setCases);

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

  const changeStatus = async (c: InstitutionalCase, next: PersonStatus) => {
    if (!actor) return;
    const prev = c.status;
    await institutionalRepository.updateStatus(c.id, next);
    auditLog.record({
      actor,
      action: "case.statusChange",
      targetId: c.id,
      targetLabel: c.displayName,
      metadata: { from: prev, to: next },
    });
    toast.success(
      t("toast.case.statusChanged"),
      `${c.displayName}: ${t(`status.${next}` as MessageKey)}`,
    );
    refresh();
  };
  const toggleVerified = async (c: InstitutionalCase) => {
    if (!c.sensitive || !actor) return;
    const nextVerified = !c.sensitive.verified;
    await institutionalRepository.setVerified(c.id, nextVerified);
    auditLog.record({
      actor,
      action: nextVerified ? "case.verify" : "case.unverify",
      targetId: c.id,
      targetLabel: c.displayName,
    });
    toast.success(
      nextVerified ? t("toast.case.verified") : t("toast.case.unverified"),
      c.displayName,
    );
    refresh();
  };
  const revealSensitive = (c: InstitutionalCase) => {
    if (!actor || !c.sensitive) return;
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(c.id)) {
        next.delete(c.id);
        toast.info(t("toast.sensitive.hidden"), c.displayName);
      } else {
        next.add(c.id);
        auditLog.record({
          actor,
          action: "sensitive.reveal",
          targetId: c.id,
          targetLabel: c.displayName,
        });
        toast.info(t("toast.sensitive.revealed"), c.displayName);
      }
      return next;
    });
  };

  return (
    <>
      <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label={t("inst.stats.total")} value={stats.total} tone="default" />
        <StatCard label={t("inst.stats.missing")} value={stats.missing} tone="destructive" />
        <StatCard label={t("inst.stats.searching")} value={stats.searching} tone="urgent" />
        <StatCard label={t("inst.stats.reunited")} value={stats.reunited} tone="hope" />
        <StatCard label={t("inst.stats.pending")} value={stats.pending} tone="urgent" />
      </section>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("inst.cases.title")}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {canCreateDisaster && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Crear evento
            </button>
          )}
          <label htmlFor="status-filter" className="text-xs font-medium text-muted-foreground">
            {t("inst.cases.filter")}
          </label>
          <select
            id="status-filter"
            className="rounded-md border border-input bg-card px-2 py-1 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PersonStatus | "")}
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

      <p className="mb-4 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
        {t("inst.sensitive.notice")}
      </p>

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
            {filtered.map((c) => {
              const isRevealed = revealed.has(c.id);
              return (
                <tr key={c.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
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
                        onChange={(e) => changeStatus(c, e.target.value as PersonStatus)}
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
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">
                          {c.sensitive.reporterName}
                        </div>
                        <div className="font-mono text-muted-foreground">
                          {isRevealed
                            ? c.sensitive.reporterContact
                            : maskContact(c.sensitive.reporterContact)}
                        </div>
                        {isRevealed && c.sensitive.internalNotes && (
                          <div className="mt-1 rounded-md border border-border bg-muted/30 px-2 py-1 text-[11px] text-muted-foreground">
                            <span className="font-medium text-foreground">
                              {t("inst.sensitive.internalNotes")}:
                            </span>{" "}
                            {c.sensitive.internalNotes}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => revealSensitive(c)}
                          className="mt-1 inline-flex items-center gap-1 rounded-md border border-input bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition hover:bg-accent"
                        >
                          {isRevealed ? (
                            <>
                              <EyeOff className="h-3 w-3" aria-hidden />
                              {t("inst.sensitive.hide")}
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3" aria-hidden />
                              {t("inst.sensitive.reveal")}
                            </>
                          )}
                        </button>
                      </div>
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
              );
            })}
          </tbody>
        </table>
      </div>

      {canCreateDisaster && createOpen && (
        <CreateDisasterModal
          onClose={() => setCreateOpen(false)}
          onCreated={(d) => {
            if (actor) {
              auditLog.record({
                actor,
                action: "disaster.create",
                targetId: d.id,
                targetLabel: d.name,
                metadata: {
                  type: d.type,
                  country: d.country,
                  startedAt: d.startedAt,
                },
              });
            }
            toast.success("Evento creado", d.name);
            refreshDisasters();
            setCreateOpen(false);
          }}
          operatorName={session?.operatorName}
          orgName={session?.orgName}
          countries={Array.from(new Set(disasters.map((d) => d.country))).sort()}
        />
      )}
    </>
  );
}

const disasterTypeOptions: { value: DisasterType; label: string }[] = [
  { value: "earthquake", label: "Sismo" },
  { value: "flood", label: "Inundación" },
  { value: "tsunami", label: "Tsunami" },
  { value: "hurricane", label: "Huracán / ciclón" },
  { value: "storm", label: "Tormenta severa" },
  { value: "landslide", label: "Deslizamiento" },
  { value: "wildfire", label: "Incendio forestal" },
  { value: "volcano", label: "Erupción volcánica" },
  { value: "war", label: "Conflicto armado" },
  { value: "humanitarian", label: "Emergencia humanitaria" },
  { value: "accident", label: "Accidente de gran magnitud" },
  { value: "other", label: "Otro" },
];

function CreateDisasterModal({
  onClose,
  onCreated,
  operatorName,
  orgName,
  countries,
}: {
  onClose: () => void;
  onCreated: (d: Disaster) => void;
  operatorName?: string;
  orgName?: string;
  countries: string[];
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<DisasterType>("earthquake");
  const [customType, setCustomType] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [startedAt, setStartedAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [description, setDescription] = useState("");
  const [magnitude, setMagnitude] = useState("");
  const [affected, setAffected] = useState("");
  const [fatalities, setFatalities] = useState("");
  const [missing, setMissing] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const toNum = (v: string) => {
    if (!v.trim()) return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Requerido";
    if (!type) e.type = "Requerido";
    if (type === "other" && !customType.trim())
      e.customType = "Especifica el tipo";
    if (!country.trim()) e.country = "Requerido";
    if (!region.trim()) e.region = "Requerido";
    if (!startedAt) e.startedAt = "Requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: CreateDisasterInput = {
        name: name.trim(),
        type,
        customType: type === "other" ? customType.trim() : undefined,
        country: country.trim().toUpperCase(),
        region: region.trim(),
        startedAt,
        description: description.trim() || undefined,
        magnitude:
          type === "earthquake" && magnitude.trim() ? magnitude.trim() : undefined,
        affectedEstimate: toNum(affected),
        fatalities: toNum(fatalities),
        missing: toNum(missing),
        createdByOperator: operatorName,
        createdByOrg: orgName,
      };
      const created = await peopleRepository.createDisaster(payload);
      onCreated(created);
    } catch (err) {
      if (err instanceof DuplicateDisasterError) {
        setErrors({
          name: "Ya existe un evento con el mismo nombre, país y fecha.",
        });
      } else {
        toast.error(
          "No se pudo crear el evento",
          err instanceof Error ? err.message : "Error desconocido",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fieldCls =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const labelCls = "text-xs font-medium text-muted-foreground";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crear evento"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="my-10 w-full max-w-2xl rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-bold">Crear evento</h2>
            <p className="text-xs text-muted-foreground">
              Registra una nueva catástrofe. Quedará disponible en Reportar.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition hover:bg-accent"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="ev-name">
                Nombre del evento *
              </label>
              <input
                id="ev-name"
                className={fieldCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Inundaciones en Bolivia 2026"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-destructive">{errors.name}</p>
              )}
            </div>
            <div>
              <label className={labelCls} htmlFor="ev-type">
                Tipo *
              </label>
              <select
                id="ev-type"
                className={fieldCls}
                value={type}
                onChange={(e) => setType(e.target.value as DisasterType)}
              >
                {disasterTypeOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {type === "other" && (
              <div>
                <label className={labelCls} htmlFor="ev-customType">
                  Especifica el tipo *
                </label>
                <input
                  id="ev-customType"
                  className={fieldCls}
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                />
                {errors.customType && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.customType}
                  </p>
                )}
              </div>
            )}
            <div>
              <label className={labelCls} htmlFor="ev-country">
                País *
              </label>
              <input
                id="ev-country"
                list="ev-country-list"
                className={fieldCls}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Ej. BOLIVIA"
              />
              <datalist id="ev-country-list">
                {countries.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              {errors.country && (
                <p className="mt-1 text-xs text-destructive">{errors.country}</p>
              )}
            </div>
            <div>
              <label className={labelCls} htmlFor="ev-region">
                Zona afectada *
              </label>
              <input
                id="ev-region"
                className={fieldCls}
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Provincia, ciudad, área"
              />
              {errors.region && (
                <p className="mt-1 text-xs text-destructive">{errors.region}</p>
              )}
            </div>
            <div>
              <label className={labelCls} htmlFor="ev-date">
                Fecha de inicio *
              </label>
              <input
                id="ev-date"
                type="date"
                className={fieldCls}
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
              />
              {errors.startedAt && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.startedAt}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="ev-desc">
                Descripción breve
              </label>
              <textarea
                id="ev-desc"
                rows={2}
                className={fieldCls}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            {type === "earthquake" && (
              <div className="sm:col-span-2">
                <label className={labelCls} htmlFor="ev-mag">
                  Magnitud
                </label>
                <input
                  id="ev-mag"
                  className={fieldCls}
                  value={magnitude}
                  onChange={(e) => setMagnitude(e.target.value)}
                  placeholder="Ej. 6.8"
                />
              </div>
            )}
            <div>
              <label className={labelCls} htmlFor="ev-aff">
                Personas afectadas (est.)
              </label>
              <input
                id="ev-aff"
                type="number"
                min={0}
                className={fieldCls}
                value={affected}
                onChange={(e) => setAffected(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="ev-fat">
                Fallecidos
              </label>
              <input
                id="ev-fat"
                type="number"
                min={0}
                className={fieldCls}
                value={fatalities}
                onChange={(e) => setFatalities(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="ev-mis">
                Desaparecidos
              </label>
              <input
                id="ev-mis"
                type="number"
                min={0}
                className={fieldCls}
                value={missing}
                onChange={(e) => setMissing(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
            El evento se creará con estado <strong>Activo</strong> y quedará
            disponible en el formulario de Reportar.
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium transition hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {submitting ? "Creando…" : "Crear evento"}
            </button>
          </div>
        </form>
      </div>
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
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${toneCls[tone]}`}>{value}</p>
    </div>
  );
}
