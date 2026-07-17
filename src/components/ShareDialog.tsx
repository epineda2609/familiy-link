import { useState } from "react";
import { Copy, MessageCircle, Mail, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useT } from "../i18n/LocaleProvider";
import { toast } from "./Toast";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  name: string;
}

export function ShareDialog({ open, onOpenChange, url, name }: ShareDialogProps) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);

  const template = t("share.messageTemplate")
    .replace("{name}", name)
    .replace("{url}", url);
  const subject = t("share.emailSubject").replace("{name}", name);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t("share.copied"));
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(t("share.copied"));
    }
  };

  const waHref = `https://wa.me/?text=${encodeURIComponent(template)}`;
  const mailHref = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(template)}`;

  const btn =
    "flex w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("share.dialog.title")}</DialogTitle>
          <DialogDescription>{t("share.dialog.desc")}</DialogDescription>
        </DialogHeader>
        <div className="mt-2 space-y-3">
          <div className="rounded-md border border-border bg-muted/40 p-2 text-xs text-muted-foreground break-all">
            {url}
          </div>
          <button type="button" onClick={copy} className={btn}>
            {copied ? (
              <Check className="h-4 w-4 text-primary" aria-hidden />
            ) : (
              <Copy className="h-4 w-4" aria-hidden />
            )}
            {copied ? t("share.copied") : t("share.copy")}
          </button>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className={btn}
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            {t("share.whatsapp")}
          </a>
          <a href={mailHref} className={btn}>
            <Mail className="h-4 w-4" aria-hidden />
            {t("share.email")}
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
