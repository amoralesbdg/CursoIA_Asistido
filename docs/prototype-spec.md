# Prototype Spec — Mini Jira (MVP)

**Fuente:** `docs/specs.md` (Requerimientos Funcionales RF-01 a RF-19) y `architecture/er_diagram.md`.
**Alcance:** Este documento define el sistema de diseño, los estándares de accesibilidad/usabilidad y las especificaciones de UI de cada funcionalidad del MVP identificada en `specs.md`. Todo el contenido de ejemplo (nombres, textos, avatares) es **placeholder** — no representa datos reales de la empresa. Este documento está pensado para alimentar tanto a Claude Code (implementación) como a Google Stitch (generación de UI).
**No incluye:** pantallas de notificaciones por email (RF-18) ni dashboard de métricas (RF-19), por estar fuera de alcance del MVP.

---

## A. Sistema de Diseño — Design Tokens

Estética objetivo: "estilo Apple" — blanco, sombras suaves, minimalista, sin la apariencia "gris" de un Jira tradicional (RF-17). Los tokens se definen como variables semánticas para soportar modo claro y modo oscuro sin duplicar componentes (RF-16).

### A.1 Color — Primitivos

```css
/* Neutrales (escala de gris cálido, no puro #000/#FFF) */
--gray-0:   #FFFFFF;
--gray-50:  #F9FAFB;
--gray-100: #F2F3F5;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-700: #374151;
--gray-800: #1F2328;
--gray-900: #101214;

/* Acento (azul estilo iOS/macOS) */
--blue-500: #0A84FF;
--blue-600: #0066CC;

/* Semánticos de estado */
--green-500:  #34C759; /* éxito / Terminado */
--amber-500:  #FF9F0A;  /* advertencia / Review */
--red-500:    #FF3B30;  /* error / prioridad Alta */
--yellow-500: #FFD60A;  /* prioridad Media */
```

### A.2 Color — Tokens semánticos (light / dark)

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--color-bg-canvas` | `gray-50` | `gray-900` | Fondo general de la app |
| `--color-bg-surface` | `gray-0` | `#17191C` | Cards, modales, paneles (tarjetas de ticket, formularios) |
| `--color-bg-surface-raised` | `gray-0` | `#1F2226` | Elementos elevados (menús, popovers) |
| `--color-border-subtle` | `gray-200` | `#2A2D31` | Bordes de card, separadores |
| `--color-border-strong` | `gray-300` | `#3A3D42` | Bordes de input, focus ring base |
| `--color-text-primary` | `gray-900` | `gray-50` | Texto principal |
| `--color-text-secondary` | `gray-500` | `gray-400` | Metadatos, ayudas, timestamps |
| `--color-text-disabled` | `gray-300` | `gray-600` | Elementos deshabilitados |
| `--color-accent` | `blue-500` | `blue-500` | Acciones primarias, links, focus |
| `--color-accent-contrast` | `gray-0` | `gray-0` | Texto sobre `--color-accent` |
| `--color-success` | `green-500` | `green-500` | Estado "Terminado", confirmaciones |
| `--color-warning` | `amber-500` | `amber-500` | Estado "Review", avisos |
| `--color-danger` | `red-500` | `red-500` | Prioridad Alta, errores, archivar |
| `--color-shadow` | `rgba(16,18,20,0.08)` | `rgba(0,0,0,0.45)` | Base para tokens de elevación |

**Tokens de prioridad (RF-11):**

| Prioridad | Color | Token |
|---|---|---|
| Alta | Rojo | `--priority-high: var(--red-500)` |
| Media | Ámbar/Amarillo | `--priority-medium: var(--yellow-500)` |
| Baja | Verde azulado | `--priority-low: #30B0C7` |

**Tokens de estado del tablero (RF-13):**

| Estado | Token | Color indicador |
|---|---|---|
| Por hacer | `--status-todo` | `gray-400` |
| En progreso | `--status-in-progress` | `blue-500` |
| Review | `--status-review` | `amber-500` |
| Terminado | `--status-done` | `green-500` |

### A.3 Tipografía

```css
--font-family-base: -apple-system, "SF Pro Text", "Inter", system-ui, sans-serif;
--font-family-mono: "SF Mono", "JetBrains Mono", monospace; /* IDs de ticket, código */

--font-size-caption: 12px;  /* line-height 16px — metadatos, timestamps */
--font-size-body-sm: 13px;  /* line-height 18px — texto secundario, labels */
--font-size-body: 15px;     /* line-height 22px — texto de UI por defecto */
--font-size-title-sm: 17px; /* line-height 22px — título de card/modal pequeño */
--font-size-title: 20px;    /* line-height 26px — título de sección */
--font-size-headline: 28px; /* line-height 34px — título de página */

--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
```

### A.4 Espaciado (escala base 4px)

```css
--space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
--space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px; --space-12: 48px;
```

### A.5 Radios, elevación y bordes

```css
--radius-sm: 8px;   /* inputs, chips */
--radius-md: 12px;  /* cards de ticket */
--radius-lg: 16px;  /* modales, paneles */
--radius-full: 999px; /* avatares, badges pill */

--shadow-1: 0 1px 2px var(--color-shadow);                         /* card en reposo */
--shadow-2: 0 2px 8px var(--color-shadow);                         /* card hover / dropdown */
--shadow-3: 0 8px 24px var(--color-shadow);                        /* modal, popover */
--shadow-4: 0 16px 48px var(--color-shadow);                       /* modal grande / drag activo */
```

### A.6 Movimiento

```css
--duration-fast: 120ms;   /* hover, focus */
--duration-base: 200ms;   /* apertura de modal, cambio de columna */
--duration-slow: 320ms;   /* transición de tema claro/oscuro */
--easing-standard: cubic-bezier(0.2, 0, 0, 1);
--easing-decelerate: cubic-bezier(0, 0, 0, 1);

@media (prefers-reduced-motion: reduce) {
  /* todas las duraciones se fuerzan a 0ms; ver sección B.7 */
}
```

### A.7 Layout / breakpoints

| Token | Valor | Uso |
|---|---|---|
| `--breakpoint-sm` | 480px | Móvil |
| `--breakpoint-md` | 768px | Tablet — tablero pasa de scroll horizontal a columnas fijas |
| `--breakpoint-lg` | 1024px | Desktop — sidebar de navegación visible |
| `--breakpoint-xl` | 1440px | Desktop grande — máximo ancho de contenido `1280px`, centrado |
| `--container-max-width` | 1280px | Ancho máximo de contenido principal |

### A.8 Iconografía

- Set de líneas (estilo SF Symbols / Lucide), stroke `1.5px`, tamaños `16px` / `20px` / `24px`.
- Iconos usados: prioridad (bandera), fecha (calendario), responsable (persona/avatar), proyecto (carpeta), etiqueta (tag), comentario (burbuja), archivar (caja), tema (sol/luna).

---

## B. Estándares WCAG 2.1 AA + Usabilidad

Aplica a todas las pantallas descritas en la sección C. Los tokens de la sección A ya están construidos para cumplir contraste en ambos temas; cualquier combinación nueva debe validarse contra esta tabla antes de usarse.

### B.1 Contraste de color

| Criterio WCAG | Regla | Aplicación en el prototipo |
|---|---|---|
| 1.4.3 Contraste mínimo (AA) | Texto normal ≥ 4.5:1, texto grande (≥18.66px bold o ≥24px) ≥ 3:1 | `--color-text-primary` sobre `--color-bg-surface` ≥ 4.5:1 en ambos temas; validar antes de publicar cualquier combinación nueva |
| 1.4.11 Contraste no textual | Componentes de UI e iconos informativos ≥ 3:1 contra el fondo adyacente | Bordes de input, indicadores de columna del tablero, iconos de prioridad |
| — | El color nunca es el único portador de significado | Prioridad y estado siempre llevan color **+ texto/ícono** (ej. "Alta" en rojo + etiqueta de texto "Alta", no solo un punto de color) |

### B.2 Teclado y foco

| Criterio | Regla | Aplicación |
|---|---|---|
| 2.1.1 Teclado | Toda acción (crear ticket, cambiar estado, asignar, comentar, archivar) operable sin mouse | El drag-and-drop del tablero (C.3) debe tener alternativa por teclado: seleccionar ticket + menú "Mover a…" |
| 2.1.2 Sin trampas de teclado | Modales y menús deben poder cerrarse con `Esc` y devolver el foco al elemento que los abrió | Formulario de ticket, modal de asignación, selector de tema |
| 2.4.3 Orden de foco | El orden de tabulación sigue el orden visual/lógico | Formulario de ticket: título → descripción → prioridad → fecha → responsables → proyecto → etiquetas → guardar |
| 2.4.7 Foco visible | Anillo de foco visible en todo elemento interactivo, contraste ≥ 3:1 | `outline: 2px solid var(--color-accent); outline-offset: 2px;` — nunca `outline: none` sin reemplazo |

### B.3 Formularios

| Criterio | Regla | Aplicación |
|---|---|---|
| 3.3.1 Identificación de errores | Error se anuncia en texto, no solo con color | Campo "Email" inválido: borde rojo + mensaje "Introduce un email válido" bajo el campo |
| 3.3.2 Etiquetas o instrucciones | Todo input tiene `<label>` visible asociado (no solo placeholder) | Formulario de login, formulario de ticket, formulario de proyecto |
| 3.3.3 Sugerencia ante errores | El mensaje de error indica cómo corregir | "La contraseña debe tener al menos 8 caracteres" en vez de "Contraseña inválida" |
| 1.3.1 Info y relaciones | Agrupar campos relacionados con `<fieldset>`/`aria-describedby` | Grupo de "Prioridad" (radio/select) con descripción accesible |

### B.4 Estructura y semántica

- Jerarquía de encabezados (`h1`→`h6`) sin saltos, un `h1` por vista.
- Roles ARIA en componentes custom: el tablero Kanban usa `role="list"`/`role="listitem"` por columna y ticket, con `aria-label` indicando la columna (ej. "Columna: En progreso, 4 tickets").
- Nombre accesible en cada botón de solo-ícono (ej. botón de archivar ticket: `aria-label="Archivar ticket"`).

### B.5 Responsive y zoom

- 1.4.4 / 1.4.10: la UI es funcional y sin pérdida de contenido con zoom de hasta 200% y con reflow en viewport de 320px de ancho (sin scroll horizontal salvo el tablero Kanban, que lo declara explícitamente).
- Objetivo de usabilidad (no derivado de un SC de AA, pero aplicado como buena práctica): objetivos táctiles ≥ 24×24px con espaciado suficiente entre acciones adyacentes (ej. botones de acción rápida sobre una card de ticket).

### B.6 Estados de carga, vacío y error (usabilidad, Nielsen heurísticas #1 y #9)

Toda vista con datos remotos (lista de proyectos, tablero, filtros) debe definir explícitamente:
- **Loading:** skeleton de la misma forma que el contenido final (nunca solo un spinner genérico en pantallas con estructura, para reducir el salto de layout).
- **Vacío:** mensaje + ilustración simple + acción primaria (ej. "Aún no tienes proyectos" + botón "Crear proyecto").
- **Error:** mensaje en lenguaje claro + acción de reintento.
- **Restringido por rol:** cuando una acción no está disponible por permisos (RF-03, RF-04, RF-05), el control se oculta (no se deshabilita sin explicación) o, si se deshabilita, incluye tooltip/mensaje indicando el motivo.

### B.7 Movimiento y preferencias del sistema

- 2.3.3 (buena práctica AAA aplicada igualmente): respetar `prefers-reduced-motion` — desactivar animaciones de drag, transición de columnas y cambio de tema cuando está activo.
- Modo oscuro (RF-16) respeta por defecto `prefers-color-scheme` del sistema operativo, con override manual persistente en el selector de tema.

---

## C. Funcionalidades del MVP

Funcionalidades identificadas en `specs.md` (sección 5, RF-01 a RF-17): **Autenticación**, **Gestión de Proyectos**, **Tablero de Tickets**, **Detalle y Formulario de Ticket** (incluye asignación de personas, etiquetas y campos), **Filtros de Tickets**, **Comentarios**, y **Modo Oscuro**. RF-18 y RF-19 quedan fuera de esta especificación.

### C.1 Autenticación (Login / Registro)

**Propósito:** permitir el acceso mediante usuario/contraseña propios, con email obligatorio por cuenta (RF-01), sin proveedor externo.

**Componentes:**
- `AuthCard` (surface centrada, `--shadow-3`, `--radius-lg`, ancho máx. 400px)
- `TextInput` (usuario, email, contraseña) con label visible y estado de error inline (B.3)
- `PasswordInput` con toggle de visibilidad (ícono ojo, `aria-pressed`)
- `Button` primario ("Iniciar sesión" / "Crear cuenta"), ancho completo
- `LinkText` para alternar entre login y registro
- `ThemeToggle` en la esquina superior (persistente incluso pre-login, ver C.7)

**Layout:**
- Pantalla completa, `--color-bg-canvas` de fondo, `AuthCard` centrada vertical y horizontalmente.
- Logo/nombre del producto ("Mini Jira", placeholder) sobre el card.
- En viewport < 480px: card ocupa 100% del ancho con `--space-4` de margen lateral.

**Estados:**
| Estado | Descripción |
|---|---|
| Vacío inicial | Formulario de login por defecto, campos vacíos, botón habilitado (validación al submit) |
| Validando | Botón muestra spinner inline, campos deshabilitados |
| Error de credenciales | Mensaje general sobre el formulario: "Usuario o contraseña incorrectos" (no se especifica cuál falló, por seguridad) |
| Error de validación de campo | Mensaje inline bajo el campo específico (ej. email con formato inválido) — RF-01 |
| Registro exitoso | Redirección automática al estado autenticado (vista de Proyectos, C.2) |

---

### C.2 Gestión de Proyectos

**Propósito:** listar, crear y editar proyectos; controlar visibilidad según rol y membresía (RF-05, RF-08, RF-09, RF-09-bis).

**Componentes:**
- `ProjectCard` (nombre del proyecto, cantidad de tickets, avatares apilados de miembros — máx. 4 visibles + contador "+N")
- `ProjectGrid` / `ProjectList` — grid responsivo de `ProjectCard`
- `Button` "Nuevo proyecto" (esquina superior derecha, ícono `+`)
- `ProjectFormModal`: campo nombre, selector de miembros (multi-select con búsqueda por nombre/email, placeholder)
- `RoleBadge` visible solo para Admin, indicando si el proyecto fue creado por otro usuario

**Layout:**
- Header de página: título "Proyectos" (h1) + botón "Nuevo proyecto" alineado a la derecha.
- Grid de `ProjectCard`: 3 columnas en desktop (`--breakpoint-lg`+), 2 en tablet, 1 en móvil.
- Modal de creación/edición: overlay con `--shadow-4`, ancho máx. 480px, centrado.

**Estados:**
| Estado | Descripción |
|---|---|
| Vista Admin | Ve todos los proyectos de la empresa (RF-09) |
| Vista Usuario normal | Ve solo proyectos creados por él o donde es miembro (RF-09); el resto no aparece en el listado (no hay estado "bloqueado" visible) |
| Vacío | "Aún no tienes proyectos" + botón "Crear proyecto" |
| Cargando | Skeleton de `ProjectCard` (3–6 placeholders) |
| Edición de miembros | Solo visible para el creador del proyecto o un Admin (RF-09-bis); otros usuarios ven la lista de miembros en modo solo lectura |
| Error al guardar | Toast/inline error: "No se pudo guardar el proyecto, intenta de nuevo" |

---

### C.3 Tablero de Tickets (Kanban)

**Propósito:** visualizar y mover tickets a través de 4 columnas fijas con transición secuencial obligatoria (RF-13).

**Componentes:**
- `BoardColumn` × 4: "Por hacer", "En progreso", "Review", "Terminado" — header con nombre + contador + color indicador (`--status-*`)
- `TicketCard`: título, badge de prioridad (color + texto), avatares de responsables (máx. 3 + "+N"), etiquetas (chips, máx. 2 visibles + "+N"), fecha límite
- `DragHandle` implícito en toda la card (drag-and-drop) + acción alternativa por teclado (menú contextual "Mover a…", ver B.2)
- `EmptyColumnState` (ilustración/mensaje sutil dentro de la columna)
- `BoardFilterBar` (ver C.5) anclada sobre el tablero

**Layout:**
- 4 columnas de ancho fijo (~280px) en fila; scroll horizontal en viewport < `--breakpoint-md` (declarado explícitamente, RF-13 requiere ver las 4 columnas).
- `TicketCard` con `--radius-md`, `--shadow-1` en reposo, `--shadow-2` en hover, `--shadow-4` mientras se arrastra.
- Espaciado entre cards: `--space-3`; padding interno de columna: `--space-4`.

**Estados:**
| Estado | Descripción |
|---|---|
| Reposo | Cards distribuidas por estado actual |
| Arrastrando | Card con `--shadow-4` y ligera rotación (2°); columnas destino válidas se resaltan con borde `--color-accent` |
| Movimiento inválido (salto de columna) | Al soltar sobre columna no adyacente: la card vuelve a su posición + toast "No se puede saltar columnas" (RF-13) |
| Movimiento no autorizado | Si el usuario no es Admin, creador ni asignado: card no es arrastrable, cursor `not-allowed`, tooltip "No tienes permiso para mover este ticket" (RF-03/RF-04) |
| Columna vacía | `EmptyColumnState`: "Sin tickets" en texto secundario, centrado |
| Cargando | Skeleton de `TicketCard` en cada columna |

---

### C.4 Detalle y Formulario de Ticket

**Propósito:** crear/editar un ticket con sus campos (RF-11), incluyendo asignación múltiple de personas (RF-10) y resolución de ediciones concurrentes por last-write-wins (RF-14, sin UI de conflicto).

**Componentes:**
- `TicketModal` (o panel lateral deslizante en desktop ancho) con dos zonas: contenido principal (título, descripción) y sidebar de metadatos
- `TextInput` título, `TextArea` descripción (soporta texto plano, placeholder)
- `PrioritySelect`: 3 opciones (Alta/Media/Baja) representadas como `SegmentedControl` o `Select` con color + texto
- `DatePicker` para fecha
- `AssigneeMultiSelect`: campo tipo combobox con búsqueda, muestra avatares seleccionados como chips removibles; cualquier usuario puede asignarse a sí mismo o a otros (RF-10)
- `ProjectSelect`: select de proyecto (1:1 ticket→proyecto, RF-07) — solo proyectos visibles para el usuario (RF-09)
- `TagInput`: chips de texto libre, sin lista predefinida (RF-11), se agregan con `Enter` o coma
- `StatusBadge` (solo lectura en el formulario; el cambio de estado ocurre en el tablero, C.3)
- `ArchiveButton` (ver estados de permiso abajo)
- `CommentSection` (ver C.6) anclada al final del modal/panel

**Layout:**
- Desktop: panel lateral deslizante desde la derecha, 480px de ancho, `--shadow-4`, altura completa con scroll interno.
- Móvil: modal a pantalla completa.
- Sidebar de metadatos (prioridad, fecha, responsables, proyecto, etiquetas) apilado verticalmente con labels a la izquierda (o arriba en móvil).

**Estados:**
| Estado | Descripción |
|---|---|
| Creación | Todos los campos vacíos salvo proyecto (preseleccionado si se abre desde el tablero de un proyecto) |
| Edición | Campos prellenados; guardado autosave o botón explícito "Guardar" (a definir en implementación, no especificado en `specs.md`) |
| Solo lectura por permisos | Usuario normal que no creó ni fue asignado al ticket: campos deshabilitados salvo el propio botón de auto-asignarse (RF-04, RF-10) |
| Guardado con conflicto silencioso | No hay banner de conflicto (RF-14): al guardar, simplemente prevalece la última escritura; el formulario no debe mostrar advertencia de "alguien más editó esto" |
| Archivado (soft-delete) | Ticket archivado se muestra con badge "Archivado" + estilo atenuado (opacidad reducida); el botón cambia a "Restaurar" si el usuario tiene permiso (RF-06) |
| Botón "Eliminar" | Etiqueta visible dice "Eliminar" aunque la acción es soft-delete (supuesto de `specs.md`, sección 4); solo visible para el creador, un asignado, o un Admin (RF-05) |

---

### C.5 Filtros de Tickets

**Propósito:** filtrar el listado/tablero de tickets por fecha, prioridad, responsable, proyecto y etiquetas (RF-12).

**Componentes:**
- `BoardFilterBar`: fila horizontal de controles de filtro sobre el tablero o la lista
- `FilterChip` por cada filtro activo (ej. "Prioridad: Alta ✕"), removible individualmente
- `FilterDropdown` por campo: fecha (rango), prioridad (multi-check Alta/Media/Baja), responsable (búsqueda de persona), proyecto (select, solo proyectos visibles), etiquetas (búsqueda de texto libre con autocompletado de etiquetas existentes)
- `ClearFiltersButton` ("Limpiar filtros"), visible solo cuando hay al menos un filtro activo

**Layout:**
- Barra fija (sticky) debajo del header de página, sobre el tablero/lista.
- En móvil: los controles colapsan en un único botón "Filtros" que abre un panel inferior (bottom sheet) con los mismos controles apilados.

**Estados:**
| Estado | Descripción |
|---|---|
| Sin filtros | Barra muestra solo los controles vacíos, sin chips |
| Filtros activos | Chips visibles + contador en el botón "Filtros" (móvil) |
| Sin resultados | Estado vacío del tablero/lista: "Ningún ticket coincide con los filtros" + `ClearFiltersButton` destacado |
| Combinación de filtros | Los filtros se combinan con AND (ej. prioridad Alta + proyecto X); no se especifica lógica OR en `specs.md` |

---

### C.6 Comentarios del Ticket

**Propósito:** hilo de conversación interno dentro de cada ticket (RF-15).

**Componentes:**
- `CommentList`: lista cronológica ascendente (más antiguo arriba, más reciente abajo)
- `CommentItem`: avatar + nombre del autor + timestamp relativo ("hace 2 h") + contenido en texto plano
- `CommentComposer`: `TextArea` expandible + botón "Comentar" (deshabilitado si el campo está vacío)

**Layout:**
- Sección fija al final del `TicketModal`/panel (C.4), con scroll interno independiente si la lista es larga.
- `CommentComposer` anclado (sticky) al fondo de la sección de comentarios.

**Estados:**
| Estado | Descripción |
|---|---|
| Sin comentarios | "Aún no hay comentarios. Sé el primero en comentar." |
| Cargando | Skeleton de 2–3 `CommentItem` |
| Enviando | Composer deshabilitado, botón con spinner inline |
| Error al enviar | Mensaje inline bajo el composer: "No se pudo publicar el comentario" + botón "Reintentar", el texto escrito no se pierde |

---

### C.7 Modo Oscuro (Tema)

**Propósito:** alternar entre modo claro y oscuro en toda la interfaz (RF-16), aplicando los tokens semánticos de la sección A.2.

**Componentes:**
- `ThemeToggle`: control de 2–3 posiciones (Claro / Oscuro / Sistema), ícono sol/luna, ubicado en la barra de navegación principal (visible en todas las vistas autenticadas y en C.1)

**Layout:**
- Ubicado en la esquina superior derecha de la navegación global, junto al avatar/menú de usuario.

**Estados:**
| Estado | Descripción |
|---|---|
| Sistema (por defecto) | Sigue `prefers-color-scheme` del sistema operativo |
| Claro forzado | Usuario seleccionó explícitamente "Claro"; se persiste la preferencia |
| Oscuro forzado | Usuario seleccionó explícitamente "Oscuro"; se persiste la preferencia |
| Transición | Cambio de tema anima con `--duration-slow` / `--easing-standard`, salvo `prefers-reduced-motion` (B.7) |

---

## D. Trazabilidad Funcionalidad ↔ Requerimiento

| Sección | Requerimientos cubiertos |
|---|---|
| C.1 Autenticación | RF-01 |
| C.2 Gestión de Proyectos | RF-05, RF-08, RF-09, RF-09-bis |
| C.3 Tablero de Tickets | RF-13, RF-03 (autorización de movimiento) |
| C.4 Detalle y Formulario de Ticket | RF-04, RF-05, RF-06, RF-07, RF-10, RF-11, RF-14 |
| C.5 Filtros de Tickets | RF-12 |
| C.6 Comentarios | RF-15 |
| C.7 Modo Oscuro | RF-16 |
| A + B (transversal) | RF-17 (estética), aplicable a toda pantalla |
