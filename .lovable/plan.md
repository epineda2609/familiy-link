Plan: Verificar que la sección "Modos" esté eliminada del header y que el proyecto compile.

1. Revisar `src/components/SiteHeader.tsx` y confirmar que no exista ningún bloque `<Link to="/modes">` en la navegación de escritorio ni en la navegación móvil. Si quedara algún resto, eliminarlo sin tocar el resto del header.

2. Ejecutar `bun run build` para verificar que el proyecto compila sin errores tras la eliminación.

3. No modificar ningún otro archivo, ruta, estilo, lógica de estado, componente ni clave i18n.