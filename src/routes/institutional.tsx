import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ShieldCheck,
  LogOut,
  UserCog,
  Lock,
  AlertTriangle,
  LayoutDashboard,
  GitCompareArrows,
  ScrollText,
  Radio,
  Building2,
  KeyRound,
} from "lucide-react";
import { DemoBanner } from "../components/DemoBanner";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SkipLink } from "../components/SkipLink";
import { useT } from "../i18n/LocaleProvider";
import {
  useInstitutionalSession,
  type InstitutionalRole,
} from "../auth/InstitutionalSession";
import { institutionsRepository } from "../repositories/InstitutionsRepository";
import type { MembershipRole } from "../domain/institutions";

export const Route = createFileRoute("/institutional")({
  head: () => ({
    meta: [
      { title: "Acceso institucional — BASUF" },
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

// Código interno demo para acceso BASUF Master. En producción viene del backend/SSO interno.
const BASUF_MASTER_CODE = "BASUF-MASTER";

function InstitutionalLayout() {
  const { session } = useInstitutionalSession();
  if (!session) return <SignInGate />;
  return <Shell />;
}

function SignInGate() {
  const { signIn } = useInstitutionalSession();
  const approved = useMemo(() => institutionsRepository.listApproved(), []);

  const [tab, setTab] = useState<"institutional" | "basuf">("institutional");

  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />
      <DemoBanner />
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-lg px-4 py-14">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
              <Lock className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-bold">Acceso institucional</h1>
              <p className="text-xs text-muted-foreground">
                Sólo instituciones aprobadas por BASUF.
              </p>
            </div>
          </div>

          <div className="mb-5 flex items-start gap-2 rounded-md border border-urgent/40 bg-urgent/10 p-3">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-urgent-foreground"
              aria-hidden
            />
            <p className="text-xs text-muted-foreground">
              Cada acceso queda registrado en auditoría. No compartas credenciales.
            </p>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/40 p-1 text-sm">
            <button
              type="button"
              onClick={() => setTab("institutional")}
              className={`rounded-md px-3 py-1.5 font-medium transition ${
                tab === "institutional"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Miembro institucional
            </button>
            <button
              type="button"
              onClick={() => setTab("basuf")}
              className={`rounded-md px-3 py-1.5 font-medium transition ${
                tab === "basuf"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              BASUF Master
            </button>
          </div>

          {tab === "institutional" ? (
            <InstitutionalLoginForm
              approved={approved}
              onSignIn={signIn}
            />
          ) : (
            <BasufAdminLoginForm onSignIn={signIn} />
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function InstitutionalLoginForm({
  approved,
  onSignIn,
}: {
  approved: ReturnType<typeof institutionsRepository.listApproved>;
  onSignIn: (s: {
    role: InstitutionalRole;
    orgName: string;
    operatorName: string;
    institutionId?: string;
    membershipId?: string;
    userEmail?: string;
  }) => void;
}) {
  const [institutionId, setInstitutionId] = useState<string>("");
  const [userEmail, setUserEmail] = useState("");
  const [role, setRole] = useState<MembershipRole>("reviewer");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!institutionId) {
      setError("Selecciona una organización aprobada.");
      return;
    }
    if (!userEmail.trim()) {
      setError("Ingresa tu correo institucional.");
      return;
    }
    const result = institutionsRepository.authenticate({
      institutionId,
      userEmail,
      role,
    });
    if (!result.ok) {
      const msgs: Record<string, string> = {
        institution_not_found: "La institución no existe.",
        institution_not_approved:
          "La institución no está aprobada. Contacta al administrador BASUF.",
        membership_not_found:
          "No encontramos una membresía activa para este correo en esta institución.",
        membership_inactive:
          "La membresía no está activa. Confirma tu invitación o contacta al administrador.",
        role_mismatch:
          "El rol seleccionado no coincide con tu membresía registrada.",
      };
      setError(msgs[result.reason ?? ""] ?? "No se pudo iniciar sesión.");
      return;
    }
    // Validación en cliente + repositorio; el repositorio nunca acepta admin como rol institucional.
    onSignIn({
      role: role as InstitutionalRole,
      orgName: result.institution!.name,
      operatorName: result.membership!.userName,
      institutionId: result.institution!.id,
      membershipId: result.membership!.id,
      userEmail: result.membership!.userEmail,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="org">
          Organización
        </label>
        <select
          id="org"
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={institutionId}
          onChange={(e) => setInstitutionId(e.target.value)}
        >
          <option value="">Seleccionar organización</option>
          {approved.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
              {i.acronym ? ` (${i.acronym})` : ""} — {i.country}
            </option>
          ))}
        </select>
        {approved.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Todavía no hay instituciones aprobadas.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="op">
          Usuario&nbsp;
        </label>
        <input
          id="op"
          type="email"
          required
          placeholder="correo@institucion.org"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="role">
          Rol
        </label>
        <select
          id="role"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={role}
          onChange={(e) => setRole(e.target.value as MembershipRole)}
        >
          <option value="reviewer">Revisor</option>
          <option value="viewer">Consulta</option>
        </select>
        <p className="text-[11px] text-muted-foreground">
          El rol Administrador está reservado a personal interno de BASUF.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        <ShieldCheck className="h-4 w-4" aria-hidden />
        Iniciar sesión
      </button>
    </form>
  );
}

function BasufAdminLoginForm({
  onSignIn,
}: {
  onSignIn: (s: {
    role: InstitutionalRole;
    orgName: string;
    operatorName: string;
  }) => void;
}) {
  const [operator, setOperator] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!operator.trim()) {
      setError("Ingresa tu nombre.");
      return;
    }
    if (code.trim().toUpperCase() !== BASUF_MASTER_CODE) {
      setError("Código interno incorrecto.");
      return;
    }
    onSignIn({
      role: "admin",
      orgName: "BASUF",
      operatorName: operator.trim(),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-muted-foreground space-y-1">
        <p>
          Acceso interno BASUF (Administrador/Master). Sólo personal de la
          organización.
        </p>
        <p>
          Demo — Operador:{" "}
          <span className="font-mono text-foreground">BASUF Admin</span> · Código:{" "}
          <span className="font-mono text-foreground">{BASUF_MASTER_CODE}</span>
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="badm">
          Nombre del operador
        </label>
        <input
          id="badm"
          type="text"
          required
          placeholder="Nombre y apellido"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={operator}
          onChange={(e) => setOperator(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="bcode">
          Código interno
        </label>
        <input
          id="bcode"
          type="password"
          required
          placeholder="Código interno BASUF"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <p className="text-[11px] text-muted-foreground">
          Demo: <span className="font-mono">{BASUF_MASTER_CODE}</span>
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        <KeyRound className="h-4 w-4" aria-hidden />
        Entrar como BASUF Master
      </button>
    </form>
  );
}

function Shell() {
  const { t } = useT();
  const { session, signOut } = useInstitutionalSession();
  const isAdmin = session?.role === "admin";

  const tabCls =
    "inline-flex items-center gap-1.5 rounded-md border border-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-accent";
  const activeTabCls = "border-border bg-card text-foreground shadow-sm";

  return (
    <div className="min-h-dvh bg-background">
      <DemoBanner />
      <SiteHeader />

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
              <UserCog className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Sesión activa como
              </p>
              <p className="text-sm font-semibold">
                {session?.operatorName} · {session?.orgName}
              </p>
              <p className="text-xs text-muted-foreground">
                {session?.role === "admin"
                  ? "Administrador BASUF"
                  : session?.role === "reviewer"
                  ? "Revisor"
                  : "Consulta"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium transition hover:bg-accent"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Cerrar sesión
          </button>
        </div>

        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Panel institucional
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Coordinación de casos, coincidencias y datos sensibles bajo auditoría.
          </p>
        </header>

        <nav className="mb-6 flex flex-wrap gap-1" aria-label="Secciones institucionales">
          <Link
            to="/institutional"
            className={tabCls}
            activeProps={{ className: `${tabCls} ${activeTabCls}` }}
            activeOptions={{ exact: true }}
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden />
            Casos
          </Link>
          <Link
            to="/institutional/matches"
            className={tabCls}
            activeProps={{ className: `${tabCls} ${activeTabCls}` }}
          >
            <GitCompareArrows className="h-4 w-4" aria-hidden />
            Coincidencias
          </Link>
          {isAdmin && (
            <Link
              to="/institutional/institutions"
              className={tabCls}
              activeProps={{ className: `${tabCls} ${activeTabCls}` }}
            >
              <Building2 className="h-4 w-4" aria-hidden />
              Instituciones
            </Link>
          )}
          <Link
            to="/institutional/audit"
            className={tabCls}
            activeProps={{ className: `${tabCls} ${activeTabCls}` }}
          >
            <ScrollText className="h-4 w-4" aria-hidden />
            Auditoría
          </Link>
          <Link
            to="/institutional/integrations"
            className={tabCls}
            activeProps={{ className: `${tabCls} ${activeTabCls}` }}
          >
            <Radio className="h-4 w-4" aria-hidden />
            Integraciones
          </Link>
        </nav>

        <Outlet />
      </main>

      <SiteFooter />
    </div>
  );
}
