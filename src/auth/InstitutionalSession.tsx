import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../integrations/supabase/client";
import { auditLog } from "../audit/auditLog";

// ---------------------------------------------------------------------------
// Fase 4b — Sesión institucional respaldada por Supabase Auth.
// - Fuente de verdad: supabase.auth (JWT en cookies/localStorage manejado por
//   la librería). Este contexto sólo deriva la vista `InstitutionalSession`
//   consultando `user_roles`, `organization_memberships` y `organizations`.
// - Roles:
//    · admin  → user_roles.role ∈ {master_admin, administrator}
//    · reviewer/viewer → derivado de organization_memberships (status='active')
// ---------------------------------------------------------------------------

export type InstitutionalRole = "admin" | "reviewer" | "viewer";

export interface InstitutionalSession {
  role: InstitutionalRole;
  orgName: string;
  operatorName: string;
  loggedInAt: string;
  institutionId?: string;
  membershipId?: string;
  userEmail?: string;
  authUserId: string;
}

type Ctx = {
  session: InstitutionalSession | null;
  status: "loading" | "authenticated" | "unauthenticated" | "unauthorized";
  error: string | null;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (params: {
    email: string;
    password: string;
    fullName: string;
  }) => Promise<{ needsConfirmation: boolean }>;
  
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const InstitutionalContext = createContext<Ctx | null>(null);

async function deriveSession(
  user: User,
): Promise<{ session: InstitutionalSession | null; reason?: string }> {
  const loggedInAt = new Date().toISOString();
  const email = user.email ?? "";

  // 1) Master admin (BASUF internal)
  const { data: roles, error: rolesErr } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  if (rolesErr) {
    console.warn("[session] user_roles read failed:", rolesErr.message);
  }
  const roleSet = new Set((roles ?? []).map((r) => r.role));
  if (roleSet.has("master_admin") || roleSet.has("administrator")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    return {
      session: {
        role: "admin",
        orgName: "BASUF",
        operatorName: profile?.full_name || email || "BASUF Admin",
        loggedInAt,
        userEmail: email,
        authUserId: user.id,
      },
    };
  }

  // 2) Institutional membership (reviewer/viewer)
  const readMembership = async () =>
    supabase
      .from("organization_memberships")
      .select(
        "id, organization_id, user_name, institutional_role, status, organizations:organization_id(name, status)",
      )
      .ilike("user_email", email)
      .eq("status", "active")
      .maybeSingle();

  let { data: membership } = await readMembership();

  // If no active membership found, try to reconcile any invited row for this
  // confirmed email whose organization is already approved. Idempotent.
  if (!membership) {
    const { error: rpcErr } = await supabase.rpc("accept_institutional_invite");
    if (rpcErr) {
      console.warn("[session] accept_institutional_invite failed:", rpcErr.message);
    } else {
      const retry = await readMembership();
      membership = retry.data;
    }
  }

  if (!membership) {
    return { session: null, reason: "no_membership" };
  }
  const org = membership.organizations as
    | { name: string; status: string }
    | null;
  if (!org || org.status !== "approved") {
    return { session: null, reason: "institution_not_approved" };
  }
  return {
    session: {
      role: membership.institutional_role as InstitutionalRole,
      orgName: org.name,
      operatorName: membership.user_name || email,
      loggedInAt,
      institutionId: membership.organization_id,
      membershipId: membership.id,
      userEmail: email,
      authUserId: user.id,
    },
  };
}


export function InstitutionalSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<InstitutionalSession | null>(null);
  const [status, setStatus] = useState<Ctx["status"]>("loading");
  const [error, setError] = useState<string | null>(null);
  const auditedFor = useRef<string | null>(null);

  const applyAuthSession = useCallback(async (authSession: Session | null) => {
    if (!authSession?.user) {
      setSession(null);
      setStatus("unauthenticated");
      auditedFor.current = null;
      return;
    }
    const { session: derived, reason } = await deriveSession(authSession.user);
    if (!derived) {
      setSession(null);
      setStatus("unauthorized");
      setError(
        reason === "institution_not_approved"
          ? "La institución vinculada a tu cuenta no está aprobada."
          : "Tu cuenta no tiene una membresía institucional activa.",
      );
      return;
    }
    setSession(derived);
    setStatus("authenticated");
    setError(null);
    if (auditedFor.current !== authSession.user.id) {
      auditedFor.current = authSession.user.id;
      auditLog.record({
        actor: {
          operatorName: derived.operatorName,
          orgName: derived.orgName,
          role: derived.role,
        },
        action: "auth.signIn",
        metadata: { institutionId: derived.institutionId },
      });
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      void applyAuthSession(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      void applyAuthSession(s);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [applyAuthSession]);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      setError(null);
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) {
        setError(err.message);
        throw err;
      }
    },
    [],
  );

  const signUp = useCallback(
    async ({
      email,
      password,
      fullName,
    }: {
      email: string;
      password: string;
      fullName: string;
    }) => {
      setError(null);
      const { data, error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/institutional`,
          data: { full_name: fullName.trim() },
        },
      });
      if (err) {
        setError(err.message);
        throw err;
      }
      return { needsConfirmation: !data.session };
    },
    [],
  );


  const signOut = useCallback(async () => {
    if (session) {
      auditLog.record({
        actor: {
          operatorName: session.operatorName,
          orgName: session.orgName,
          role: session.role,
        },
        action: "auth.signOut",
      });
    }
    await supabase.auth.signOut();
    // onAuthStateChange handles state reset
  }, [session]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await applyAuthSession(data.session);
  }, [applyAuthSession]);

  if (status === "loading") return null;

  return (
    <InstitutionalContext.Provider
      value={{
        session,
        status,
        error,
        signInWithPassword,
        signUp,
        
        signOut,
        refresh,
      }}
    >
      {children}
    </InstitutionalContext.Provider>
  );
}

export function useInstitutionalSession() {
  const ctx = useContext(InstitutionalContext);
  if (!ctx)
    throw new Error(
      "useInstitutionalSession must be used inside <InstitutionalSessionProvider>",
    );
  return ctx;
}
