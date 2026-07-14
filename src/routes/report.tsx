import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, CheckCircle2, Send, ArrowLeft } from "lucide-react";
import { DemoBanner } from "../components/DemoBanner";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { useT } from "../i18n/LocaleProvider";
import {
  peopleRepository,
  type ReportPersonInput,
} from "../repositories/PeopleRepository";
import type {
  Disaster,
  Country,
  PublicPersonCard,
  Gender,
} from "../domain/types";
import type { MessageKey } from "../i18n/messages";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Reportar persona — BASUF" },
      {
        name: "description",
        content:
          "Formulario humanitario para reportar personas desaparecidas por catástrofes en Latinoamérica.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Reportar persona — BASUF" },
      {
        property: "og:description",
        content:
          "Formulario de reporte de desapariciones. Prototipo con datos de demostración.",
      },
    ],
  }),
  component: ReportPage,
});

type FormState = {
  displayName: string;
  approximateAge: string;
  gender: Gender | "";
  country: string;
  disasterId: string;
  lastSeenLocation: string;
  lastSeenAt: string;
  distinctiveFeatures: string;
  reporterName: string;
  reporterContact: string;
  consent: boolean;
};

const emptyState: FormState = {
  displayName: "",
  approximateAge: "",
  gender: "",
  country: "",
  disasterId: "",
  lastSeenLocation: "",
  lastSeenAt: "",
  distinctiveFeatures: "",
  reporterName: "",
  reporterContact: "",
  consent: false,
};

const genders: Gender[] = ["f", "m", "o"];

const fieldCls =
  "w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const labelCls = "text-xs font-medium text-muted-foreground";
const requiredMark = <span className="ml-0.5 text-destructive">*</span>;

function ReportPage() {
  const { t } = useT();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(emptyState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<PublicPersonCard | null>(null);
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);

  useEffect(() => {
    peopleRepository.listDisasters().then(setDisasters);
    peopleRepository.listCountries().then(setCountries);
  }, []);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
  };

  const validate = (): boolean => {
    const req = t("report.field.required");
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.displayName.trim()) next.displayName = req;
    if (!form.gender) next.gender = req;
    if (!form.country) next.country = req;
    if (!form.disasterId) next.disasterId = req;
    if (!form.reporterName.trim()) next.reporterName = req;
    if (!form.reporterContact.trim()) next.reporterContact = req;
    if (!form.consent) next.consent = req;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const ageNum = form.approximateAge ? Number(form.approximateAge) : undefined;
      const payload: ReportPersonInput = {
        displayName: form.displayName.trim(),
        approximateAge: ageNum && !Number.isNaN(ageNum) ? ageNum : undefined,
        gender: form.gender as Gender,
        country: form.country,
        disasterId: form.disasterId,
        lastSeenLocation: form.lastSeenLocation.trim() || undefined,
        lastSeenAt: form.lastSeenAt || undefined,
        distinctiveFeatures: form.distinctiveFeatures.trim() || undefined,
        reporterName: form.reporterName.trim(),
        reporterContact: form.reporterContact.trim(),
        consent: form.consent,
      };
      const record = await peopleRepository.createReport(payload);
      setCreated(record);
      if (typeof window !== "undefined") window.scrollTo({ top: 0 });
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <div className="min-h-dvh bg-background">
        <DemoBanner />
        <SiteHeader />
        <main id="main-content" className="mx-auto max-w-2xl px-4 py-16">
          <div className="rounded-xl border border-hope/40 bg-hope/10 p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-hope-foreground" aria-hidden />
            <h1 className="mt-4 text-2xl font-bold">{t("report.success.title")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("report.success.desc")}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link
                to="/person/$id"
                params={{ id: created.id }}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                {t("report.success.viewCase")}
              </Link>
              <button
                type="button"
                onClick={() => {
                  setCreated(null);
                  setForm(emptyState);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
              >
                {t("report.success.newReport")}
              </button>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="min-h-dvh bg-background">
      <DemoBanner />
      <SiteHeader />

      <main id="main-content" className="mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("nav.home")}
        </Link>

        <header className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t("report.title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("report.subtitle")}</p>
        </header>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-urgent/40 bg-urgent/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-urgent-foreground" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t("report.notice.title")}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t("report.notice.desc")}
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-6">
          {/* Persona */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("report.section.person")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="displayName"
                label={t("report.field.displayName")}
                required
                error={errors.displayName}
              >
                <input
                  id="displayName"
                  type="text"
                  className={fieldCls}
                  value={form.displayName}
                  onChange={(e) => set("displayName", e.target.value)}
                />
              </Field>
              <Field
                id="approximateAge"
                label={t("report.field.approximateAge")}
              >
                <input
                  id="approximateAge"
                  type="number"
                  min={0}
                  max={120}
                  className={fieldCls}
                  value={form.approximateAge}
                  onChange={(e) => set("approximateAge", e.target.value)}
                />
              </Field>
              <Field
                id="gender"
                label={t("report.field.gender")}
                required
                error={errors.gender}
              >
                <select
                  id="gender"
                  className={fieldCls}
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value as Gender | "")}
                >
                  <option value="">{t("report.field.select")}</option>
                  {genders.map((g) => (
                    <option key={g} value={g}>
                      {t(`gender.${g}` as MessageKey)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                id="country"
                label={t("report.field.country")}
                required
                error={errors.country}
              >
                <select
                  id="country"
                  className={fieldCls}
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                >
                  <option value="">{t("report.field.select")}</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                id="disasterId"
                label={t("report.field.disaster")}
                required
                error={errors.disasterId}
                className="sm:col-span-2"
              >
                <select
                  id="disasterId"
                  className={fieldCls}
                  value={form.disasterId}
                  onChange={(e) => set("disasterId", e.target.value)}
                >
                  <option value="">{t("report.field.select")}</option>
                  {disasters.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          {/* Último avistamiento */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("report.section.lastSeen")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="lastSeenLocation"
                label={t("report.field.lastSeenLocation")}
              >
                <input
                  id="lastSeenLocation"
                  type="text"
                  className={fieldCls}
                  value={form.lastSeenLocation}
                  onChange={(e) => set("lastSeenLocation", e.target.value)}
                />
              </Field>
              <Field
                id="lastSeenAt"
                label={t("report.field.lastSeenAt")}
              >
                <input
                  id="lastSeenAt"
                  type="date"
                  className={fieldCls}
                  value={form.lastSeenAt}
                  onChange={(e) => set("lastSeenAt", e.target.value)}
                />
              </Field>
              <Field
                id="distinctiveFeatures"
                label={t("report.field.features")}
                hint={t("report.field.features.hint")}
                className="sm:col-span-2"
              >
                <textarea
                  id="distinctiveFeatures"
                  rows={3}
                  className={fieldCls}
                  value={form.distinctiveFeatures}
                  onChange={(e) => set("distinctiveFeatures", e.target.value)}
                />
              </Field>
            </div>
          </section>

          {/* Reporter */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("report.section.reporter")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="reporterName"
                label={t("report.field.reporterName")}
                required
                error={errors.reporterName}
              >
                <input
                  id="reporterName"
                  type="text"
                  className={fieldCls}
                  value={form.reporterName}
                  onChange={(e) => set("reporterName", e.target.value)}
                />
              </Field>
              <Field
                id="reporterContact"
                label={t("report.field.reporterContact")}
                required
                error={errors.reporterContact}
              >
                <input
                  id="reporterContact"
                  type="text"
                  className={fieldCls}
                  value={form.reporterContact}
                  onChange={(e) => set("reporterContact", e.target.value)}
                />
              </Field>
            </div>
          </section>

          {/* Consent */}
          <section
            className={`rounded-xl border p-5 shadow-sm ${errors.consent ? "border-destructive/50 bg-destructive/5" : "border-border bg-card"}`}
          >
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => set("consent", e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-ring"
              />
              <span className="text-foreground">
                {t("report.field.consent")}
                {requiredMark}
              </span>
            </label>
            {errors.consent && (
              <p className="mt-2 text-xs text-destructive">{errors.consent}</p>
            )}
          </section>

          {hasErrors && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <p className="font-medium text-destructive">
                {t("report.error.title")}
              </p>
              <p className="mt-0.5 text-muted-foreground">
                {t("report.error.desc")}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              <Send className="h-4 w-4" aria-hidden />
              {t("report.submit")}
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              {t("report.cancel")}
            </button>
          </div>
        </form>
      </main>

      <SiteFooter />
    </div>
  );
}

function Field({
  id,
  label,
  required,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <label htmlFor={id} className={labelCls}>
        {label}
        {required && requiredMark}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
