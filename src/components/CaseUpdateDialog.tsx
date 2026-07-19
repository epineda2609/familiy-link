import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useT } from "../i18n/LocaleProvider";
import { toast } from "./Toast";
import { peopleRepository } from "../repositories/PeopleRepository";
import {
  caseUpdateRepository,
  type CaseUpdateInput,
} from "../repositories/CaseUpdateRepository";
import type { Country, PersonStatus, PublicPersonCard } from "../domain/types";
import type { MessageKey } from "../i18n/messages";

interface CaseUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person: PublicPersonCard;
}

const statuses: PersonStatus[] = ["missing", "searching", "found", "reunited"];

const fieldCls =
  "w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
const labelCls = "text-xs font-medium text-muted-foreground";

export function CaseUpdateDialog({
  open,
  onOpenChange,
  person,
}: CaseUpdateDialogProps) {
  const { t } = useT();
  const [countries, setCountries] = useState<Country[]>([]);
  const [nationalities, setNationalities] = useState<Country[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    knownName: "",
    alias: "",
    approximateAge: "",
    nationality: "",
    document: "",
    identityNotes: "",
    date: "",
    time: "",
    country: "",
    city: "",
    location: "",
    description: "",
    proposedStatus: "" as PersonStatus | "",
    anonymous: false,
    reporterName: "",
    reporterEmail: "",
    reporterPhone: "",
    relation: "",
  });

  useEffect(() => {
    if (!open) return;
    peopleRepository.listCountries().then(setCountries);
    peopleRepository.listNationalities().then(setNationalities);
  }, [open]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const input: CaseUpdateInput = {
      caseId: person.id,
      identity: {
        knownName: form.knownName.trim() || undefined,
        alias: form.alias.trim() || undefined,
        approximateAge: form.approximateAge.trim() || undefined,
        nationality: form.nationality || undefined,
        document: form.document.trim() || undefined,
        notes: form.identityNotes.trim() || undefined,
      },
      lastSeen: {
        date: form.date || undefined,
        time: form.time || undefined,
        country: form.country || undefined,
        city: form.city.trim() || undefined,
        location: form.location.trim() || undefined,
        description: form.description.trim() || undefined,
      },
      proposedStatus: form.proposedStatus || "",
      reporter: {
        anonymous: form.anonymous,
        name: form.anonymous ? undefined : form.reporterName.trim() || undefined,
        email: form.anonymous ? undefined : form.reporterEmail.trim() || undefined,
        phone: form.anonymous ? undefined : form.reporterPhone.trim() || undefined,
        relation: form.anonymous ? undefined : form.relation.trim() || undefined,
      },
    };
    // Simulate small delay for UX
    setTimeout(() => {
      void caseUpdateRepository.create(input);
      toast.success(t("info.success.title"), t("info.success.desc"));
      setSubmitting(false);
      onOpenChange(false);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("info.dialog.title")}</DialogTitle>
          <DialogDescription>{t("info.dialog.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="mb-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs">
          <p className="font-semibold text-foreground">
            {t("info.reference")}
          </p>
          <p className="mt-1 text-muted-foreground">
            {person.displayName} · {t("info.caseCode")}:{" "}
            <span className="font-mono">{person.id}</span>
          </p>
        </div>

        <div className="mb-3 flex items-start gap-2 rounded-md border border-urgent/30 bg-urgent/10 p-3 text-xs text-urgent-foreground">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{t("info.pendingNotice")}</span>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">
              {t("info.section.identity")}
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("info.field.knownName")}>
                <input
                  className={fieldCls}
                  value={form.knownName}
                  onChange={(e) => set("knownName", e.target.value)}
                  maxLength={120}
                />
              </Field>
              <Field label={t("info.field.alias")}>
                <input
                  className={fieldCls}
                  value={form.alias}
                  onChange={(e) => set("alias", e.target.value)}
                  maxLength={80}
                />
              </Field>
              <Field label={t("info.field.age")}>
                <input
                  className={fieldCls}
                  value={form.approximateAge}
                  onChange={(e) => set("approximateAge", e.target.value)}
                  inputMode="numeric"
                  maxLength={4}
                />
              </Field>
              <Field label={t("info.field.nationality")}>
                <select
                  className={fieldCls}
                  value={form.nationality}
                  onChange={(e) => set("nationality", e.target.value)}
                >
                  <option value="">—</option>
                  {nationalities.map((n) => (
                    <option key={n.code} value={n.name}>
                      {n.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("info.field.document")}>
                <input
                  className={fieldCls}
                  value={form.document}
                  onChange={(e) => set("document", e.target.value)}
                  maxLength={80}
                />
              </Field>
            </div>
            <Field label={t("info.field.identityNotes")}>
              <textarea
                className={fieldCls}
                rows={2}
                value={form.identityNotes}
                onChange={(e) => set("identityNotes", e.target.value)}
                maxLength={400}
              />
            </Field>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">
              {t("info.section.lastSeen")}
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("info.field.date")}>
                <input
                  type="date"
                  className={fieldCls}
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </Field>
              <Field label={t("info.field.time")}>
                <input
                  type="time"
                  className={fieldCls}
                  value={form.time}
                  onChange={(e) => set("time", e.target.value)}
                />
              </Field>
              <Field label={t("info.field.country")}>
                <select
                  className={fieldCls}
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                >
                  <option value="">—</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("info.field.city")}>
                <input
                  className={fieldCls}
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  maxLength={120}
                />
              </Field>
            </div>
            <Field label={t("info.field.location")}>
              <input
                className={fieldCls}
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                maxLength={160}
              />
            </Field>
            <Field label={t("info.field.description")}>
              <textarea
                className={fieldCls}
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                maxLength={600}
              />
            </Field>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">
              {t("info.section.status")}
            </legend>
            <Field label={t("info.field.status")}>
              <select
                className={fieldCls}
                value={form.proposedStatus}
                onChange={(e) =>
                  set("proposedStatus", e.target.value as PersonStatus | "")
                }
              >
                <option value="">—</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {t(`status.${s}` as MessageKey)}
                  </option>
                ))}
              </select>
            </Field>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-foreground">
              {t("info.section.reporter")}
            </legend>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.anonymous}
                onChange={(e) => set("anonymous", e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              {t("info.field.anonymous")}
            </label>
            {!form.anonymous && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("info.field.reporterName")}>
                  <input
                    className={fieldCls}
                    value={form.reporterName}
                    onChange={(e) => set("reporterName", e.target.value)}
                    maxLength={120}
                  />
                </Field>
                <Field label={t("info.field.reporterEmail")}>
                  <input
                    type="email"
                    className={fieldCls}
                    value={form.reporterEmail}
                    onChange={(e) => set("reporterEmail", e.target.value)}
                    maxLength={200}
                  />
                </Field>
                <Field label={t("info.field.reporterPhone")}>
                  <input
                    className={fieldCls}
                    value={form.reporterPhone}
                    onChange={(e) => set("reporterPhone", e.target.value)}
                    maxLength={40}
                  />
                </Field>
                <Field label={t("info.field.relation")}>
                  <input
                    className={fieldCls}
                    value={form.relation}
                    onChange={(e) => set("relation", e.target.value)}
                    maxLength={80}
                  />
                </Field>
              </div>
            )}
          </fieldset>

          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              {t("info.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              <Send className="h-4 w-4" aria-hidden />
              {submitting ? t("info.submitting") : t("info.submit")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}
