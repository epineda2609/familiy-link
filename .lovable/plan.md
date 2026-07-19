## Objetivo

Eliminar del header la sección visible llamada **“Modos”** y todo el contenido que aparece dentro de esa sección, realizando el cambio más puntual posible.

## Alcance puntual

- Solo se toca `src/components/SiteHeader.tsx`.
- Se eliminan los dos bloques `<Link to="/modes">` que renderizan la etiqueta `t("nav.modes")`:
  1. Enlace en navegación de escritorio (dentro de `<nav className="hidden ... md:flex">`).
  2. Enlace en navegación móvil (dentro de `<nav id="mobile-nav">`).
- No se modifica ninguna otra parte del header.
- No se toca: estilos, colores, tipografías, espaciados, alineaciones, reordenación de CTAs por modo, provider de modos, página `/modes`, rutas, i18n, componentes ni estados ajenos.

## Pasos

1. **Localizar y quitar el enlace de escritorio**
   - En `src/components/SiteHeader.tsx`, eliminar el bloque `<Link to="/modes" ...>{t("nav.modes")}</Link>` del nav de escritorio.

2. **Localizar y quitar el enlace móvil**
   - En el mismo archivo, eliminar el bloque `<Link to="/modes" ...>{t("nav.modes")}</Link>` del nav móvil.

3. **Verificación mínima**
   - Ejecutar `bun run build` para confirmar que el proyecto compila sin errores.
   - Validar que el header sigue mostrando el resto de enlaces (Inicio, Buscar, Reportar, Cadena de rescate, Acerca de, Acceso institucional) y que la sección “Modos” ya no aparece.

## Entregable

Header sin la sección visible “Modos”, todo lo demás del proyecto intacto.