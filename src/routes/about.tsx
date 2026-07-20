import { createFileRoute } from "@tanstack/react-router";
import { HeartHandshake, ShieldCheck, Sunrise } from "lucide-react";
import { DemoBanner } from "../components/DemoBanner";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SkipLink } from "../components/SkipLink";
import { useT } from "../i18n/LocaleProvider";
import type { MessageKey } from "../i18n/messages";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Acerca de nosotros — BASUF" },
      {
        name: "description",
        content:
          "Conoce la misión de BASUF: reunir familias separadas por catástrofes con humanidad, trazabilidad y esperanza.",
      },
      {
        property: "og:title",
        content: "Acerca de nosotros — BASUF",
      },
      {
        property: "og:description",
        content:
          "Conoce la misión de BASUF: reunir familias separadas por catástrofes con humanidad, trazabilidad y esperanza.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useT();

  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />
      <DemoBanner />
      <SiteHeader />
      <main id="main-content">
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-hope/10"
          />
          <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                {t("nav.about")}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                {t("app.mission")}
              </p>
              <p className="mt-4 text-lg font-semibold text-foreground">
                {t("about.tagline")}
              </p>
            </div>
          </div>
        </section>

        {/* Nuestra misión */}
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {t("mission.title")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("mission.subtitle")}
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  Icon: HeartHandshake,
                  title: "mission.pillar.humanity.title",
                  desc: "mission.pillar.humanity.desc",
                  tint: "text-primary",
                  bg: "bg-primary/10",
                },
                {
                  Icon: ShieldCheck,
                  title: "mission.pillar.traceability.title",
                  desc: "mission.pillar.traceability.desc",
                  tint: "text-hope-foreground",
                  bg: "bg-hope/20",
                },
                {
                  Icon: Sunrise,
                  title: "mission.pillar.hope.title",
                  desc: "mission.pillar.hope.desc",
                  tint: "text-urgent-foreground",
                  bg: "bg-urgent/20",
                },
              ].map(({ Icon, title, desc, tint, bg }) => (
                <article
                  key={title}
                  className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                  <span
                    className={`mb-4 grid h-11 w-11 place-items-center rounded-lg ${bg} ${tint}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="font-semibold leading-tight">
                    {t(title as MessageKey)}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t(desc as MessageKey)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Por qué existe BASUF */}
        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
            <h3 className="text-lg font-semibold tracking-tight">
              {t("mission.originTitle")}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {t("mission.originBody")}
            </p>
          </div>
        </section>

        {/* ¿Qué hace diferente a BASUF? */}
        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
            <h3 className="text-lg font-semibold tracking-tight">
              {t("about.differenceTitle")}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {t("about.differenceBody")}
            </p>
          </div>
        </section>

        {/* Cierre */}
        <section className="mx-auto max-w-7xl px-4 py-16">
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {t("about.closing")}
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
