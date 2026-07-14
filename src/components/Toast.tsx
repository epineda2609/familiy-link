import { useSyncExternalStore, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastTone = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  createdAt: number;
};

type Listener = () => void;

const listeners = new Set<Listener>();
let items: ToastItem[] = [];

function emit() {
  for (const l of listeners) l();
}

export const toast = {
  push(input: Omit<ToastItem, "id" | "createdAt">) {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const next: ToastItem = { ...input, id, createdAt: Date.now() };
    items = [...items, next];
    emit();
    // Auto-dismiss after 4s
    setTimeout(() => toast.dismiss(id), 4000);
    return id;
  },
  success(title: string, description?: string) {
    return toast.push({ tone: "success", title, description });
  },
  error(title: string, description?: string) {
    return toast.push({ tone: "error", title, description });
  },
  info(title: string, description?: string) {
    return toast.push({ tone: "info", title, description });
  },
  dismiss(id: string) {
    items = items.filter((t) => t.id !== id);
    emit();
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  snapshot() {
    return items;
  },
};

function useToasts() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => items,
    () => items,
  );
}

const toneStyles: Record<ToastTone, string> = {
  success: "border-hope/40 bg-hope/10 text-hope-foreground",
  error: "border-destructive/40 bg-destructive/10 text-destructive",
  info: "border-primary/40 bg-primary/10 text-primary",
};

const toneIcon: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export function ToastViewport() {
  const toasts = useToasts();
  // SSR safety: nothing to render server-side (toasts are client-triggered)
  useEffect(() => {}, []);
  if (toasts.length === 0) return null;
  return (
    <div
      role="region"
      aria-label="Notificaciones"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
    >
      {toasts.map((t) => {
        const Icon = toneIcon[t.tone];
        return (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto animate-in fade-in slide-in-from-right-4 duration-200 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm shadow-md backdrop-blur ${toneStyles[t.tone]}`}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs opacity-90">{t.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="ml-1 rounded p-0.5 opacity-70 transition hover:opacity-100"
              aria-label="Cerrar notificación"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
