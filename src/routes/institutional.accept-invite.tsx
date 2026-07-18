import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { DemoBanner } from "../components/DemoBanner";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SkipLink } from "../components/SkipLink";
import { institutionsRepository } from "../repositories/InstitutionsRepository";
import type { Institution, InstitutionMembership } from "../domain/institutions";
import { auditLog } from "../audit/auditLog";

export const Route = createFileRoute("/institutional/accept-invite")({
  head: () => ({
    meta: [
      { title: "Aceptar invitación — BASUF" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { token?: string } => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const { token } = useSearch({ from: "/institutional/accept-invite" });
  const [membership, setMembership] = useState<InstitutionMembership | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [activated, setActivated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Falta el token de invitación.");
      return;
    }
    const m = institutionsRepository
      .listMemberships()
      .find((mm) => mm.inviteToken === token);
    if (!m) {
      setError("La invitación no existe o ya fue procesada.");
      return;
    }
    setMembership(m);
    setInstitution(institutionsRepository.getById(m.institutionId));
  }, [token]);

  const activate = () => {
    if (!membership) return;
    const updated = institutionsRepository.activateInvite(membership.inviteToken!);
    if (!updated) {
      setError("No se pudo activar la invitación.");
      return;
    }
    setMembership(updated);
    setActivated(true);
    auditLog.record({
      actor: {
        operatorName: updated.userName,
        orgName: institution?.name ?? "—",
        role: updated.institutionalRole,
      },
      action: "institution.membership.activate",
      targetId: updated.id,
      targetLabel: `${updated.userName} · ${institution?.name ?? ""}`,
    });
  };

  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />
      <DemoBanner />
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-lg px-4 py-14">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h1 className="text-xl font-bold">Aceptar invitación</h1>
              <p className="text-xs text-muted-foreground">
                Activa tu acceso institucional en BASUF.
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <XCircle className="mt-0.5 h-4 w-4" aria-hidden />
              {error}
            </div>
          )}

          {membership && institution && !error && (
            <>
              <dl className="space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Institución
                  </dt>
                  <dd className="font-medium">
                    {institution.name}
                    {institution.acronym ? ` (${institution.acronym})` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Usuario
                  </dt>
                  <dd>
                    {membership.userName} ·{" "}
                    <span className="font-mono text-muted-foreground">
                      {membership.userEmail}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Rol
                  </dt>
                  <dd>
                    {membership.institutionalRole === "reviewer"
                      ? "Revisor"
                      : "Consulta"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Estado
                  </dt>
                  <dd className="capitalize">{membership.status}</dd>
                </div>
              </dl>

              {membership.status === "active" || activated ? (
                <div className="mt-4 flex items-start gap-2 rounded-md border border-hope/40 bg-hope/10 p-3 text-sm text-hope-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4" aria-hidden />
                  <div>
                    <p className="font-semibold">Acceso activo.</p>
                    <p className="text-xs">
                      Ya puedes iniciar sesión desde{" "}
                      <Link
                        to="/institutional"
                        className="underline"
                      >
                        Acceso Institucional
                      </Link>{" "}
                      con tu correo y el rol asignado.
                    </p>
                  </div>
                </div>
              ) : institution.status !== "approved" ? (
                <p className="mt-4 rounded-md border border-urgent/40 bg-urgent/10 px-3 py-2 text-xs text-muted-foreground">
                  La institución no está aprobada actualmente. Contacta al
                  administrador BASUF.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={activate}
                  className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Activar mi acceso
                </button>
              )}
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
