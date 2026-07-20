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
import { T } from "../i18n/T";
import { useT } from "../i18n/LocaleProvider";

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
  const { t } = useT();
  const { token } = useSearch({ from: "/institutional/accept-invite" });
  const [membership, setMembership] = useState<InstitutionMembership | null>(null);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [activated, setActivated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError(t("audit.acceptInvite.missingToken"));
      return;
    }
    const m = institutionsRepository.listMemberships().find((mm) => mm.inviteToken === token);
    if (!m) {
      setError(t("audit.acceptInvite.notFound"));
      return;
    }
    setMembership(m);
    setInstitution(institutionsRepository.getById(m.institutionId));
  }, [t, token]);

  const activate = () => {
    if (!membership) return;
    const updated = institutionsRepository.activateInvite(membership.inviteToken!);
    if (!updated) {
      setError(t("audit.acceptInvite.activationError"));
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
              <h1 className="text-xl font-bold">
                <T k="audit.routes.institutionalAcceptInvite.aceptarInvitacion" />
              </h1>
              <p className="text-xs text-muted-foreground">
                <T k="audit.routes.institutionalAcceptInvite.activaTuAccesoInstitucionalEnBASUF" />
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
                    <T k="audit.routes.institutionalAcceptInvite.institucion" />
                  </dt>
                  <dd className="font-medium">
                    {institution.name}
                    {institution.acronym ? ` (${institution.acronym})` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <T k="audit.routes.institutionalAcceptInvite.usuario" />
                  </dt>
                  <dd>
                    {membership.userName} ·{" "}
                    <span className="font-mono text-muted-foreground">{membership.userEmail}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <T k="audit.routes.institutionalAcceptInvite.rol" />
                  </dt>
                  <dd>
                    {t(
                      membership.institutionalRole === "reviewer"
                        ? "audit.roles.reviewer"
                        : "audit.roles.viewer",
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <T k="audit.routes.institutionalAcceptInvite.estado" />
                  </dt>
                  <dd className="capitalize">{membership.status}</dd>
                </div>
              </dl>

              {membership.status === "active" || activated ? (
                <div className="mt-4 flex items-start gap-2 rounded-md border border-hope/40 bg-hope/10 p-3 text-sm text-hope-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4" aria-hidden />
                  <div>
                    <p className="font-semibold">
                      <T k="audit.routes.institutionalAcceptInvite.accesoActivo" />
                    </p>
                    <p className="text-xs">
                      <T k="audit.routes.institutionalAcceptInvite.yaPuedesIniciarSesionDesde" />{" "}
                      <Link to="/institutional" className="underline">
                        <T k="audit.routes.institutionalAcceptInvite.accesoInstitucional" />
                      </Link>{" "}
                      <T k="audit.routes.institutionalAcceptInvite.conTuCorreoYElRolAsignado" />
                    </p>
                  </div>
                </div>
              ) : institution.status !== "approved" ? (
                <p className="mt-4 rounded-md border border-urgent/40 bg-urgent/10 px-3 py-2 text-xs text-muted-foreground">
                  <T k="audit.routes.institutionalAcceptInvite.laInstitucionNoEstaAprobadaActualmenteContacta" />
                </p>
              ) : (
                <button
                  type="button"
                  onClick={activate}
                  className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  <T k="audit.routes.institutionalAcceptInvite.activarMiAcceso" />
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
