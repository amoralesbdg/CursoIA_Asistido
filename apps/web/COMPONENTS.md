# Componentes — apps/web

## Button
- **Ubicación:** `src/components/atoms/Button.tsx`
- **Props:** `variant?: 'primary' | 'secondary' | 'danger'` (default `'primary'`), `fullWidth?: boolean` (default `true`), `...ButtonHTMLAttributes<HTMLButtonElement>`
- **Tokens de diseño usados:** `--radius-sm`, altura de control 44px, padding-x `--space-4`, `text-body` peso 600, `--color-accent-action` / `--color-accent-action-hover` (estático), `--color-border-input`, `--color-danger-text`
- **Excluido deliberadamente:** spinner de `loading`/`loadingLabel` y `transition-colors duration-[var(--duration-fast)]` del prototipo — microinteracciones fuera de esta fase
- **Notas:** —

## IconButton
- **Ubicación:** `src/components/atoms/IconButton.tsx`
- **Props:** `icon: ReactNode`, `label: string` (usado como `aria-label`/`title`), `size?: 32 | 36` (default `36`), `...ButtonHTMLAttributes<HTMLButtonElement>`
- **Tokens de diseño usados:** `--radius-sm`, tamaño de botón de icono 32–36px, `--color-text-secondary` (`fg-2`) con hover estático a `--color-bg-canvas`/`--color-text-primary`
- **Excluido deliberadamente:** sin `transition-colors`; nuevo (no existe como componente propio en el prototipo, donde estaba inline en `ProjectCard.tsx`)
- **Notas:** —

## Avatar
- **Ubicación:** `src/components/atoms/Avatar.tsx` (incluye también `AvatarStack`)
- **Props (`Avatar`):** `user: Pick<User, 'id' | 'name'>`, `size?: number` (default `28`)
- **Props (`AvatarStack`):** `users: Pick<User, 'id' | 'name'>[]`, `max?: number` (default `4`), `label?: string` (default `'Miembros'`)
- **Tokens de diseño usados:** `--radius-full`, paleta de tintes fija de avatar (`#bfdbfe #bbf7d0 #fde68a #fbcfe8 #ddd6fe #fed7aa`, texto `#101214`), tipografía semibold al 40% del tamaño, `--color-bg-surface` para el anillo del stack
- **Excluido deliberadamente:** sin transición en el anillo del stack
- **Notas:** decorativo (`aria-hidden`); el nombre accesible completo se expone vía el `aria-label` de `AvatarStack` o debe añadirse como texto visible junto al `Avatar` individual

## Badge
- **Ubicación:** `src/components/atoms/Badge.tsx`
- **Props:** `variant?: 'neutral' | 'accent'` (default `'neutral'`), `children: ReactNode`
- **Tokens de diseño usados:** `--radius-full`, `text-caption` peso medio, `--color-border-subtle`/`--color-bg-canvas` (neutral) o `--color-accent-action`/`--color-accent-contrast` (accent)
- **Excluido deliberadamente:** sin estados interactivos ni transición (el spec de design.md no define hover propio para badges/pills)
- **Notas:** nuevo componente genérico — el prototipo no tenía un `Badge` reutilizable, solo markup inline repetido para pills de prioridad/creador/tag

## Sidebar
- **Ubicación:** `src/components/organisms/Sidebar.tsx`
- **Props:** `items: { id, label, href?, active?, icon? }[]`, `user?: Pick<User, 'id' | 'name'>`, `brand?: string` (default `'Mini Jira'`)
- **Tokens de diseño usados:** `--color-bg-surface`, `--color-border-subtle`, `--space-2`/`--space-4` (padding), `--radius-sm` (item activo/hover), `text-title-sm` (marca), `text-body` (items de nav), `text-body-sm` (bloque de usuario), `--color-accent-action` (logo)
- **Excluido deliberadamente:** sin `ThemeToggle`, sin animación de apertura/cierre (`panel-in`) ni transición de color en hover de los items de nav
- **Notas:** componente **nuevo** — el prototipo (`prototype/src/components/AppShell.tsx`) implementa un header superior, no un sidebar lateral; esta pieza no es un puerto, es nueva. Ancho fijo de 240px (`w-60`) es una decisión de este componente, no un token existente en design.md. Enlaces son placeholders (`href="#"` por defecto) porque no hay router instalado aún

## ProjectCard
- **Ubicación:** `src/components/molecules/ProjectCard.tsx`
- **Props:** `project: Project`, `owner: User` (resuelto por el componente padre a partir de `project.creatorId` — ver decisión de modelado de "responsable" en el plan), `ticketCount?: number` (por defecto usa `project.ticketCount`), `to?: string` (si se pasa, envuelve la card en `<Link to={to}>` de `react-router-dom`; opcional y retrocompatible)
- **Tokens de diseño usados:** `--radius-md`, `--color-border-subtle`, `--color-bg-surface`, `--shadow-1` (en reposo), `--space-4` (padding y gap), `text-title-sm` (nombre), `text-body-sm` (descripción y responsable)
- **Excluido deliberadamente:** `hover:shadow-[var(--shadow-2)]` + `transition-shadow duration-[var(--duration-fast)]` del prototipo; sin `ProjectCardSkeleton` (`animate-pulse`); sin botones de acción Editar/Ver (`canEdit`/`onOpen`) — no pedidos
- **Notas:** usa `Avatar` (atom) y `Badge` (atom) en vez del markup plano del prototipo; `description` es un campo nuevo del modelo (ver `apps/web/src/mocks/types.ts`); `ProjectGrid` la usa con `to={`/projects/${project.id}/board`}` para navegar al Tablero de Tickets

## PriorityTag
- **Ubicación:** `src/components/atoms/PriorityTag.tsx`
- **Props:** `priority: Priority` (`'high' | 'medium' | 'low'`)
- **Tokens de diseño usados:** `--radius-full`, `--color-border-subtle`, `text-caption` peso medio, `--priority-high`/`--priority-medium`/`--priority-low` (color del icono de bandera), etiqueta de texto desde `PRIORITY_LABEL` (`apps/web/src/mocks/types.ts`)
- **Excluido deliberadamente:** sin hover/focus propios ni tooltip
- **Notas:** componente nuevo, no una variante de `Badge` — `Badge` solo soporta `variant: 'neutral' | 'accent'` (colores fijos de énfasis), mientras que prioridad necesita color dinámico por valor + icono, una dimensión distinta

## TaskCard
- **Ubicación:** `src/components/molecules/TaskCard.tsx`
- **Props:** `ticket: Ticket`, `assignees: User[]` (resueltos por el componente padre a partir de `ticket.assigneeIds`, mismo patrón que `ProjectCard` recibe `owner` ya resuelto)
- **Tokens de diseño usados:** `--radius-md`, `--color-border-subtle`, `--color-bg-surface`, `--shadow-1`, `--space-3` (padding y gap); tag de ticket: `--color-bg-canvas`, `--radius-sm`, `text-caption` `fg-2`
- **Excluido deliberadamente** (referencia estructural: `prototype/src/screens/board/TicketCard.tsx`, solo layout, no interacción): drag & drop, menú "Mover a…", clic en título para abrir detalle, estado visual de fecha vencida, animaciones/hover
- **Notas:** compone `AvatarStack` (atom existente), `PriorityTag` (atom nuevo) y `Badge` existente (para "Archivado"); los tags del ticket se renderizan inline (máx. 2 + "+N") en vez de un átomo `Tag` nuevo — único consumidor actual, no justifica la abstracción todavía

## KanbanColumn
- **Ubicación:** `src/components/organisms/KanbanColumn.tsx`
- **Props:** `status: Status`, `label: string`, `dotColor: string`, `tickets: Ticket[]` (ya filtrados por ese status, provistos por `KanbanBoard` vía `useTicketsByStatus`)
- **Tokens de diseño usados:** borde 2px transparente en reposo, `bg-subtle`/40%, `--radius-lg`, padding `--space-4`, alto mínimo 192px, gap interno `--space-3`; encabezado con punto 10px de color, `text-body` semibold (título), contador pill (`--color-border-subtle`, `--color-bg-surface`, `text-caption` `fg-2`)
- **Excluido deliberadamente:** estado visual "destino de drag" (borde `accent` + fondo `accent`/10%) — no pedido en esta fase
- **Notas:** genérico por diseño — no conoce los 4 estados posibles, recibe `label`/`dotColor` ya resueltos por `KanbanBoard`; ya no recibe `usersById` por prop, resuelve `assignees` con `useUsersById()` (`src/store/selectors.ts`); es droppable vía `useDroppable({ id: status })` de `@dnd-kit/core`; renderiza `DraggableTaskCard` en vez de `TaskCard` directo

## DraggableTaskCard
- **Ubicación:** `src/components/molecules/DraggableTaskCard.tsx`
- **Props:** `ticket: Ticket`, `assignees: User[]` (mismo contrato que `TaskCard`)
- **Tokens de diseño usados:** ninguno propio — envuelve `TaskCard` sin estilos adicionales, solo `transform` inline durante el arrastre
- **Excluido deliberadamente:** sin `useSortable`/`SortableContext` (no se pidió reordenar tarjetas dentro de una columna, solo mover entre columnas) ni animación de "vuelta a su lugar" en `DragOverlay` (`dropAnimation: null` en `KanbanBoard`)
- **Notas:** componente nuevo — wrapper con `useDraggable` (`@dnd-kit/core`) que mantiene `TaskCard` puramente presentacional; único consumidor es `KanbanColumn`

## KanbanBoard
- **Ubicación:** `src/components/organisms/KanbanBoard.tsx`
- **Props:** `projectId: string`
- **Tokens de diseño usados:** `--space-4` (gap del grid); grid responsive (`grid-cols-1 md:grid-cols-2 xl:grid-cols-4`, decisión del equipo en vez del grid fijo de 4 columnas del prototipo, por consistencia con `ProjectGrid`)
- **Excluido deliberadamente:** filtros, permisos por rol, skeleton de carga, restricción de transición solo-hacia-adelante (`docs/frontend-specs.md` §8.3) — decisión explícita del usuario para esta fase, ver `dev-logs/`
- **Notas:** ya no recibe `tickets`/`usersById` por props — consume `useTicketsByStatus(projectId)` y `moveTicket` de `src/store/board.store.ts` (Zustand); orquesta una `KanbanColumn` por cada entrada de `STATUSES`; envuelve las columnas en `DndContext` (`PointerSensor`, `onDragStart`/`onDragEnd`) y agrega `DragOverlay` para la tarjeta en vuelo; referencia estructural: `prototype/src/screens/board/BoardScreen.tsx`

## ProjectBoardPage
- **Ubicación:** `src/pages/ProjectBoardPage.tsx`
- **Props:** ninguna (lee `projectId` con `useParams` de `react-router-dom`)
- **Tokens de diseño usados:** `text-headline` (título `h1`), `--space-6` (separación vertical)
- **Excluido deliberadamente:** sin loading/error states dedicados — "proyecto no encontrado" es un mensaje de texto simple
- **Notas:** montada en la ruta `/projects/:projectId/board` en `src/App.tsx`; ya no arma `usersById` ni filtra `tickets` — solo resuelve `project` desde los mocks y pasa `projectId` a `KanbanBoard`, que lee tickets/usuarios del store

## board.store (Zustand)
- **Ubicación:** `src/store/board.store.ts` (+ `src/store/simulateNetwork.ts`, `src/store/selectors.ts`)
- **API:** `useTicketsByStatus(projectId: string): Record<Status, Ticket[]>`, `useBoardStore(state => state.moveTicket): (ticketId: string, newStatus: Status) => void`, `useUsersById(): Map<string, User>`
- **Notas:** fuente de verdad del tablero (reemplaza el prop-drilling `ProjectBoardPage → KanbanBoard → KanbanColumn → TaskCard`); `moveTicket` aplica el cambio de forma optimista (0ms) y llama a `simulatePatchStatus` (setTimeout de 600ms con ~20% de fallo aleatorio, constantes `LATENCY_MS`/`FAILURE_RATE`); si falla, revierte al snapshot de tickets previo al movimiento. Decisión explícita del usuario: usa Zustand pese a que `docs/frontend-specs.md` §3.3 decía "sin gestor de estado global", y no aplica la restricción de transición solo-hacia-adelante de §8.3 — ver `dev-logs/` para el detalle de esta decisión

## ProjectGrid
- **Ubicación:** `src/components/organisms/ProjectGrid.tsx`
- **Props:** `projects: Project[]`, `users: Map<string, User>` (para resolver el `owner` de cada card por `creatorId`)
- **Tokens de diseño usados:** `--space-4` (gap del grid); breakpoints `md`/`lg` para 2/3 columnas (estructural, igual patrón que el prototipo)
- **Excluido deliberadamente:** sin loading/error states, sin modal de creación de proyecto (fuera de alcance de esta fase)
- **Notas:** no existía como componente propio en el prototipo (el grid estaba inline en `ProjectsScreen.tsx`, aunque `docs/prototype-spec.md` sí lo especificaba como pieza separada); estado vacío es un texto simple, sin el empty-state ilustrado del prototipo

## ProjectsPage
- **Ubicación:** `src/pages/ProjectsPage.tsx`
- **Props:** ninguna (consume `apps/web/src/mocks/` directamente)
- **Tokens de diseño usados:** `text-headline` (título `h1`), `--space-6` (separación vertical)
- **Excluido deliberadamente:** sin loading/error states ni modal de creación de proyecto
- **Notas:** montada en `/` dentro de `src/App.tsx` junto al `Sidebar` (sin router instalado aún)
