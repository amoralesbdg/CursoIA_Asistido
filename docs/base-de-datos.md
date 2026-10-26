# Base de datos — Mini Jira (MVP)

> Fuente única: `database-schema.yaml` (raíz del repo). Motor: **PostgreSQL (Supabase)**.
> Este documento es una transcripción fiel de ese archivo. Ninguna tabla, columna o relación aquí presente fue inventada; donde el YAML no especifica algo, se marca como `PENDIENTE: no especificado en database-schema.yaml`.

## 1. ERD (Mermaid)

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : "creator_id (crea)"
    USERS ||--o{ PROJECT_MEMBERS : "user_id (es miembro)"
    PROJECTS ||--o{ PROJECT_MEMBERS : "project_id (tiene miembros)"
    USERS ||--o{ TICKETS : "creator_id (crea)"
    PROJECTS ||--o{ TICKETS : "project_id (agrupa, 1:N)"
    USERS ||--o{ TICKET_ASSIGNEES : "user_id (asignado a)"
    TICKETS ||--o{ TICKET_ASSIGNEES : "ticket_id (tiene asignados)"
    TICKETS ||--o{ TICKET_TAGS : "ticket_id (etiquetado con)"
    TAGS ||--o{ TICKET_TAGS : "tag_id (aplicada a)"
    TICKETS ||--o{ COMMENTS : "ticket_id (tiene comentarios, 1:N)"
    USERS ||--o{ COMMENTS : "author_id (autor de)"
    TICKETS ||--o{ AUDIT_LOG : "ticket_id (tiene historial, 1:N)"
    USERS ||--o{ AUDIT_LOG : "actor_id (realiza)"
    TICKETS ||--|| TICKET_LOCKS : "ticket_id (lock informativo, 1:1)"
    USERS ||--o{ TICKET_LOCKS : "user_id (posee lock)"

    USERS {
        uuid id PK
        text name
        text username UK
        text email UK
        text password_hash
        enum_role role
        timestamptz created_at
    }

    PROJECTS {
        uuid id PK
        text name
        text description
        uuid creator_id FK
        timestamptz created_at
    }

    PROJECT_MEMBERS {
        uuid project_id PK_FK
        uuid user_id PK_FK
        timestamptz added_at
    }

    TICKETS {
        uuid id PK
        text key UK
        uuid project_id FK
        text title
        text description
        enum_status status
        enum_priority priority
        uuid creator_id FK
        date due_date
        timestamptz archived_at
        timestamptz created_at
        timestamptz updated_at
    }

    TICKET_ASSIGNEES {
        uuid ticket_id PK_FK
        uuid user_id PK_FK
        timestamptz assigned_at
    }

    TAGS {
        uuid id PK
        text name UK
    }

    TICKET_TAGS {
        uuid ticket_id PK_FK
        uuid tag_id PK_FK
    }

    COMMENTS {
        uuid id PK
        uuid ticket_id FK
        uuid author_id FK
        text body
        timestamptz created_at
    }

    AUDIT_LOG {
        uuid id PK
        uuid ticket_id FK
        uuid actor_id FK
        enum_audit_action action
        jsonb changes
        timestamptz created_at
    }

    TICKET_LOCKS {
        uuid ticket_id PK_FK
        uuid user_id FK
        timestamptz created_at
    }
```

**Notas sobre las relaciones (según `database-schema.yaml`):**

- `project_members`: relación **N:M** usuario↔proyecto (declarada como `relation: N:M` en el YAML). Clave primaria compuesta `[project_id, user_id]`.
- `ticket_assignees`: relación **N:M** usuario↔ticket (declarada como `relation: N:M`). Clave primaria compuesta `[ticket_id, user_id]`.
- `ticket_tags`: relación **N:M** ticket↔etiqueta (declarada como `relation: N:M`). Clave primaria compuesta `[ticket_id, tag_id]`.
- `ticket_locks`: relación **1:1** con `tickets` (declarada como `relation: "1:1"`). La PK de `ticket_locks` es `ticket_id` (no un `id` propio), lo cual refuerza que a lo sumo existe un lock activo por ticket.
- `projects` → `tickets`: relación **1:N** (un proyecto agrupa muchos tickets; cada ticket pertenece a exactamente un proyecto — RF-07).
- `tickets` → `comments`: relación **1:N** (RF-15, H11).
- `tickets` → `audit_log`: relación **1:N** (historial de cambios, H2/H4).
- `users` → `projects` (vía `creator_id`), `users` → `tickets` (vía `creator_id`), `users` → `comments` (vía `author_id`), `users` → `audit_log` (vía `actor_id`): todas son relaciones **1:N** de tipo "autoría/creación".

## 2. Columnas por tabla

### users

Cuenta de usuario con autenticación propia (RF-01). Tabla propia e independiente, no delega en Supabase Auth.

| Columna | Tipo | Constraints | Notas |
|---|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() | — |
| name | text | NOT NULL | — |
| username | text | NOT NULL, UNIQUE | Login propio con usuario/contraseña (RF-01). Username único (H1 edge case). |
| email | text | NOT NULL, UNIQUE | Email obligatorio por cuenta (RF-01), aunque las notificaciones por email queden en fase 2. |
| password_hash | text | NOT NULL | Hash de contraseña (bcrypt/argon2), nunca texto plano. |
| role | enum(role) | NOT NULL, DEFAULT 'user' | — |
| created_at | timestamptz | NOT NULL, DEFAULT now() | — |

Índices: `username` (unique), `email` (unique).

### projects

Proyecto que agrupa tickets (RF-08). ticket_count se calcula server-side, no se almacena.

| Columna | Tipo | Constraints | Notas |
|---|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() | — |
| name | text | NOT NULL | — |
| description | text | (sin constraints) | — |
| creator_id | uuid | FK→users.id, NOT NULL | Actúa como owner del proyecto (H5). Define visibilidad para usuarios normales (RF-09). |
| created_at | timestamptz | NOT NULL, DEFAULT now() | — |

Notas de tabla:
- "ticket_count NO es columna: se calcula server-side como COUNT(tickets WHERE project_id=... AND archived_at IS NULL) (ver api-contract.md)."
- "No se modela archived_at en projects: specs.md no describe borrado/archivado de proyectos."

### project_members

Relación N:M usuario↔proyecto (RF-09, RF-09-bis). Membresía asignada por el creador del proyecto o un Admin.

| Columna | Tipo | Constraints | Notas |
|---|---|---|---|
| project_id | uuid | FK→projects.id, NOT NULL | — |
| user_id | uuid | FK→users.id, NOT NULL | — |
| added_at | timestamptz | NOT NULL, DEFAULT now() | — |

Clave primaria: `[project_id, user_id]`.

Notas de tabla:
- "El creador del proyecto no se inserta automáticamente aquí: la visibilidad de RF-09 se resuelve con creator_id OR membresía en esta tabla."

### tickets

Ticket asociado a exactamente un proyecto (RF-07, relación 1:N proyecto→ticket).

| Columna | Tipo | Constraints | Notas |
|---|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() | — |
| key | text | NOT NULL, UNIQUE | Formato PREFIJO-N, generado server-side (ver api-contract.md). |
| project_id | uuid | FK→projects.id, NOT NULL | Obligatorio (RF-07, H5 edge case). POST /tickets rechaza si falta. |
| title | text | NOT NULL | — |
| description | text | (sin constraints) | — |
| status | enum(status) | NOT NULL, DEFAULT 'todo' | Transición secuencial obligatoria todo→in-progress→review→done (RF-13, H9). Se valida en la capa de aplicación, no como CHECK de columna. |
| priority | enum(priority) | NOT NULL | — |
| creator_id | uuid | FK→users.id, NOT NULL | — |
| due_date | date | (sin constraints) | Campo 'fecha' de RF-11; filtro por fecha en RF-12. |
| archived_at | timestamptz | (sin constraints) | Soft-delete (RF-06). NULL = activo, no-NULL = archivado. Nunca se borra físicamente. Reemplaza el booleano `archived` del contrato API con un timestamp (permite saber cuándo se archivó). |
| created_at | timestamptz | NOT NULL, DEFAULT now() | — |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | No se usa para detección de conflictos: RF-14 es last-write-wins, sin bloqueo optimista ni aviso de conflicto. |

Índices: `status` (filtro de tablero y listado, RF-12/RF-13), `priority` (filtro por prioridad, RF-12), `project_id` (filtro por proyecto y join con projects, RF-07/RF-12), `archived_at` (excluir archivados por defecto en listados, ver api-contract.md GET /projects/:id/tickets).

### ticket_assignees

Relación N:M usuario↔ticket para asignación múltiple (RF-10).

| Columna | Tipo | Constraints | Notas |
|---|---|---|---|
| ticket_id | uuid | FK→tickets.id, NOT NULL | — |
| user_id | uuid | FK→users.id, NOT NULL | — |
| assigned_at | timestamptz | NOT NULL, DEFAULT now() | — |

Clave primaria: `[ticket_id, user_id]`.

Índices: `user_id` (filtro de tickets por responsable/assignee, RF-12, GET /tickets?assigneeId=).

### tags

Catálogo normalizado de etiquetas de texto libre (RF-11). Sin lista predefinida, pero deduplicadas entre tickets.

| Columna | Tipo | Constraints | Notas |
|---|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() | — |
| name | text | NOT NULL, UNIQUE | — |

Índices: `name` (unique).

### ticket_tags

Relación N:M ticket↔etiqueta (RF-11, RF-12).

| Columna | Tipo | Constraints | Notas |
|---|---|---|---|
| ticket_id | uuid | FK→tickets.id, NOT NULL | — |
| tag_id | uuid | FK→tags.id, NOT NULL | — |

Clave primaria: `[ticket_id, tag_id]`.

Índices: `tag_id` (filtro de tickets por etiqueta, RF-12, GET /tickets?tag=).

### comments

Comentarios internos dentro de un ticket (RF-15, H11). Relación 1:N ticket→comentario.

| Columna | Tipo | Constraints | Notas |
|---|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() | — |
| ticket_id | uuid | FK→tickets.id, NOT NULL | — |
| author_id | uuid | FK→users.id, NOT NULL | — |
| body | text | NOT NULL | — |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Define el orden cronológico del hilo (RF-15). |

Índices: `[ticket_id, created_at]` (listado paginado de comentarios de un ticket en orden cronológico ascendente).

### audit_log

Historial de cambios sobre tickets (H2, H4). Traza acciones de Admin sobre tickets ajenos.

| Columna | Tipo | Constraints | Notas |
|---|---|---|---|
| id | uuid | PK, DEFAULT gen_random_uuid() | — |
| ticket_id | uuid | FK→tickets.id, NOT NULL | — |
| actor_id | uuid | FK→users.id, NOT NULL | Quién realizó la acción. |
| action | enum(audit_action) | NOT NULL | — |
| changes | jsonb | (sin constraints) | Diff simplificado de campos modificados. |
| created_at | timestamptz | NOT NULL, DEFAULT now() | — |

Índices: `[ticket_id, created_at]` (listado paginado de auditoría de un ticket en orden descendente, GET /audit/:ticketId).

Notas de tabla:
- "immutable: true — esta tabla es solo de inserción (INSERT-only). No se permiten UPDATE ni DELETE sobre filas existentes; se recomienda reforzar con política RLS/trigger que rechace esas operaciones."

### ticket_locks

Soft lock informativo de edición (H10). Relación 1:1 con tickets — a lo sumo un lock activo por ticket.

| Columna | Tipo | Constraints | Notas |
|---|---|---|---|
| ticket_id | uuid | PK, FK→tickets.id | — |
| user_id | uuid | FK→users.id, NOT NULL | Quién tiene el lock informativo. |
| created_at | timestamptz | NOT NULL, DEFAULT now() | — |

Notas de tabla:
- "Puramente informativo/presencia: NO bloquea PATCH /tickets/:id (ver api-contract.md, 'Regla de locking'). No contradice RF-14 (last-write-wins)."
- "PK en ticket_id (no un id propio) refuerza la cardinalidad 1:1: un ticket tiene a lo sumo un lock vigente."

## 3. Decisiones de diseño

- **Soft-delete de tickets (`archived_at`)**: en lugar de borrar físicamente un ticket, `tickets.archived_at` se usa como marca de archivado (RF-06). `NULL` significa activo; cualquier valor no-`NULL` significa archivado, y el registro nunca se elimina de la base de datos. Esta columna reemplaza el booleano `archived` del contrato API por un timestamp, lo que permite además saber *cuándo* se archivó el ticket. Por esta misma razón existe un índice sobre `archived_at`, pensado para excluir archivados por defecto en los listados (ver `GET /projects/:id/tickets` en `api-contract.md`).

- **Lock informativo / soft lock sobre tickets (`ticket_locks`)**: `ticket_locks` modela un lock de edición puramente informativo o de "presencia" (H10), no un bloqueo pesimista real. El propio YAML aclara explícitamente que este lock **NO bloquea** las operaciones `PATCH /tickets/:id` (ver `api-contract.md`, sección "Regla de locking"), y que su existencia **no contradice** la regla de RF-14 de *last-write-wins* (última escritura gana, sin bloqueo optimista ni aviso de conflicto). Es decir: `ticket_locks` solo sirve para mostrar en la UI "quién está editando" un ticket, pero cualquier usuario puede seguir enviando un PATCH que sobrescriba los cambios sin importar si hay un lock vigente. La relación es 1:1 con `tickets`, reforzada a nivel de modelo por usar `ticket_id` como PK en lugar de un `id` propio, de modo que a lo sumo puede existir un lock activo por ticket.

- **Audit log inmutable (INSERT-only)**: `audit_log` registra el historial de cambios sobre tickets (altas, actualizaciones, archivado, cambios de estado — ver enum `audit_action`), y el propio YAML marca la tabla como `immutable: true`. Esto significa que la tabla es exclusivamente de inserción: no se permiten `UPDATE` ni `DELETE` sobre filas existentes una vez creadas. El YAML recomienda reforzar esta regla a nivel de base de datos (no solo de aplicación) mediante una política RLS o un trigger que rechace esas operaciones, de forma que el historial de auditoría quede protegido incluso ante accesos directos a la base de datos.

## 4. Fuera de alcance (`out_of_scope`)

Tal como está declarado en `database-schema.yaml`:

- Notificaciones por email (RF-18) — fase 2, sin tabla asociada.
- Dashboard de métricas (RF-19) — fase 2, sin tabla asociada.
- SLA/umbral de rendimiento (RNF-01) — [PENDIENTE] en specs.md, no afecta el modelo de datos.
