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
import { T } from "../i18n/T";

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
              <h1 className="text-xl font-bold">
                <T k="audit.routes.institutional.accesoInstitucional" />
              </h1>
              <p className="text-xs text-muted-foreground">
                <T k="audit.routes.institutional.soloInstitucionesAprobadasPorBASUFYPersonal" />
              </p>
            </div>
          </div>

          <div className="mb-5 flex items-start gap-2 rounded-md border border-urgent/40 bg-urgent/10 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-urgent-foreground" aria-hidden />
            <p className="text-xs text-muted-foreground">
              <T k="audit.routes.institutional.cadaAccesoQuedaRegistradoEnAuditoriaUsa" />
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
              <T k="audit.routes.institutional.iniciarSesion" />
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
              <T k="audit.routes.institutional.crearCuenta" />
            </button>
          </div>

          {mode === "signin" ? <SignInForm /> : <SignUpForm />}

          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            <T k="audit.routes.institutional.losUsuariosInstitucionalesDebenHaberSidoInvitados" />
            <span className="font-mono">
              {" "}
              <T k="audit.routes.institutional.bASUFMASTER" />
            </span>{" "}
            <T k="audit.routes.institutional.trasIniciarSesion" />
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function SignInForm() {
  const { t } = useT();
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
      setError(err instanceof Error ? err.message : t("audit.institutional.signInError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field
        id="si-email"
        label={t("audit.institutional.emailLabel")}
        type="email"
        value={email}
        onChange={setEmail}
        placeholder={t("audit.common.institutionalEmailPlaceholder")}
        required
      />
      <Field
        id="si-pass"
        label={t("audit.institutional.passwordLabel")}
        type="password"
        value={password}
        onChange={setPassword}
        required
      />
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
        {busy ? t("audit.institutional.verifying") : t("audit.routes.institutional.iniciarSesion")}
      </button>
    </form>
  );
}

function SignUpForm() {
  const { t } = useT();
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
      setError(t("audit.institutional.passwordTooShort"));
      return;
    }
    setBusy(true);
    try {
      const res = await signUp({ email, password, fullName });
      if (res.needsConfirmation) {
        setInfo(t("audit.institutional.confirmEmail"));
      } else {
        // Auto-signed-in; try to sign in explicitly if needed
        await signInWithPassword(email, password).catch(() => {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("audit.institutional.signUpError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field
        id="su-name"
        label={t("audit.institutional.fullNameLabel")}
        value={fullName}
        onChange={setFullName}
        required
      />
      <Field
        id="su-email"
        label={t("audit.institutional.emailLabel")}
        type="email"
        value={email}
        onChange={setEmail}
        placeholder={t("audit.common.institutionalEmailPlaceholder")}
        required
      />
      <Field
        id="su-pass"
        label={t("audit.institutional.passwordMinimumLabel")}
        type="password"
        value={password}
        onChange={setPassword}
        required
      />
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
        {busy ? t("audit.institutional.creating") : t("audit.routes.institutional.crearCuenta")}
      </button>
      <p className="text-[11px] text-muted-foreground">
        <T k="audit.routes.institutional.siTuCorreoCoincideConUnaInvitacion" />
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
  const { t } = useT();
  const { error, signOut, claimMasterAdmin } = useInstitutionalSession();
  const [code, setCode] = useState("");
  const [claimError, setClaimError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setClaimError(null);
    setBusy(true);
    try {
      await claimMasterAdmin(code);
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : t("audit.institutional.invalidCode"));
    } finally {
      setBusy(false);
    }
  };

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
              <h1 className="text-xl font-bold">
                <T k="audit.routes.institutional.cuentaSinAccesoInstitucional" />
              </h1>
              <p className="text-xs text-muted-foreground">
                <T k="audit.routes.institutional.tuCuentaEstaAutenticadaPeroAunNo" />
              </p>
            </div>
          </div>
          {error && (
            <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
          <div className="mb-6 space-y-1 text-sm text-muted-foreground">
            <p>
              <T k="audit.routes.institutional.siEresPersonalDeUnaInstitucionAprobada" />
            </p>
            <ul className="list-disc pl-5 text-xs">
              <li>
                <T k="audit.routes.institutional.solicitaAlAdministradorBASUFUnaInvitacionAl" />
              </li>
              <li>
                <T k="audit.routes.institutional.unaVezEnviadaLaInvitacionCierraSesion" />
              </li>
            </ul>
          </div>

          <form
            onSubmit={submit}
            className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4"
          >
            <p className="text-xs font-semibold text-foreground">
              <T k="audit.routes.institutional.personalInternoBASUFIngresaElCodigoMaestro" />
            </p>
            <input
              type="password"
              required
              placeholder={t("audit.institutional.internalCodePlaceholder")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              <T k="audit.routes.institutional.demo" />
              <span className="font-mono">
                <T k="audit.routes.institutional.bASUFMASTER" />
              </span>
            </p>
            {claimError && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {claimError}
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              <KeyRound className="h-4 w-4" aria-hidden />
              {busy ? t("audit.institutional.verifying") : t("audit.institutional.claimMaster")}
            </button>
          </form>

          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-6 inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium transition hover:bg-accent"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <T k="audit.routes.institutional.cerrarSesion" />
          </button>
        </div>
      </main>
      <SiteFooter />
    </div>
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
                <T k="audit.routes.institutional.sesionActivaComo" />
              </p>
              <p className="text-sm font-semibold">
                {session?.operatorName} · {session?.orgName}
              </p>
              <p className="text-xs text-muted-foreground">
                {session?.role === "admin"
                  ? t("audit.roles.admin")
                  : session?.role === "reviewer"
                    ? t("audit.roles.reviewer")
                    : t("audit.roles.viewer")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium transition hover:bg-accent"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <T k="audit.routes.institutional.cerrarSesion" />
          </button>
        </div>

        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            <T k="audit.routes.institutional.panelInstitucional" />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <T k="audit.routes.institutional.coordinacionDeCasosCoincidenciasYDatosSensibles" />
          </p>
        </header>

        <nav className="mb-6 flex flex-wrap gap-1" aria-label={t("audit.institutional.sections")}>
          <Link
            to="/institutional"
            className={tabCls}
            activeProps={{ className: `${tabCls} ${activeTabCls}` }}
            activeOptions={{ exact: true }}
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden />
            <T k="audit.routes.institutional.casos" />
          </Link>
          <Link
            to="/institutional/matches"
            className={tabCls}
            activeProps={{ className: `${tabCls} ${activeTabCls}` }}
          >
            <GitCompareArrows className="h-4 w-4" aria-hidden />
            <T k="audit.routes.institutional.coincidencias" />
          </Link>
          {isAdmin && (
            <Link
              to="/institutional/institutions"
              className={tabCls}
              activeProps={{ className: `${tabCls} ${activeTabCls}` }}
            >
              <Building2 className="h-4 w-4" aria-hidden />
              <T k="audit.routes.institutional.instituciones" />
            </Link>
          )}
          <Link
            to="/institutional/audit"
            className={tabCls}
            activeProps={{ className: `${tabCls} ${activeTabCls}` }}
          >
            <ScrollText className="h-4 w-4" aria-hidden />
            <T k="audit.routes.institutional.auditoria" />
          </Link>
          <Link
            to="/institutional/integrations"
            className={tabCls}
            activeProps={{ className: `${tabCls} ${activeTabCls}` }}
          >
            <Radio className="h-4 w-4" aria-hidden />
            <T k="audit.routes.institutional.integraciones" />
          </Link>
        </nav>

        <Outlet />
      </main>

      <SiteFooter />
    </div>
  );
}
