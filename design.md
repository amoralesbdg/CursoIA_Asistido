# design.md — Sistema de diseño Mini Jira

> **Fuente:** extraído del prototipo implementado (`prototype/src/index.css`, `components/*`, `screens/board/*`, `screens/projects/*`) y `docs/prototype-spec.md` §A–B. **No** se analizaron archivos `.dc.html` de Claude Design: no existen en el repo.
> **Convención de estados:** `(código)` = presente en el código del prototipo. `(derivado)` = no está estilizado explícitamente; es el comportamiento del navegador o la regla global. Donde un estado no existe se indica `—`.

---

## 1. Paleta de colores

### 1.1 Primitivos

| Token | Valor | Nota |
|---|---|---|
| `--gray-0` | `#ffffff` | |
| `--gray-50` | `#f9fafb` | |
| `--gray-100` | `#f2f3f5` | |
| `--gray-200` | `#e5e7eb` | |
| `--gray-300` | `#d1d5db` | |
| `--gray-400` | `#9ca3af` | |
| `--gray-500` | `#6b7280` | |
| `--gray-600` | `#4b5563` | |
| `--gray-700` | `#374151` | |
| `--gray-800` | `#1f2328` | |
| `--gray-900` | `#101214` | |
| `--blue-500` | `#0a84ff` | Solo foco, acentos y bordes activos |
| `--blue-600` | `#0066cc` | Acción (5.57:1 con blanco) |
| `--green-500` | `#34c759` | |
| `--amber-500` | `#ff9f0a` | |
| `--red-500` | `#ff3b30` | |
| `--yellow-500` | `#ffd60a` | |

### 1.2 Primarios (marca / acción)

| Rol | Token | Light | Dark |
|---|---|---|---|
| Acento (foco, borde de drop válido) | `--color-accent` | `blue-500` | `blue-500` |
| Texto sobre acento | `--color-accent-contrast` | `gray-0` | `gray-0` |
| Fondo de botón primario | `--color-accent-action` | `blue-600` | `blue-600` |
| Botón primario hover | `--color-accent-action-hover` | `#0058b3` | `#0058b3` |
| Enlace | `--color-link` | `blue-600` | `blue-500` |

### 1.3 Neutros

| Rol | Token | Light | Dark |
|---|---|---|---|
| Fondo de página | `--color-bg-canvas` | `gray-50` | `gray-900` |
| Superficie (card, header, modal) | `--color-bg-surface` | `gray-0` | `#17191c` |
| Superficie elevada (dropdown, toast) | `--color-bg-surface-raised` | `gray-0` | `#1f2226` |
| Borde sutil | `--color-border-subtle` | `gray-200` | `#2a2d31` |
| Borde fuerte | `--color-border-strong` | `gray-300` | `#3a3d42` |
| Borde de input (≥3:1) | `--color-border-input` | `gray-500` | `#7b8088` |
| Texto primario | `--color-text-primary` | `gray-900` | `gray-50` |
| Texto secundario | `--color-text-secondary` | `gray-500` | `gray-400` |
| Texto deshabilitado | `--color-text-disabled` | `gray-300` | `gray-600` |
| Overlay de modal | (literal) `black/40` | `rgba(0,0,0,.4)` | igual |

### 1.4 Estados (feedback, prioridad, columna)

| Rol | Token | Valor |
|---|---|---|
| Éxito | `--color-success` | `green-500` |
| Advertencia | `--color-warning` | `amber-500` |
| Peligro (relleno/icono) | `--color-danger` | `red-500` |
| Peligro (texto/borde, ≥4.5:1) | `--color-danger-text` | light `#c4001a` · dark `#ff6961` |
| Prioridad alta | `--priority-high` | `red-500` |
| Prioridad media | `--priority-medium` | `yellow-500` |
| Prioridad baja | `--priority-low` | `#30b0c7` |
| Columna Por hacer | `--status-todo` | `gray-400` |
| Columna En progreso | `--status-in-progress` | `blue-500` |
| Columna En revisión | `--status-review` | `amber-500` |
| Columna Hecho | `--status-done` | `green-500` |

### 1.5 Interactivos

| Rol | Regla |
|---|---|
| Hover en superficie neutra | fondo `canvas` |
| Hover en icono/texto secundario | texto `fg-2` → `fg` |
| Foco global | `outline: 2px solid var(--color-accent)` con `offset 2px` |
| Columna como destino válido de drop | borde `accent` 2px |
| Columna bajo el cursor durante drag | además fondo `color-mix(in srgb, accent 10%, transparent)` |
| Filtro con selección | borde `accent-action` |
| Avatar (tintes, texto `#101214`) | `#bfdbfe` `#bbf7d0` `#fde68a` `#fbcfe8` `#ddd6fe` `#fed7aa` |

---

## 2. Tipografía

| Propiedad | Valor |
|---|---|
| Familia base | `-apple-system, "SF Pro Text", "Inter", system-ui, sans-serif` |
| Familia mono (claves de ticket) | `"SF Mono", "JetBrains Mono", monospace` |
| Pesos | 400 regular · 500 medium · 600 semibold |
| Base | `html` 16px (rem) · `body` 15px / 22px |

| Token Tailwind | Tamaño | Line-height | Uso |
|---|---|---|---|
| `text-caption` | 12px | 16px | Metadatos, fechas, contadores, claves de ticket |
| `text-body-sm` | 13px | 18px | Labels, texto secundario, errores |
| `text-body` | 15px | 22px | Texto de UI, botones, inputs |
| `text-title-sm` | 17px | 22px | Título de card de proyecto, marca |
| `text-title` | 20px | 26px | Título de sección/modal |
| `text-headline` | 28px | 34px | `h1` de página |

Uso de pesos: labels e items de tarjeta en 500 · botones y títulos en 600 · resto en 400.

---

## 3. Espaciado y layout

### 3.1 Escala (base 4px)

`--space-1` 4 · `--space-2` 8 · `--space-3` 12 · `--space-4` 16 · `--space-5` 20 · `--space-6` 24 · `--space-8` 32 · `--space-10` 40 · `--space-12` 48

### 3.2 Layout

| Elemento | Valor |
|---|---|
| Ancho máximo de contenido | 1280px, centrado |
| Padding horizontal de página | 16px (<768) · 24px (≥768) |
| Padding vertical de `main` | 32px |
| Header | sticky, alto 56px, borde inferior sutil |
| Barra de filtros | sticky bajo el header (`top` 56px) |
| Columna Kanban | padding 16px, alto mínimo 192px, separación interna 12px |
| Card de ticket | padding 12px, gap 12px |
| Card de proyecto | padding 16px, gap 16px |
| Modal | ancho máx. 480px, margen 16px |
| Panel lateral | 480px desde `md`, pantalla completa en móvil |
| Altura de control | botón/input 44px · chip/filtro 40px · botón icono 32–36px |
| Objetivo táctil mínimo | 24×24px |

### 3.3 Breakpoints

`--breakpoint-sm` 480 · `--breakpoint-md` 768 · `--breakpoint-lg` 1024 · `--breakpoint-xl` 1440

### 3.4 Movimiento

| Token | Valor | Uso |
|---|---|---|
| `--duration-fast` | 120ms | Hover, foco |
| `--duration-base` | 200ms | Apertura de panel |
| `--duration-slow` | 320ms | Cambio de tema |
| `--easing-standard` | `cubic-bezier(0.2, 0, 0, 1)` | General |
| `--easing-decelerate` | `cubic-bezier(0, 0, 0, 1)` | Entrada de panel (`translateX(24px)` + fade) |

Con `prefers-reduced-motion` todas las duraciones pasan a 0ms.

---

## 4. Radios de borde

| Token | Valor | Componentes |
|---|---|---|
| `--radius-sm` | 8px | Button, Input, botones de icono, items de menú, tags, logo |
| `--radius-md` | 12px | Card de ticket, card de proyecto, dropdown, popover de filtro, toast |
| `--radius-lg` | 16px | Columna Kanban, modal, bottom sheet (solo arriba), panel (solo izquierda), estado vacío |
| `--radius-full` | 999px | Avatar, badge de prioridad, contador, chip de filtro, ThemeToggle |

---

## 5. Sombras

| Nombre semántico | Token | Valor | Uso |
|---|---|---|---|
| Card en reposo | `--shadow-1` | `0 1px 2px var(--color-shadow)` | Card de ticket/proyecto, ThemeToggle |
| Card hover / dropdown | `--shadow-2` | `0 2px 8px var(--color-shadow)` | Hover de cards |
| Popover / toast | `--shadow-3` | `0 8px 24px var(--color-shadow)` | Menú Mover, filtros, toast |
| Modal / drag | `--shadow-4` | `0 16px 48px var(--color-shadow)` | Modal, panel de ticket |
| Color de sombra | `--color-shadow` | light `rgba(16,18,20,.08)` · dark `rgba(0,0,0,.45)` | |

---

## 6. Componentes y estados

### Button
Alto 44px · radio sm · padding-x 16px · texto `body` semibold · gap 8px · ancho completo por defecto.

| Variante | Default | Hover | Active | Disabled | Focus |
|---|---|---|---|---|---|
| **Primary** | fondo `action`, texto `on-accent` | fondo `action-hover` (código) | — (derivado) | opacidad 60%, cursor `not-allowed` (código) | outline global (derivado) |
| **Secondary** | fondo `surface`, borde `input`, texto `fg` | fondo `canvas` (código) | — | opacidad 60% | outline global |
| **Danger** | fondo `surface`, borde y texto `danger-text` | fondo `canvas` (código) | — | opacidad 60% | outline global |

- **Loading:** spinner 16px, mantiene foco, bloquea reenvío (`aria-disabled`) y no aplica opacidad.
- Transición de color en `--duration-fast`.

### Input (texto / password / search)
Alto 44px · radio sm · padding-x 12px · texto `body` · fondo `surface`.

| Estado | Estilo |
|---|---|
| Default | borde `input`, placeholder `fg-2` |
| Hover | — |
| Active/typing | — |
| Focus | outline global 2px `accent` (derivado) |
| Error | borde `danger-text` + mensaje con icono, texto `body-sm` `danger-text` |
| Disabled | opacidad 60%, `not-allowed` |

Label visible arriba (`body-sm` medium `fg`), ayuda en `caption` `fg-2`. Con `trailing` (toggle de contraseña): padding-right 48px.

### Checkbox / Radio
Nativos 16×16px con `accent-color: accent-action`. Fila de opción con label clicable. Hover/disabled sin estilo propio (derivado). Focus: outline global.

### Badge / Chip / Tag
| Variante | Estilo |
|---|---|
| Prioridad (pill) | borde `subtle`, radio full, `caption` medium, icono bandera con color `--priority-*` |
| Archivado (pill) | borde `input`, radio full, icono 16px |
| Creador (pill) | borde `subtle`, fondo `canvas`, `caption` |
| Tag de ticket | fondo `canvas`, radio sm, `caption` `fg-2`, padding 6×2 |
| Contador de columna | pill con borde `subtle`, fondo `surface`, `caption` `fg-2` |
| Contador de filtros | pill fondo `action`, texto `on-accent` |
| Chip de filtro activo | pill borde `subtle`, fondo `surface`; botón de cierre circular 24px, hover fondo `canvas` y texto `fg` |

Sin estados interactivos propios excepto el botón de cierre del chip.

### Card de ticket
Fondo `surface` · borde `subtle` · radio md · `shadow-1`.

| Estado | Estilo |
|---|---|
| Default | cursor `grab` |
| Hover | `shadow-2` (transición fast) |
| Active (arrastrando) | cursor `grabbing` |
| Dragging | opacidad 40% |
| Archivado | opacidad 75% |
| Disabled (sin permiso) | cursor `not-allowed`, icono candado en lugar del menú Mover |
| Focus | outline global en el título (botón) y en el menú |

- Título: botón de texto, hover subrayado.
- Fecha vencida: texto `danger-text` medium, icono alerta.

### Card de proyecto
Fondo `surface` · borde `subtle` · radio md · `shadow-1`.

| Estado | Estilo |
|---|---|
| Default | — |
| Hover | `shadow-2`; título subrayado |
| Active | — |
| Disabled | — |
| Focus | outline global en título y botón de acción |

Botón de acción 36×36px: texto `fg-2`; hover fondo `canvas` y texto `fg`.

### Columna Kanban
Borde 2px, fondo `subtle` al 40%, radio lg.

| Estado | Estilo |
|---|---|
| Default | borde transparente |
| Destino válido (durante drag) | borde `accent` |
| Hover del drag sobre destino válido | borde `accent` + fondo `accent` al 10% |
| Destino inválido | sin cambio (soltar cancela con toast) |

Encabezado: punto 10px con `--status-*`, título `body` semibold, contador.

### Modal / Panel lateral / Bottom sheet
`<dialog>` nativo · fondo `surface` · borde `subtle` · `shadow-4` · backdrop `black/40`. Panel con animación `panel-in`. Foco inicial en `[data-autofocus]`. Esc cierra, salvo estado `busy`. Clic en backdrop cierra.

### Menú desplegable (Mover, Filtros)
Fondo `raised` · borde `subtle` · radio md · `shadow-3` · `z-20`. Ancho mín. 192px (menú) · 288px (filtro).

| Estado del item | Estilo |
|---|---|
| Default | alto 40px, padding-x 12px, radio sm, `body` `fg` |
| Hover / Focus-visible | fondo `canvas` |
| Active | — |
| Disabled | — |

Disparador de filtro: alto 40px, borde `input` (con selección: `accent-action`).

### Toast
Fondo `raised` · borde `subtle` · radio md · `shadow-3` · `body`. Fijo abajo, centrado, `z-50`. Se cierra solo a los 6s. Botón de cierre 32px: texto `fg-2` → `fg` en hover.

### Avatar / AvatarStack
Círculo 28px, fondo tinte, iniciales semibold a 40% del tamaño. Stack con solape −8px y anillo 2px `surface`. Contador `+N`: fondo `canvas`, `caption` semibold. Decorativo, sin estados.

### ThemeToggle
Grupo pill con borde `subtle`, fondo `surface`, `shadow-1`, padding 4px. Opciones circulares de 28px (32px desde `sm`), con transición fast. Opciones: Claro, Oscuro y Sistema.

### Enlace
Color `anchor`. Hover: subrayado (o sin subrayado si estaba subrayado). Focus: outline global.

### Skeleton
Bloques `canvas` con `animate-pulse`, mismo radio y padding que la card real.

### Estado vacío
Borde discontinuo `input`, fondo `surface`, radio lg, padding 40px, texto centrado (`title-sm` semibold + `body` `fg-2`).

### Iconografía
Estilo de línea, trazo 1.5px, tamaños 16/20/24px.

---

## 7. Variables consolidadas

```css
:root {
  /* Primitivos */
  --gray-0: #ffffff; --gray-50: #f9fafb; --gray-100: #f2f3f5; --gray-200: #e5e7eb;
  --gray-300: #d1d5db; --gray-400: #9ca3af; --gray-500: #6b7280; --gray-600: #4b5563;
  --gray-700: #374151; --gray-800: #1f2328; --gray-900: #101214;
  --blue-500: #0a84ff; --blue-600: #0066cc;
  --green-500: #34c759; --amber-500: #ff9f0a; --red-500: #ff3b30; --yellow-500: #ffd60a;

  /* Semánticos (light) */
  --color-bg-canvas: var(--gray-50);
  --color-bg-surface: var(--gray-0);
  --color-bg-surface-raised: var(--gray-0);
  --color-border-subtle: var(--gray-200);
  --color-border-strong: var(--gray-300);
  --color-border-input: var(--gray-500);
  --color-text-primary: var(--gray-900);
  --color-text-secondary: var(--gray-500);
  --color-text-disabled: var(--gray-300);
  --color-accent: var(--blue-500);
  --color-accent-contrast: var(--gray-0);
  --color-accent-action: var(--blue-600);
  --color-accent-action-hover: #0058b3;
  --color-link: var(--blue-600);
  --color-success: var(--green-500);
  --color-warning: var(--amber-500);
  --color-danger: var(--red-500);
  --color-danger-text: #c4001a;
  --color-shadow: rgba(16, 18, 20, 0.08);

  /* Dominio */
  --priority-high: var(--red-500);
  --priority-medium: var(--yellow-500);
  --priority-low: #30b0c7;
  --status-todo: var(--gray-400);
  --status-in-progress: var(--blue-500);
  --status-review: var(--amber-500);
  --status-done: var(--green-500);

  /* Tipografía */
  --font-sans: -apple-system, "SF Pro Text", "Inter", system-ui, sans-serif;
  --font-mono: "SF Mono", "JetBrains Mono", monospace;
  --font-weight-regular: 400; --font-weight-medium: 500; --font-weight-semibold: 600;
  --text-caption: 12px;   --text-caption--line-height: 16px;
  --text-body-sm: 13px;   --text-body-sm--line-height: 18px;
  --text-body: 15px;      --text-body--line-height: 22px;
  --text-title-sm: 17px;  --text-title-sm--line-height: 22px;
  --text-title: 20px;     --text-title--line-height: 26px;
  --text-headline: 28px;  --text-headline--line-height: 34px;

  /* Espaciado y layout */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 20px;
  --space-6: 24px; --space-8: 32px; --space-10: 40px; --space-12: 48px;
  --container-max-width: 1280px;
  --breakpoint-sm: 480px; --breakpoint-md: 768px; --breakpoint-lg: 1024px; --breakpoint-xl: 1440px;

  /* Radios */
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 16px; --radius-full: 999px;

  /* Sombras */
  --shadow-1: 0 1px 2px var(--color-shadow);
  --shadow-2: 0 2px 8px var(--color-shadow);
  --shadow-3: 0 8px 24px var(--color-shadow);
  --shadow-4: 0 16px 48px var(--color-shadow);

  /* Movimiento */
  --duration-fast: 120ms; --duration-base: 200ms; --duration-slow: 320ms;
  --easing-standard: cubic-bezier(0.2, 0, 0, 1);
  --easing-decelerate: cubic-bezier(0, 0, 0, 1);
}

/* Overrides dark: aplicar bajo :root[data-theme="dark"] y, para "Sistema",
   bajo @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } } */
:root[data-theme="dark"] {
  color-scheme: dark;
  --color-bg-canvas: var(--gray-900);
  --color-bg-surface: #17191c;
  --color-bg-surface-raised: #1f2226;
  --color-border-subtle: #2a2d31;
  --color-border-strong: #3a3d42;
  --color-border-input: #7b8088;
  --color-text-primary: var(--gray-50);
  --color-text-secondary: var(--gray-400);
  --color-text-disabled: var(--gray-600);
  --color-link: var(--blue-500);
  --color-danger-text: #ff6961;
  --color-shadow: rgba(0, 0, 0, 0.45);
}
```

### Alias de utilidades Tailwind usados en el prototipo
Mapeo `@theme inline`: `canvas`, `surface`, `raised`, `subtle`, `strong`, `input`, `fg`, `fg-2`, `fg-off`, `brand`, `action`, `action-hover`, `on-accent`, `anchor`, `critical`, `critical-fg`. Corresponden respectivamente a `--color-bg-canvas`, `bg-surface`, `bg-surface-raised`, `border-subtle`, `border-strong`, `border-input`, `text-primary`, `text-secondary`, `text-disabled`, `accent`, `accent-action`, `accent-action-hover`, `accent-contrast`, `link`, `danger` y `danger-text`.
