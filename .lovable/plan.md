## Iteración N — Pasaporte Humanitario Digital, Evidencia visual y UX de alto estrés

Tres bloques que se apoyan entre sí. Todo demo (mocks + localStorage), sin backend nuevo. Se reutiliza `RescueQR`, `RescueRecord`, `OperationalMode`, `useAuditLog`.

---

### 1. Pasaporte Humanitario Digital (Safe ID)

Referencia segura por caso/persona con vistas por rol y trazabilidad de escaneos.

**Dominio nuevo** — `src/domain/safeId.ts`
- `SafeIdAudience = "public" | "family" | "institution" | "authority"`
- `SafeIdRecord { id, shortCode, barcodeValue, linkedRescueCode?, linkedPersonId?, createdAt, disasterId }`
- `SafeIdAccessEvent { at, audience, actorOrg?, action: "view" | "scan" | "print" | "share" }`
- Helper `resolveAudience(mode)` deriva audiencia por defecto desde `OperationalMode` (family → family, hospital/shelter → institution, coord → authority, field/callcenter → institution).

**Mock repo** — `src/data/mock/safeIds.ts` + `src/repositories/SafeIdRepository.ts`
- 3–4 IDs ligados a los `RescueRecord` existentes (`R-4F7K`, `R-8QN2`, `R-2XM9`) y a `p-001`.
- Log de accesos in-memory + `useAuditLog` para registrar cada vista/scan/print/share.

**Componentes** — `src/components/safeId/`
- `SafeIdCard.tsx`: tarjeta imprimible con QR (reutiliza `RescueQR`), código corto grande, barcode SVG (líneas verticales deterministas desde el hash del código, patrón simple demo — no Code128 real), y el `barcodeValue` legible debajo. Botones **Imprimir**, **Compartir** (usa `navigator.share` con fallback a copiar link), **Copiar código**.
- `SafeIdAudienceSwitcher.tsx`: chips para previsualizar `public | family | institution | authority`. Registra evento de auditoría al cambiar.
- `SafeIdView.tsx`: renderiza los campos permitidos por audiencia:
  - **public**: solo shortCode + estado general ("En hospital", "En refugio").
  - **family**: + ubicación general + hint no sensible + última actualización.
  - **institution**: + cadena de rescate resumida + notas clínicas de triaje.
  - **authority**: + cadena completa + linked person + accesos recientes.
- `SafeIdAccessLog.tsx`: lista de últimos 10 escaneos (fecha, audiencia, actor).

**Ruta nueva** — `src/routes/safe-id.$code.tsx`
- Loader busca por `shortCode`. Muestra `SafeIdView` según audiencia inicial (derivada del modo actual) + `SafeIdAudienceSwitcher` + `SafeIdCard` imprimible + `SafeIdAccessLog`.
- Enlazada desde `RescueBadgePreview` (nuevo botón "Ver pasaporte") y desde `person.$id` (chip "Safe ID").

**Integración**
- `SiteHeader`: no se agrega item de nav (evitar ruido); acceso desde rescate/persona.
- `rescue.$code.tsx`: banner con shortCode del Safe ID + link.
- Home: NO se agrega sección nueva (evitar repetición).

---

### 2. Carga de fotos y evidencia con visibilidad por audiencia

**Dominio** — `src/domain/evidence.ts`
- `EvidenceVisibility = "public" | "family_verified" | "institution" | "authority" | "restricted"`
- `EvidenceKind = "person_photo" | "document" | "institutional" | "clothing" | "location"`
- `EvidenceItem { id, caseRef, kind, visibility, url (dataURL en demo), caption, sensitive: boolean, uploadedAt, uploadedBy }`

**Mock repo** — `src/data/mock/evidence.ts` + `src/repositories/EvidenceRepository.ts`
- Semilla con fotos placeholder (usar `/placeholder.svg` existente para no traer binarios; nunca fotos de fallecidos).
- Persistencia demo en `localStorage` para uploads del usuario en la sesión.

**Componentes** — `src/components/evidence/`
- `EvidenceUploader.tsx`: `<input type="file" multiple accept="image/*,.pdf">`; para cada archivo pide **visibilidad** (radio) y **marca de sensibilidad** (checkbox). Convierte a dataURL en memoria. Máx 5 archivos, 5MB c/u (validación cliente con toast).
- `EvidenceGallery.tsx`: grid con badges de visibilidad y sensibilidad. Los items marcados `sensitive` se muestran con blur + botón "Mostrar (revisor)" que registra auditoría.
- `AudiencePreviewTabs.tsx`: tabs "Público / Familia verificada / Institucional / Autoridad" que filtran la galería. Copy explicativo por tab: "Esto es lo que vería…".
- `SensitiveContentBadge.tsx` + `VisibilityBadge.tsx`.

**Reglas de seguridad (aplicadas en el filtro)**
- `public`: excluye `sensitive`, excluye `person_photo` de estado `deceased`, excluye documentos.
- `family_verified`: incluye fotos de vivos + docs no restringidos.
- `institution`: incluye médico/clínico no restringido.
- `authority`: todo excepto lo marcado explícitamente `restricted` por otra autoridad.
- Nunca renderizar foto si el `PublicPersonCard.status` fuera `deceased` en audiencia pública (guard en `EvidenceGallery`).

**Integración**
- `person.$id.tsx`: nueva sección "Evidencia y fotos" con `AudiencePreviewTabs` + `EvidenceGallery` + `EvidenceUploader` (solo modos `field`, `hospital`, `shelter`, `coord`).
- `report.tsx`: bloque opcional "Adjuntar fotos o documentos" con `EvidenceUploader` (default visibility = `family_verified`).

---

### 3. Asistencia por similitud visual (simulada, controlada)

**Dominio** — extender `src/domain/match.ts`
- Añadir `MatchField.key` opcional `"visualSimilarity"` (no rompe existente porque es unión).
- Nuevo tipo `VisualSimilarity = { level: "low" | "medium" | "high"; note: string }` en `MatchExplanation` opcional.

**Repo** — `src/repositories/MatchingRepository.ts`
- Añadir `visualSimilarity` mock a 1–2 matches existentes. Nunca `high` sin coincidencia de ubicación + edad.

**Componente** — `src/components/matching/VisualSimilarityCard.tsx`
- Muestra nivel (bajo/medio/alto) con color no alarmista (usar `--primary`, no rojo).
- Copy fijo, siempre visible: *"La similitud fotográfica es solo un factor más. No confirma identidad ni fallecimientos. Requiere verificación humana."*
- Botones: "Requiere revisión humana" (deshabilitado, informativo) y "Ver evidencia".

**Integración**
- `institutional.matches.tsx`: render de `VisualSimilarityCard` dentro de la explicación existente, debajo de `MatchExplanationList`.

---

### 4. UX empática y de alto estrés (capa transversal)

**Microcopy — nuevas claves i18n en los 10 locales** (`i18n/locales/*.ts` + `i18n/messages.ts`)
- `ux.whatHappensNow.title` + copy por flujo (buscar, reportar, rescatar).
- `ux.privacy.short` — línea de 1 frase reutilizable.
- `ux.uncertainty.pending`, `ux.uncertainty.partial`, `ux.uncertainty.verified`.
- `ux.help.contextual.*` para tooltips.
- `safeId.audience.{public,family,institution,authority}` + descripciones.
- `evidence.visibility.*`, `evidence.sensitive.warning`, `evidence.uploader.help`.
- `match.visual.disclaimer`, `match.visual.level.{low,medium,high}`.

**Componentes reutilizables** — `src/components/ux/`
- `WhatHappensNow.tsx`: caja informativa con lista numerada de próximos pasos. Se usa arriba de `search`, `report`, `rescue`.
- `PrivacyInline.tsx`: línea con ícono de escudo + copy `ux.privacy.short`.
- `UncertaintyPill.tsx`: pill de estado (pendiente/parcial/verificado) con color no alarmista.
- `EmptyStateGuided.tsx`: reemplazo/wrapper del `EmptyState` existente que añade CTA de siguiente paso.

**Ajustes puntuales**
- `SearchForm.tsx`, `report.tsx`: prepend `<WhatHappensNow>` + `<PrivacyInline>`.
- `rescue.tsx`: `<WhatHappensNow>` para el flujo de crear ingreso.
- Tono: mantener paleta existente (`hope`, `primary`, `muted`). Evitar rojos salvo en contradicciones ya existentes.

---

### Cambios de rutas / router
- Crear `src/routes/safe-id.$code.tsx`. El plugin regenera `routeTree.gen.ts` automáticamente.

### Fuera de alcance
- Backend real / Supabase / storage real de imágenes (todo demo con dataURL + localStorage).
- Librería real de códigos de barras (barcode se dibuja en SVG demo, se comenta que en producción se usa `bwip-js`).
- ML real de similitud visual (100% mock explicable).
- Cambios en `home` / `index.tsx` (recién ajustada).
- Traducciones nuevas para textos largos de los 10 idiomas: se añadirán claves con **es/en completos**; los otros 8 locales caerán al fallback en inglés hasta iteración de traducción.

### Archivos nuevos
```
src/domain/safeId.ts
src/domain/evidence.ts
src/data/mock/safeIds.ts
src/data/mock/evidence.ts
src/repositories/SafeIdRepository.ts
src/repositories/EvidenceRepository.ts
src/components/safeId/SafeIdCard.tsx
src/components/safeId/SafeIdView.tsx
src/components/safeId/SafeIdAudienceSwitcher.tsx
src/components/safeId/SafeIdAccessLog.tsx
src/components/evidence/EvidenceUploader.tsx
src/components/evidence/EvidenceGallery.tsx
src/components/evidence/AudiencePreviewTabs.tsx
src/components/evidence/VisibilityBadge.tsx
src/components/evidence/SensitiveContentBadge.tsx
src/components/matching/VisualSimilarityCard.tsx
src/components/ux/WhatHappensNow.tsx
src/components/ux/PrivacyInline.tsx
src/components/ux/UncertaintyPill.tsx
src/components/ux/EmptyStateGuided.tsx
src/routes/safe-id.$code.tsx
```

### Archivos editados
```
src/domain/match.ts
src/repositories/MatchingRepository.ts
src/components/RescueBadgePreview.tsx      (+ link a Safe ID)
src/routes/rescue.$code.tsx                (+ banner Safe ID)
src/routes/person.$id.tsx                  (+ evidencia + chip Safe ID)
src/routes/report.tsx                      (+ uploader + WhatHappensNow)
src/routes/search.tsx                      (+ WhatHappensNow + PrivacyInline)
src/routes/rescue.tsx                      (+ WhatHappensNow)
src/routes/institutional.matches.tsx       (+ VisualSimilarityCard)
src/i18n/messages.ts
src/i18n/locales/{es,en,pt,fr,de,it,ja,ar,da,tr}.ts   (claves nuevas; texto completo en es/en, fallback en resto)
```
