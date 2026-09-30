# Plan de Pruebas — Mini Jira (MVP)

**Rol:** QA Lead Senior
**Fuentes:** docs/backlog.md, docs/specs.md
**Alcance:** Un caso de prueba por cada escenario Gherkin del backlog (positivo, negativo o borde), matriz de edge cases críticos no cubiertos y validación de cobertura de RF.

---

## 1. Casos de prueba por criterio de aceptación

### Historia 1 — Registro y autenticación (RF-01)

| ID | Escenario (Gherkin) | Tipo | Pasos | Resultado esperado |
|----|----|----|----|----|
| TC-H1-01 | Registro exitoso con email obligatorio | Positivo | Completar registro con usuario, contraseña y email válidos y enviar | Cuenta creada, email queda asociado |
| TC-H1-02 | Login exitoso | Positivo | Iniciar sesión con usuario/contraseña correctos de una cuenta existente | Acceso concedido con el rol correspondiente |
| TC-H1-03 | Registro sin email | Negativo | Enviar el formulario de registro sin completar el email | Registro rechazado, error de campo obligatorio |
| TC-H1-04 | Login con credenciales incorrectas | Negativo | Iniciar sesión con contraseña incorrecta para una cuenta existente | Acceso denegado |
| TC-H1-05 | Registro con usuario duplicado | Negativo | Registrar una cuenta con un nombre de usuario ya existente | Registro rechazado por duplicidad |

### Historia 2 — Permisos ampliados del Admin (RF-02, RF-03)

| ID | Escenario | Tipo | Pasos | Resultado esperado |
|----|----|----|----|----|
| TC-H2-01 | Admin edita ticket de otro usuario | Positivo | Con sesión Admin, editar un ticket creado por un Usuario normal | Cambios guardados correctamente |
| TC-H2-02 | Admin archiva ticket de cualquier usuario | Positivo | Con sesión Admin, archivar un ticket creado por otro usuario | Ticket archivado (soft-delete); registro de trazabilidad muestra al Admin como autor de la acción |
| TC-H2-03 | Usuario normal intenta editar ticket ajeno | Negativo | Con sesión Usuario normal, intentar editar un ticket que no creó ni tiene asignado | Acción rechazada |

### Historia 3 — Gestión de tickets propios/asignados (RF-04)

| ID | Escenario | Tipo | Pasos | Resultado esperado |
|----|----|----|----|----|
| TC-H3-01 | Usuario normal edita ticket que creó | Positivo | Crear un ticket como Usuario normal y editarlo | Cambios guardados |
| TC-H3-02 | Usuario normal edita ticket en el que fue asignado | Positivo | Asignar un ticket creado por otro usuario a este Usuario normal y editarlo | Cambios guardados |

### Historia 4 — Archivado con trazabilidad (RF-05, RF-06)

| ID | Escenario | Tipo | Pasos | Resultado esperado |
|----|----|----|----|----|
| TC-H4-01 | Usuario normal archiva ticket propio | Positivo | Archivar ("Eliminar") un ticket propio y verificar en base de datos | Ticket marcado como archivado; el registro sigue existiendo físicamente |
| TC-H4-02 | Usuario normal intenta archivar ticket ajeno | Negativo | Intentar archivar un ticket que no creó ni tiene asignado | Acción rechazada |

### Historia 5 — Proyectos y visibilidad por rol (RF-07, RF-08, RF-09, RF-09-bis)

| ID | Escenario | Tipo | Pasos | Resultado esperado |
|----|----|----|----|----|
| TC-H5-01 | Usuario normal crea un proyecto | Positivo | Crear un proyecto con sesión Usuario normal | Proyecto registrado con este usuario como creador |
| TC-H5-02 | Admin ve todos los proyectos | Positivo | Con sesión Admin, abrir el listado de proyectos | Se listan todos los proyectos existentes |
| TC-H5-03 | Usuario normal ve solo sus proyectos | Positivo | Con sesión Usuario normal (no creador/miembro de todos), abrir el listado | Solo aparecen proyectos creados o asignados a este usuario |
| TC-H5-04 | Creador del proyecto asigna miembros | Positivo | Como creador de un proyecto, agregar a un Usuario normal como miembro | El usuario agregado ve el proyecto en su listado |
| TC-H5-05 | Admin asigna miembros a proyecto ajeno | Positivo | Con sesión Admin, agregar un miembro a un proyecto que no creó | Asignación exitosa |
| TC-H5-06 | Usuario normal intenta asignar miembro a proyecto ajeno | Negativo | Con sesión Usuario normal (no creador), intentar agregar un miembro a un proyecto de otro | Acción rechazada |
| TC-H5-07 | Creación de ticket sin proyecto asociado | Negativo | Intentar guardar un ticket sin seleccionar proyecto | Creación rechazada por campo obligatorio |

### Historia 6 — Ticket con campos completos (RF-07, RF-11)

| ID | Escenario | Tipo | Pasos | Resultado esperado |
|----|----|----|----|----|
| TC-H6-01 | Creación de ticket con todos los campos | Positivo | Crear ticket completando título, descripción, prioridad, fecha, responsable(s), proyecto y etiquetas | Ticket creado, asociado a un único proyecto, con todos los campos persistidos |
| TC-H6-02 | Ticket con múltiples etiquetas libres | Positivo | Añadir 3+ etiquetas de texto libre a un ticket | Todas las etiquetas quedan asociadas |
| TC-H6-03 | Prioridad fuera de valores permitidos | Negativo | Intentar guardar un ticket con prioridad distinta de Alta/Media/Baja | Valor rechazado |

### Historia 7 — Asignación múltiple (RF-10)

| ID | Escenario | Tipo | Pasos | Resultado esperado |
|----|----|----|----|----|
| TC-H7-01 | Asignar múltiples responsables | Positivo | Asignar 2+ personas a un mismo ticket | Todas quedan registradas como responsables |
| TC-H7-02 | Autoasignación de ticket | Positivo | Un usuario se asigna a sí mismo un ticket no asignado previamente | Queda registrado como responsable |

### Historia 8 — Filtros (RF-12)

| ID | Escenario | Tipo | Pasos | Resultado esperado |
|----|----|----|----|----|
| TC-H8-01 | Filtrar por proyecto | Positivo | Con tickets de varios proyectos, filtrar por uno específico | Solo se muestran tickets de ese proyecto |
| TC-H8-02 | Filtrar combinando criterios | Positivo | Filtrar simultáneamente por prioridad y responsable | Solo se muestran tickets que cumplen ambos criterios |
| TC-H8-03 | Filtro sin resultados | Borde | Aplicar combinación de filtros que ningún ticket cumple | Listado vacío, sin error |

### Historia 9 — Tablero Kanban secuencial (RF-13)

| ID | Escenario | Tipo | Pasos | Resultado esperado |
|----|----|----|----|----|
| TC-H9-01 | Avanzar al siguiente estado | Positivo | Cambiar un ticket de "Por hacer" a "En progreso" | Estado actualizado |
| TC-H9-02 | Completar flujo hasta Terminado | Positivo | Cambiar un ticket de "Review" a "Terminado" | Estado actualizado |
| TC-H9-03 | Salto de columnas hacia adelante | Negativo | Intentar cambiar un ticket de "Por hacer" a "Terminado" directamente | Transición rechazada |
| TC-H9-04 | Retroceso de estado | Negativo | Intentar cambiar un ticket de "Review" a "Por hacer" | Transición rechazada |

### Historia 10 — Conflictos de edición concurrente (RF-14)

| ID | Escenario | Tipo | Pasos | Resultado esperado |
|----|----|----|----|----|
| TC-H10-01 | Last-write-wins | Borde | Dos sesiones abren el mismo ticket, editan campos distintos y guardan en secuencia (A luego B) | Prevalece la versión de B, sin bloqueo ni mensaje de conflicto |

### Historia 11 — Comentarios (RF-15)

| ID | Escenario | Tipo | Pasos | Resultado esperado |
|----|----|----|----|----|
| TC-H11-01 | Añadir comentario | Positivo | Escribir y enviar un comentario en un ticket | Comentario visible en el hilo |
| TC-H11-02 | Ver hilo cronológico | Positivo | Abrir un ticket con varios comentarios previos | Comentarios listados en orden cronológico |

### Historia 12 — Modo oscuro (RF-16)

| ID | Escenario | Tipo | Pasos | Resultado esperado |
|----|----|----|----|----|
| TC-H12-01 | Activar modo oscuro | Positivo | Desde modo claro, activar el modo oscuro | Interfaz cambia a paleta oscura |
| TC-H12-02 | Activar modo claro | Positivo | Desde modo oscuro, activar el modo claro | Interfaz cambia a paleta clara |

**Total: 36 casos de prueba** cubriendo los 36 escenarios Gherkin del backlog.

---

## 2. Edge cases críticos no cubiertos en el backlog

Identificados por inferencia directa sobre las reglas de negocio de specs.md que el backlog no ejercita explícitamente.

| # | Edge case | Impacto | Probabilidad | Prioridad | Justificación |
|---|---|---|---|---|---|
| EC-01 | Crear ticket con campos obligatorios vacíos distintos de proyecto (título, fecha o responsable vacíos) | Alto — RF-11 exige estos campos; datos incompletos rompen filtros (RF-12) y el tablero | Alta — es el error de entrada más común en formularios de uso diario | **Crítica** | Combina alta frecuencia de ocurrencia con alto daño funcional aguas abajo (filtros, tablero) |
| EC-02 | Dos usuarios cambian el estado del mismo ticket simultáneamente a valores distintos (choque entre RF-13 y RF-14) | Alto — puede violar la transición secuencial obligatoria si "last-write-wins" (RF-14) sobrescribe una transición válida con una inválida | Media — requiere dos usuarios trabajando el mismo ticket a la vez, plausible en equipo de 10 personas compartiendo pocos tickets activos | **Alta** | RF-13 y RF-14 no definen cuál prevalece; es una zona gris del PRD con alto riesgo de comportamiento inconsistente |
| EC-03 | Tickets archivados (soft-delete) siguen apareciendo en el tablero o en los filtros por defecto | Alto — expone datos que el usuario espera "eliminados" (RF-06), rompe confianza en la función Archivar | Media — depende de si la query de listado excluye archivados por defecto, un descuido común de implementación | **Alta** | Riesgo directo de violar la expectativa de RF-05/RF-06 sin que el PRD lo aclare explícitamente |
| EC-04 | Se intenta cambiar de estado o editar un ticket ya archivado | Medio — puede "revivir" trabajo que debía quedar cerrado | Media | **Media** | No está prohibido explícitamente en el PRD; buena práctica validar que un ticket archivado quede de solo lectura |
| EC-05 | Un usuario es removido como miembro de un proyecto pero conserva tickets asignados en él | Alto — puede perder acceso a su propio trabajo (RF-09) o, al revés, retener visibilidad indebida | Baja — la gestión de membresías es una acción administrativa poco frecuente | **Media** | El PRD no define qué ocurre con la visibilidad de tickets tras remover membresía (RF-09/RF-09-bis); gap de especificación con impacto alto si ocurre |
| EC-06 | Login con nombre de usuario que no existe (no solo contraseña incorrecta) | Bajo — comportamiento estándar de rechazo, sin riesgo funcional grave | Alta — error de tipeo frecuente | **Media** | Alta frecuencia pero bajo daño; se prioriza por debajo de casos con impacto alto |
| EC-07 | Alta del primer usuario Admin del sistema (bootstrap) | Alto — sin un Admin, nadie puede asignar el rol ni gestionar el sistema | Baja — ocurre una única vez, en el despliegue inicial | **Media** | No es solo un caso de prueba: es un vacío de especificación en specs.md (RF-02 no define cómo se otorga el primer rol Admin); debe resolverse con Producto antes de certificar |

---

## 3. Validación final — RF de specs.md sin test asociado

Revisando RF-01 a RF-19 y RNF-01/RNF-02 contra la sección 1:

- **RF-17** — "Estética visual moderna, limpia, con sombras suaves (estilo Apple)": **sin test funcional asociado**. Es un requerimiento subjetivo/visual; no es expresable como Given/When/Then verificable por QA funcional. Requiere una revisión de diseño/UX (checklist visual o QA manual comparando contra mockups), no un caso de prueba Gherkin.
- **RNF-01** — "Tiempo de carga percibido como rápido": **sin test asociado**, y no puede tenerlo todavía. El propio PRD lo marca `[PENDIENTE]` sin SLA numérico definido; no se puede certificar un umbral que no existe. Queda bloqueado hasta que Producto/Tech Lead cierre este punto pendiente (sección 7 de specs.md).
- **RNF-02** — "Plazo de entrega de 3 semanas": **sin test asociado**. Es un requerimiento de gestión de proyecto (fecha de entrega), no una funcionalidad verificable mediante casos de prueba.

**RF-18 y RF-19** (notificaciones por email, dashboard de métricas) quedan correctamente **fuera de este plan de pruebas**: el propio PRD los declara fuera de alcance del MVP (Fase 2), y el backlog los excluye de forma explícita. No se consideran una brecha de cobertura sino un alcance correctamente delimitado.

**Todos los RF funcionales del MVP (RF-01 a RF-16, incluyendo RF-09-bis) tienen al menos un caso de prueba asociado en la sección 1.**
