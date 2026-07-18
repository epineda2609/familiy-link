## Objetivo
Agregar el campo opcional **Documento de identidad** al formulario "SOBRE LA PERSONA" (ruta `/report`) y persistirlo con el resto de datos, reutilizando el nombre `documentId` que ya existe en el dominio.

## Estado actual (verificado)
- `PublicPersonCard.documentId?: string` ya existe en `src/domain/types.ts` (agregado en la iteración anterior para el filtro de búsqueda).
- `SearchFilters.documentId` y las claves i18n `search.field.documentId` / `.ph` también existen.
- **Falta**: el campo en el formulario, en `ReportPersonInput` y en `createReport`.
- El proyecto usa un repositorio mock en memoria (`PeopleRepository.ts`), no hay tabla Supabase de personas; se persiste en el mismo store mock que el resto de los campos, respetando el patrón existente.

## Cambios
1. **`src/repositories/PeopleRepository.ts`**
   - Añadir `documentId?: string` a la interfaz `ReportPersonInput`.
   - En `createReport`, propagar `documentId: input.documentId?.trim() || undefined` al registro creado, junto a los demás campos.

2. **`src/routes/report.tsx`**
   - Añadir `documentId: string` al estado `form` y a su valor inicial (`""`).
   - Incluirlo en el `payload` de `createReport` (sin validación de longitud/formato; sin marcarlo como requerido).
   - Renderizar un nuevo `FormField` **dentro del bloque "SOBRE LA PERSONA"**, después de "Nacionalidad", reutilizando el mismo componente `FormField` + `<input>` que usan los demás (mismo diseño, tipografía y grid responsive):
     - `label={t("report.field.documentId")}` (sin asterisco: el asterisco solo aparece en campos con la prop `required`, que no se usará).
     - `<input type="text" pattern="[A-Za-z0-9\s-]*" placeholder={t("report.field.documentId.placeholder")} />`.
     - Sin entrada en el objeto `errors` ni en la validación `validate()`.

3. **`src/i18n/locales/es.ts` y `en.ts`**
   - Añadir:
     - `report.field.documentId`: "Documento de identidad" / "Identity document".
     - `report.field.documentId.placeholder`: "Número de documento" / "Document number".

## Privacidad
No se altera la ficha pública ni los resultados de búsqueda: el valor se guarda en el registro pero las vistas existentes no lo muestran (siguen renderizando solo los campos que ya listaban). No se agrega ninguna nueva visualización pública del documento.

## Fuera de alcance
- No se toca otro campo del formulario ni el flujo de envío.
- No se modifican otras rutas, la ficha `/person/$id`, ni la búsqueda (que ya soporta filtrar por documento).
- No se agregan librerías ni migraciones (no hay tabla Supabase para personas en este proyecto).

## Verificación
- El campo aparece en "SOBRE LA PERSONA", sin asterisco rojo.
- El formulario se envía correctamente con el campo vacío.
- Al enviar con un valor, aparece en el registro creado por `createReport` (visible al buscar por documento en `/search`).
