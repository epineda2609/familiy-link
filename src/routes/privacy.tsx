import { createFileRoute } from "@tanstack/react-router";
import { DemoBanner } from "../components/DemoBanner";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SkipLink } from "../components/SkipLink";
import { T } from "../i18n/T";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Política de Privacidad — BASUF" },
      {
        name: "description",
        content:
          "Política de privacidad de BASUF: cómo tratamos los datos personales en contextos de emergencia y reunificación familiar.",
      },
      { property: "og:title", content: "Política de Privacidad — BASUF" },
      {
        property: "og:description",
        content:
          "Política de privacidad de BASUF: cómo tratamos los datos personales en contextos de emergencia y reunificación familiar.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />
      <DemoBanner />
      <SiteHeader />
      <main id="main-content">
        <section className="border-b border-border">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <T k="audit.routes.privacy.contenidoDeEjemploDemostracion" />
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              <T k="audit.routes.privacy.politicaDePrivacidad" />
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              <T k="audit.routes.privacy.ultimaActualizacion1DeEneroDe2026" />
            </p>
          </div>
        </section>

        <article className="mx-auto max-w-3xl space-y-8 px-4 py-12 text-sm leading-relaxed text-foreground">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              <T k="audit.routes.privacy.1NuestroCompromiso" />
            </h2>
            <p className="text-muted-foreground">
              <T k="audit.routes.privacy.bASUFEsUnaPlataformaHumanitariaDedicadaA" />
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              <T k="audit.routes.privacy.2DatosQueRecopilamos" />
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <strong className="text-foreground">
                  <T k="audit.routes.privacy.datosDeLaPersonaBuscada" />
                </strong>{" "}
                <T k="audit.routes.privacy.nombreEdadEstimadaSenasParticularesFotografiaSi" />
              </li>
              <li>
                <strong className="text-foreground">
                  <T k="audit.routes.privacy.datosDelReportante" />
                </strong>{" "}
                <T k="audit.routes.privacy.nombreRelacionConLaPersonaCanalDe" />
              </li>
              <li>
                <strong className="text-foreground">
                  <T k="audit.routes.privacy.datosDeRescateEIngreso" />
                </strong>{" "}
                <T k="audit.routes.privacy.registrosAportadosPorBrigadasHospitalesYRefugios" />
              </li>
              <li>
                <strong className="text-foreground">
                  <T k="audit.routes.privacy.datosTecnicosMinimos" />
                </strong>{" "}
                <T k="audit.routes.privacy.idiomaPreferidoYMetadatosNecesariosParaAuditoria" />
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              <T k="audit.routes.privacy.3FinalidadDelTratamiento" />
            </h2>
            <p className="text-muted-foreground">
              <T k="audit.routes.privacy.utilizamosLosDatosUnicamenteParaAFacilitar" />
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              <T k="audit.routes.privacy.4VisibilidadPublicaVsInstitucional" />
            </h2>
            <p className="text-muted-foreground">
              <T k="audit.routes.privacy.lasFichasPublicasMuestranSoloLaInformacion" />
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              <T k="audit.routes.privacy.5PersonasVulnerables" />
            </h2>
            <p className="text-muted-foreground">
              <T k="audit.routes.privacy.menoresDeEdadPersonasConDiscapacidadY" />
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              <T k="audit.routes.privacy.6RetencionYSupresion" />
            </h2>
            <p className="text-muted-foreground">
              <T k="audit.routes.privacy.conservamosLosDatosMientrasElCasoPermanezca" />
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              <T k="audit.routes.privacy.7DerechosDeLasPersonas" />
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <T k="audit.routes.privacy.accederALaInformacionRegistradaSobreUna" />
              </li>
              <li>
                <T k="audit.routes.privacy.rectificarDatosInexactos" />
              </li>
              <li>
                <T k="audit.routes.privacy.solicitarLaSupresionCuandoElCasoHaya" />
              </li>
              <li>
                <T k="audit.routes.privacy.retirarElConsentimientoEnCualquierMomento" />
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              <T k="audit.routes.privacy.8ContactoParaAsuntosDePrivacidad" />
            </h2>
            <p className="text-muted-foreground">
              <T k="audit.routes.privacy.escribenosA" />{" "}
              <a
                href="mailto:privacidad@basuf.org"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                <T k="audit.routes.privacy.privacidadBasufOrg" />
              </a>{" "}
              <T k="audit.routes.privacy.paraEjercerTusDerechosOResolverDudas" />
            </p>
          </section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
