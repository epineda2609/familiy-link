## Plan de cambio

### Objetivo
Reorganizar la página de inicio (`src/routes/index.tsx`) para que la sección **"Cómo funciona"** aparezca justo debajo del Hero (donde están los botones "Buscar a alguien" y "Reportar persona"), antes de la sección de Estadísticas.

### Cambios a realizar

1. **Reordenar las secciones en `src/routes/index.tsx`:**
   - Mover el bloque JSX de la sección `{/* Cómo funciona */}` (líneas 239–264) a la posición inmediatamente después de la sección `{/* Hero */}` (línea 127) y antes de `{/* Stats */}` (línea 132).
   - Ajustar el espaciado/contenedor para que la transición sea visualmente coherente.

2. **Mantener el resto del contenido intacto:**
   - Hero sin cambios.
   - Botones "Buscar a alguien" y "Reportar persona" permanecen en el Hero.
   - Sección de Estadísticas, Emergencias activas y demás contenido permanecen en su posición relativa, quedando después de "Cómo funciona".

3. **Verificación:**
   - Ejecutar `bun run build` para confirmar que la compilación no se rompe.
   - Verificar visualmente en la previsualización que la sección "Cómo funciona" queda debajo del Hero y antes de las estadísticas.

### Archivos afectados
- `src/routes/index.tsx` (único archivo que cambia).