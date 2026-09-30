# Plan de implementación del prototipo — Mini Jira

Fuente: `docs/prototype-spec.md`. Stack: React 19 + TypeScript + Tailwind v4 (Vite). Datos 100 % mock/placeholder.
Regla de trabajo: **una pantalla a la vez; no se avanza sin feedback e instrucción explícita.**

## Cimientos (hechos con la pantalla 1)
Tokens A.1–A.6 como CSS variables en `src/index.css` (light/dark/sistema), mapeados a Tailwind con `@theme inline`;
foco visible global; `prefers-reduced-motion`; `useTheme` + `ThemeToggle` (C.7 parcial).

## Pantallas (orden propuesto)
| # | Pantalla | Spec | RF | Estado |
|---|---|---|---|---|
| 1 | Autenticación (login/registro) + ThemeToggle | C.1, C.7 | RF-01, RF-16 | ✅ construida |
| 2 | Gestión de Proyectos (grid, modal crear/editar, skeleton/vacío/error, vista Admin vs usuario) + shell de navegación autenticada | C.2 | RF-05, 08, 09, 09-bis | ✅ construida |
| 3 | Tablero Kanban (4 columnas, drag + alternativa teclado "Mover a…", validación de salto, permisos) | C.3 | RF-13, RF-03 | ✅ construida |
| 4 | Filtros de tickets (barra, chips, bottom sheet móvil, sin resultados) | C.5 | RF-12 | ✅ construida (AND en responsables/etiquetas; prioridad OR) |
| 5 | Detalle/Formulario de Ticket (panel lateral, asignados, etiquetas, archivar/restaurar, solo lectura) | C.4 | RF-04–07, 10, 11, 14 | ✅ construida |
| 6 | Comentarios (lista, composer, estados) | C.6 | RF-15 | ✅ construida |
| 7 | Pulido transversal: ThemeToggle en shell final, auditoría WCAG completa (axe + teclado + zoom 200 %) | A, B | RF-17 | ✅ construida — **esperando feedback** |

Criterio de "hecha" por pantalla: estados del spec implementados (loading/vacío/error/restringido donde aplique),
teclado completo, contraste verificado en ambos temas, responsive hasta 320 px, sin errores de `tsc`.

## Desviaciones deliberadas del spec (para que decidas)
El spec exige validar contraste antes de usar combinaciones nuevas (B.1). Tres combinaciones literales del spec no pasan AA:
| Spec | Ratio | Solución aplicada |
|---|---|---|
| Texto blanco sobre `--color-accent` (blue-500) | 3.65:1 (<4.5) | Botones y links usan `blue-600` vía `--color-accent-action` (5.57:1). `blue-500` se conserva para foco y en dark para links |
| Texto de error en `red-500` sobre blanco | 3.55:1 | `--color-danger-text: #c4001a` (6.25:1); dark `#ff6961` (6.24:1) |
| Borde de input `gray-300` | 1.47:1 (<3:1, 1.4.11) | `--color-border-input: gray-500` (4.83:1); dark `#7b8088` (4.43:1) |

## Decisiones de producto confirmadas
- **Filtros (C.5):** AND entre campos y dentro de responsables y etiquetas; prioridad con OR (valor único por ticket). El filtro de Proyecto cambia el proyecto mostrado en el tablero.
- **Comentarios (C.6):** cualquier persona con acceso al ticket puede comentar (excepto en tickets archivados, hasta restaurarlos). Las menciones son texto plano: no hay @menciones con autocompletado ni notificación.

## Mejoras futuras (fuera del MVP)
- **Paginación / carga incremental de comentarios (C.6):** hoy la lista renderiza todos los comentarios del ticket, con scroll interno de 288px. En tickets con hilos muy largos conviene cargar por páginas (p. ej. últimos 20 + "Ver anteriores") o virtualizar la lista, preservando el foco y el anuncio `role="status"` al cargar más.
- Menciones @usuario reales (autocompletado + notificación), editar/borrar comentarios propios.

## Auditoría transversal (pantalla 7)
Se ejecuta con el servidor en `:5173` y Google Chrome instalado: `npm run audit:axe` y `npm run audit:behave` (carpeta `audit/`).

**Resultado final:** axe-core (WCAG 2.0/2.1 A + AA) → 0 violaciones en 4 combinaciones (claro/oscuro × desktop 1280 / móvil 375) cubriendo login, registro con errores, proyectos (normal, cargando, vacío, error), modales, tablero, filtros (desplegables, chips, sin resultados, sheet móvil), panel de ticket (edición, nuevo con error, solo lectura) y comentarios. Comprobaciones de comportamiento: 51/51 OK, sin errores de consola.

**Defectos encontrados por la auditoría y corregidos**
| Defecto | Causa | Corrección |
|---|---|---|
| A 320 px y con zoom 200 % el tablero ensanchaba toda la página (+827 px, viola 1.4.10) | Los `.sr-only` (position:absolute) dentro de las tarjetas escapaban del `overflow-x` de la región | Región del tablero con `relative` |
| A 320 px el header desbordaba (+72 px) | Controles de la derecha no cabían | Header compacto en < 640 px (marca en texto solo para lectores, sin chip de usuario, toggle de 28 px) |
| Utilidades Tailwind ~6 % más pequeñas que los px del spec (`h-6` = 22.5 px) | `html { font-size: 15px }` cambiaba la base del `rem` | Base `rem` = 16 px; 15 px solo en `body` |
| Botones de título de tarjeta con 22 px de alto (< 24 px) | Botón en línea sin padding | `py-0.5` |
| 404 en consola | Faltaba favicon | Favicon SVG inline |

**Criterios cubiertos por pruebas automáticas:** contraste (1.4.3/1.4.11, ambos temas), nombres accesibles, etiquetas, roles ARIA, landmarks, orden de encabezados; reflow a 320 px y zoom 200 % (1.4.4/1.4.10); foco atrapado y devuelto en diálogos (2.1.2), Esc, foco visible (2.4.7); movimiento por teclado y por arrastre; permisos por rol; filtros AND; `prefers-reduced-motion`; objetivos ≥ 24 px; persistencia del tema.

## Pendiente / no cubierto
- **Lector de pantalla real** (VoiceOver/NVDA): axe detecta solo una parte de los problemas de WCAG; los anuncios `role="status"`/`alert` y el orden de lectura no se han escuchado.
- **Safari y Firefox:** la auditoría corre solo en Chrome. `<dialog>`, `has-[:checked]` y `color-mix` requieren navegadores recientes.
- **Táctil real:** el arrastre usa HTML5 nativo (no funciona en táctil; queda el menú «Mover a…»). Falta la rotación de 2° y `--shadow-4` en la tarjeta arrastrada (ver decisión abierta en pantalla 3).
- **Indicador de columna «Por hacer»:** `gray-400` = 2.5:1 sobre el fondo (decorativo, el nombre va en texto).
- **Sidebar** del spec (≥ 1024 px): se usa header superior mientras solo haya una sección.
- Datos 100 % mock en memoria: no hay persistencia ni backend (Supabase según ADR-001).
