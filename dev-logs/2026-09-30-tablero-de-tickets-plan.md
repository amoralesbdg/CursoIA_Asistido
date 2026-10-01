# 2026-09-30 — Plan: Tablero de Tickets (Kanban) en `apps/web`

## Contexto

Se construye el Tablero de Tickets del MVP de Mini Jira: navegación desde `ProjectCard` hacia una ruta de tablero por proyecto (`/projects/:projectId/board`), y las piezas de UI que lo componen (`TaskCard`, `KanbanColumn`, `KanbanBoard`), usando los tickets mockeados en `apps/web/src/mocks/`. Se reutiliza al máximo el sistema de átomos/moléculas/organismos ya existente en `apps/web`, evitando duplicar lo que ya hay.

El prototipo navegable (`prototype/src/screens/board/`) ya resuelve visualmente un Kanban completo (`TicketCard.tsx`, `BoardScreen.tsx`), pero vive fuera del workspace pnpm y mezcla estructura con interacciones de producción (drag & drop, menú "Mover a…", estados de hover/drag, fecha vencida resaltada). Por instrucción explícita del usuario, **solo se tomó de ahí la estructura/layout** — las microinteracciones y tweaks visuales quedan fuera de esta fase (planificadas para producción por separado).

## Decisiones tomadas

- **4 columnas, no 3**: el modelo de datos tiene 4 estados (`todo`, `in-progress`, `review`, `done`); se implementan las 4, respetando el modelo de datos existente y el prototipo. (Confirmado con el usuario — el pedido original decía "3 columnas".)
- **Grid responsive**, no fijo con scroll horizontal: 1 columna en mobile, 2 en `md`, 4 en `xl`, por consistencia con `ProjectGrid` (que ya es responsive). (Confirmado con el usuario.)
- **Routing real con `react-router-dom`**: `apps/web` no tenía router instalado; se agrega la dependencia real en vez de un hack de `useState`, porque se pidió una URL compartible/bookmarkeable con soporte de navegación del navegador.
- **`ProjectCard` se extiende, no se duplica**: prop opcional `to?: string` que envuelve el `<article>` existente en `<Link>`. Retrocompatible.
- **`PriorityTag` es un átomo nuevo**, no una variante forzada de `Badge`: `Badge` solo soporta `variant: 'neutral' | 'accent'` (semántica de énfasis fijo); prioridad necesita color dinámico por valor + icono, una dimensión distinta.
- **Los tags del ticket no se extraen a un átomo**: un único consumidor (`TaskCard`) con markup de una línea no justifica una abstracción nueva todavía.
- **`KanbanColumn` es genérico**: no conoce los 4 estados posibles, recibe `status`/`label`/`dotColor` ya resueltos por `KanbanBoard`.

## Archivos nuevos

- `apps/web/src/components/atoms/PriorityTag.tsx`
- `apps/web/src/components/molecules/TaskCard.tsx`
- `apps/web/src/components/organisms/KanbanColumn.tsx`
- `apps/web/src/components/organisms/KanbanBoard.tsx`
- `apps/web/src/pages/ProjectBoardPage.tsx`

## Archivos modificados

- `apps/web/package.json` (agregar `react-router-dom`)
- `apps/web/src/App.tsx` (router + ruta `/projects/:projectId/board`)
- `apps/web/src/mocks/types.ts` (agregar `STATUSES`, `PRIORITY_LABEL`)
- `apps/web/src/components/molecules/ProjectCard.tsx` (prop opcional `to`)
- `apps/web/src/components/organisms/ProjectGrid.tsx` (pasar `to` a `ProjectCard`)
- `apps/web/COMPONENTS.md` (filas nuevas + actualización de `ProjectCard`)

Plan completo aprobado: `~/.claude/plans/pasted-content-id-7f35-lee-components-m-quirky-barto.md`.
