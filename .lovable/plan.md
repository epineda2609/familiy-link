
# Iteración L — Modos de crisis, matching explicable, timeline vivo

Tres bloques que se construyen en paralelo y comparten un mismo modelo de eventos y de coincidencias enriquecidas. Todo sigue siendo mock-first (sin Supabase todavía), tipado estricto y multilingüe en los 10 idiomas.

## Bloque 1 — Modos de uso en crisis

Introducir un concepto de **modo operativo** que reconfigura la UI según el contexto del actor. No es un rol de seguridad (eso vendrá con Cloud), es una preferencia de interfaz.

Modos:
- `family` — Búsqueda Familiar (por defecto, tono cálido, textos largos ok)
- `callcenter` — Call Center (densidad alta, acciones de reporte rápidas, atajos)
- `field` — Rescatista en Campo (botones grandes, móvil, alto contraste, foco en crear ingreso de rescate)
- `hospital` — Ingreso Hospitalario (formularios de admisión/traslado, terminología clínica)
- `shelter` — Registro en Refugio (check-in, custodia de menores)
- `coord` — Revisión / Coordinación (tablas densas, matching y auditoría)

Cada modo define:
- densidad (`comfortable` | `compact` | `touch`)
- tono (`warm` | `neutral` | `clinical`)
- acciones rápidas (lista de CTAs prioritarios)
- terminología (mapa de claves i18n alternativas: p.ej. `person.status.missing` → "sin localizar" en family vs "no identificado" en hospital)

Implementación:
- Nuevo `src/modes/OperationalMode.ts` con tipos, catálogo y helpers (`getModeConfig`, `getModeCTAs`).
- Nuevo `src/modes/OperationalModeProvider.tsx` con contexto + `localStorage`.
- Nuevo componente `ModeSelector` en `SiteHeader` (junto a `LanguageSelector`).
- Nueva ruta `/modes` explicando cada modo y permitiendo seleccionarlo.
- `SiteHeader` reordena CTAs según `getModeCTAs(mode)`.
- Clases utilitarias tailwind vía `data-mode="..."` en `<html>` para tocar densidad global (padding/tap targets) sin reescribir componentes.
- Nuevas claves i18n `mode.*` en los 10 idiomas.

## Bloque 2 — Matching explicable y confiable

Elevar el motor de coincidencias existente (`data/mock/matches.ts`) a un modelo explicable.

Modelo (`src/domain/match.ts`):
- `MatchKind = 'exact' | 'probabilistic' | 'narrative' | 'visual' | 'human'`
- `MatchField = { key, valueA, valueB, agreement: 'match' | 'contradict' | 'partial' | 'unknown' }`
- `MatchExplanation = { kind, score, fields: MatchField[], contradictions: MatchField[], reportedBy, reviewState, recommendedAction }`
- Ampliar `MatchCandidate` con `explanation: MatchExplanation`.

Recalcular en `computeCandidates()` para poblar campos comparados (edad, género, ubicación, desastre, señas) marcando match/contradict/partial. Contradicciones no vetan la sugerencia; bajan el score y se muestran.

Componentes visuales (`src/components/matching/`):
- `ConfidenceScore.tsx` — anillo/barra con umbrales (alta ≥80, media 50-79, baja <50), a11y con `aria-valuenow`.
- `MatchExplanation.tsx` — lista de campos con iconos ✓ / ✗ / ~ y valores comparados.
- `ContradictionList.tsx` — resalta campos en conflicto.
- `ReviewBadge.tsx` — estado de revisión (pendiente/aprobado/rechazado/requiere autoridad).
- `RecommendedAction.tsx` — CTA sugerida (ej. "Solicitar validación familiar", "Marcar como no coincidencia").

Refactor `routes/institutional.matches.tsx` para usar estos componentes en cada fila/expansión. La lista sigue funcionando; se enriquece la explicación.

Nuevas claves i18n `match.explain.*`, `match.field.*`, `match.action.*` en los 10 idiomas.

## Bloque 3 — Timeline vivo + historia narrativa

Unificar los eventos de `RescueRecord.chain` con los eventos de personas (`PublicPersonCard`) en un único stream de eventos de caso.

Modelo (`src/domain/caseTimeline.ts`):
- `CaseEventType` extiende los tipos de rescate + `reported_missing`, `partial_id`, `possible_match`, `critical_review`, `deceased_review`.
- `CaseEvent = { id, type, at, actorOrg, note?, sourceKind: 'family' | 'rescuer' | 'hospital' | 'shelter' | 'ngo' | 'authority' | 'system' }`
- `CaseHistory = { personId?, rescueCode?, events: CaseEvent[] }`

Repositorio: `src/repositories/CaseTimelineRepository.ts` que fusiona `mockPeople` + `mockRescueRecords` + `mockMatches` aprobados en un timeline por caso.

Generación narrativa (`src/lib/caseNarrative.ts`):
- `buildNarrative(history, locale, disasters): string[]` — devuelve 2–4 párrafos derivados **estrictamente** de los eventos (nunca inventa). Plantillas por idioma con placeholders `{location}`, `{disaster}`, `{actor}`, `{when}`. Reglas: si no hay evento hospitalario, no menciona hospital; si estado es `deceased`, tono sobrio y sin detalles sensibles.

UI:
- Nuevo componente `CaseTimeline.tsx` (evolución de `RescueChainTimeline`, más tipos, filtrable por capa).
- Nuevo componente `CaseNarrative.tsx` con toggle "Ver como historia" / "Ver como línea temporal".
- Integración en `routes/person.$id.tsx` (nuevo bloque "Historia del caso") y `routes/rescue.$code.tsx` (reemplaza la timeline actual manteniendo la vista de pulsera).

Nuevas claves i18n `case.timeline.*`, `case.narrative.template.*` en los 10 idiomas.

## Detalles técnicos

- Todo en frontend, mock-first, sin Supabase.
- Sin nuevas dependencias.
- Tipado estricto: `MessageKey` sigue derivándose de `es.ts`; se añaden claves a los 10 locales para no romper el fallback.
- Accesibilidad: cada componente de matching y timeline lleva roles ARIA, `aria-label` traducido, foco visible.
- RTL: los nuevos componentes usan `ms-*` / `me-*` y evitan `left/right` fijos.
- Modos aplican vía `data-mode` en `<html>`; los componentes de timeline y matching consultan `useMode()` para densidad/tono, no para lógica de negocio.

## Fuera de alcance de esta iteración

- Persistencia real de modo/matches en Supabase (llegará con Lovable Cloud).
- Edición humana del timeline desde la UI (solo lectura + acciones ya existentes de aprobar/rechazar match).
- IA real para narrativa o para matching visual/fotográfico; se simula con reglas.
- Página `/about` o rediseño de la home.

## Verificación

- `tsgo` limpio.
- Recorrido manual: seleccionar cada modo y verificar cambios en `SiteHeader` + densidad.
- `/institutional/matches` muestra score, campos que coinciden, contradicciones y acción recomendada.
- `/person/p-001` y `/rescue/R-2XM9` muestran timeline unificado + narrativa coherente con los eventos.
- Cambio a `ar` mantiene RTL en los nuevos componentes.

## Archivos previstos

Creados: `src/modes/OperationalMode.ts`, `src/modes/OperationalModeProvider.tsx`, `src/components/ModeSelector.tsx`, `src/routes/modes.tsx`, `src/domain/match.ts`, `src/components/matching/{ConfidenceScore,MatchExplanation,ContradictionList,ReviewBadge,RecommendedAction}.tsx`, `src/domain/caseTimeline.ts`, `src/repositories/CaseTimelineRepository.ts`, `src/lib/caseNarrative.ts`, `src/components/CaseTimeline.tsx`, `src/components/CaseNarrative.tsx`.

Editados: `src/routes/__root.tsx` (provider + `data-mode`), `src/components/SiteHeader.tsx`, `src/data/mock/matches.ts`, `src/routes/institutional.matches.tsx`, `src/routes/person.$id.tsx`, `src/routes/rescue.$code.tsx`, `src/i18n/locales/*.ts` (10 idiomas), `src/routeTree.gen.ts`.
