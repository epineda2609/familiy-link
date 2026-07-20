import { createFileRoute } from "@tanstack/react-router";
import { DemoBanner } from "../components/DemoBanner";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SkipLink } from "../components/SkipLink";

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
              Contenido de ejemplo · Demostración
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Protocolos Humanitarios
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Marco de actuación de la red BASUF para operar con dignidad,
              trazabilidad y coordinación durante emergencias.
            </p>
          </div>
        </section>

        <article className="mx-auto max-w-3xl space-y-10 px-4 py-12 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              1. Principios rectores
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>Humanidad: la persona siempre antes que el dato.</li>
              <li>Imparcialidad: sin distinción por origen, credo o estatus.</li>
              <li>Neutralidad operativa frente a partes en conflicto.</li>
              <li>Transparencia y trazabilidad de cada acción registrada.</li>
              <li>Consentimiento informado en cada aporte de información.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              2. Verificación de información
            </h2>
            <p className="text-muted-foreground">
              Toda información entra en estado provisional. Antes de
              publicarse como confirmada requiere:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>Al menos dos fuentes independientes cuando sea posible.</li>
              <li>Revisión humana por parte de un operador acreditado.</li>
              <li>Cotejo con registros oficiales de rescate y hospitales.</li>
              <li>
                Etiquetado explícito del nivel de confianza (bajo, medio, alto).
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              3. Protección de datos sensibles
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                Los datos de contacto se enmascaran por defecto y solo se
                revelan bajo justificación registrada.
              </li>
              <li>
                Historial clínico y ubicación exacta permanecen en el módulo
                institucional, nunca en la ficha pública.
              </li>
              <li>
                Toda revelación queda auditada con operador, fecha y motivo.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              4. Tratamiento de personas vulnerables
            </h2>
            <p className="text-muted-foreground">
              Menores no acompañados, personas con discapacidad, adultos
              mayores y sobrevivientes de violencia siguen un flujo reforzado:
              publicación restringida, verificación cruzada con autoridades
              competentes y contacto exclusivo a través de organismos
              acreditados.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              5. Coordinación con organismos oficiales
            </h2>
            <p className="text-muted-foreground">
              BASUF opera como capa complementaria de coordinación. Los
              conectores institucionales permiten intercambio bidireccional
              con Cruz Roja, ACNUR, protección civil, hospitales y refugios
              acreditados, respetando el mandato de cada actor.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              6. Cadena de identidad de rescate
            </h2>
            <p className="text-muted-foreground">
              Cada persona rescatada recibe un identificador provisional que
              se mantiene aunque no se conozca su nombre. Rescatistas,
              hospitales y refugios agregan eslabones a esa cadena, de modo
              que la trazabilidad exista desde el primer instante.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              7. Buenas prácticas en comunicación
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>Lenguaje claro, empático y libre de tecnicismos.</li>
              <li>Nunca prometer resultados; explicar qué ocurre ahora.</li>
              <li>Mostrar incertidumbre cuando exista.</li>
              <li>Ofrecer siempre un siguiente paso concreto.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              8. Revisión y mejora continua
            </h2>
            <p className="text-muted-foreground">
              Los protocolos se revisan cada seis meses, incorporando
              aprendizajes de campo y aportes de organismos aliados. La
              versión vigente siempre está disponible en esta página.
            </p>
          </section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
