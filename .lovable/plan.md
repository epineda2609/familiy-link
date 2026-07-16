## Plan de cambio

### Objetivo
Reorganizar la página de inicio (`src/routes/index.tsx`) para que el orden de las secciones sea:

1. Hero (título, subtítulo, línea de contexto)
2. Botones "Buscar a alguien" y "Reportar persona" (dentro del Hero)
3. Sección "Cómo funciona"
4. Tarjeta de "Innovación clave: identidad rastreable desde el rescate"
5. Estadísticas
6. Emergencias activas

### Cambios a realizar

1. **Mover la tarjeta de "Innovación clave" fuera del Hero en `src/routes/index.tsx`:**
   - Extraer el bloque `<Link to="/rescue" …>` que actualmente está dentro del Hero (debajo de los botones).
   - Colocarlo como una sección independiente inmediatamente después de "Cómo funciona".

2. **Reordenar "Cómo funciona":**
   - Colocar la sección `{/* Cómo funciona */}` inmediatamente después del Hero (después de los botones) y antes de la tarjeta de innovación.

3. **Mantener el resto del contenido intacto:**
   - Hero conserva título, subtítulo, contexto y botones; pierde la tarjeta de innovación.
   - Estadísticas y Emergencias activas se mantienen al final, después de la tarjeta de innovación.

4. **Verificación:**
   - Ejecutar `bun run build` para confirmar compilación sin errores.
   - Verificar visualmente en la previsualización que el orden sea: Hero → Botones → Cómo funciona → Innovación clave → Estadísticas → Emergencias activas.

### Archivos afectados
- `src/routes/index.tsx` (único archivo que cambia).