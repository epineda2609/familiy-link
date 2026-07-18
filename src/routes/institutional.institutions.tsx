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
  INSTITUTION_STATUS_LABELS_ES,
  INSTITUTION_TYPE_LABELS_ES,
  verificationLevel,
  type Institution,
  type InstitutionStatus,
  type InstitutionType,
  type MembershipRole,
} from "../domain/institutions";
import { auditLog } from "../audit/auditLog";
import { toast } from "../components/Toast";

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

function InstitutionsAdminPage() {
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
          Sección restringida. Sólo para administradores BASUF.
        </p>
        <Link
          to="/institutional"
          className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
        >
          ← Volver al panel
        </Link>
      </div>
    );
  }

  const actor = {
    operatorName: session!.operatorName,
    orgName: session!.orgName,
    role: session!.role,
  };

  const changeStatus = (
    inst: Institution,
    next: InstitutionStatus,
    label: string,
    note?: string,
  ) => {
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
    toast.success(`Institución ${label}`, inst.name);
  };

  return (
    <>
      {/* Indicadores */}
      <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MiniStat label="Aprobadas" value={stats.approved} tone="hope" />
        <MiniStat label="Pendientes" value={stats.pending} tone="urgent" />
        <MiniStat label="Suspendidas" value={stats.suspended} tone="urgent" />
        <MiniStat label="Usuarios activos" value={stats.activeUsers} tone="primary" />
        <MiniStat label="Países representados" value={stats.countries} tone="default" />
      </section>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Instituciones</h2>
          <p className="text-xs text-muted-foreground">
            Registro, aprobación y membresías. Sólo instituciones aprobadas
            aparecen en Acceso Institucional.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Nueva institución
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            placeholder="Buscar por nombre, sigla o país"
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
          <option value="">Todos los estados</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {INSTITUTION_STATUS_LABELS_ES[s]}
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
          <option value="">Todos los países</option>
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
          <option value="">Todos los tipos</option>
          {TYPES.map((tp) => (
            <option key={tp} value={tp}>
              {INSTITUTION_TYPE_LABELS_ES[tp]}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Sigla</th>
              <th className="px-4 py-3 font-medium">País</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Usuarios</th>
              <th className="px-4 py-3 font-medium">Solicitud</th>
              <th className="px-4 py-3 font-medium">Aprobación</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((i) => (
              <tr
                key={i.id}
                className="border-b border-border/50 last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 font-medium">
                    {i.name}
                    {i.status === "approved" && (
                      <span
                        title="Verificada por BASUF"
                        className="inline-flex items-center gap-1 rounded-full border border-hope/40 bg-hope/20 px-1.5 py-0.5 text-[10px] font-semibold text-hope-foreground"
                      >
                        <ShieldCheck className="h-3 w-3" aria-hidden />
                        Verificada
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {verificationLevel(i) === "complete"
                      ? "Verificación completa"
                      : verificationLevel(i) === "intermediate"
                      ? "Verificación intermedia"
                      : "Verificación básica"}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">{i.acronym ?? "—"}</td>
                <td className="px-4 py-3 text-xs">{i.country}</td>
                <td className="px-4 py-3 text-xs">
                  {INSTITUTION_TYPE_LABELS_ES[i.institutionType]}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_TONE[i.status]}`}
                  >
                    {INSTITUTION_STATUS_LABELS_ES[i.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  {institutionsRepository.countUsers(i.id)}
                </td>
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
                      Ver
                    </button>
                    {(i.status === "pending" ||
                      i.status === "reference" ||
                      i.status === "rejected") && (
                      <button
                        type="button"
                        onClick={() => {
                          const note = window.prompt(
                            `Aprobar "${i.name}". Nota de verificación:`,
                            "",
                          );
                          if (note === null) return;
                          changeStatus(i, "approved", "aprobada", note);
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-hope/20 px-2 py-1 text-xs font-semibold text-hope-foreground hover:bg-hope/30"
                      >
                        <ShieldCheck className="h-3 w-3" aria-hidden />
                        Aprobar
                      </button>
                    )}
                    {i.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => changeStatus(i, "rejected", "rechazada")}
                        className="inline-flex items-center gap-1 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/20"
                      >
                        <X className="h-3 w-3" aria-hidden />
                        Rechazar
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
                          Invitar
                        </button>
                        <button
                          type="button"
                          onClick={() => changeStatus(i, "suspended", "suspendida")}
                          className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs font-medium hover:bg-accent"
                        >
                          <Ban className="h-3 w-3" aria-hidden />
                          Suspender
                        </button>
                      </>
                    )}
                    {i.status === "suspended" && (
                      <button
                        type="button"
                        onClick={() => changeStatus(i, "approved", "reactivada")}
                        className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs font-medium hover:bg-accent"
                      >
                        <RotateCcw className="h-3 w-3" aria-hidden />
                        Reactivar
                      </button>
                    )}
                    {(i.status === "rejected" || i.status === "suspended") && (
                      <button
                        type="button"
                        onClick={() => changeStatus(i, "archived", "archivada")}
                        className="inline-flex items-center gap-1 rounded-md border border-input px-2 py-1 text-xs font-medium hover:bg-accent"
                      >
                        <Archive className="h-3 w-3" aria-hidden />
                        Archivar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Sin resultados con los filtros actuales.
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
            ← Anterior
          </button>
          <span className="text-muted-foreground">
            Página {page + 1} de {totalPages}
          </span>
          <button
            type="button"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-input px-2 py-1 disabled:opacity-50"
          >
            Siguiente →
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
            toast.success("Institución registrada", inst.name);
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
            toast.success("Invitación creada", m.userEmail);
          }}
        />
      )}
      {viewing && (
        <ViewInstitutionModal
          institution={viewing}
          onClose={() => setViewing(null)}
        />
      )}
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
            aria-label="Cerrar"
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

  const set = <K extends keyof CreateInstitutionInput>(
    k: K,
    v: CreateInstitutionInput[K],
  ) => setForm((prev) => ({ ...prev, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const inst = institutionsRepository.create(form);
      onCreated(inst);
    } catch (err) {
      if (err instanceof DuplicateInstitutionError) {
        setError(
          "Ya existe una institución con ese nombre, correo institucional o número de registro.",
        );
      } else {
        setError("Faltan campos obligatorios.");
      }
    }
  };

  return (
    <ModalShell title="Nueva institución" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre oficial *">
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Sigla">
            <input
              value={form.acronym ?? ""}
              onChange={(e) => set("acronym", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="País *">
            <input
              required
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Tipo de institución *">
            <select
              value={form.institutionType}
              onChange={(e) =>
                set("institutionType", e.target.value as InstitutionType)
              }
              className="input"
            >
              {TYPES.map((tp) => (
                <option key={tp} value={tp}>
                  {INSTITUTION_TYPE_LABELS_ES[tp]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Correo institucional *">
            <input
              required
              type="email"
              value={form.officialEmail}
              onChange={(e) => set("officialEmail", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Persona de contacto">
            <input
              value={form.contactName ?? ""}
              onChange={(e) => set("contactName", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Correo de contacto">
            <input
              type="email"
              value={form.contactEmail ?? ""}
              onChange={(e) => set("contactEmail", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Teléfono">
            <input
              value={form.contactPhone ?? ""}
              onChange={(e) => set("contactPhone", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Sitio web">
            <input
              type="url"
              value={form.website ?? ""}
              onChange={(e) => set("website", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Número de registro">
            <input
              value={form.registrationNumber ?? ""}
              onChange={(e) => set("registrationNumber", e.target.value)}
              className="input"
            />
          </Field>
        </div>
        <Field label="Dirección">
          <input
            value={form.address ?? ""}
            onChange={(e) => set("address", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Descripción">
          <textarea
            rows={2}
            value={form.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Notas internas de verificación">
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
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Registrar (pendiente)
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
        setError(
          "Ese correo ya está vinculado a una institución. Cada cuenta debe ser única.",
        );
      } else {
        setError("Faltan campos obligatorios.");
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
      title={`Invitar usuario · ${institution.name}`}
      onClose={onClose}
    >
      {!invited ? (
        <form onSubmit={submit} className="space-y-3 text-sm">
          <Field label="Nombre completo *">
            <input
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Correo electrónico *">
            <input
              required
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Rol institucional *">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as MembershipRole)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="reviewer">Revisor</option>
              <option value="viewer">Consulta</option>
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
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Generar invitación
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3 text-sm">
          <p className="rounded-md border border-hope/40 bg-hope/10 px-3 py-2 text-xs text-hope-foreground">
            Invitación creada para <strong>{invited.userEmail}</strong> como{" "}
            <strong>{invited.institutionalRole === "reviewer" ? "Revisor" : "Consulta"}</strong>.
          </p>
          <Field label="Enlace de invitación">
            <input
              readOnly
              value={link}
              className="w-full rounded-md border border-input bg-muted/40 px-3 py-2 text-xs font-mono"
              onFocus={(e) => e.currentTarget.select()}
            />
          </Field>
          <p className="text-[11px] text-muted-foreground">
            Comparte este enlace por un canal seguro. El usuario lo abrirá para
            activar su acceso.
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
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden />
                  Copiar enlace de invitación
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Cerrar
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
  const members = institutionsRepository.listMemberships(institution.id);
  const level = verificationLevel(institution);
  return (
    <ModalShell title={institution.name} onClose={onClose}>
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_TONE[institution.status]}`}
          >
            {INSTITUTION_STATUS_LABELS_ES[institution.status]}
          </span>
          {institution.status === "approved" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-hope/40 bg-hope/20 px-2 py-0.5 text-[11px] font-semibold text-hope-foreground">
              <ShieldCheck className="h-3 w-3" aria-hidden />
              Verificada por BASUF
            </span>
          )}
          <span className="rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] font-semibold text-primary">
            Verificación {level === "complete" ? "completa" : level === "intermediate" ? "intermedia" : "básica"}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-3">
          <Row k="Sigla" v={institution.acronym ?? "—"} />
          <Row k="País" v={institution.country} />
          <Row
            k="Tipo"
            v={INSTITUTION_TYPE_LABELS_ES[institution.institutionType]}
          />
          <Row k="Correo institucional" v={institution.officialEmail} />
          <Row k="Contacto" v={institution.contactName ?? "—"} />
          <Row k="Correo contacto" v={institution.contactEmail ?? "—"} />
          <Row k="Teléfono" v={institution.contactPhone ?? "—"} />
          <Row k="Sitio web" v={institution.website ?? "—"} />
          <Row k="Registro legal" v={institution.registrationNumber ?? "—"} />
          <Row k="Dirección" v={institution.address ?? "—"} />
          <Row k="Solicitud" v={institution.requestedAt.slice(0, 10)} />
          <Row k="Aprobación" v={institution.approvedAt?.slice(0, 10) ?? "—"} />
        </dl>
        {institution.description && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Descripción
            </p>
            <p className="mt-1 text-sm">{institution.description}</p>
          </div>
        )}
        {institution.verificationNotes && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Notas de verificación
            </p>
            <p className="mt-1 text-sm">{institution.verificationNotes}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Usuarios vinculados ({members.length})
          </p>
          {members.length === 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">Sin usuarios aún.</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 px-2 py-1 text-xs"
                >
                  <span>
                    <span className="font-medium">{m.userName}</span> ·{" "}
                    <span className="font-mono text-muted-foreground">
                      {m.userEmail}
                    </span>
                  </span>
                  <span className="rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {m.institutionalRole === "reviewer" ? "Revisor" : "Consulta"} · {m.status}
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
            Cerrar
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
