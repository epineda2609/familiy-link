# Módulo de Instituciones Aprobadas

## Contexto verificado
- El proyecto **no tiene Supabase habilitado**: la autenticación institucional vive en `src/auth/InstitutionalSession.tsx` (localStorage) y los datos usan repos mock en memoria (`PeopleRepository`, `InstitutionalRepository`).
- El formulario de Acceso Institucional (`src/routes/institutional.tsx`) hoy es texto libre: `orgName` + `operatorName` + `role` (admin/reviewer/viewer).
- El Panel Institucional (`institutional.index.tsx`) ya restringe "Crear evento" a `role === "admin"` — mismo patrón reutilizable para "Instituciones".
- Auditoría existente: `src/audit/auditLog.ts`.

Dado que no hay backend real, el módulo se implementa siguiendo el **mismo patrón mock que Disasters/People** (repositorio + seed + persistencia en memoria + localStorage para invitaciones y membresías). Cuando Cloud/Supabase se habilite en el futuro, los repositorios ya tendrán la forma correcta para migrarse. Esto respeta la restricción "no crear un segundo sistema de autenticación / reutilizar el actual".

## Alcance

### 1. Modelo de dominio (`src/domain/institutions.ts` — nuevo)
```ts
InstitutionType = "un_agency"|"red_cross"|"civil_protection"|"fire"|"usar"|
                  "hospital"|"forensic"|"shelter"|"humanitarian"|"child_protection"|
                  "migration"|"government"|"other"
InstitutionStatus = "pending"|"approved"|"rejected"|"suspended"|"archived"|"reference"
MembershipRole   = "reviewer"|"viewer"          // NUNCA admin
MembershipStatus = "invited"|"active"|"suspended"|"revoked"

Institution { id, name, acronym?, normalizedName, country, institutionType,
              officialEmail, contactName, contactEmail, contactPhone, website?,
              registrationNumber?, address?, description?, verificationNotes?,
              status, publicVisibility, isReference, createdByOperator?,
              approvedByOperator?, requestedAt, approvedAt?, rejectedAt?, updatedAt }

InstitutionMembership { id, institutionId, userEmail, userName,
                        institutionalRole, status, inviteToken?,
                        invitedByOperator, invitedAt, activatedAt? }
```

### 2. Repositorio (`src/repositories/InstitutionsRepository.ts` — nuevo)
API: `list(filters)`, `getById`, `create`, `update`, `approve`, `reject`, `suspend`, `reactivate`, `archive`, `listApproved()` (ordenadas alfabéticamente, sólo `status==="approved"`), detección de duplicados (nombre normalizado + país + email institucional + registro), `inviteUser`, `activateInvite(token)`, `listMemberships(institutionId)`, `authenticate(email, institutionId, role)` que valida membresía activa + institución aprobada + rol coincidente.

Persistencia: array en memoria seedado desde `src/data/mock/institutions.ts`, con snapshot en `localStorage` (clave `basuf.institutions.v1`) para que el flujo de aprobación/invitación sobreviva reload.

### 3. Seed inicial (`src/data/mock/institutions.ts` — nuevo)
Cargar las **50 instituciones** de referencia especificadas, con nombre, sigla, país y tipo. Marcado por defecto: `status="reference"`, `isReference=true`. Además, **10 aprobadas** para la demo (mix de ONU, Cruz Roja, protección civil), **3 pendientes** y **1 suspendida**. Membresías demo: 2 reviewers + 2 viewers repartidos en 2 instituciones aprobadas, marcados `demo:true`.

### 4. Acceso Institucional (`src/routes/institutional.tsx`)
Reemplazar los 3 inputs actuales:
- **Organización**: `<select>` alimentado por `InstitutionsRepository.listApproved()` — formato `"Nombre — País"`. Ordenado alfabéticamente. Sin listas duplicadas.
- **Usuario**: input tipo `email` (correo institucional). Placeholder: "correo@institucion.org".
- **Rol**: `<select>` con **sólo** `reviewer` y `viewer`. Opción `admin` eliminada del select.
- Botón secundario "Acceso interno BASUF" que abre un pequeño formulario aparte para rol `admin` (nombre operador + código interno demo) — así se preserva el rol admin actual sin exponerlo en el flujo institucional.

Validación al enviar:
- Institución debe existir y estar aprobada.
- Membresía activa para (email, institutionId) con rol coincidente.
- Errores localizados: institución no aprobada, sin membresía, rol incorrecto.

Persistir en `InstitutionalSession` los campos adicionales `institutionId` y `membershipId` (ampliar el tipo). No cambiar el shape mínimo actual.

### 5. Panel de Administración de Instituciones
Nueva pestaña **"Instituciones"** en el shell (`institutional.tsx`) visible sólo si `role === "admin"`. Nueva ruta `src/routes/institutional.institutions.tsx` con:
- Tabla: Nombre, Sigla, País, Tipo, Estado, #Usuarios, Fecha solicitud, Fecha aprobación, Acciones.
- Filtros: estado, país, tipo, búsqueda por nombre. Paginación cliente simple (20/pág).
- Botón **"Nueva institución"** → modal con todos los campos (nombre, país datalist, tipo, correo institucional, contacto, teléfono, sitio web, registro, dirección, descripción, notas de verificación). Detección de duplicados antes de crear.
- Acciones por fila: Ver, Editar, Aprobar (con confirmación + nota), Rechazar, Suspender, Reactivar, Archivar, Invitar usuario.
- Modal "Invitar usuario": nombre + email + rol (`reviewer|viewer`). Genera token, muestra **"Copiar enlace de invitación"** (`/institutional/accept-invite?token=...`). No envía correos externos.
- Badge **"Institución verificada por BASUF"** sólo cuando `status==="approved"`.
- Indicador **Verificación básica/intermedia/completa** calculado por reglas simples (email institucional presente, contacto presente, registro legal, sitio web, revisión completada).
- Indicadores agregados arriba: aprobadas, pendientes, usuarios activos, suspendidas, países representados, registros aportados.

### 6. Aceptar invitación
Ruta pública `src/routes/institutional.accept-invite.tsx`: valida token, muestra institución + rol, botón "Activar acceso" que marca membresía `active` y redirige a Acceso Institucional con la institución preseleccionada. No maneja contraseñas (sistema de sesión actual no las usa).

### 7. Auditoría
Añadir acciones a `auditLog`: `institution.create|approve|reject|suspend|reactivate|archive|edit`, `institution.invite`, `institution.membership.activate|revoke|roleChange`. Sin cambios estructurales al audit.

### 8. Integración con People/Matching
- Ampliar `PublicPersonCard` con `institutionId?: string` y `createdByUserEmail?: string` (opcional para no romper mocks existentes).
- `createReport` acepta esos campos cuando la sesión los proporciona; en `search` (público) filtrar registros institucionales por institución aprobada + `publicVisibility`. Los registros de instituciones suspendidas permanecen en BD pero se ocultan de búsqueda pública. No se toca el motor de coincidencias más allá de esta relación.

### 9. i18n
Nuevas claves bajo `inst.institutions.*`, `inst.invite.*`, `inst.login.selectOrg`, `inst.role.reviewer|viewer` (los actuales), errores de validación. Añadidas a `es.ts` y `en.ts` (idiomas restantes reutilizan español como fallback como hoy).

## Detalles técnicos

**Archivos nuevos**
- `src/domain/institutions.ts`
- `src/repositories/InstitutionsRepository.ts`
- `src/data/mock/institutions.ts`
- `src/routes/institutional.institutions.tsx`
- `src/routes/institutional.accept-invite.tsx`
- `src/components/institutions/InstitutionFormModal.tsx`
- `src/components/institutions/InviteUserModal.tsx`
- `src/components/institutions/VerifiedBadge.tsx`

**Archivos modificados**
- `src/auth/InstitutionalSession.tsx` — extender sesión con `institutionId`, `membershipId`; añadir helper `signInAsBasufAdmin`.
- `src/routes/institutional.tsx` — reemplazar formulario, añadir pestaña Instituciones.
- `src/repositories/PeopleRepository.ts` + `src/domain/types.ts` — campos `institutionId`, `createdByUserEmail`; filtrado público por institución aprobada.
- `src/i18n/locales/es.ts` + `en.ts`.
- `src/audit/auditLog.ts` — nuevas acciones tipadas.

**Fuera de alcance**: cambios visuales al header, nuevas librerías, gráficos, envío real de correos, edge functions, motor de matching interno.

## Verificación
- Login como admin (código interno demo) → puede crear/aprobar/suspender instituciones.
- Nueva institución queda `pending` y no aparece en el selector.
- Al aprobarla, aparece automáticamente en Acceso Institucional.
- Al suspenderla, desaparece del selector.
- Un usuario invitado activa su acceso vía token y entra sólo con la institución vinculada.
- Selector de rol institucional muestra sólo Revisor y Consulta; forzar `admin` en el DOM es rechazado por el repo.
- Registros creados por institución suspendida no aparecen en `/search`.
- Todos los cambios quedan registrados en `auditLog`.
