## Objetivo
Agregar dos filtros opcionales al formulario de la sección **Buscar**: **Nacionalidad** (selector) y **Documento de identidad** (texto libre). Reutilizar componentes, estilos y datos existentes; no tocar la sección Reportar.

## Cambios

### 1. `src/components/SearchForm.tsx`
- Extender props con `nationalities: Country[]`.
- Añadir dos nuevos campos dentro del mismo grid (mismos estilos `fieldCls` / `labelCls`, sin asterisco):
  - `<select>` "Nacionalidad" con opción inicial `report.field.nationality.placeholder` ("Seleccionar nacionalidad"), listando `nationalities`.
  - `<input type="text">` "Documento de identidad" con `placeholder` "Número de documento" y `pattern` que acepta letras, números, espacios y guiones (validación permisiva, no bloqueante).
- Ambos usan `set("nationality", ...)` y `set("documentId", ...)` sobre el mismo objeto de filtros.

### 2. `src/repositories/PeopleRepository.ts`
- Extender `SearchFilters` con `nationality?: string` y `documentId?: string`.
- En `searchPublic`, aplicar filtros adicionales:
  - `f.nationality`: match exacto contra `p.nationality`.
  - `f.documentId`: coincidencia parcial (normalizada: trim + lowercase, ignorando espacios y guiones) contra `p.documentId`.
- Si ambos vacíos, comportamiento actual sin cambios.

### 3. `src/domain/types.ts`
- Añadir campo opcional `documentId?: string` a `PublicPersonCard` (el campo `nationality` ya existe). El dato sigue siendo opcional y no altera fichas existentes; no se muestra en la ficha pública (respeta reglas de privacidad actuales).

### 4. `src/routes/search.tsx`
- Añadir `nationalities` state y cargar con `peopleRepository.listNationalities()` en el `useEffect` inicial.
- Pasar `nationalities` al `<SearchForm>`.

### 5. i18n (`src/i18n/locales/es.ts` y `en.ts`)
- Nuevas claves reutilizables:
  - `search.field.nationality` → "Nacionalidad" / "Nationality"
  - `search.field.documentId` → "Documento de identidad" / "Identity document"
  - `search.field.documentId.ph` → "Número de documento" / "Document number"
- Reutilizar `report.field.nationality.placeholder` existente para la opción inicial del selector.

## Restricciones respetadas
- Sin nuevas dependencias, sin cambios de rutas, sin modificar la sección Reportar.
- Sin asteriscos ni validación de obligatoriedad en los nuevos campos.
- Todos los filtros existentes siguen funcionando y se combinan con los nuevos.
- Documento de identidad se maneja como texto flexible; no se expone en la ficha pública.

## Verificación
- Buscar solo por nacionalidad, solo por documento, o combinados con filtros existentes.
- Dejar ambos vacíos: resultados idénticos al comportamiento actual.
- Ninguno bloquea el envío del formulario.
