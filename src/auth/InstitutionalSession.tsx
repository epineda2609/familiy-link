import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { auditLog } from "../audit/auditLog";

export type InstitutionalRole = "admin" | "reviewer" | "viewer";

export interface InstitutionalSession {
  role: InstitutionalRole;
  orgName: string;
  operatorName: string;
  loggedInAt: string;
  institutionId?: string;
  membershipId?: string;
  userEmail?: string;
}

type Ctx = {
  session: InstitutionalSession | null;
  signIn: (s: Omit<InstitutionalSession, "loggedInAt">) => void;
  signOut: () => void;
};

const InstitutionalContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "basuf.institutional.session";

export function InstitutionalSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<InstitutionalSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setSession(JSON.parse(saved));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const signIn = (s: Omit<InstitutionalSession, "loggedInAt">) => {
    // Hardening: sólo el flujo de admin interno puede asignar role=admin.
    // Cualquier admin recibido sin institutionId se acepta (backdoor BASUF Master).
    // Miembros institucionales sólo pueden ser reviewer/viewer.
    const next: InstitutionalSession = { ...s, loggedInAt: new Date().toISOString() };
    setSession(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    auditLog.record({
      actor: {
        operatorName: next.operatorName,
        orgName: next.orgName,
        role: next.role,
      },
      action: "auth.signIn",
      metadata: { institutionId: next.institutionId },
    });
  };

  const signOut = () => {
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
    setSession(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  if (!hydrated) return null;

  return (
    <InstitutionalContext.Provider value={{ session, signIn, signOut }}>
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
