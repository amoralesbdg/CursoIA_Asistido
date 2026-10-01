# 2026-09-30 — Integración: Store de Zustand + Drag and Drop + actualización optimista

## Contexto

Los componentes del Tablero (`KanbanBoard`, `KanbanColumn`, `TaskCard`, `ProjectBoardPage`) ya estaban construidos pero eran puramente presentacionales: `ProjectBoardPage` armaba `usersById` y filtraba `tickets` por `projectId` desde mocks estáticos y los empujaba por props hacia abajo, sin estado propio ni interacción real. Esta tarea le da vida al tablero: un store de Zustand como fuente de verdad, drag-and-drop funcional con `@dnd-kit` para mover tickets entre columnas, y actualización optimista con rollback simulando una llamada de red que puede fallar.

## Decisiones tomadas

- **Se usa Zustand pese a `docs/frontend-specs.md` §3.3** ("sin gestor de estado global (Redux/Zustand)"): decisión explícita del usuario para esta tarea puntual, por encima de lo documentado en el spec. Aún no existe código de producción que dependa de esa decisión del spec, solo el documento.
- **No se aplica la restricción de transición solo-hacia-adelante de `docs/frontend-specs.md` §8.3** (`todo → in-progress → review → done`, sin saltos/retrocesos): `moveTicket()` acepta cualquier columna destino. Decisión explícita del usuario — esta fase es solo integración de store/DnD/optimismo, sin reglas de negocio todavía.
- **`useTicketsByStatus(projectId)` agrupado**, no por columna: devuelve `Record<Status, Ticket[]>` completo en una sola llamada; `KanbanBoard` la llama una vez y reparte cada lista a su `KanbanColumn`. Evita 4 llamadas redundantes al mismo proyecto.
- **Simulación de fallo: probabilidad aleatoria ~20%**, no determinista: `FAILURE_RATE = 0.2`, `LATENCY_MS = 600` en `src/store/simulateNetwork.ts`, ajustables. Permite ver tanto el camino exitoso como el rollback en uso normal (verificado también forzando `FAILURE_RATE = 1` temporalmente durante el testing manual).
- **`useDraggable`/`useDroppable` en vez de `useSortable`/`SortableContext`**: no se pidió reordenar tarjetas dentro de una columna, solo moverlas entre columnas — evita traer lógica y animaciones de reflow no pedidas, consistente con "no replicar animaciones del prototipo".
- **`DraggableTaskCard` como wrapper nuevo**, no se mete `useDraggable` dentro de `TaskCard`: mantiene `TaskCard` puramente presentacional (como ya estaba documentado en `COMPONENTS.md`).
- **`DragOverlay` con `dropAnimation: null`**: se considera necesidad funcional (evita que la tarjeta se vea recortada por el `overflow` de su columna de origen al cruzar a otra), no decoración — no contradice la instrucción de no replicar animaciones.
- **Rollback revierte el snapshot completo de `tickets`**, no solo el campo `status` del ticket movido: más robusto ante el caso (raro) de que otro `moveTicket` se dispare en el medio; limitación conocida y aceptada en vez de resolver con colas/versión.
- **Bug encontrado y corregido durante el testing manual**: `useTicketsByStatus` usaba `useShallow` sobre un objeto reconstruido en cada llamada del selector (arrays nuevos cada vez vía `push`), lo que producía un bucle infinito de render ("getSnapshot should be cached", "Maximum update depth exceeded"). Se reemplazó por lectura simple de `state.tickets` + `useMemo` local con deps `[tickets, projectId]`.

## Archivos nuevos

- `apps/web/src/store/board.store.ts` — store Zustand: `tickets`, `moveTicket`, `useTicketsByStatus`
- `apps/web/src/store/simulateNetwork.ts` — `simulatePatchStatus`, `FAILURE_RATE`, `LATENCY_MS`
- `apps/web/src/store/selectors.ts` — `useUsersById`
- `apps/web/src/components/molecules/DraggableTaskCard.tsx` — wrapper `useDraggable` sobre `TaskCard`

## Archivos modificados

- `apps/web/package.json` (agregar `zustand`; `@dnd-kit/*` ya estaba instalado)
- `apps/web/src/components/organisms/KanbanBoard.tsx` (prop `projectId`, `DndContext`/`PointerSensor`/`onDragEnd`/`DragOverlay`, consume `useTicketsByStatus`)
- `apps/web/src/components/organisms/KanbanColumn.tsx` (droppable vía `useDroppable`, consume `useUsersById`, renderiza `DraggableTaskCard`)
- `apps/web/src/pages/ProjectBoardPage.tsx` (simplificado — ya no arma `usersById`/filtra `tickets`, solo pasa `projectId`)
- `apps/web/COMPONENTS.md` (actualiza `KanbanBoard`, `KanbanColumn`, `ProjectBoardPage`; agrega `DraggableTaskCard` y `board.store`)

## Verificación

- `pnpm --filter @minijira/web typecheck` y `build` en verde.
- Prueba funcional con `playwright-core` contra `pnpm --filter @minijira/web dev`: drag de una tarjeta entre columnas confirmado a 0ms (optimista); rollback confirmado forzando `FAILURE_RATE = 1` temporalmente (la tarjeta vuelve a su columna original ~600ms después de soltar); sin errores de consola tras el fix del bucle infinito.

Plan completo aprobado: `~/.claude/plans/delegated-dreaming-dongarra.md`.
