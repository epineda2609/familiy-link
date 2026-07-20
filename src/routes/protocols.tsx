import { createFileRoute } from "@tanstack/react-router";
import { DemoBanner } from "../components/DemoBanner";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SkipLink } from "../components/SkipLink";
import { T } from "../i18n/T";

export const Route = createFileRoute("/protocols")({
  head: () => ({
    meta: [
      { title: "Protocolos Humanitarios — BASUF" },
      {
        name: "description",
        content:
          "Protocolos de actuación, verificación de información y protección de personas vulnerables en la red BASUF.",
      },
      { property: "og:title", content: "Protocolos Humanitarios — BASUF" },
      {
        property: "og:description",
        content:
          "Protocolos de actuación, verificación de información y protección de personas vulnerables en la red BASUF.",
      },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProtocolsPage,
});

function ProtocolsPage() {
  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />
      <DemoBanner />
      <SiteHeader />
      <main id="main-content">
        <section className="border-b border-border">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <T k="audit.routes.protocols.contenidoDeEjemploDemostracion" />
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              <T k="audit.routes.protocols.protocolosHumanitarios" />
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              <T k="audit.routes.protocols.marcoDeActuacionDeLaRedBASUF" />
            </p>
          </div>
        </section>

        <article className="mx-auto max-w-3xl space-y-10 px-4 py-12 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              <T k="audit.routes.protocols.1PrincipiosRectores" />
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <T k="audit.routes.protocols.humanidadLaPersonaSiempreAntesQueEl" />
              </li>
              <li>
                <T k="audit.routes.protocols.imparcialidadSinDistincionPorOrigenCredoO" />
              </li>
              <li>
                <T k="audit.routes.protocols.neutralidadOperativaFrenteAPartesEnConflicto" />
              </li>
              <li>
                <T k="audit.routes.protocols.transparenciaYTrazabilidadDeCadaAccionRegistrada" />
              </li>
              <li>
                <T k="audit.routes.protocols.consentimientoInformadoEnCadaAporteDeInformacion" />
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              <T k="audit.routes.protocols.2VerificacionDeInformacion" />
            </h2>
            <p className="text-muted-foreground">
              <T k="audit.routes.protocols.todaInformacionEntraEnEstadoProvisionalAntes" />
            </p>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <T k="audit.routes.protocols.alMenosDosFuentesIndependientesCuandoSea" />
              </li>
              <li>
                <T k="audit.routes.protocols.revisionHumanaPorParteDeUnOperador" />
              </li>
              <li>
                <T k="audit.routes.protocols.cotejoConRegistrosOficialesDeRescateY" />
              </li>
              <li>
                <T k="audit.routes.protocols.etiquetadoExplicitoDelNivelDeConfianzaBajo" />
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              <T k="audit.routes.protocols.3ProteccionDeDatosSensibles" />
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <T k="audit.routes.protocols.losDatosDeContactoSeEnmascaranPor" />
              </li>
              <li>
                <T k="audit.routes.protocols.historialClinicoYUbicacionExactaPermanecenEn" />
              </li>
              <li>
                <T k="audit.routes.protocols.todaRevelacionQuedaAuditadaConOperadorFecha" />
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              <T k="audit.routes.protocols.4TratamientoDePersonasVulnerables" />
            </h2>
            <p className="text-muted-foreground">
              <T k="audit.routes.protocols.menoresNoAcompanadosPersonasConDiscapacidadAdultos" />
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              <T k="audit.routes.protocols.5CoordinacionConOrganismosOficiales" />
            </h2>
            <p className="text-muted-foreground">
              <T k="audit.routes.protocols.bASUFOperaComoCapaComplementariaDeCoordinacion" />
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              <T k="audit.routes.protocols.6CadenaDeIdentidadDeRescate" />
            </h2>
            <p className="text-muted-foreground">
              <T k="audit.routes.protocols.cadaPersonaRescatadaRecibeUnIdentificadorProvisional" />
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              <T k="audit.routes.protocols.7BuenasPracticasEnComunicacion" />
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <T k="audit.routes.protocols.lenguajeClaroEmpaticoYLibreDeTecnicismos" />
              </li>
              <li>
                <T k="audit.routes.protocols.nuncaPrometerResultadosExplicarQueOcurreAhora" />
              </li>
              <li>
                <T k="audit.routes.protocols.mostrarIncertidumbreCuandoExista" />
              </li>
              <li>
                <T k="audit.routes.protocols.ofrecerSiempreUnSiguientePasoConcreto" />
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              <T k="audit.routes.protocols.8RevisionYMejoraContinua" />
            </h2>
            <p className="text-muted-foreground">
              <T k="audit.routes.protocols.losProtocolosSeRevisanCadaSeisMeses" />
            </p>
          </section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
