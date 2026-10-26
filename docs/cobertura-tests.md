# Cobertura de tests — Mini Jira (MVP)

**Fuente de historias:** `docs/backlog.md`
**Fuente de evidencia:** los 6 archivos `*.test.ts` existentes en `apps/api` (localizados con
`find apps/api -iname "*.test.ts" -not -path "*/node_modules/*" -not -path "*/.next/*"`):

- `apps/api/src/app/api/projects/route.test.ts`
- `apps/api/src/app/api/projects/[id]/route.test.ts`
- `apps/api/src/app/api/projects/[id]/tickets/route.test.ts`
- `apps/api/src/app/api/auth/register/route.test.ts`
- `apps/api/src/app/api/auth/login/route.test.ts`
- `apps/api/src/app/api/tickets/[id]/status/route.test.ts`

> **Nota sobre IDs:** `docs/backlog.md` no define IDs formales de historia (tipo `HU-01`); solo
> usa el título "Historia N". Se usa ese título como ID en la tabla, señalando aquí la ausencia
> de una convención formal de identificadores.

> **Nota sobre rutas sin test:** existen handlers implementados en el código fuente para los
> cuales **no existe ningún archivo `*.test.ts`**: `tickets/route.ts` (crear ticket),
> `tickets/[id]/route.ts` (editar/archivar ticket), `tickets/[id]/assignees/route.ts`
> (asignación múltiple), `tickets/[id]/comments/route.ts` (comentarios), `tickets/[id]/lock/route.ts`
> (bloqueo/conflicto), `projects/[id]/members/route.ts` (miembros de proyecto), `users/route.ts`
> y `audit/[ticketId]/route.ts`. Esto se refleja en las historias marcadas ❌ abajo.

## Tabla de cobertura

| Historia | ID | Estado | Evidencia / Justificación |
|---|---|---|---|
| Registro y autenticación | Historia 1 | ✅ cubierta | `register/route.test.ts`: `describe('POST /auth/register')` → "registro exitoso con email obligatorio...", "registro sin email es rechazado con 400", "registro con username ya existente es rechazado por duplicidad (409)". `login/route.test.ts`: `describe('POST /auth/login')` → "login exitoso devuelve el usuario con su rol y un token", "login sin password es rechazado con 400", "login con contraseña incorrecta es rechazado (401)". Los tres escenarios base y los tres edge cases del backlog tienen un `it(...)` correspondiente. |
| Permisos ampliados del Admin sobre tickets | Historia 2 | ❌ no cubierta | No existe `tickets/[id]/route.test.ts` (el handler `tickets/[id]/route.ts` que implementaría editar/archivar existe en el código, pero no tiene test). Ningún archivo de test ejercita edición por Admin de un ticket ajeno, archivado por Admin, ni el rechazo a un Usuario normal que edita un ticket que no le pertenece. |
| Gestión de tickets propios o asignados | Historia 3 | ❌ no cubierta | No hay test para `tickets/[id]/route.ts` (PATCH de edición). Ningún `*.test.ts` cubre "edito un ticket que creé" ni "edito un ticket en el que fui asignado". |
| Archivado (soft-delete) de tickets con trazabilidad | Historia 4 | ❌ no cubierta | No existe ningún test de archivado/soft-delete ni de "Usuario normal intenta archivar un ticket ajeno". `tickets/[id]/route.ts` no tiene `route.test.ts`. |
| Gestión de proyectos y visibilidad por rol | Historia 5 | ⚠️ parcialmente cubierta | `projects/route.test.ts`: `describe('GET /projects')` cubre "lista proyectos paginados" ✅ y "pageSize fuera de rango es rechazado con 400" ✅. `projects/[id]/route.test.ts`: `describe('GET /projects/:id')` cubre "devuelve el proyecto cuando existe" ✅. Pero el escenario central de la historia — "Usuario normal ve solo sus proyectos" — está en **`it.skip(...)`** en ambos archivos, con comentario explícito en el código: "GET /projects no valida Authorization todavía... no hay forma de identificar al usuario normal para filtrar por ownership". Es decir, la seguridad de visibilidad por rol está deshabilitada en los tests, no solo sin cubrir. Tampoco hay test de "Admin ve todos los proyectos", de creación de proyecto (`POST /projects` no tiene test), ni de asignación de miembros (`projects/[id]/members/route.ts` existe en código pero no tiene `route.test.ts`), ni del edge case "Usuario normal intenta asignar miembros a un proyecto que no creó". |
| Creación de tickets con campos completos | Historia 6 | ❌ no cubierta | `tickets/route.ts` (POST) existe en el código pero no tiene `route.test.ts`. Ningún test cubre creación con todos los campos, etiquetas de texto libre, ni el edge case de prioridad fuera de los valores permitidos. |
| Asignación múltiple de responsables | Historia 7 | ❌ no cubierta | `tickets/[id]/assignees/route.ts` existe en el código pero no tiene `route.test.ts`. No hay test de asignar varias personas ni de autoasignación. |
| Filtros de tickets | Historia 8 | ❌ no cubierta | `projects/[id]/tickets/route.test.ts` solo prueba el filtro por `status` (enum del Kanban, ligado a Historia 9), no los filtros por fecha, prioridad, responsable, proyecto o etiquetas que pide esta historia, ni su combinación, ni el caso de "filtro sin resultados". |
| Tablero Kanban con transición secuencial obligatoria | Historia 9 | ⚠️ parcialmente cubierta | `tickets/[id]/status/route.test.ts`: `describe('PATCH /tickets/:id/status')` cubre "avanza un ticket de 'todo' a 'in-progress'" ✅ y "un salto de columnas hacia adelante es rechazado (409 forbidden-transition)" ✅ (todo→done). También cubre validación de enum fuera de rango. Pero falta el escenario de "completar el flujo hasta Terminado" (review→done) y, sobre todo, falta el edge case explícito del backlog "Intento de retroceso de estado" (review→todo) — ningún test ejercita un retroceso. `projects/[id]/tickets/route.test.ts` también prueba el agrupamiento por columnas del Kanban, que refuerza parcialmente esta historia. |
| Resolución de conflictos de edición concurrente | Historia 10 | ❌ no cubierta | `tickets/[id]/lock/route.ts` existe en el código (sugiere lógica de last-write-wins o bloqueo) pero no tiene `route.test.ts`. Ningún test simula dos ediciones concurrentes sobre el mismo ticket. |
| Comentarios en tickets | Historia 11 | ❌ no cubierta | `tickets/[id]/comments/route.ts` existe en el código pero no tiene `route.test.ts`. Ningún test cubre añadir un comentario ni ver el hilo. |
| Modo oscuro | Historia 12 | ❌ no cubierta | No es una funcionalidad de backend; no existe ningún test (ni backend ni se encontró test de frontend) que ejercite el cambio de tema claro/oscuro. |

**Resumen:** 12 historias evaluadas → 1 ✅ cubierta, 2 ⚠️ parcialmente cubiertas, 9 ❌ no cubiertas.

## Top 3 de deuda de testing

1. **Edición y archivado de tickets con control de autorización (Historias 2, 3 y 4).**
   `tickets/[id]/route.ts` implementa edición y soft-delete con reglas de propiedad/asignación
   y privilegios de Admin, pero no tiene ningún `route.test.ts`. Es la lógica de autorización
   más sensible del sistema (quién puede modificar o archivar el trabajo de quién) y hoy no hay
   ninguna prueba automatizada que impida una regresión que permita a un Usuario normal editar
   o archivar tickets ajenos — justamente el riesgo de seguridad que el backlog identifica como
   edge case crítico en ambas historias.

2. **Creación de tickets y asignación múltiple de responsables (Historias 6 y 7).**
   `tickets/route.ts` (POST) y `tickets/[id]/assignees/route.ts` no tienen tests. La creación de
   tickets es el flujo de escritura más usado de toda la aplicación, e involucra validaciones de
   negocio explícitas en el backlog (proyecto obligatorio, prioridad restringida a Alta/Media/Baja,
   etiquetas libres). Sin tests, cualquier regresión en esas validaciones —por ejemplo, permitir
   crear un ticket sin proyecto o con una prioridad inválida— pasaría inadvertida.

3. **Visibilidad por rol y gestión de miembros de proyecto (Historia 5).**
   El único test que verificaba el filtrado de proyectos por ownership (`GET /projects` e
   `GET /projects/:id`) está deshabilitado con `it.skip(...)`, con un comentario en el propio
   código reconociendo que la validación de JWT aún no existe. Esto significa que la regla de
   negocio "un Usuario normal solo ve los proyectos que creó o donde es miembro" no tiene ninguna
   protección activa en la suite de tests. A esto se suma que `projects/[id]/members/route.ts`
   (asignar miembros, incluyendo el edge case de que solo el creador o un Admin puedan hacerlo)
   no tiene ningún test. Es una brecha de seguridad de aislamiento de datos entre equipos/proyectos,
   de las más críticas para un sistema multiusuario.
