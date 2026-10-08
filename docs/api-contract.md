# API Contract — Mini Jira (MVP)

**Fuente:** `docs/backlog.md` (fuente principal de qué endpoints deben existir), `apps/web/src/mocks/types.ts` (shapes de datos), `apps/web/src/store/board.store.ts` (patrón de comportamiento real de red/optimistic update).

**Nota de alcance:** el frontend actual es un prototipo de solo lectura. Solo 2 operaciones tienen código real hoy (`useTicketsByStatus`, `moveTicket`); el resto de endpoints de este contrato (CRUD, comentarios, auditoría, auth, locking) no tiene contraparte en código — se diseñan a partir de `backlog.md` y se marcan como tal en la columna "Origen".

---

## Convenciones globales

### Envelope de respuesta (2xx)

Todas las respuestas exitosas usan:

```json
{ "data": { /* payload o null */ }, "error": null }
```

### Formato de error (4xx/5xx)

RFC 7807 Problem Details, como body nativo de la respuesta HTTP (no se envuelve en `{ data, error }`):

```json
{
  "type": "https://miniJira.dev/errors/forbidden-transition",
  "title": "Transición de estado no permitida",
  "status": 409,
  "detail": "No se puede mover el ticket de 'todo' a 'done' directamente.",
  "instance": "/tickets/t5/status"
}
```

Códigos de `type` usados en este contrato: `validation-error` (400), `unauthenticated` (401), `forbidden` (403), `not-found` (404), `duplicate` (409), `forbidden-transition` (409), `internal-error` (500).

### Paginación

Offset-based en todo listado: query params `?page=1&pageSize=20` (defaults: `page=1`, `pageSize=20`, máx `pageSize=100`). Respuesta:

```json
{
  "data": {
    "items": [ /* ... */ ],
    "page": 1,
    "pageSize": 20,
    "total": 57,
    "totalPages": 3
  },
  "error": null
}
```

### Autenticación

JWT en header `Authorization: Bearer <token>`, emitido por `POST /auth/login` y `POST /auth/register`. Todo endpoint salvo `/auth/*` requiere este header. El `userId` del token define el "usuario actual" para las reglas de ownership (`creatorId`, `assigneeIds`) y de rol (`admin` vs `user`).

### Convención de rutas

REST anidado por relación: un recurso que no tiene sentido sin su padre vive bajo la ruta del padre (`/projects/:id/tickets`, `/tickets/:id/comments`, `/tickets/:id/lock`). Recursos de primer nivel (`/projects`, `/tickets`, `/users`) se listan y filtran con query params.

### Regla de locking (soft lock informativo)

`POST /tickets/:id/lock` y `DELETE /tickets/:id/lock` existen únicamente para mostrar en UI "fulano está editando este ticket ahora" (presencia). **No bloquean la escritura**: `PATCH /tickets/:id` no valida ni rechaza por lock existente. Esto es deliberado para no contradecir la Historia 10 del backlog (last-write-wins, sin aviso de conflicto).

---

## Entidades

| Entidad | Campo | Tipo | Notas |
|---|---|---|---|
| **User** | `id` | string | |
| | `name` | string | |
| | `email` | string | único, obligatorio (H1) |
| | `role` | `'admin' \| 'user'` | default `'user'` |
| **Project** | `id` | string | |
| | `name` | string | |
| | `description` | string? | |
| | `creatorId` | string | `User.id`; actúa como owner (H5) |
| | `memberIds` | string[] | `User.id[]` |
| | `ticketCount` | number | **calculado server-side** (`COUNT(tickets WHERE projectId=... AND NOT archived)`), no almacenado |
| **Ticket** | `id` | string | |
| | `key` | string | formato `PREFIJO-N`, generado server-side |
| | `projectId` | string | obligatorio (H5 edge case) |
| | `title` | string | obligatorio |
| | `description` | string? | |
| | `status` | `'todo'\|'in-progress'\|'review'\|'done'` | transición secuencial obligatoria (H9) |
| | `priority` | `'high'\|'medium'\|'low'` | único enum permitido (H6 edge case) |
| | `assigneeIds` | string[] | multi-asignación (H7) |
| | `creatorId` | string | |
| | `tags` | string[] | texto libre (H6) |
| | `dueDate` | string? | ISO date |
| | `archived` | boolean? | soft-delete (H4) |
| **Comment** *(nuevo, H11)* | `id` | string | |
| | `ticketId` | string | |
| | `authorId` | string | |
| | `body` | string | |
| | `createdAt` | string | ISO datetime, define orden cronológico |
| **AuditEntry** *(nuevo, H2)* | `id` | string | |
| | `ticketId` | string | |
| | `actorId` | string | quién realizó la acción |
| | `action` | `'created'\|'updated'\|'archived'\|'status_changed'` | |
| | `changes` | object? | diff simplificado de campos modificados |
| | `createdAt` | string | ISO datetime |
| **Lock** *(nuevo, H10 soft lock)* | `ticketId` | string | |
| | `userId` | string | quién tiene el lock informativo |
| | `createdAt` | string | ISO datetime |

---

## Endpoints

### P0 — desbloquea el Kanban

| Método + Ruta | Payload request | Response (`data`) | Dispara desde | Reglas de negocio |
|---|---|---|---|---|
| `POST /auth/register` | `{ username, password, email }` | `{ user: User, token }` | *(nuevo, no existe UI aún)* | email obligatorio (H1); username único (H1 edge case) |
| `POST /auth/login` | `{ username, password }` | `{ user: User, token }` | *(nuevo)* | credenciales incorrectas → 401 (H1 edge case) |
| `GET /projects` | query: `page, pageSize` | `Paginated<Project>` | `ProjectsPage.tsx` (reemplaza import directo del mock) | Admin ve todos (H5); user normal solo ve los suyos/donde es miembro — filtrado server-side por `userId` del token |
| `GET /projects/:id` | — | `Project` | `ProjectBoardPage.tsx` (reemplaza `projects.find(...)`) | 404 si no existe o si el usuario no tiene visibilidad |
| `GET /projects/:id/tickets` | query: `status?` (agrupa si se omite) | `{ todo: Ticket[], 'in-progress': Ticket[], review: Ticket[], done: Ticket[] }` o `Ticket[]` si se filtra por `status` | `board.store.ts: useTicketsByStatus` (reemplaza filtrado en memoria de todos los tickets) | excluye `archived: true` por defecto |
| `PATCH /tickets/:id/status` | `{ status: Status }` | `Ticket` actualizado | `board.store.ts: moveTicket`, invocado desde `KanbanBoard.handleDragEnd` | **transición secuencial obligatoria** (`todo→in-progress→review→done`, sin saltos ni retrocesos — H9); 409 `forbidden-transition` si se viola. Reemplaza el mock `simulatePatchStatus()`: éxito 200 actualiza igual que el optimistic update actual, error → cliente hace rollback igual que hoy |

### P1

| Método + Ruta | Payload request | Response (`data`) | Dispara desde | Reglas de negocio |
|---|---|---|---|---|
| `GET /tickets` | query: `projectId?, priority?, assigneeId?, tag?, dueDateFrom?, dueDateTo?, page, pageSize` | `Paginated<Ticket>` | *(nuevo — filtros combinados, H8)* | combina todos los filtros presentes con AND; sin resultados → `items: []` (H8 edge case) |
| `POST /tickets` | `{ title, description?, projectId, priority, assigneeIds?, tags?, dueDate? }` | `Ticket` creado | *(nuevo — formulario de creación, H6)* | `projectId` obligatorio (400 si falta — H5 edge case); `priority` debe ser uno de los 3 valores (400 si no — H6 edge case) |
| `PATCH /tickets/:id` | subconjunto de campos editables de `Ticket` | `Ticket` actualizado | *(nuevo — formulario de edición, H2/H3)* | permitido si `actor.role === 'admin'` O `actor.id === ticket.creatorId` O `actor.id` ∈ `ticket.assigneeIds` (H2, H3); si no, 403. Última escritura gana, sin detección de conflicto (H10) |
| `DELETE /tickets/:id` *(soft-delete)* | — | `Ticket` con `archived: true` | *(nuevo — acción "Eliminar", H4)* | mismo chequeo de ownership que `PATCH` (admin o creador o asignado — H4, H4 edge case); no borra físicamente |
| `POST /tickets/:id/assignees` | `{ userId }` | `Ticket` actualizado | *(nuevo — autoasignación y asignación múltiple, H7)* | agrega `userId` a `assigneeIds` si no está ya presente |
| `POST /projects` | `{ name, description? }` | `Project` creado | *(nuevo — creación de proyecto, H5)* | `creatorId` = usuario del token; cualquier usuario autenticado puede crear |
| `POST /projects/:id/members` | `{ userId }` | `Project` actualizado | *(nuevo — asignar miembros, H5)* | permitido si `actor.id === project.creatorId` O `actor.role === 'admin'` (H5); si no, 403 (H5 edge case) |

### P2

| Método + Ruta | Payload request | Response (`data`) | Dispara desde | Reglas de negocio |
|---|---|---|---|---|
| `POST /tickets/:id/lock` | — | `Lock` | *(nuevo — presencia de edición, H10)* | soft lock informativo; no bloquea `PATCH /tickets/:id` (ver nota arriba) |
| `DELETE /tickets/:id/lock` | — | `null` | *(nuevo)* | libera el lock propio; no falla si no existe |
| `GET /tickets/:id/comments` | query: `page, pageSize` | `Paginated<Comment>` ordenado por `createdAt` asc | *(nuevo — hilo de comentarios, H11)* | orden cronológico |
| `POST /tickets/:id/comments` | `{ body }` | `Comment` creado | *(nuevo — añadir comentario, H11)* | `authorId` = usuario del token |
| `GET /audit/:ticketId` | query: `page, pageSize` | `Paginated<AuditEntry>` ordenado por `createdAt` desc | *(nuevo — historial de cambios, H2/H4)* | registra `archived`/`updated` para trazar acciones de Admin sobre tickets ajenos (H2) |

---

## Matriz de trazabilidad (backlog.md → endpoints)

| Historia | Escenario | Endpoint(s) |
|---|---|---|
| H1 | Registro exitoso con email obligatorio | `POST /auth/register` |
| H1 | Login exitoso | `POST /auth/login` |
| H1 | Registro sin email | `POST /auth/register` (400 validation-error) |
| H1 | Login con credenciales incorrectas | `POST /auth/login` (401) |
| H1 | Registro con username ya existente | `POST /auth/register` (409 duplicate) |
| H2 | Admin edita ticket de otro usuario | `PATCH /tickets/:id` (rol admin) |
| H2 | Admin archiva ticket de cualquier usuario | `DELETE /tickets/:id` + `GET /audit/:ticketId` (traza como admin) |
| H2 | Usuario normal intenta editar ticket ajeno | `PATCH /tickets/:id` (403 forbidden) |
| H3 | Usuario edita ticket que creó | `PATCH /tickets/:id` |
| H3 | Usuario edita ticket donde está asignado | `PATCH /tickets/:id` |
| H4 | Usuario archiva ticket propio | `DELETE /tickets/:id` |
| H4 | Usuario intenta archivar ticket ajeno | `DELETE /tickets/:id` (403 forbidden) |
| H5 | Usuario crea un proyecto | `POST /projects` |
| H5 | Admin ve todos los proyectos | `GET /projects` (rol admin) |
| H5 | Usuario ve solo sus proyectos | `GET /projects` (filtrado por creatorId/memberIds) |
| H5 | Creador asigna miembros | `POST /projects/:id/members` |
| H5 | Admin asigna miembros a cualquier proyecto | `POST /projects/:id/members` (rol admin) |
| H5 | Usuario intenta asignar miembros sin ser creador | `POST /projects/:id/members` (403 forbidden) |
| H5 | Creación de ticket sin proyecto | `POST /tickets` (400 validation-error) |
| H6 | Creación de ticket con todos los campos | `POST /tickets` |
| H6 | Ticket con múltiples etiquetas | `POST /tickets` / `PATCH /tickets/:id` (`tags: string[]`) |
| H6 | Prioridad fuera de valores permitidos | `POST /tickets` (400 validation-error) |
| H7 | Asignar múltiples personas | `POST /tickets/:id/assignees` (repetido) |
| H7 | Autoasignación | `POST /tickets/:id/assignees` |
| H8 | Filtrar por proyecto | `GET /tickets?projectId=` |
| H8 | Filtrar combinando criterios | `GET /tickets?priority=&assigneeId=` |
| H8 | Filtro sin resultados | `GET /tickets` (`items: []`) |
| H9 | Avanzar al siguiente estado | `PATCH /tickets/:id/status` |
| H9 | Completar flujo hasta el final | `PATCH /tickets/:id/status` |
| H9 | Salto de columnas hacia adelante | `PATCH /tickets/:id/status` (409 forbidden-transition) |
| H9 | Retroceso de estado | `PATCH /tickets/:id/status` (409 forbidden-transition) |
| H10 | Edición concurrente, última escritura prevalece | `PATCH /tickets/:id` (sin lock bloqueante) + `POST/DELETE /tickets/:id/lock` (presencia, no bloqueo) |
| H11 | Añadir comentario | `POST /tickets/:id/comments` |
| H11 | Ver hilo de comentarios | `GET /tickets/:id/comments` |
| H12 | Modo oscuro / claro | *(sin endpoint — preferencia de cliente, no persiste en backend)* |

---

## Reglas de negocio transversales (server-side, no presentes en el frontend actual)

- **Ownership:** editar/archivar un ticket requiere `actor.role === 'admin'` O `actor.id === ticket.creatorId` O `actor.id ∈ ticket.assigneeIds`.
- **Rol admin:** `GET /projects` sin filtro de visibilidad; permisos ampliados en `PATCH`/`DELETE /tickets/:id` y `POST /projects/:id/members`.
- **Transición secuencial de Kanban:** `PATCH /tickets/:id/status` solo permite avanzar un paso en el orden `todo → in-progress → review → done` (sin saltos, sin retroceso).
- **Prioridad:** únicamente `high | medium | low`.
- **Proyecto obligatorio:** `POST /tickets` rechaza si falta `projectId`.
- **Last-write-wins:** `PATCH /tickets/:id` nunca devuelve 409 por conflicto de versión; el lock (`/tickets/:id/lock`) es puramente informativo.
- **`ticketCount` de Project:** siempre calculado por el backend (`COUNT` de tickets no archivados), nunca almacenado ni enviado por el cliente — corrige la inconsistencia que hoy existe en el mock estático.
