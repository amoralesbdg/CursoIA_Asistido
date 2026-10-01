# Frontend Specs — Mini Jira (MVP)

**Estado:** Confirmado por el usuario (contrato de API de la sección 5, autosave/creación explícita, comportamiento de archivados y designación de Admin por backend). No se ha escrito código.
**Fuentes:** `docs/specs.md` (PRD), `docs/backlog.md`, `docs/prototype-spec.md`, `docs/test_plan.md`, `architecture/architecture.md`, `architecture/er_diagram.md`, `docs/adr/001-database-selection.md`, `prototype/` (referencia de comportamiento). No existe `design.md`.

---

## 1. Alcance y decisiones

### 1.1 Cobertura
- **En alcance:** RF-01 a RF-17 (auth, roles, proyectos, tickets, asignación múltiple, filtros, tablero, last-write-wins, comentarios, modo oscuro, estética).
- **Fuera de alcance:** RF-18 (notificaciones por email), RF-19 (dashboard de métricas). Sin pantallas, rutas ni tipos para ellos.

### 1.2 Decisiones confirmadas

| Tema | Decisión |
|---|---|
| Backend | API REST propia en Node.js (Supabase/Postgres por detrás, ADR-001). El frontend **no** usa `supabase-js` y no conoce RLS. |
| Base de código | Proyecto nuevo en `frontend/`. `prototype/` queda solo como referencia visual y de comportamiento; no se importa código de él. |
| Transiciones de estado (RF-13) | Solo hacia adelante, un paso a la vez: Por hacer → En progreso → Review → Terminado. Retroceso y saltos se rechazan. |
| Sesión | Cookie `httpOnly` emitida por el backend; el frontend usa `credentials: 'include'` y nunca lee ni almacena el token. |
| Guardado de ticket | Autosave por campo en edición; last-write-wins sin aviso (RF-14). |
| Contrato de API | Propuesto en la sección 5; el backend deberá cumplirlo o acordar cambios. |
| Gestor de paquetes | npm. |

### 1.3 Contradicciones en las fuentes y su resolución

| Contradicción | Resolución |
|---|---|
| `specs.md` §3 fija SQLite; ADR-001 y `CLAUDE.md` eligen Supabase | Irrelevante para el frontend: solo consume la API REST. Rige el ADR-001. |
| RF-13 / backlog H9 rechazan el retroceso; el prototipo permite mover a columnas contiguas en ambos sentidos | Rige la regla **solo hacia adelante** (decisión del usuario). El menú "Mover a…" solo ofrece el siguiente estado. |
| `prototype-spec.md` C.4 deja abierto "autosave o botón Guardar" | Autosave por campo en edición (ver 8.6). |

---

## 2. Stack y versiones

Versiones verificadas con `npm view` el 2026-09-30. Se fijan con `^` en `package.json` y se congelan con `package-lock.json`.

| Capa | Tecnología | Versión |
|---|---|---|
| Runtime de desarrollo | Node.js (LTS actual) / npm | Node ≥ 22 LTS; probado con Node 25.9 / npm 11.12 |
| UI | React + React DOM | 19.3.0 |
| Lenguaje | TypeScript (`strict: true`) | 7.0.2 |
| Bundler / dev server | Vite + `@vitejs/plugin-react` | 8.3.1 / 6.1.1 |
| Estilos | Tailwind CSS + `@tailwindcss/vite` | 4.3.3 |
| Enrutado | React Router | 8.4.0 |
| Estado de servidor | TanStack Query | 5.104.0 |
| Formularios | React Hook Form | 7.89.0 |
| Validación | Zod + `@hookform/resolvers` | 4.6.5 / 5.9.1 |
| Drag & drop | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | 6.3.1 / 10.0.0 / 3.2.2 |
| Tests unitarios/componentes | Vitest, Testing Library (`react`, `user-event`, `jest-dom`), jsdom | 5.0.3 / 16.3.3, 14.6.7, 7.0.1 / 30.1.1 |
| Mock de red en tests | MSW | 3.0.1 |
| E2E | `@playwright/test` | 1.63.0 |
| Accesibilidad | `@axe-core/playwright` | 4.13.0 |
| Lint / formato | ESLint, `typescript-eslint`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react-hooks`, Prettier | 10.11.0 / 8.71.0 / 6.10.2 / 7.1.1 / 3.9.9 |

**Navegadores objetivo:** últimas 2 versiones de Chrome, Edge, Firefox y Safari (se usan `<dialog>`, `color-mix` y `:has()`). El prototipo solo se auditó en Chrome; el MVP debe ejecutar E2E en Chromium, Firefox y WebKit.

---

## 3. Dependencias

### 3.1 Runtime (`dependencies`)
`react`, `react-dom`, `react-router`, `@tanstack/react-query`, `react-hook-form`, `zod`, `@hookform/resolvers`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.

### 3.2 Desarrollo (`devDependencies`)
`typescript`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`, `@types/react`, `@types/react-dom`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `msw`, `@playwright/test`, `@axe-core/playwright`, `eslint`, `typescript-eslint`, `eslint-plugin-jsx-a11y`, `eslint-plugin-react-hooks`, `prettier`.

### 3.3 Exclusiones deliberadas
Sin librería de componentes (Material, Chakra, etc.), sin librería de iconos externa ni de fechas (se usa `Intl` nativo y un set de iconos SVG propio, stroke 1.5px, según `prototype-spec.md` A.8), sin gestor de estado global (Redux/Zustand): el estado de servidor va en TanStack Query y el de UI en estado local, URL o context.

### 3.4 Scripts npm

| Script | Acción |
|---|---|
| `dev` | Vite dev server (proxy `/api` → backend) |
| `build` | `tsc -b && vite build` |
| `preview` | Sirve el build |
| `lint` / `format` | ESLint / Prettier |
| `typecheck` | `tsc -b --noEmit` |
| `test` / `test:watch` | Vitest |
| `e2e` | Playwright (Chromium, Firefox, WebKit) |
| `audit:axe` | Auditoría axe-core WCAG 2.0/2.1 A + AA, en claro/oscuro × 1280/375 px |

---

## 4. Modelo de datos

Tipos del lado cliente (reflejan `architecture/er_diagram.md`, adaptados al prototipo). Los identificadores son `string` opacos. Las fechas viajan como ISO 8601; `dueDate` como `YYYY-MM-DD`.

### 4.1 Enumeraciones

| Enum | Valores (API) | Etiqueta UI |
|---|---|---|
| `Role` | `admin`, `user` | Admin, Usuario |
| `Priority` | `high`, `medium`, `low` | Alta, Media, Baja |
| `Status` (orden = columnas) | `todo`, `in-progress`, `review`, `done` | Por hacer, En progreso, Review, Terminado |

### 4.2 Entidades

**User**

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | |
| `username` | string | Login (RF-01). Único. |
| `name` | string | Nombre mostrado (avatar/iniciales) |
| `email` | string | Obligatorio (RF-01) |
| `role` | `Role` | |

**Project**

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | |
| `name` | string | 1–80 caracteres |
| `creatorId` | string | |
| `memberIds` | string[] | Incluye al creador |
| `ticketCount` | number | Tickets no archivados |

**Ticket**

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | |
| `key` | string | Legible, p. ej. `MJ-12` (asignado por el backend; fuente mono) |
| `projectId` | string | Obligatorio, exactamente uno (RF-07) |
| `title` | string | Obligatorio, 1–120 |
| `description` | string | Texto plano, opcional |
| `priority` | `Priority` | Obligatorio |
| `dueDate` | string \| null | `YYYY-MM-DD` |
| `status` | `Status` | Por defecto `todo` al crear |
| `assigneeIds` | string[] | 0..N (RF-10) |
| `tags` | string[] | Texto libre, sin lista predefinida (RF-11) |
| `creatorId` | string | |
| `archived` | boolean | Soft-delete (RF-06) |
| `archivedBy` / `archivedAt` | string \| null | Trazabilidad de archivado (RF-05, TC-H2-02) |

**Comment**

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | |
| `ticketId` | string | |
| `authorId` | string | |
| `body` | string | Texto plano, 1–2000; se respeta el salto de línea |
| `createdAt` | string | ISO 8601 |

### 4.3 Esquemas de validación (Zod)

| Formulario | Reglas (mensajes en español, con sugerencia de corrección — WCAG 3.3.3) |
|---|---|
| Login | `username` obligatorio; `password` obligatoria |
| Registro | `username` 3–30 (`[a-zA-Z0-9._-]`); `email` formato válido; `password` ≥ 8 caracteres |
| Proyecto | `name` obligatorio, ≤ 80; `memberIds` opcional |
| Ticket (creación) | `title` obligatorio; `projectId` obligatorio; `priority` ∈ enum; `dueDate` fecha válida o vacía; `tags` sin duplicados (sin distinguir mayúsculas) y ≤ 30 caracteres cada una |
| Comentario | `body` no vacío tras `trim()` |

---

## 5. Contrato de API esperado

Propuesta del frontend al backend. Base `/api/v1`, JSON, cookie de sesión `httpOnly; Secure; SameSite=Lax`. El frontend envía `credentials: 'include'`.

### 5.1 Endpoints

| Método y ruta | Descripción | Respuesta |
|---|---|---|
| `POST /auth/register` | `{username, name, email, password}` | 201 `User` + cookie |
| `POST /auth/login` | `{username, password}` | 200 `User` + cookie |
| `POST /auth/logout` | Invalida la cookie | 204 |
| `GET /auth/me` | Sesión actual | 200 `User` \| 401 |
| `GET /users` | Personas asignables/invitables (id, name, email) | 200 `User[]` |
| `GET /projects` | Solo los visibles para el usuario (RF-09); el backend filtra | 200 `Project[]` |
| `POST /projects` | `{name, memberIds}` | 201 `Project` |
| `PATCH /projects/{id}` | `{name?, memberIds?}` (miembros: solo creador/Admin) | 200 `Project` \| 403 |
| `GET /projects/{id}/tickets` | Query: `priority` (lista), `assigneeId` (lista), `tag` (lista), `dueFrom`, `dueTo`, `includeArchived` | 200 `Ticket[]` |
| `POST /tickets` | Campos de creación (§4.3) | 201 `Ticket` |
| `GET /tickets/{id}` | Detalle | 200 `Ticket` |
| `PATCH /tickets/{id}` | Campos parciales (autosave por campo); no admite `status` ni `archived` | 200 `Ticket` \| 403 |
| `PATCH /tickets/{id}/status` | `{status}` (solo el siguiente estado) | 200 `Ticket` \| 400 transición inválida \| 403 |
| `POST /tickets/{id}/archive` | Soft-delete; registra `archivedBy/At` | 200 `Ticket` \| 403 |
| `POST /tickets/{id}/restore` | Restaura | 200 `Ticket` \| 403 |
| `GET /tickets/{id}/comments` | Orden cronológico ascendente | 200 `Comment[]` |
| `POST /tickets/{id}/comments` | `{body}` | 201 `Comment` \| 403 si el ticket está archivado |
| `POST /tickets/{id}/assignees/me` | Autoasignarse (RF-10) incluso sin permiso de edición | 200 `Ticket` |

### 5.2 Formato de error
`{ "error": { "code": string, "message": string, "fields"?: { [campo: string]: string } } }`

| HTTP | Uso | Tratamiento en UI |
|---|---|---|
| 400 | Validación / transición inválida (`code: INVALID_TRANSITION`) | Errores por campo, o toast "No se puede saltar columnas" |
| 401 | Sin sesión o expirada | Limpiar caché de Query y redirigir a `/login` |
| 403 | Sin permiso | Toast "No tienes permiso para esta acción"; revertir optimista |
| 404 | Recurso inexistente o no visible | Pantalla "No encontrado" |
| 409 | **No se usa** (RF-14: last-write-wins, sin detección de conflicto) | — |
| 5xx / red | Fallo | Mensaje claro + botón "Reintentar" |

---

## 6. Arquitectura de componentes

### 6.1 Capas
1. **`app/`** — bootstrap, providers (`QueryClientProvider`, `RouterProvider`, `ThemeProvider`, `ToastProvider`, `AuthProvider`).
2. **`routes/`** — definición de rutas, layouts y guards.
3. **`features/*`** — pantallas y lógica por dominio (hooks de datos, componentes específicos, esquemas). Una feature no importa de otra salvo vía su `index.ts`.
4. **`components/ui/`** — primitivas de diseño sin conocimiento de dominio.
5. **`lib/`** — cliente HTTP, permisos, reglas de transición, utilidades.

### 6.2 Rutas

| Ruta | Acceso | Pantalla |
|---|---|---|
| `/login`, `/registro` | Solo sin sesión (con sesión → `/proyectos`) | `AuthScreen` (C.1) |
| `/proyectos` | Autenticado | `ProjectsScreen` (C.2) |
| `/proyectos/:projectId` | Autenticado y proyecto visible | `BoardScreen` (C.3, C.5) |
| `/proyectos/:projectId/tickets/:ticketId` | Ídem | `BoardScreen` + `TicketPanel` (C.4, C.6); enlace profundo |
| `*` | — | `NotFound` |

El panel de ticket y los filtros viven en la URL (`?prioridad=&responsable=&etiqueta=&desde=&hasta=`) para que sean compartibles y sobrevivan a recargas.

### 6.3 Árbol de componentes

**`components/ui/`** (nombres alineados con `prototype-spec.md`): `Button`, `TextInput`, `PasswordInput`, `TextArea`, `Select`, `SegmentedControl`, `DatePicker`, `Modal` (sobre `<dialog>`, con trampa y devolución de foco), `SidePanel`, `Toast`, `Skeleton`, `EmptyState`, `ErrorState`, `Avatar`, `AvatarStack`, `Badge` (prioridad / estado / Archivado), `Chip`, `Icon`, `Tooltip`, `Combobox`, `ThemeToggle`, `VisuallyHidden`.

**`features/auth`:** `AuthScreen` → `AuthCard` → `LoginForm` | `RegisterForm`; `AuthProvider`, `useSession`, `RequireAuth`, `RedirectIfAuth`.

**`features/projects`:** `ProjectsScreen` → `ProjectGrid` → `ProjectCard`; `ProjectFormModal` (+ `MemberPicker`); estados skeleton / vacío / error.

**`features/board`:** `BoardScreen` → `BoardHeader`, `FilterBar` (`FilterDropdown` × 5, `FilterChip`, `ClearFiltersButton`, `FilterSheet` móvil), `Board` (`DndContext`) → `BoardColumn` × 4 → `TicketCard`; `MoveMenu` ("Mover a…", alternativa por teclado); `EmptyColumnState`.

**`features/tickets`:** `TicketPanel` → `TicketFields` (`TitleField`, `DescriptionField`, `PrioritySelect`, `DueDateField`, `AssigneePicker`, `ProjectSelect`, `TagInput`, `StatusBadge`), `SaveIndicator`, `ArchiveButton` / `RestoreButton`, `NewTicketForm`.

**`features/comments`:** `CommentSection` → `CommentList` → `CommentItem`; `CommentComposer`.

**`features/theme`:** `ThemeProvider`, `useTheme` (Claro / Oscuro / Sistema).

### 6.4 Estado

| Tipo | Herramienta | Detalle |
|---|---|---|
| Servidor | TanStack Query | Claves: `['me']`, `['users']`, `['projects']`, `['tickets', projectId, filters]`, `['ticket', id]`, `['comments', ticketId]` |
| Sesión | `['me']` + `AuthProvider` | 401 en cualquier request → limpiar caché y redirigir |
| Filtros | URL (`useSearchParams`) | Fuente única de verdad |
| Panel abierto | URL (ruta anidada) | |
| Tema | Context + `localStorage` | Valores `light` \| `dark` \| `system` |
| UI efímera (menús, toasts) | Estado local / context | |

**Mutaciones:**
- *Mover ticket:* actualización **optimista** (mueve la tarjeta), rollback + toast si falla (400/403), invalidación de `['tickets', projectId]` al asentarse.
- *Autosave de campo:* ver 8.6.
- *Crear / archivar / restaurar / comentar:* no optimistas; invalidan las claves afectadas. Comentar conserva el texto si falla.

### 6.5 Cliente HTTP
Un único módulo `lib/api/client.ts` (wrapper de `fetch`): base `/api/v1`, `credentials: 'include'`, parseo de errores al formato de 5.2 en un `ApiError` tipado. Sin lógica de negocio. Los hooks de cada feature (`useProjects`, `useTickets`, …) son la única capa que llama al cliente.

---

## 7. Estructura de carpetas

```
frontend/
├─ index.html
├─ package.json / package-lock.json
├─ tsconfig.json  vite.config.ts  vitest.config.ts  playwright.config.ts
├─ eslint.config.js  .prettierrc
├─ e2e/                    # Playwright: flujos de test_plan.md
├─ audit/                  # axe.mjs
└─ src/
   ├─ main.tsx
   ├─ app/                 # providers, App.tsx
   ├─ routes/              # router.tsx, guards, NotFound
   ├─ features/
   │  ├─ auth/             # components/, api.ts, schemas.ts, useSession.ts
   │  ├─ projects/
   │  ├─ board/            # components/, filters.ts, useBoardDnd.ts
   │  ├─ tickets/
   │  ├─ comments/
   │  └─ theme/
   ├─ components/ui/       # primitivas reutilizables
   ├─ lib/
   │  ├─ api/              # client.ts, ApiError, endpoints por recurso
   │  ├─ permissions.ts    # canEditTicket, canArchive, canMove, canManageMembers
   │  ├─ transitions.ts    # STATUSES, nextStatus(), isValidTransition()
   │  ├─ dates.ts  format.ts
   │  └─ queryClient.ts
   ├─ types/               # User, Project, Ticket, Comment, enums
   ├─ styles/              # index.css: tokens, @theme inline, foco, reduced-motion
   └─ test/                # setup.ts, msw handlers, factories
```

Convenciones: componentes en `PascalCase.tsx`, hooks `useX.ts`, tests junto al archivo (`X.test.tsx`), un componente por archivo, exportaciones nombradas.

---

## 8. Reglas de negocio

`permissions.ts` y `transitions.ts` son **funciones puras**, únicas fuentes de verdad en el cliente, y se cubren con tests unitarios. El backend es la autoridad final (la UI oculta/deshabilita por usabilidad, no por seguridad).

### 8.1 Permisos

| Acción | Admin | Usuario: creador del ticket | Usuario: asignado | Usuario: otro |
|---|---|---|---|---|
| Ver tickets de un proyecto visible | Sí | Sí | Sí | Sí (si ve el proyecto) |
| Editar ticket (RF-03, RF-04) | Sí | Sí | Sí | No (solo lectura) |
| Mover de estado (RF-03, RF-04) | Sí | Sí | Sí | No |
| Archivar / restaurar (RF-05) | Sí | Sí | Sí | No |
| Autoasignarse (RF-10) | Sí | — | — | Sí |
| Asignar a otros (RF-10) | Sí | Sí | Sí | No (solo edición permitida) |
| Comentar | Sí | Sí | Sí | Sí, si ve el ticket y no está archivado |

| Acción sobre proyecto | Admin | Creador | Miembro | Otro |
|---|---|---|---|---|
| Ver (RF-09) | Todos | Sí | Sí | No aparece en el listado |
| Crear (RF-08) | Sí | — | Sí (cualquier usuario) | — |
| Editar nombre | Sí | Sí | No | — |
| Gestionar miembros (RF-09-bis) | Sí | Sí | No (lista en solo lectura) | — |

### 8.2 Visibilidad de proyectos (RF-09)
El frontend muestra exactamente lo que devuelve `GET /projects`. El Admin ve un `RoleBadge` ("Creado por {nombre}") en proyectos que no creó. Un proyecto no visible devuelve 404 en su ruta.

### 8.3 Transición de estado (RF-13)
- Orden fijo: `todo → in-progress → review → done`.
- `nextStatus(s)` devuelve el siguiente o `null` en `done`. `isValidTransition(from, to)` es cierto solo si `to === nextStatus(from)`.
- **Drag & drop (dnd-kit):** las columnas soltables válidas (solo la siguiente) se resaltan con borde `--color-accent`. Soltar en cualquier otra columna cancela el movimiento: la tarjeta vuelve a su lugar y se muestra el toast "Solo puedes mover el ticket a la siguiente columna" (saltos y retrocesos).
- **Teclado/lector de pantalla:** `MoveMenu` ("Mover a…") ofrece únicamente la opción "{siguiente estado}"; en `done` no hay opciones y se indica "Este ticket ya está terminado". dnd-kit con `KeyboardSensor` y anuncios `aria-live` configurados en español.
- **Táctil:** `TouchSensor` de dnd-kit con retardo de activación de 200 ms; `MoveMenu` sigue disponible.
- Sin permiso (8.1): la tarjeta no es arrastrable, cursor `not-allowed` y tooltip "No tienes permiso para mover este ticket".
- Un 400 `INVALID_TRANSITION` del servidor (p. ej. otro usuario movió el ticket antes) revierte el cambio optimista y refresca el tablero.

### 8.4 Archivado / soft-delete (RF-05, RF-06)
- El botón se llama **"Eliminar"** (acción real: archivar; no hay borrado físico). Pide confirmación en un diálogo.
- Por defecto el tablero **no** muestra tickets archivados. Un conmutador "Mostrar archivados" (en `FilterBar`) envía `includeArchived=true`; estos se ven atenuados con `Badge` "Archivado".
- En un ticket archivado: campos deshabilitados, sin mover, sin comentar (comentar exige restaurar); el botón pasa a **"Restaurar"** para quien tenga permiso.
- Se muestra "Archivado por {nombre} · {fecha}" (trazabilidad, sobre todo cuando lo hizo un Admin).

### 8.5 Filtros (RF-12)
- Campos: fecha (rango `dueFrom`–`dueTo`), prioridad, responsable, proyecto, etiquetas.
- Combinación **AND** entre campos. Dentro de un campo: **prioridad = OR** (un ticket tiene una sola), **responsables y etiquetas = AND** (decisión ya tomada en el prototipo, `PLAN.md`).
- El filtro de **proyecto** cambia el proyecto mostrado (la ruta `/proyectos/:projectId`); solo lista proyectos visibles.
- Autocompletado de etiquetas con las existentes en el proyecto; se admite texto libre.
- Chips removibles por filtro activo y "Limpiar filtros" (solo visible si hay alguno). En < 768 px los controles se agrupan en un `FilterSheet` con contador.
- Sin resultados: "Ningún ticket coincide con los filtros" + "Limpiar filtros" destacado.

### 8.6 Autosave por campo (RF-14)
- Aplica **solo a edición** de un ticket existente. La **creación** usa un botón explícito "Crear ticket" (un ticket no existe hasta entonces). *Ver punto abierto P-1.*
- Campos de texto (título, descripción): se guardan al perder el foco, con *debounce* de 800 ms mientras se escribe. Selectores, fecha, prioridad, asignados y etiquetas: se guardan al cambiar.
- Se envía `PATCH /tickets/{id}` con **solo el campo modificado**.
- `SaveIndicator` (región `role="status"`, `aria-live="polite"`): "Guardando…" → "Guardado" → "No se pudo guardar · Reintentar". Un campo inválido (p. ej. título vacío) no se envía y muestra su error inline.
- **Last-write-wins:** no hay control de versión, ni banner de "alguien más editó", ni manejo de 409. La respuesta del servidor reemplaza el valor local del campo guardado; los demás campos en edición no se pisan.
- Al cerrar el panel se fuerza el guardado de campos pendientes.

### 8.7 Ticket
- Proyecto obligatorio y único. Al crear desde el tablero de un proyecto, viene preseleccionado; `ProjectSelect` solo lista proyectos visibles.
- Prioridad solo `Alta | Media | Baja`; nunca se envía otro valor.
- Etiquetas: texto libre; se añaden con `Enter` o coma; sin duplicados; eliminables.
- Asignados: múltiples (`AssigneePicker` combobox con búsqueda por nombre/email sobre `GET /users`). El estado inicial de un ticket nuevo es `todo`.
- Un usuario sin permiso de edición ve el panel en solo lectura, con la única acción habilitada "Asignarme".

### 8.8 Comentarios (RF-15)
Orden cronológico ascendente; timestamp relativo ("hace 2 h") con la fecha completa en `title`/`<time datetime>`. Composer deshabilitado si está vacío; en fallo conserva el texto y muestra "Reintentar". Menciones `@` son texto plano (sin autocompletado ni notificación). Editar/borrar comentarios queda fuera del MVP.

### 8.9 Autenticación (RF-01)
- Registro: usuario, nombre, email (obligatorio) y contraseña. Errores de campo inline; duplicado de usuario → "Ese usuario ya existe. Prueba con otro nombre."
- Login: error genérico "Usuario o contraseña incorrectos" (no revela cuál falló).
- Tras autenticarse → `/proyectos`. Cerrar sesión desde el menú de usuario del shell. Sin "recordarme" ni recuperación de contraseña (no están en `specs.md`).
- Quién es Admin lo decide el backend; el registro **no** permite elegir rol.

### 8.10 Tema (RF-16)
Tres opciones: Claro, Oscuro, Sistema (por defecto, respeta `prefers-color-scheme`). Preferencia persistida en `localStorage` (con `try/catch`). El atributo `data-theme` se aplica antes del primer render para evitar parpadeo. Transición `--duration-slow`, desactivada con `prefers-reduced-motion`. `ThemeToggle` visible también en pantallas de login/registro.

### 8.11 Idioma y formato
Interfaz solo en español; textos literales en los componentes (sin librería de i18n en el MVP). Fechas y números con `Intl` y `es`. Zona horaria: la del navegador; `dueDate` se trata como fecha sin hora.

---

## 9. Sistema de diseño y accesibilidad

Rigen sin cambios **`docs/prototype-spec.md` secciones A (tokens) y B (WCAG 2.1 AA)**: colores, tipografía, espaciado, radios/sombras, movimiento, breakpoints (480/768/1024/1440) e iconografía. Se implementan como CSS variables en `src/styles/index.css`, mapeadas a Tailwind v4 con `@theme inline`.

**Correcciones de contraste que el MVP hereda** (el spec literal no cumple AA; validadas en el prototipo):

| Spec literal | Ratio | Solución |
|---|---|---|
| Texto blanco sobre `blue-500` | 3.65:1 | Botones/links usan `blue-600` vía `--color-accent-action` (5.57:1); `blue-500` solo para foco |
| Error en `red-500` sobre blanco | 3.55:1 | `--color-danger-text: #c4001a` (dark `#ff6961`) |
| Borde de input `gray-300` | 1.47:1 | `--color-border-input: gray-500` (dark `#7b8088`) |

**Requisitos transversales:** base `rem` = 16 px y `body` 15 px; foco visible global (`outline: 2px solid var(--color-accent)`); `<label>` visible en todo input; un `h1` por vista; objetivos táctiles ≥ 24×24 px; reflow a 320 px y zoom 200 %; `prefers-reduced-motion`; color nunca como único portador de significado; `Esc` cierra diálogos y devuelve el foco.

---

## 10. Estados transversales

Toda vista con datos remotos define explícitamente (`prototype-spec.md` B.6):

| Estado | Comportamiento |
|---|---|
| Cargando | `Skeleton` con la forma del contenido final |
| Vacío | Mensaje + acción primaria (p. ej. "Aún no tienes proyectos" + "Crear proyecto") |
| Error | Mensaje claro + "Reintentar" (`ErrorState`) |
| Restringido por rol | Control oculto, o deshabilitado con tooltip que explica el motivo |

Mensajes de confirmación y error transitorios: `Toast` (`role="status"` / `role="alert"`).

---

## 11. Estrategia de pruebas y calidad

| Nivel | Herramienta | Qué cubre |
|---|---|---|
| Unitario | Vitest | `permissions.ts`, `transitions.ts`, esquemas Zod, `filters`, utilidades de fecha |
| Componente | Vitest + Testing Library + MSW | Formularios (errores y mensajes), `TicketCard`, `MoveMenu`, `FilterBar`, autosave y `SaveIndicator`, `CommentComposer` |
| E2E | Playwright (Chromium, Firefox, WebKit) | Casos de `docs/test_plan.md` por Historia: H1 auth, H2–H4 permisos/archivado, H5 proyectos, H6–H7 ticket/asignados, H8 filtros, H9 transiciones (salto y retroceso rechazados), H10 last-write-wins, H11 comentarios, H12 tema |
| Accesibilidad | `@axe-core/playwright` | 0 violaciones WCAG 2.0/2.1 A+AA en claro/oscuro × 1280/375 px, cubriendo los estados de las secciones C.1–C.7; comprobaciones de teclado, reflow 320 px y zoom 200 % |
| Estático | `tsc --noEmit`, ESLint (`jsx-a11y`, `react-hooks`), Prettier | Sin errores ni warnings en CI |

Las E2E corren contra el backend real o un servidor de pruebas que cumpla el contrato de la sección 5; los tests de componente usan MSW con ese mismo contrato.

**Criterio de "hecho" por pantalla:** estados del spec implementados (cargando, vacío, error, restringido), operable solo con teclado, contraste verificado en ambos temas, responsive hasta 320 px, `typecheck`/`lint`/`test` en verde, axe sin violaciones.

**Pendiente de validación manual (no automatizable):** lector de pantalla real (VoiceOver/NVDA) y táctil real.

---

## 12. Trazabilidad RF → Frontend

| RF | Cubierto en |
|---|---|
| RF-01 | §4.3, §5.1 (auth), §8.9, `features/auth` |
| RF-02, RF-03 | §8.1, `permissions.ts` |
| RF-04, RF-05 | §8.1, §8.4 |
| RF-06 | §8.4 |
| RF-07 | §4.2, §8.7 |
| RF-08, RF-09, RF-09-bis | §8.1, §8.2, `features/projects` |
| RF-10 | §8.1, §8.7 (`AssigneePicker`, `/assignees/me`) |
| RF-11 | §4.2, §8.7 |
| RF-12 | §8.5 |
| RF-13 | §8.3, `transitions.ts` |
| RF-14 | §8.6 |
| RF-15 | §8.8 |
| RF-16 | §8.10 |
| RF-17 | §9 |
| RF-18, RF-19 | Fuera de alcance (§1.1) |

---

## 13. Puntos abiertos

| ID | Punto | Propuesta en este documento |
|---|---|---|
| P-1 | ~~El autosave por campo solo tiene sentido en tickets existentes~~ | **Resuelto:** autosave solo en edición; la creación usa el botón explícito "Crear ticket" |
| P-2 | `GET /users` expone a todos nombre y email | Se asume aceptable (empresa de ~10 personas); el backend puede restringirlo |
| P-3 | ~~Quién es el primer Admin y cómo se promueve a otros~~ | **Resuelto:** lo decide el backend; fuera del frontend |
| P-4 | `[PENDIENTE]` SLA de rendimiento (RNF-01) | Sin métricas ni presupuestos de rendimiento hasta que se defina |
| P-5 | Política de CORS/dominio para cookies `SameSite=Lax` | En desarrollo se usa el proxy de Vite (`/api`) para ser same-origin; en producción, servir SPA y API bajo el mismo sitio |
