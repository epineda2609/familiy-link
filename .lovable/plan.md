
# Persistencia completa en Lovable Cloud

## Contexto verificado
- El proyecto **NO tiene Lovable Cloud habilitado** todavía (los repositorios actuales — `PeopleRepository`, `InstitutionsRepository`, `CaseUpdateRepository`, `EvidenceRepository`, `SafeIdRepository`, `MatchingRepository`, `CaseTimelineRepository`, `auditLog`, `InstitutionalSession` — trabajan contra mocks en memoria + `localStorage`).
- La UI (rutas, formularios, modales, dialogs) ya está consolidada. **No se rediseña nada visual.** Solo se cambian las implementaciones de repositorio para leer/escribir contra Cloud, y se reemplaza `InstitutionalSession` (localStorage) por sesión real de Cloud Auth con `profiles`.

Primer paso técnico obligatorio: habilitar Lovable Cloud (proporciona Postgres + Auth + Storage). A partir de ahí todas las tablas se crean vía migraciones y se conectan mediante los repositorios ya existentes, sin tocar componentes de UI.

## Modelo de datos (SQL en una sola migración)

Enums: `app_role` (`master_admin`,`administrator`,`reviewer`,`viewer`), `org_status`, `disaster_status`, `person_status`, `report_status`, `match_status`, `verification_decision`, `notification_type`, `visibility_level`, `disaster_type`, `institution_type`.

Tablas (todas en `public`, con `GRANT`s explícitos, RLS activada, `created_at/updated_at` con triggers, soft-delete vía `archived_at` en entidades sensibles):

1. `profiles` — `auth_user_id` FK a `auth.users`, `organization_id`, datos de contacto, `status`, `last_login_at`. Auto-creado por trigger `on_auth_user_created`.
2. `user_roles` — tabla separada `(user_id, role)` + función `has_role(_user_id, _role)` SECURITY DEFINER (patrón obligatorio anti-recursión RLS).
3. `organizations` — reemplaza `institutions` mock; conserva 50 instituciones seed (mismos nombres/siglas/país/tipo). `status`, `approved_by`, `approved_at`, `is_demo`.
4. `organization_memberships` — vincula `profile_id ↔ organization_id` con `institutional_role` (`reviewer`|`viewer`), `status` (`invited`,`active`,`revoked`), `invite_token`.
5. `disaster_events` — reemplaza `mock/disasters`. Incluye `event_code`, coordenadas, `magnitude`, `fatalities`, `missing`, `affected_estimate`, `severity`, `status`, `created_by`.
6. `persons` — registro principal (public_case_code auto, event_id, nombres, documentos, nacionalidad, rasgos físicos, `current_status`, `privacy_level`, `reported_by_user_id`, `reported_by_organization_id`, `photo_url`).
7. `disappearance_details` — 1:1 con `persons` (último avistamiento, coordenadas, circunstancias, vestimenta).
8. `person_contacts` — familiares/denunciantes con `consent_to_contact`.
9. `additional_information_reports` — sustituye `CaseUpdateRepository`. `information_type`, `sighting_*`, `anonymity_requested`, `status`, `assigned_organization_id`.
10. `person_status_history` — se llena vía trigger cuando `persons.current_status` cambia.
11. `case_timeline` — línea temporal consolidada. Poblada por triggers al: crear persona, crear report, cambiar estado, crear match, crear verification.
12. `potential_matches` — `source_person_id`, `matched_person_id`, `match_score`, `matching_fields JSONB`, `explanation`, `status`. Función `compute_person_matches(person_id)` con reglas básicas (documento exacto, similitud fonética `soundex`, edad±3, sexo, evento, cercanía geográfica < 50km, fecha ±30 días) que inserta sugerencias.
13. `verification_reviews` — decisiones de revisor/admin sobre personas/reports/matches.
14. `attachments` — polimórfica (`entity_type`, `entity_id`), integrada con bucket de Storage.
15. `notifications` — internas por usuario/organización.
16. `audit_logs` — reemplaza `auditLog` (localStorage). `previous_data/new_data JSONB`. Rellenado desde triggers y explícitamente desde repos en acciones sensibles.
17. `search_logs` — opcional, solo métricas agregadas (sin PII sensible).
18. `safe_ids` — códigos Safe ID (persistiendo lo que hoy genera `SafeIdRepository`).
19. `rescue_intakes` — cadena de identidad de rescate (`R-XXXX`) del módulo actual.

Índices en: nombres (trigram `pg_trgm`), documento, `event_id`, `current_status`, `country`, coordenadas, códigos públicos, `organization_id`, `person_id` en tablas hijas.

## Seguridad (RLS) — resumen por tabla

Función helper: `has_role(uid, role)`, `is_org_member(uid, org_id)`, `is_org_admin(uid)`. Todas SECURITY DEFINER.

- **profiles**: propietario lee/edita el suyo; admins leen todos.
- **user_roles**: solo `master_admin` inserta/edita; usuario lee su fila.
- **organizations**: `SELECT` público solo `status='approved'`; `INSERT/UPDATE` restringido a `master_admin`/`administrator`.
- **organization_memberships**: `master_admin` gestiona; usuario ve las suyas.
- **disaster_events**: `SELECT` público (activos/monitor); `INSERT/UPDATE` admin.
- **persons**: `SELECT` público solo columnas seguras vía **vista `persons_public`** (excluye documento completo, datos médicos, contactos). Miembros de organización aprobada ven todo; admins ven todo. `INSERT` autenticado + público (para reportes ciudadanos, con `privacy_level` limitado).
- **disappearance_details / person_contacts**: sin acceso público directo; solo revisores/admins de org aprobada.
- **additional_information_reports**: `INSERT` público (anónimo permitido); `SELECT/UPDATE` restringido a reviewer/admin.
- **person_status_history / case_timeline**: `SELECT` a través de vista pública que filtra por `visibility`; reviewer/admin ven todo.
- **potential_matches / verification_reviews / audit_logs**: solo reviewer/admin.
- **attachments**: hereda del `entity_type`+`entity_id`.
- **notifications**: solo destinatario.

Storage buckets:
- `person-photos` (público para status ≠ deceased),
- `evidence` (privado, signed URLs),
- `case-documents` (privado).

## Cambios de código (mínimos, sin tocar UI)

Se **reemplaza la implementación interna** de cada repositorio existente por consultas a `supabase` (browser client) o `createServerFn` con `requireSupabaseAuth` cuando la operación requiere autorización servidor. **Las firmas públicas de los repositorios se mantienen** para no tocar componentes.

- `src/integrations/supabase/*` — generado por el enable de Cloud.
- `src/repositories/PeopleRepository.ts` — CRUD contra `persons` + `disappearance_details` + `person_contacts`. Los métodos `list/search/create/update/setStatus` mantienen su firma.
- `src/repositories/InstitutionsRepository.ts` — contra `organizations` + `organization_memberships`. `listApproved`, `authenticate`, `inviteUser`, `activateInvite` se reimplementan.
- `src/repositories/CaseUpdateRepository.ts` → `additional_information_reports`.
- `src/repositories/MatchingRepository.ts` → `potential_matches` (con RPC `compute_person_matches`).
- `src/repositories/CaseTimelineRepository.ts` → `case_timeline` (solo lectura; entries generadas por triggers).
- `src/repositories/EvidenceRepository.ts` → `attachments` + Storage.
- `src/repositories/SafeIdRepository.ts` → `safe_ids`.
- `src/repositories/InstitutionalRepository.ts` → vista `persons_institutional` (join con sensibles).
- `src/audit/auditLog.ts` — reemplaza persistencia localStorage por `audit_logs` (mantiene `record/list/subscribe` API).
- `src/auth/InstitutionalSession.tsx` — reemplaza sesión en localStorage por sesión Supabase real (`supabase.auth`). El login institucional del `/institutional` llama a `supabase.auth.signInWithPassword` (email institucional + password) o mantiene el flujo demo actual como fallback si el usuario aún no migró. Se preservan `institutionId`, `membershipId`, `role` derivados de `profiles` + `user_roles` + `organization_memberships`. Backdoor `BASUF-MASTER` se mantiene como *bootstrap* solo mientras no exista `master_admin` real, y desaparece una vez creado el primer admin.
- `src/data/mock/*` — se conservan como **seed inicial** que se inserta en la migración inicial con `is_demo = true` (50 instituciones, 8 personas, desastres, evidencias, safe IDs, rescates). No se dejan como fuente en runtime.

## Seed en migración

La migración final ejecuta `INSERT` de:
- 50 organizaciones de referencia + estados demo (10 aprobadas, 3 pendientes, 1 suspendida).
- 8 personas actuales de `mockPeople` con sus `disappearance_details`, contactos, y timeline inicial.
- 6 desastres actuales (Yaracuy incluido con las cifras vigentes).
- Membresías demo (2 reviewers + 2 viewers).
- Evidencias, safe IDs y rescate mock actuales.

Todo marcado `is_demo = true` para poder purgar más adelante.

## UX / errores (sin rediseño)

Cada repositorio expone errores con mensajes localizados; los componentes ya tienen `try/catch` + toasts (`useToast`) donde corresponde. Se añaden estados de carga en los pocos lugares que hoy son síncronos (formularios de report/create disaster/create institution/invite user) — solo un `disabled` en el submit y un spinner Lucide, sin cambiar layout.

## Fuera de alcance
- Rediseño visual, nuevas rutas, nuevas pantallas.
- IA/embeddings para matching (queda la estructura + función SQL de reglas).
- Emails reales de invitación (solo se genera el enlace, como ya hoy).
- Pagos, integraciones externas.

## Verificación
- Habilitar Cloud → migración crea todas las tablas + seed → build pasa.
- Login como demo `BASUF-MASTER` crea el primer `master_admin` y desactiva el backdoor.
- Crear evento, reportar persona, enviar "Tengo información", aprobar institución, invitar usuario, aceptar invitación → todo persiste tras F5 (ya no depende de localStorage).
- `/search` público muestra solo columnas seguras vía vista.
- Panel de auditoría muestra entradas reales de `audit_logs`.
- Coincidencias sugeridas aparecen tras crear una persona nueva vía trigger + RPC.

## Nota sobre créditos
Todo se implementa en una sola tanda: (1) `supabase--enable`, (2) una migración SQL única con todas las tablas/enums/funciones/triggers/policies/seed, (3) reemplazo interno de repositorios en paralelo, (4) verificación con build. Sin iteraciones cosméticas.
