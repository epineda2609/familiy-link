import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ShieldCheck, Lock } from "lucide-react";
import { supabase } from "../integrations/supabase/client";

type AuthorizationDetails = {
  client?: { name?: string | null } | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
};

type OAuthApi = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};

function oauthApi(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  component: ConsentPage,
});

function ConsentPage() {
  const { authorization_id: authorizationId } = Route.useSearch();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(Boolean(data.session)));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setAuthed(Boolean(session)),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authed || !authorizationId) return;
    let cancelled = false;
    oauthApi()
      .getAuthorizationDetails(authorizationId)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) return setError(error.message);
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      })
      .catch((e: unknown) => setError(String((e as Error)?.message ?? e)));
    return () => {
      cancelled = true;
    };
  }, [authed, authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauthApi();
    const { data, error } = approve
      ? await api.approveAuthorization(authorizationId)
      : await api.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("El servidor de autorización no devolvió una URL de retorno.");
      return;
    }
    window.location.href = target;
  }

  if (!authorizationId) {
    return (
      <Shell>
        <p className="text-sm text-destructive">
          Falta el parámetro authorization_id en la solicitud.
        </p>
      </Shell>
    );
  }

  if (authed === null) {
    return (
      <Shell>
        <p className="text-sm text-muted-foreground">Cargando…</p>
      </Shell>
    );
  }

  if (!authed) return <Shell><SignInForm /></Shell>;

  return (
    <Shell>
      <h1 className="text-lg font-bold">
        Conectar {details?.client?.name ?? "una aplicación"} a tu cuenta BASUF
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {details?.client?.name ?? "La aplicación"} podrá consultar información de
        BASUF actuando en tu nombre, con los mismos permisos que tu cuenta.
        Cada acceso queda registrado en auditoría.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => decide(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
        >
          Autorizar
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => decide(false)}
          className="rounded-md border border-input px-4 py-2 text-sm font-medium transition hover:bg-accent disabled:opacity-50"
        >
          Denegar
        </button>
      </div>
    </Shell>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setErr(error.message);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex items-center gap-2">
        <Lock className="h-5 w-5 text-primary" aria-hidden />
        <h1 className="text-lg font-bold">Inicia sesión para continuar</h1>
      </div>
      <p className="text-xs text-muted-foreground">
        Autoriza el acceso con tu cuenta BASUF.
      </p>
      <input
        type="email"
        required
        placeholder="correo@organizacion.org"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <input
        type="password"
        required
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      {err && (
        <p role="alert" className="text-sm text-destructive">
          {err}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
      >
        Iniciar sesión
      </button>
    </form>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-4">
      <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
          BASUF
        </div>
        {children}
      </div>
    </main>
  );
}
