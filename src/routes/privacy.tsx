import { createFileRoute } from "@tanstack/react-router";
import { DemoBanner } from "../components/DemoBanner";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SkipLink } from "../components/SkipLink";

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
              Contenido de ejemplo · Demostración
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Política de Privacidad
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Última actualización: 1 de enero de 2026. Este documento es
              ficticio y forma parte de un prototipo humanitario.
            </p>
          </div>
        </section>

        <article className="mx-auto max-w-3xl space-y-8 px-4 py-12 text-sm leading-relaxed text-foreground">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              1. Nuestro compromiso
            </h2>
            <p className="text-muted-foreground">
              BASUF es una plataforma humanitaria dedicada a la reunificación
              de personas separadas por catástrofes, conflictos armados y
              emergencias sanitarias. Tratamos cada dato personal con el
              cuidado que exige un contexto de crisis: minimización, propósito
              acotado y trazabilidad.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              2. Datos que recopilamos
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <strong className="text-foreground">Datos de la persona buscada:</strong>{" "}
                nombre, edad estimada, señas particulares, fotografía si el
                familiar la aporta y último lugar donde fue vista.
              </li>
              <li>
                <strong className="text-foreground">Datos del reportante:</strong>{" "}
                nombre, relación con la persona, canal de contacto y
                consentimiento explícito.
              </li>
              <li>
                <strong className="text-foreground">Datos de rescate e ingreso:</strong>{" "}
                registros aportados por brigadas, hospitales y refugios
                asociados a la cadena de identidad de rescate.
              </li>
              <li>
                <strong className="text-foreground">Datos técnicos mínimos:</strong>{" "}
                idioma preferido y metadatos necesarios para auditoría.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              3. Finalidad del tratamiento
            </h2>
            <p className="text-muted-foreground">
              Utilizamos los datos únicamente para: (a) facilitar la búsqueda
              y reunificación, (b) coordinar con organismos humanitarios
              acreditados, (c) mantener un registro auditable de cada acción
              sobre un caso y (d) evaluar la calidad del proceso.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              4. Visibilidad pública vs. institucional
            </h2>
            <p className="text-muted-foreground">
              Las fichas públicas muestran solo la información imprescindible
              para identificación colectiva. Los datos de contacto, historial
              médico y ubicaciones sensibles quedan restringidos a operadores
              institucionales verificados, con acceso auditado.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              5. Personas vulnerables
            </h2>
            <p className="text-muted-foreground">
              Menores de edad, personas con discapacidad y sobrevivientes de
              violencia reciben tratamiento reforzado: enmascarado por
              defecto, revisión humana obligatoria antes de publicar y canales
              diferenciados de contacto.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              6. Retención y supresión
            </h2>
            <p className="text-muted-foreground">
              Conservamos los datos mientras el caso permanezca activo. Una
              vez confirmada la reunificación o cerrado el caso por la
              autoridad competente, los datos sensibles se anonimizan en un
              plazo de 90 días.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              7. Derechos de las personas
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>Acceder a la información registrada sobre una persona.</li>
              <li>Rectificar datos inexactos.</li>
              <li>Solicitar la supresión cuando el caso haya finalizado.</li>
              <li>Retirar el consentimiento en cualquier momento.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight">
              8. Contacto para asuntos de privacidad
            </h2>
            <p className="text-muted-foreground">
              Escríbenos a{" "}
              <a
                href="mailto:privacidad@basuf.org"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                privacidad@basuf.org
              </a>{" "}
              para ejercer tus derechos o resolver dudas sobre este documento.
            </p>
          </section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
