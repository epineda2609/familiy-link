import { useT } from "../i18n/LocaleProvider";

/**
 * Enlace "saltar al contenido" — visible al enfocar con teclado.
 * Debe renderizarse antes que cualquier otro contenido interactivo.
 */
export function SkipLink() {
  const { t } = useT();
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {t("a11y.skipToContent")}
    </a>
  );
}
