import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import type {
  EvidenceItem,
  EvidenceVisibility,
} from "../../domain/evidence";
import { evidenceRepository } from "../../repositories/EvidenceRepository";
import { useT } from "../../i18n/LocaleProvider";
import type { MessageKey } from "../../i18n/messages";
import { toast } from "../Toast";
import { auditLog } from "../../audit/auditLog";

const MAX_FILES = 5;
const MAX_SIZE = 5 * 1024 * 1024;

const VIS: EvidenceVisibility[] = [
  "public",
  "family_verified",
  "institution",
  "authority",
  "restricted",
];

interface Pending {
  file: File;
  visibility: EvidenceVisibility;
  sensitive: boolean;
  caption: string;
  previewUrl: string;
}

export function EvidenceUploader({
  caseRef,
  uploadedBy,
  defaultVisibility = "family_verified",
  onAdded,
}: {
  caseRef: string;
  uploadedBy: string;
  defaultVisibility?: EvidenceVisibility;
  onAdded?: (item: EvidenceItem) => void;
}) {
  const { t } = useT();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<Pending[]>([]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (items.length + files.length > MAX_FILES) {
      toast.error(t("evidence.uploader.tooMany"));
      return;
    }
    for (const f of files) {
      if (f.size > MAX_SIZE) {
        toast.error(`${f.name}: ${t("evidence.uploader.tooLarge")}`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const url = String(reader.result ?? "");
        setItems((prev) => [
          ...prev,
          {
            file: f,
            visibility: defaultVisibility,
            sensitive: false,
            caption: "",
            previewUrl: url,
          },
        ]);
      };
      reader.readAsDataURL(f);
    }
  };

  const update = (idx: number, patch: Partial<Pending>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };
  const remove = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const saveAll = () => {
    let count = 0;
    for (const it of items) {
      const added = evidenceRepository.add({
        caseRef,
        kind: it.file.type.startsWith("image/") ? "person_photo" : "document",
        visibility: it.visibility,
        sensitive: it.sensitive,
        url: it.previewUrl,
        caption: it.caption.trim() || undefined,
        uploadedBy,
      });
      auditLog.record({
        actor: {
          operatorName: uploadedBy,
          orgName: "—",
          role: "reporter",
        },
        action: "evidence.upload",
        targetId: added.id,
        targetLabel: added.caption ?? added.kind,
        metadata: { visibility: added.visibility },
      });
      onAdded?.(added);
      count++;
    }
    if (count > 0) {
      toast.success(t("evidence.uploader.saved"));
      setItems([]);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold">{t("evidence.uploader.title")}</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("evidence.uploader.help")}
      </p>

      <div className="mt-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={onPick}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent"
        >
          <Upload className="h-4 w-4" />
          {t("evidence.uploader.add")}
        </button>
      </div>

      {items.length > 0 && (
        <ul className="mt-4 space-y-3">
          {items.map((it, i) => (
            <li
              key={i}
              className="flex flex-col gap-2 rounded-md border border-border bg-background p-3 sm:flex-row sm:items-start"
            >
              {it.file.type.startsWith("image/") && (
                <img
                  src={it.previewUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-md border border-border object-cover"
                />
              )}
              <div className="flex-1 space-y-2">
                <p className="truncate text-xs font-medium">{it.file.name}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {t("evidence.uploader.visibility")}
                  </label>
                  <select
                    value={it.visibility}
                    onChange={(e) =>
                      update(i, {
                        visibility: e.target.value as EvidenceVisibility,
                      })
                    }
                    className="rounded-md border border-input bg-card px-2 py-1 text-xs"
                  >
                    {VIS.map((v) => (
                      <option key={v} value={v}>
                        {t(`evidence.visibility.${v}` as MessageKey)}
                      </option>
                    ))}
                  </select>
                  <label className="inline-flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={it.sensitive}
                      onChange={(e) => update(i, { sensitive: e.target.checked })}
                    />
                    {t("evidence.uploader.sensitive")}
                  </label>
                </div>
                <input
                  type="text"
                  placeholder={t("evidence.uploader.caption")}
                  value={it.caption}
                  onChange={(e) => update(i, { caption: e.target.value })}
                  className="w-full rounded-md border border-input bg-card px-2 py-1 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="self-start rounded-md border border-input bg-background p-1 text-muted-foreground hover:bg-accent"
                aria-label="Quitar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={saveAll}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t("evidence.uploader.add")} ({items.length})
          </button>
        </div>
      )}
    </div>
  );
}
