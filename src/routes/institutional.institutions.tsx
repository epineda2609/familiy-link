import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Plus,
  X,
  ShieldCheck,
  Ban,
  RotateCcw,
  Archive,
  UserPlus,
  Search,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { useInstitutionalSession } from "../auth/InstitutionalSession";
import {
  institutionsRepository,
  DuplicateInstitutionError,
  DuplicateMembershipError,
  type CreateInstitutionInput,
} from "../repositories/InstitutionsRepository";
import {
  verificationLevel,
  type Institution,
  type InstitutionStatus,
  type InstitutionType,
  type MembershipRole,
} from "../domain/institutions";
import { auditLog } from "../audit/auditLog";
import { toast } from "../components/Toast";
import { T } from "../i18n/T";
import { useT } from "../i18n/LocaleProvider";
import type { MessageKey } from "../i18n/messages";

export const Route = createFileRoute("/institutional/institutions")({
  head: () => ({
    meta: [
      { title: "Instituciones — Panel BASUF" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: InstitutionsAdminPage,
});

const STATUS_TONE: Record<InstitutionStatus, string> = {
  pending: "bg-urgent/20 text-urgent-foreground border-urgent/40",
  approved: "bg-hope/20 text-hope-foreground border-hope/40",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  suspended: "bg-urgent/20 text-urgent-foreground border-urgent/40",
  archived: "bg-muted text-muted-foreground border-border",
  reference: "bg-primary/10 text-primary border-primary/30",
};

const TYPES: InstitutionType[] = [
  "un_agency",
  "red_cross",
  "civil_protection",
  "fire",
  "usar",
  "hospital",
  "forensic",
  "shelter",
  "humanitarian",
  "child_protection",
  "migration",
  "government",
  "other",
];

const STATUSES: InstitutionStatus[] = [
  "pending",
  "approved",
  "rejected",
  "suspended",
  "archived",
  "reference",
];

const TYPE_KEYS: Record<InstitutionType, MessageKey> = {
  un_agency: "audit.institutionTypes.unAgency",
  red_cross: "audit.institutionTypes.redCross",
  civil_protection: "audit.institutionTypes.civilProtection",
  fire: "audit.institutionTypes.fire",
  usar: "audit.institutionTypes.usar",
  hospital: "audit.institutionTypes.hospital",
  forensic: "audit.institutionTypes.forensic",
  shelter: "audit.institutionTypes.shelter",
  humanitarian: "audit.institutionTypes.humanitarian",
  child_protection: "audit.institutionTypes.childProtection",
  migration: "audit.institutionTypes.migration",
  government: "audit.institutionTypes.government",
  other: "audit.institutionTypes.other",
};

const STATUS_KEYS: Record<InstitutionStatus, MessageKey> = {
  pending: "audit.institutionStatus.pending",
  approved: "audit.institutionStatus.approved",
  rejected: "audit.institutionStatus.rejected",
  suspended: "audit.institutionStatus.suspended",
  archived: "audit.institutionStatus.archived",
  reference: "audit.institutionStatus.reference",
};

function InstitutionsAdminPage() {
  const { t } = useT();
  const { session } = useInstitutionalSession();
  const isAdmin = session?.role === "admin";

  const [tick, setTick] = useState(0);
  useEffect(() => institutionsRepository.subscribe(() => setTick((v) => v + 1)), []);

  const [statusFilter, setStatusFilter] = useState<InstitutionStatus | "">("");
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<InstitutionType | "">("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const [createOpen, setCreateOpen] = useState(false);
  const [inviteFor, setInviteFor] = useState<Institution | null>(null);
  const [viewing, setViewing] = useState<Institution | null>(null);
  // biome/lint: intentional dependency on tick to refresh from store
  const list = useMemo(
    () =>
      institutionsRepository.list({
        status: statusFilter || undefined,
        country: countryFilter || undefined,
        institutionType: typeFilter || undefined,
        q,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statusFilter, countryFilter, typeFilter, q, tick],
  );
  const stats = useMemo(() => institutionsRepository.stats(), [tick]);

  const countries = useMemo(() => {
    const s = new Set(institutionsRepository.list().map((i) => i.country));
    return Array.from(s).sort((a, b) => a.localeCompare(b, "es"));
  }, [tick]);

  const paged = list.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6">
        <p className="text-sm font-medium text-destructive">
          <T k="audit.routes.institutionalInstitutions.seccionRestringidaSoloParaAdministradoresBASUF" />
        </p>
        <Link
          to="/institutional"
          className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
        >
          <T k="audit.routes.institutionalInstitutions.volverAlPanel" />
        </Link>
      </div>
    );
  }

  const actor = {
    operatorName: session!.operatorName,
    orgName: session!.orgName,
    role: session!.role,
  };

  const changeStatus = (inst: Institution, next: InstitutionStatus, note?: string) => {
    institutionsRepository.updateStatus(inst.id, next, actor.operatorName, note);
    const action =
      next === "approved"
        ? "institution.approve"
        : next === "rejected"
          ? "institution.reject"
          : next === "suspended"
            ? "institution.suspend"
            : next === "archived"
              ? "institution.archive"
              : "institution.reactivate";
    auditLog.record({
      actor,
      action: action as
        | "institution.approve"
        | "institution.reject"
        | "institution.suspend"
        | "institution.archive"
        | "institution.reactivate",
      targetId: inst.id,
      targetLabel: inst.name,
      metadata: { note },
    });
    toast.success(
      t("audit.institutions.statusChangedToast", { status: t(STATUS_KEYS[next]) }),
      inst.name,
    );
  };

  return (
    <>
      {/* Indicadores */}
      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MiniStat label={t("audit.institutions.approvedStat")} value={stats.approved} tone="hope" />
        <MiniStat label={t("audit.institutions.pendingStat")} value={stats.pending} tone="urgent" />
        <MiniStat
          label={t("audit.institutions.suspendedStat")}
          value={stats.suspended}
          tone="urgent"
        />
        <MiniStat
          label={t("audit.institutions.activeUsersStat")}
          value={stats.activeUsers}
          tone="primary"
        />
        <MiniStat
          label={t("audit.institutions.countriesStat")}
          value={stats.countries}
          tone="default"
        />
      </section>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            <T k="audit.routes.institutionalInstitutions.instituciones" />
          </h2>
          <p className="text-xs text-muted-foreground">
            <T k="audit.routes.institutionalInstitutions.registroAprobacionYMembresiasSoloInstitucionesAprobadas" />
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" aria-hidden />
          <T k="audit.routes.institutionalInstitutions.nuevaInstitucion" />
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            placeholder={t("audit.institutions.searchPlaceholder")}
            className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-sm"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as InstitutionStatus | "");
            setPage(0);
          }}
          className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        >
          <option value="">
            <T k="audit.routes.institutionalInstitutions.todosLosEstados" />
          </option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(STATUS_KEYS[s])}
            </option>
          ))}
        </select>
        <select
          value={countryFilter}
          onChange={(e) => {
            setCountryFilter(e.target.value);
            setPage(0);
          }}
          className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        >
          <option value="">
            <T k="audit.routes.institutionalInstitutions.todosLosPaises" />
          </option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as InstitutionType | "");
            setPage(0);
          }}
          className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        >
          <option value="">
            <T k="audit.routes.institutionalInstitutions.todosLosTipos" />
          </option>
          {TYPES.map((tp) => (
            <option key={tp} value={tp}>
              {t(TYPE_KEYS[tp])}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">
                <T k="audit.routes.institutionalInstitutions.nombre" />
              </th>
              <th className="px-4 py-3 font-medium">
                <T k="audit.routes.institutionalInstitutions.sigla" />
              </th>
              <th className="px-4 py-3 font-medium">
                <T k="audit.routes.institutionalInstitutions.pais" />
              </th>
              <th className="px-4 py-3 font-medium">
                <T k="audit.routes.institutionalInstitutions.tipo" />
              </th>
              <th className="px-4 py-3 font-medium">
                <T k="audit.routes.institutionalInstitutions.estado" />
              </th>
              <th className="px-4 py-3 font-medium">
                <T k="audit.routes.institutionalInstitutions.usuarios" />
              </th>
              <th className="px-4 py-3 font-medium">
                <T k="audit.routes.institutionalInstitutions.solicitud" />
              </th>
              <th className="px-4 py-3 font-medium">
                <T k="audit.routes.institutionalInstitutions.aprobacion" />
              </th>
              <th className="px-4 py-3 font-medium">
                <T k="audit.routes.institutionalInstitutions.acciones" />
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.map((i) => (
              <tr key={i.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 font-medium">
                    {i.name}
                    {i.status === "approved" && (
                      <span
                        title={t("audit.institutions.verifiedTitle")}
                        className="inline-flex items-center gap-1 rounded-full border border-hope/40 bg-hope/20 px-1.5 py-0.5 text-[10px] font-semibold text-hope-foreground"
                      >
                        <ShieldCheck className="h-3 w-3" aria-hidden />
                        <T k="audit.routes.institutionalInstitutions.verificada" />
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {verificationLevel(i) === "complete"
                      ? t("audit.institutions.verificationComplete")
                      : verificationLevel(i) === "intermediate"
                        ? t("audit.institutions.verificationIntermediate")
                        : t("audit.institutions.verificationBasic")}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">{i.acronym ?? "—"}</td>
                <td className="px-4 py-3 text-xs">{i.country}</td>
                <td className="px-4 py-3 text-xs">{t(TYPE_KEYS[i.institutionType])}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_TONE[i.status]}`}
                  >
                    {t(STATUS_KEYS[i.status])}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">{institutionsRepository.countUsers(i.id)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {i.requestedAt.slice(0, 10)}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {i.approvedAt?.slice(0, 10) ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setViewing(i)}
                      className="rounded-md border border-input px-2 py-1 text-xs font-medium hover:bg-accent"
                    >
                      <T k="audit.routes.institutionalInstitutions.ver" />
                    </button>
                    {(i.status === "pending" ||
                      i.status === "reference" ||
                      i.status === "rejected") && (
                      <button
                        type="button"
                        onClick={() => {
                          const note = window.prompt(
                            t("audit.institutions.approvePrompt", { institution: i.name }),
                            "",
                          );
                          if (note === null) return;
                          changeStatus(i, "approved", note);
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-hope/20 px-2 py-1 text-xs font-semibold text-hope-foreground hover:bg-hope/30"
                      >
                        <ShieldCheck className="h-3 w-3" aria-hidden />
                        <T k="audit.routes.institutionalInstitutions.aprobar" />
                      </button>
                    )}
                    {i.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => changeStatus(i, "rejected")}
                        className="inline-flex items-center gap-1 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/20"
                      >
                        <X className="h-3 w-3" aria-hidden />
                        <T k="audit.routes.institutionalInstitutions.rechazar" />
                      </button>
                    )}
                    {i.status === "approved" && (
                      <>
                        <button
                          type="button"
                          onClick={() => setInviteFor(i)}
                          className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs font-medium hover:bg-accent"
                        >
                          <UserPlus className="h-3 w-3" aria-hidden />
                          <T k="audit.routes.institutionalInstitutions.invitar" />
                        </button>
                        <button
                          type="button"
                          onClick={() => changeStatus(i, "suspended")}
                          className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs font-medium hover:bg-accent"
                        >
                          <Ban className="h-3 w-3" aria-hidden />
                          <T k="audit.routes.institutionalInstitutions.suspender" />
                        </button>
                      </>
                    )}
                    {i.status === "suspended" && (
                      <button
                        type="button"
                        onClick={() => changeStatus(i, "approved")}
                        className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs font-medium hover:bg-accent"
                      >
                        <RotateCcw className="h-3 w-3" aria-hidden />
                        <T k="audit.routes.institutionalInstitutions.reactivar" />
                      </button>
                    )}
                    {(i.status === "rejected" || i.status === "suspended") && (
                      <button
                        type="button"
                        onClick={() => changeStatus(i, "archived")}
                        className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs font-medium hover:bg-accent"
                      >
                        <Archive className="h-3 w-3" aria-hidden />
                        <T k="audit.routes.institutionalInstitutions.archivar" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  <T k="audit.routes.institutionalInstitutions.sinResultadosConLosFiltrosActuales" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2 text-xs">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-md border border-input px-2 py-1 disabled:opacity-50"
          >
            <T k="audit.routes.institutionalInstitutions.anterior" />
          </button>
          <span className="text-muted-foreground">
            <T k="audit.routes.institutionalInstitutions.pagina" />
            {page + 1} <T k="audit.routes.institutionalInstitutions.de" />
            {totalPages}
          </span>
          <button
            type="button"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-input px-2 py-1 disabled:opacity-50"
          >
            <T k="audit.routes.institutionalInstitutions.siguiente" />
          </button>
        </div>
      )}

      {createOpen && (
        <CreateInstitutionModal
          onClose={() => setCreateOpen(false)}
          operator={actor.operatorName}
          onCreated={(inst) => {
            auditLog.record({
              actor,
              action: "institution.create",
              targetId: inst.id,
              targetLabel: inst.name,
              metadata: { country: inst.country, type: inst.institutionType },
            });
            toast.success(t("audit.institutions.registeredToast"), inst.name);
            setCreateOpen(false);
          }}
        />
      )}
      {inviteFor && (
        <InviteUserModal
          institution={inviteFor}
          operator={actor.operatorName}
          onClose={() => setInviteFor(null)}
          onInvited={(m) => {
            auditLog.record({
              actor,
              action: "institution.invite",
              targetId: m.id,
              targetLabel: `${m.userName} · ${inviteFor.name}`,
              metadata: { role: m.institutionalRole, email: m.userEmail },
            });
            toast.success(t("audit.institutions.invitationToast"), m.userEmail);
          }}
        />
      )}
      {viewing && <ViewInstitutionModal institution={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "hope" | "urgent" | "primary" | "default";
}) {
  const toneCls: Record<string, string> = {
    hope: "border-hope/40 bg-hope/10 text-hope-foreground",
    urgent: "border-urgent/40 bg-urgent/10 text-urgent-foreground",
    primary: "border-primary/30 bg-primary/5 text-primary",
    default: "border-border bg-card text-foreground",
  };
  return (
    <div className={`rounded-xl border p-4 ${toneCls[tone]}`}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

// ============ MODALES ============

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { t } = useT();
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={t("audit.common.close")}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CreateInstitutionModal({
  onClose,
  onCreated,
  operator,
}: {
  onClose: () => void;
  onCreated: (i: Institution) => void;
  operator: string;
}) {
  const { t } = useT();
  const [form, setForm] = useState<CreateInstitutionInput>({
    name: "",
    acronym: "",
    country: "",
    institutionType: "humanitarian",
    officialEmail: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    registrationNumber: "",
    address: "",
    description: "",
    verificationNotes: "",
    createdByOperator: operator,
  });
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof CreateInstitutionInput>(k: K, v: CreateInstitutionInput[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const inst = institutionsRepository.create(form);
      onCreated(inst);
    } catch (err) {
      if (err instanceof DuplicateInstitutionError) {
        setError(t("audit.institutions.duplicateError"));
      } else {
        setError(t("audit.institutions.requiredError"));
      }
    }
  };

  return (
    <ModalShell title={t("audit.institutions.newTitle")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("audit.institutions.officialNameLabel")}>
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("audit.institutions.acronymLabel")}>
            <input
              value={form.acronym ?? ""}
              onChange={(e) => set("acronym", e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("audit.institutions.countryLabel")}>
            <input
              required
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("audit.institutions.typeLabel")}>
            <select
              value={form.institutionType}
              onChange={(e) => set("institutionType", e.target.value as InstitutionType)}
              className="input"
            >
              {TYPES.map((tp) => (
                <option key={tp} value={tp}>
                  {t(TYPE_KEYS[tp])}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("audit.institutions.officialEmailLabel")}>
            <input
              required
              type="email"
              value={form.officialEmail}
              onChange={(e) => set("officialEmail", e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("audit.institutions.contactNameLabel")}>
            <input
              value={form.contactName ?? ""}
              onChange={(e) => set("contactName", e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("audit.institutions.contactEmailLabel")}>
            <input
              type="email"
              value={form.contactEmail ?? ""}
              onChange={(e) => set("contactEmail", e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("audit.institutions.phoneLabel")}>
            <input
              value={form.contactPhone ?? ""}
              onChange={(e) => set("contactPhone", e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("audit.institutions.websiteLabel")}>
            <input
              type="url"
              value={form.website ?? ""}
              onChange={(e) => set("website", e.target.value)}
              className="input"
            />
          </Field>
          <Field label={t("audit.institutions.registrationLabel")}>
            <input
              value={form.registrationNumber ?? ""}
              onChange={(e) => set("registrationNumber", e.target.value)}
              className="input"
            />
          </Field>
        </div>
        <Field label={t("audit.institutions.addressLabel")}>
          <input
            value={form.address ?? ""}
            onChange={(e) => set("address", e.target.value)}
            className="input"
          />
        </Field>
        <Field label={t("audit.institutions.descriptionLabel")}>
          <textarea
            rows={2}
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            className="input"
          />
        </Field>
        <Field label={t("audit.institutions.notesLabel")}>
          <textarea
            rows={2}
            value={form.verificationNotes ?? ""}
            onChange={(e) => set("verificationNotes", e.target.value)}
            className="input"
          />
        </Field>

        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            <T k="audit.routes.institutionalInstitutions.cancelar" />
          </button>
          <button
            type="submit"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <T k="audit.routes.institutionalInstitutions.registrarNbsp" />
          </button>
        </div>
        <style>{`.input{width:100%;border:1px solid hsl(var(--input));background:hsl(var(--background));border-radius:0.375rem;padding:0.375rem 0.5rem;font-size:0.875rem;}`}</style>
      </form>
    </ModalShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function InviteUserModal({
  institution,
  operator,
  onClose,
  onInvited,
}: {
  institution: Institution;
  operator: string;
  onClose: () => void;
  onInvited: (m: ReturnType<typeof institutionsRepository.inviteUser>) => void;
}) {
  const { t } = useT();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [role, setRole] = useState<MembershipRole>("reviewer");
  const [invited, setInvited] = useState<ReturnType<
    typeof institutionsRepository.inviteUser
  > | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const m = institutionsRepository.inviteUser({
        institutionId: institution.id,
        userName,
        userEmail,
        institutionalRole: role,
        invitedByOperator: operator,
      });
      setInvited(m);
      onInvited(m);
    } catch (err) {
      if (err instanceof DuplicateMembershipError) {
        setError(t("audit.institutions.membershipDuplicateError"));
      } else {
        setError(t("audit.institutions.requiredError"));
      }
    }
  };

  const link = invited
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/institutional/accept-invite?token=${invited.inviteToken}`
    : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <ModalShell
      title={t("audit.institutions.inviteTitle", { institution: institution.name })}
      onClose={onClose}
    >
      {!invited ? (
        <form onSubmit={submit} className="space-y-3 text-sm">
          <Field label={t("audit.institutions.nameRequiredLabel")}>
            <input
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label={t("audit.institutions.emailRequiredLabel")}>
            <input
              required
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label={t("audit.institutions.roleRequiredLabel")}>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as MembershipRole)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="reviewer">
                <T k="audit.routes.institutionalInstitutions.revisor" />
              </option>
              <option value="viewer">
                <T k="audit.routes.institutionalInstitutions.consulta" />
              </option>
            </select>
          </Field>
          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
            >
              <T k="audit.routes.institutionalInstitutions.cancelar" />
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <T k="audit.routes.institutionalInstitutions.generarInvitacion" />
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3 text-sm">
          <p className="rounded-md border border-hope/40 bg-hope/10 px-3 py-2 text-xs text-hope-foreground">
            <T k="audit.routes.institutionalInstitutions.invitacionCreadaPara" />
            <strong>{invited.userEmail}</strong>{" "}
            <T k="audit.routes.institutionalInstitutions.como" />{" "}
            <strong>
              {t(
                invited.institutionalRole === "reviewer"
                  ? "audit.roles.reviewer"
                  : "audit.roles.viewer",
              )}
            </strong>
            .
          </p>
          <Field label={t("audit.institutions.invitationLinkLabel")}>
            <input
              readOnly
              value={link}
              className="w-full rounded-md border border-input bg-muted/40 px-3 py-2 text-xs font-mono"
              onFocus={(e) => e.currentTarget.select()}
            />
          </Field>
          <p className="text-[11px] text-muted-foreground">
            <T k="audit.routes.institutionalInstitutions.comparteEsteEnlacePorUnCanalSeguro" />
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm font-medium hover:bg-accent"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-hope-foreground" aria-hidden />
                  <T k="audit.routes.institutionalInstitutions.copiado" />
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden />
                  <T k="audit.routes.institutionalInstitutions.copiarEnlaceDeInvitacion" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <T k="audit.routes.institutionalInstitutions.cerrar" />
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function ViewInstitutionModal({
  institution,
  onClose,
}: {
  institution: Institution;
  onClose: () => void;
}) {
  const { t } = useT();
  const members = institutionsRepository.listMemberships(institution.id);
  const level = verificationLevel(institution);
  return (
    <ModalShell title={institution.name} onClose={onClose}>
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_TONE[institution.status]}`}
          >
            {t(STATUS_KEYS[institution.status])}
          </span>
          {institution.status === "approved" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-hope/40 bg-hope/20 px-2 py-0.5 text-[11px] font-semibold text-hope-foreground">
              <ShieldCheck className="h-3 w-3" aria-hidden />
              <T k="audit.routes.institutionalInstitutions.verificadaPorBASUF" />
            </span>
          )}
          <span className="rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] font-semibold text-primary">
            <T k="audit.routes.institutionalInstitutions.verificacion" />
            {level === "complete"
              ? t("audit.institutions.verificationComplete")
              : level === "intermediate"
                ? t("audit.institutions.verificationIntermediate")
                : t("audit.institutions.verificationBasic")}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-3">
          <Row k={t("audit.institutions.acronymLabel")} v={institution.acronym ?? "—"} />
          <Row k={t("audit.routes.institutionalInstitutions.pais")} v={institution.country} />
          <Row
            k={t("audit.routes.institutionalInstitutions.tipo")}
            v={t(TYPE_KEYS[institution.institutionType])}
          />
          <Row k={t("audit.institutional.emailLabel")} v={institution.officialEmail} />
          <Row k={t("audit.institutions.contactLabel")} v={institution.contactName ?? "—"} />
          <Row
            k={t("audit.institutions.contactEmailShortLabel")}
            v={institution.contactEmail ?? "—"}
          />
          <Row k={t("audit.institutions.phoneLabel")} v={institution.contactPhone ?? "—"} />
          <Row k={t("audit.institutions.websiteLabel")} v={institution.website ?? "—"} />
          <Row
            k={t("audit.institutions.legalRegistrationLabel")}
            v={institution.registrationNumber ?? "—"}
          />
          <Row k={t("audit.institutions.addressLabel")} v={institution.address ?? "—"} />
          <Row
            k={t("audit.institutions.requestDateLabel")}
            v={institution.requestedAt.slice(0, 10)}
          />
          <Row
            k={t("audit.institutions.approvalDateLabel")}
            v={institution.approvedAt?.slice(0, 10) ?? "—"}
          />
        </dl>
        {institution.description && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <T k="audit.routes.institutionalInstitutions.descripcion" />
            </p>
            <p className="mt-1 text-sm">{institution.description}</p>
          </div>
        )}
        {institution.verificationNotes && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <T k="audit.routes.institutionalInstitutions.notasDeVerificacion" />
            </p>
            <p className="mt-1 text-sm">{institution.verificationNotes}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <T k="audit.routes.institutionalInstitutions.usuariosVinculados" />
            {members.length})
          </p>
          {members.length === 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              <T k="audit.routes.institutionalInstitutions.sinUsuariosAun" />
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs"
                >
                  <span>
                    <span className="font-medium">{m.userName}</span> ·{" "}
                    <span className="font-mono text-muted-foreground">{m.userEmail}</span>
                  </span>
                  <span className="rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {t(
                      m.institutionalRole === "reviewer"
                        ? "audit.roles.reviewer"
                        : "audit.roles.viewer",
                    )}{" "}
                    · {t(`audit.membershipStatus.${m.status}` as MessageKey)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
          >
            <T k="audit.routes.institutionalInstitutions.cerrar" />
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {k}
      </dt>
      <dd className="text-sm break-words">{v}</dd>
    </div>
  );
}
