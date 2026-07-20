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
  Radio,
  Building2,
  KeyRound,
  UserPlus,
  Mail,
} from "lucide-react";
import { DemoBanner } from "../components/DemoBanner";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SkipLink } from "../components/SkipLink";
import { useT } from "../i18n/LocaleProvider";
import { useInstitutionalSession } from "../auth/InstitutionalSession";

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

function InstitutionalLayout() {
  const { session, status } = useInstitutionalSession();
  if (status === "authenticated" && session) return <Shell />;
  if (status === "unauthorized") return <UnauthorizedGate />;
  return <SignInGate />;
}

function SignInGate() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

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
                Sólo instituciones aprobadas por BASUF y personal interno.
              </p>
            </div>
          </div>

          <div className="mb-5 flex items-start gap-2 rounded-md border border-urgent/40 bg-urgent/10 p-3">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-urgent-foreground"
              aria-hidden
            />
            <p className="text-xs text-muted-foreground">
              Cada acceso queda registrado en auditoría. Usa tu correo institucional.
            </p>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/40 p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`rounded-md px-3 py-1.5 font-medium transition ${
                mode === "signin"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded-md px-3 py-1.5 font-medium transition ${
                mode === "signup"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Crear cuenta
            </button>
          </div>

          {mode === "signin" ? <SignInForm /> : <SignUpForm />}

          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            Los usuarios institucionales deben haber sido invitados previamente por
            un administrador BASUF. El acceso de administrador se otorga
            manualmente desde la base de datos por seguridad.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function SignInForm() {
  const { signInWithPassword } = useInstitutionalSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signInWithPassword(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field id="si-email" label="Correo institucional" type="email" value={email} onChange={setEmail} placeholder="tu.nombre@institucion.org" required />
      <Field id="si-pass" label="Contraseña" type="password" value={password} onChange={setPassword} required />
      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
      >
        <ShieldCheck className="h-4 w-4" aria-hidden />
        {busy ? "Verificando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}

function SignUpForm() {
  const { signUp, signInWithPassword } = useInstitutionalSession();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setBusy(true);
    try {
      const res = await signUp({ email, password, fullName });
      if (res.needsConfirmation) {
        setInfo(
          "Revisa tu correo para confirmar la cuenta. Después vuelve aquí e inicia sesión.",
        );
      } else {
        // Auto-signed-in; try to sign in explicitly if needed
        await signInWithPassword(email, password).catch(() => {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field id="su-name" label="Nombre completo" value={fullName} onChange={setFullName} required />
      <Field id="su-email" label="Correo institucional" type="email" value={email} onChange={setEmail} placeholder="tu.nombre@institucion.org" required />
      <Field id="su-pass" label="Contraseña (mín. 8)" type="password" value={password} onChange={setPassword} required />
      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
      {info && (
        <p className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary">
          <Mail className="mr-1 inline h-3.5 w-3.5" aria-hidden />
          {info}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
      >
        <UserPlus className="h-4 w-4" aria-hidden />
        {busy ? "Creando…" : "Crear cuenta"}
      </button>
      <p className="text-[11px] text-muted-foreground">
        Si tu correo coincide con una invitación institucional, tu acceso se
        activará automáticamente al crear la cuenta.
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-muted-foreground" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function UnauthorizedGate() {
  const { error, signOut } = useInstitutionalSession();

  return (
    <div className="min-h-dvh bg-background">
      <DemoBanner />
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-14">
        <div className="rounded-2xl border border-urgent/40 bg-urgent/5 p-8 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-urgent/10 text-urgent-foreground">
              <AlertTriangle className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-bold">Cuenta sin acceso institucional</h1>
              <p className="text-xs text-muted-foreground">
                Tu cuenta está autenticada pero aún no tiene una membresía
                activa vinculada.
              </p>
            </div>
          </div>
          {error && (
            <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
          <div className="mb-6 space-y-1 text-sm text-muted-foreground">
            <p>Si eres personal de una institución aprobada:</p>
            <ul className="list-disc pl-5 text-xs">
              <li>Solicita al administrador BASUF una invitación al correo con que iniciaste sesión.</li>
              <li>Una vez enviada la invitación, cierra sesión y vuelve a entrar para activarla.</li>
            </ul>
            <p className="pt-2 text-[11px]">
              El rol de administrador BASUF sólo se otorga manualmente por
              motivos de seguridad. Contacta al equipo interno si necesitas
              acceso.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium transition hover:bg-accent"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Cerrar sesión
          </button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Shell() {
  const { t: _t } = useT();
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
            onClick={() => void signOut()}
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
