import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Props = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "default" | "muted";
};

/**
 * Estado vacío reutilizable con jerarquía clara (icono, título, descripción, acción).
 * Reemplaza los recuadros punteados sueltos y aporta consistencia visual.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "default",
}: Props) {
  return (
    <div
      role="status"
      className={`animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-xl border border-dashed p-8 text-center sm:p-10 ${
        tone === "muted"
          ? "border-border/70 bg-muted/30"
          : "border-border bg-card"
      }`}
    >
      {Icon && (
        <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      )}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
