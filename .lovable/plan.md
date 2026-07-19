# Cloud como única fuente de verdad — migración integral

Trabajo sobre la arquitectura ya creada (19 tablas + `cloudSync.ts`). No recreo tablas, no rediseño UI, no agrego funcionalidades. Todo en una sola iteración.

## Inventario detectado

**Con localStorage operativo (a eliminar):**
- `src/auth/InstitutionalSession.tsx` — sesión institucional falsa.
- `src/audit/auditLog.ts` — auditoría en LS.
- `src/repositories/InstitutionsRepository.ts` — instituciones + membresías en LS.
- `src/repositories/EvidenceRepository.ts` — evidencias en LS.
- `src/integrations/simulatedIntegrations.ts` — registry demo (se mantiene, es simulación de integraciones externas, no dato operativo).

**Con mocks operativos (a reemplazar por Cloud):**
- `PeopleRepository` → `mockPeople`, `mockDisasters`.
- `CaseTimelineRepository`, `MatchingRepository`, `SafeIdRepository`, `InstitutionalRepository`, `CaseUpdateRepository` — todos en memoria.
- `routes/index.tsx`, `routes/rescue*`, `routes/safe-id.$code.tsx`, `routes/person.$id.tsx`, `components/RescueBadgePreview.tsx` — importan mocks directos.

**Preservado (catálogos estáticos válidos):** `nationalities.ts`, tipos, i18n, tema/idioma en LS, `simulatedIntegrations` (simulación explícita).

## Cambios

### 1. Migración SQL única (mínima, no recrea tablas)

Solo lo que falta para cerrar la integración:

- `ALTER TABLE persons/disaster_events/organizations/... ADD COLUMN IF NOT EXISTS is_demo boolean default false, dataset_type text default 'production'`.
- Restricciones únicas para idempotencia del seed: `unique(name,country,start_date)` en `disaster_events` (si no existe), `unique(name,country)` en `organizations` (verificar), `unique(public_case_code)` en `persons`.
- Función `seed_demo_data()` **idempotente** que hace `INSERT ... ON CONFLICT DO NOTHING` para:
  - 20–30 personas ficticias (nombres genéricos tipo "Persona Demo NN", correos `@example.com`, sin fotos reales, distribuidas por estados: missing, searching, information_received, possible_match, located, reunited, case_closed).
  - Reutiliza las 50 orgs y 6 eventos ya seedeados (marcándolos `is_demo=true` si aún no lo están).
  - 10–15 `additional_information_reports` vinculados.
  - `person_status_history` derivada por triggers ya existentes.
  - 5–8 `potential_matches` en distintos estados.
  - 3–5 `verification_reviews`.
  - `person_contacts` ficticios.
- Función `purge_demo_data()` que borra solo `where is_demo = true`.
- Trigger `on_auth_user_created` (ya existe) — verificar que asigna rol `viewer` por defecto y NO permite auto-asignar admin.
- Policy hardening: revisar que `user_roles` INSERT/UPDATE solo lo pueda hacer `master_admin`.
- Grants faltantes en columnas `is_demo`/`dataset_type`.

Ejecuto `SELECT seed_demo_data();` al final de la migración.

### 2. Repositorios → async, contra Cloud

Todos los repositorios pasan a devolver `Promise<T>` leyendo/escribiendo Supabase. Firmas se ajustan mínimamente (ya varias son async).

- **`PeopleRepository`**: reemplaza `mockPeople`/`mockDisasters` por `supabase.from('persons')` con vista/select seguro (columnas públicas). `createReport` hace `insert().select().single()` y **espera** el registro. `createDisaster` idem. Mapper `dbRow → PublicPersonCard`.
- **`InstitutionsRepository`**: elimina LS. `listApproved` → `organizations` where `status='approved'` order by name. `authenticate` desaparece (lo reemplaza Supabase Auth). `inviteUser` → inserta `organization_memberships` con `invite_token`. `activateInvite` → update membership vinculando `auth_user_id` del sesión actual. Aprobar/suspender → update `status`.
- **`CaseUpdateRepository`**: elimina array local. `create` → insert en `additional_information_reports` esperando confirmación. `listByCase` → select por `person_id`.
- **`CaseTimelineRepository`**: solo lectura desde `case_timeline`.
- **`MatchingRepository`**: `list/listByPerson` desde `potential_matches`. `confirm/reject` → update `status`. `computeForPerson` → RPC `compute_person_matches`.
- **`SafeIdRepository`**: contra `safe_ids`.
- **`EvidenceRepository`**: `attachments` + storage bucket `evidence` (crear bucket privado si no existe en la migración).
- **`InstitutionalRepository`**: join persons + disappearance_details + contacts vía select con relaciones (solo para reviewers/admins vía RLS).
- **Rescue**: `rescue_intakes`.

Todos los componentes que consumen usan `useEffect + useState` o `useSyncExternalStore` con caché in-memory (no LS). Estados: loading, empty, error, retry.

### 3. `cloudSync.ts` — retirar fire-and-forget en operaciones críticas

Se elimina el archivo (o queda solo con `persistAudit` como helper). Cada repo escribe directo y espera. `auditLog.record` pasa a insertar en `audit_logs` esperando confirmación (para acciones críticas) o async para eventos secundarios (login/logout).

### 4. Autenticación institucional real

- **`InstitutionalSession.tsx`** se convierte en wrapper de `supabase.auth`:
  - `useEffect` inicial con `supabase.auth.getSession()` + `onAuthStateChange`.
  - `signIn(email, password)` → `supabase.auth.signInWithPassword`.
  - Al obtener sesión: consulta `profiles`, `user_roles`, `organization_memberships` (una sola RPC `get_session_context()` SECURITY DEFINER para evitar N+1 y no exponer relaciones) que devuelve `{ role, institutionId, membershipId, operatorName, orgName }`.
  - `signOut` → `supabase.auth.signOut()`.
  - Cero LS propio (Supabase gestiona su token).
  - Rol nunca viene del formulario; siempre de Cloud.
- **`routes/institutional.tsx`**: el login pasa a email + password. Se conserva selector de organización como *hint visual* (no como fuente de verdad). Backdoor `BASUF-MASTER` se retira; en su lugar, la migración crea un usuario `master_admin` inicial con credenciales que se muestran una única vez en la UI del panel si no existe otro admin (o simplemente se documenta que debe crearse manualmente vía tabla `auth.users` con `signUp`). **Decisión**: implemento signup público deshabilitado y creo cuenta admin demo `admin@basuf.example.com` / password fijo vía migración usando `auth.users` insert (soportado en Cloud). La UI del tab BASUF Master muestra esas credenciales demo.
- Guardas de ruta institucional consultan `session.role`; RLS es la barrera real.

### 5. Componentes que consumen mocks

- `routes/index.tsx` — eventos activos: query a `disaster_events` where `status='active'` order by `start_date desc`.
- `routes/person.$id.tsx` — carga persona + timeline + updates + matches vía Cloud, con loading/empty/error.
- `routes/report.tsx`, `routes/search.tsx` — botón submit deshabilitado durante await, toast tras confirmación.
- `routes/rescue.tsx`, `rescue.$code.tsx`, `safe-id.$code.tsx` — Cloud.
- `institutional.*` — todas las tablas contra Cloud, paginación server-side donde >100 filas.

### 6. Retiro de mocks

Tras verificar builds:
- Borro `src/data/mock/people.ts`, `disasters.ts`, `matches.ts`, `evidence.ts`, `safeIds.ts`, `rescue.ts`, `institutions.ts`, `sensitive.ts`.
- Conservo `nationalities.ts` (catálogo).
- Borro `cloudSync.ts`.
- Borro claves LS antiguas con migración limpiadora en `main.tsx` (o `__root.tsx`): `["basuf.institutional.session", "basuf.audit", "basuf.institutions", "basuf.memberships", "basuf.evidence", "basuf.integrations.registry", "basuf.integrations.logs"].forEach(k => localStorage.removeItem(k))`.
- Preservo LS de `theme`, `locale`, `operational-mode`.

### 7. UX de estados

Cada vista de lista/detalle: skeleton loader mientras `loading`, mensaje "Sin resultados" cuando `data.length===0`, banner de error con botón "Reintentar" que reejecuta la query. Formularios: `disabled + spinner` durante submit, deshabilitan doble envío.

### 8. Pruebas

- `bun run build` limpio.
- Playwright smoke: crear persona → recargar → aparece; crear evento → aparece en selectors; enviar info adicional → aparece en timeline; login institucional con cuenta demo → dashboard carga; logout → redirige; borrar LS → app sigue funcional.

## Arquitectura resultante

```text
UI (sin cambios visuales)
  ↓
Repositorios async (Promise<T>)
  ↓
supabase.from(...) / supabase.rpc(...) / supabase.auth
  ↓
Postgres + RLS (única fuente de verdad)
```

## Fuera de alcance
- Google OAuth (arquitectura queda lista, no se conecta ahora).
- Rediseño visual.
- Realtime subscriptions (queries on-demand por ahora).
- Nuevas funcionalidades.

## Riesgos
- Volumen de cambios grande (~30 archivos). Mitigo con edits quirúrgicos y una sola migración SQL adicional.
- Firmas de repos ya eran mayormente async → ruptura mínima en componentes.

¿Procedo con esta migración integral?
