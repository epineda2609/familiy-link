Plan de actualización de contenido para la página `/about` (Acerca de nosotros).

### Objetivo
Reemplazar únicamente los textos existentes de la página About por el nuevo contenido proporcionado y añadir una sección adicional antes del cierre, sin modificar el diseño, componentes, estilos, navegación ni funcionalidad.

### Archivos a modificar
1. `src/routes/about.tsx` — inserción del lema y de la nueva sección de diferenciación.
2. `src/i18n/locales/es.ts` — actualización de claves existentes y nuevas claves (`about.tagline`, `about.differenceTitle`, `about.differenceBody`, `about.closing`).
3. `src/i18n/locales/en.ts`, `src/i18n/locales/pt.ts`, `src/i18n/locales/fr.ts` y resto de locales (`ar`, `da`, `de`, `it`, `ja`, `tr`) — sincronización de las mismas claves para mantener el tipo `MessageDict` sin errores de TypeScript.

### Cambios detallados

#### 1. Hero de la página About
- Título: se mantiene `nav.about` → "Acerca de nosotros".
- Texto principal: reemplazar `app.mission` por:
  > "BASUF es una plataforma humanitaria diseñada para ayudar a localizar, identificar y reunificar personas separadas durante emergencias, desastres naturales y crisis humanitarias, conectando a familias con organizaciones de respuesta de forma segura, responsable y respetando la privacidad de las personas."
- Lema institucional debajo del texto principal, con subtítulo destacado:
  > **"Conectamos información. Reunimos familias."**
  Se inserta como un nuevo elemento visual dentro del mismo bloque del hero, reutilizando el estilo de subtítulo existente (sin cambiar el diseño general).

#### 2. Sección "Nuestra misión"
- Subtítulo: reemplazar `mission.subtitle` por:
  > "Tres compromisos que sostienen cada búsqueda, cada reporte y cada posible reencuentro."
- Pilar Humanidad:
  > "Cada ficha representa una persona, una familia y una historia. Diseñamos BASUF con empatía, respeto y dignidad para quienes atraviesan los momentos más difíciles."
- Pilar Trazabilidad:
  > "Cada dato conserva su origen y nivel de verificación, promoviendo transparencia, confianza y un manejo responsable de la información durante todo el proceso."
- Pilar Esperanza:
  > "Creemos que la tecnología puede convertirse en un puente entre la incertidumbre y el reencuentro, facilitando la colaboración entre familias y organizaciones humanitarias."

#### 3. Sección "¿Por qué existe BASUF?"
- Reemplazar `mission.originBody` por el texto completo proporcionado, que incluye la pregunta, el contexto y el origen de BASUF.

#### 4. Nueva sección antes del cierre: "¿Qué hace diferente a BASUF?"
- Añadir una nueva sección con el mismo formato de card que la sección "¿Por qué existe BASUF?".
- Título: `about.differenceTitle` → "¿Qué hace diferente a BASUF?"
- Cuerpo: `about.differenceBody` → texto de tres párrafos proporcionado sobre integración de reportes, coincidencias y revisión.

#### 5. Texto de cierre
- Añadir una sección final con el texto:
  > "Hoy BASUF es un prototipo funcional orientado a colaborar con organizaciones humanitarias, hospitales, refugios y equipos de respuesta para mejorar la coordinación durante emergencias.
  > Porque detrás de cada reporte hay una familia esperando volver a encontrarse."
- Se ubicará al final del contenido principal, antes del `SiteFooter`, reutilizando el mismo formato de card existente.

### Restricciones respetadas
- No se modificará el layout, colores, tipografía, espaciado ni componentes existentes.
- No se crearán nuevas rutas.
- No se alterará la navegación ni el footer.
- Se mantendrá el `DemoBanner` superior con el texto "Entorno de demostración — Todos los datos mostrados son ficticios."
- Se mantendrá el head SEO actual, ajustando solo la descripción si procede para reflejar el nuevo contenido.

### Validación
- Verificar que el build (`bun run build` o equivalente) pase sin errores de TypeScript tras añadir las nuevas claves i18n en todos los locales.
- Confirmar visualmente en la preview que solo los textos cambiaron y que la estructura de la página permanece idéntica.