# API Reference — Mini Jira (MVP)

> Generado a partir de `docs/api-contract.md` (única fuente). No se ha leído código fuente ni otros documentos.

## Convenciones generales (según el contrato)

- Envelope de éxito: `{ "data": { ... }, "error": null }`.
- Envelope de error: RFC 7807 Problem Details nativo (`type`, `title`, `status`, `detail`, `instance`).
- Auth: JWT en `Authorization: Bearer <token>`, emitido por `POST /auth/login` y `POST /auth/register`. Todo endpoint salvo `/auth/*` lo requiere.
- Paginación offset-based: `?page=1&pageSize=20` (defaults `page=1`, `pageSize=20`, máx `pageSize=100`).
- Tipos de error usados en el contrato: `validation-error` (400), `unauthenticated` (401), `forbidden` (403), `not-found` (404), `duplicate` (409), `forbidden-transition` (409), `internal-error` (500).
- PENDIENTE: no especificado en api-contract.md — el contrato no indica explícitamente el código de status HTTP de las respuestas exitosas (200 vs 201) para ningún endpoint.

---

## Tabla de endpoints

### P0 — desbloquea el Kanban

| Método | Ruta | Auth | Body | Response | Status codes |
|---|---|---|---|---|---|
| POST | `/auth/register` | No requiere token | `{ username, password, email }` | `{ user: User, token }` | PENDIENTE: no especificado en api-contract.md (éxito); 400 `validation-error` (falta email); 409 `duplicate` (username ya existente) |
| POST | `/auth/login` | No requiere token | `{ username, password }` | `{ user: User, token }` | PENDIENTE: no especificado en api-contract.md (éxito); 401 `unauthenticated` (credenciales incorrectas) |
| GET | `/projects` | `Authorization: Bearer {token}` | — (query: `page, pageSize`) | `Paginated<Project>` | PENDIENTE: no especificado en api-contract.md (éxito); 401 `unauthenticated` (convención global, si falta/token inválido) |
| GET | `/projects/:id` | `Authorization: Bearer {token}` | — | `Project` | PENDIENTE: no especificado en api-contract.md (éxito); 404 `not-found` (no existe o sin visibilidad); 401 `unauthenticated` (convención global) |
| GET | `/projects/:id/tickets` | `Authorization: Bearer {token}` | — (query: `status?`) | `{ todo: Ticket[], 'in-progress': Ticket[], review: Ticket[], done: Ticket[] }` o `Ticket[]` si se filtra por `status` | PENDIENTE: no especificado en api-contract.md (éxito); 401 `unauthenticated` (convención global) |
| PATCH | `/tickets/:id/status` | `Authorization: Bearer {token}` | `{ status: Status }` | `Ticket` actualizado | PENDIENTE: no especificado en api-contract.md (éxito); 409 `forbidden-transition` (transición no secuencial); 401 `unauthenticated` (convención global) |

### P1

| Método | Ruta | Auth | Body | Response | Status codes |
|---|---|---|---|---|---|
| GET | `/users` | `Authorization: Bearer {token}` | — | `User[]` (sin `password_hash`) | PENDIENTE: no especificado en api-contract.md (éxito); 401 `unauthenticated` (convención global) |
| GET | `/tickets` | `Authorization: Bearer {token}` | — (query: `projectId?, priority?, assigneeId?, tag?, dueDateFrom?, dueDateTo?, page, pageSize`) | `Paginated<Ticket>` | PENDIENTE: no especificado en api-contract.md (éxito); 401 `unauthenticated` (convención global) |
| POST | `/tickets` | `Authorization: Bearer {token}` | `{ title, description?, projectId, priority, assigneeIds?, tags?, dueDate? }` | `Ticket` creado | PENDIENTE: no especificado en api-contract.md (éxito); 400 `validation-error` (falta `projectId`, o `priority` fuera de enum); 401 `unauthenticated` (convención global) |
| PATCH | `/tickets/:id` | `Authorization: Bearer {token}` | subconjunto de campos editables de `Ticket` | `Ticket` actualizado | PENDIENTE: no especificado en api-contract.md (éxito); 403 `forbidden` (sin ownership: no es admin, creador ni asignado); 401 `unauthenticated` (convención global) |
| DELETE | `/tickets/:id` *(soft-delete)* | `Authorization: Bearer {token}` | — | `Ticket` con `archived: true` | PENDIENTE: no especificado en api-contract.md (éxito); 403 `forbidden` (sin ownership); 401 `unauthenticated` (convención global) |
| POST | `/tickets/:id/assignees` | `Authorization: Bearer {token}` | `{ userId }` | `Ticket` actualizado | PENDIENTE: no especificado en api-contract.md (éxito); 401 `unauthenticated` (convención global) |
| POST | `/projects` | `Authorization: Bearer {token}` | `{ name, description? }` | `Project` creado | PENDIENTE: no especificado en api-contract.md (éxito); 401 `unauthenticated` (convención global) |
| POST | `/projects/:id/members` | `Authorization: Bearer {token}` | `{ userId }` | `Project` actualizado | PENDIENTE: no especificado en api-contract.md (éxito); 403 `forbidden` (actor no es creador ni admin); 401 `unauthenticated` (convención global) |

### P2 ⏳ pendientes de implementación

> Nota del contrato: "el frontend actual es un prototipo de solo lectura... el resto de endpoints de este contrato (CRUD, comentarios, auditoría, auth, locking) no tiene contraparte en código". Los endpoints de esta sección están, además, clasificados explícitamente como P2 en el contrato.

| Método | Ruta | Auth | Body | Response | Status codes | Estado |
|---|---|---|---|---|---|---|
| POST | `/tickets/:id/lock` | `Authorization: Bearer {token}` | — | `Lock` | PENDIENTE: no especificado en api-contract.md (éxito); 401 `unauthenticated` (convención global) | ⏳ P2 — pendiente de implementación |
| DELETE | `/tickets/:id/lock` | `Authorization: Bearer {token}` | — | `null` | PENDIENTE: no especificado en api-contract.md (éxito); 401 `unauthenticated` (convención global); no falla si el lock no existe (según contrato) | ⏳ P2 — pendiente de implementación |
| GET | `/tickets/:id/comments` | `Authorization: Bearer {token}` | — (query: `page, pageSize`) | `Paginated<Comment>` ordenado por `createdAt` asc | PENDIENTE: no especificado en api-contract.md (éxito); 401 `unauthenticated` (convención global) | ⏳ P2 — pendiente de implementación |
| POST | `/tickets/:id/comments` | `Authorization: Bearer {token}` | `{ body }` | `Comment` creado | PENDIENTE: no especificado en api-contract.md (éxito); 401 `unauthenticated` (convención global) | ⏳ P2 — pendiente de implementación |
| GET | `/audit/:ticketId` | `Authorization: Bearer {token}` | — (query: `page, pageSize`) | `Paginated<AuditEntry>` ordenado por `createdAt` desc | PENDIENTE: no especificado en api-contract.md (éxito); 401 `unauthenticated` (convención global) | ⏳ P2 — pendiente de implementación |

---

## Ejemplos curl — endpoints P0

### POST /auth/register

```bash
curl -X POST https://api.minijira.dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "jdoe",
    "password": "PENDIENTE: no especificado en api-contract.md",
    "email": "jdoe@example.com"
  }'
```

> Nota: el contrato no especifica el host/base URL de la API. PENDIENTE: no especificado en api-contract.md.

### POST /auth/login

```bash
curl -X POST https://api.minijira.dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "jdoe",
    "password": "PENDIENTE: no especificado en api-contract.md"
  }'
```

### GET /projects

```bash
curl -X GET "https://api.minijira.dev/projects?page=1&pageSize=20" \
  -H "Authorization: Bearer {token}"
```

### GET /projects/:id

```bash
curl -X GET "https://api.minijira.dev/projects/{id}" \
  -H "Authorization: Bearer {token}"
```

### GET /projects/:id/tickets

```bash
curl -X GET "https://api.minijira.dev/projects/{id}/tickets" \
  -H "Authorization: Bearer {token}"
```

Con filtro por `status` (según el contrato, `status?` es opcional):

```bash
curl -X GET "https://api.minijira.dev/projects/{id}/tickets?status=todo" \
  -H "Authorization: Bearer {token}"
```

### PATCH /tickets/:id/status

```bash
curl -X PATCH "https://api.minijira.dev/tickets/{id}/status" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in-progress"
  }'
```

---

## Huecos de información detectados en el contrato

- No se especifica el status code HTTP de éxito (200/201/204) para ningún endpoint.
- No se especifica la base URL / host de la API.
- No se especifica el formato o requisitos de `password` (longitud mínima, reglas, etc.) para `POST /auth/register` ni `POST /auth/login`.
- No se incluye un ejemplo completo de `Response` (payload real) para ningún endpoint, solo la forma del `data` (tipos de entidad referenciados en la sección "Entidades").
