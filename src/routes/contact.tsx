import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Mail, MapPin, MessageCircle, Clock } from "lucide-react";
import { DemoBanner } from "../components/DemoBanner";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { SkipLink } from "../components/SkipLink";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contacto — BASUF" },
      {
        name: "description",
        content:
          "Canales de contacto de la red humanitaria BASUF: dirección, correo, WhatsApp y formulario de mensajes.",
      },
      { property: "og:title", content: "Contacto — BASUF" },
      {
        property: "og:description",
        content:
          "Canales de contacto de la red humanitaria BASUF: dirección, correo, WhatsApp y formulario de mensajes.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ContactPage,
});

type FieldErrors = { name?: string; email?: string; message?: string };

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Ingresa tu nombre.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = "Ingresa un correo válido.";
    if (message.trim().length < 10)
      next.message = "El mensaje debe tener al menos 10 caracteres.";
    setErrors(next);
    if (Object.keys(next).length === 0) {
      setSent(true);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <SkipLink />
      <DemoBanner />
      <SiteHeader />
      <main id="main-content">
        <section className="border-b border-border">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Contenido de ejemplo · Demostración
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Contacto
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Estamos disponibles para organizaciones aliadas, familias que
              buscan a un ser querido y equipos de campo. Elige el canal que
              te resulte más cómodo.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Info */}
            <div className="space-y-6">
              <ul className="space-y-4">
                <li className="flex gap-3 rounded-xl border border-border bg-card p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="text-sm">
                    <p className="font-semibold">Dirección</p>
                    <p className="text-muted-foreground">
                      Av. Humanitaria 1234, Ciudad Central, La Guaira, Venezuela.
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 rounded-xl border border-border bg-card p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Mail className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="text-sm">
                    <p className="font-semibold">Correo</p>
                    <a
                      href="mailto:contacto@basuf.org"
                      className="text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    >
                      contacto@basuf.org
                    </a>
                  </div>
                </li>
                <li className="flex gap-3 rounded-xl border border-border bg-card p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <MessageCircle className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="text-sm">
                    <p className="font-semibold">WhatsApp</p>
                    <p className="text-muted-foreground">+54 9 11 5555-1234</p>
                  </div>
                </li>
                <li className="flex gap-3 rounded-xl border border-border bg-card p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Clock className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="text-sm">
                    <p className="font-semibold">Horario de atención</p>
                    <p className="text-muted-foreground">
                      Lunes a viernes, 9:00 – 18:00 (hora local). Guardia 24/7
                      durante emergencias activas.
                    </p>
                  </div>
                </li>
              </ul>

              {/* Mapa estático simulado */}
              <div
                role="img"
                aria-label="Mapa referencial de la ubicación de BASUF"
                className="relative overflow-hidden rounded-xl border border-border bg-muted"
              >
                <div
                  aria-hidden
                  className="h-56 w-full bg-[linear-gradient(135deg,hsl(var(--primary)/0.12),hsl(var(--hope)/0.15))]"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg, hsl(var(--primary)/0.15), hsl(var(--hope)/0.18)), repeating-linear-gradient(0deg, transparent 0 39px, hsl(var(--border)) 39px 40px), repeating-linear-gradient(90deg, transparent 0 39px, hsl(var(--border)) 39px 40px)",
                  }}
                />
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="flex flex-col items-center gap-2 rounded-lg bg-card/90 px-4 py-3 shadow-sm backdrop-blur">
                    <MapPin className="h-6 w-6 text-primary" aria-hidden />
                    <p className="text-xs font-medium">
                      Av. Humanitaria 1234, Ciudad Central, La Guaira, Venezuela
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Mapa referencial · demostración
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <form
              onSubmit={onSubmit}
              noValidate
              className="rounded-xl border border-border bg-card p-6"
            >
              <h2 className="text-lg font-semibold tracking-tight">
                Envíanos un mensaje
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Formulario de demostración. Los mensajes no se envían a un
                destinatario real.
              </p>

              {sent ? (
                <div
                  role="status"
                  className="mt-5 rounded-lg border border-hope/40 bg-hope/10 p-4 text-sm"
                >
                  <p className="font-semibold text-foreground">
                    Mensaje recibido (demo)
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Gracias, {name || "visitante"}. Esta es una funcionalidad
                    de demostración: tu mensaje no ha sido enviado a ningún
                    destinatario real.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSent(false);
                      setName("");
                      setEmail("");
                      setMessage("");
                    }}
                    className="mt-3 inline-flex items-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
                  >
                    Enviar otro
                  </button>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-medium"
                    >
                      Nombre*
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? "err-name" : undefined}
                    />
                    {errors.name && (
                      <p
                        id="err-name"
                        className="mt-1 text-xs text-destructive"
                      >
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-medium"
                    >
                      Email*
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "err-email" : undefined}
                    />
                    {errors.email && (
                      <p
                        id="err-email"
                        className="mt-1 text-xs text-destructive"
                      >
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block text-xs font-medium"
                    >
                      Mensaje*
                    </label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                      aria-invalid={Boolean(errors.message)}
                      aria-describedby={
                        errors.message ? "err-message" : undefined
                      }
                    />
                    {errors.message && (
                      <p
                        id="err-message"
                        className="mt-1 text-xs text-destructive"
                      >
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Enviar mensaje (demo)
                  </button>
                </div>
              )}
            </form>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
