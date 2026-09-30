# PRD — Mini Jira (MVP)

**Fuente:** Transcripción de reunión de kick-off (24 de octubre) + respuestas de aclaración del Product Manager/Tech Lead recogidas en sesión de seguimiento.
**Estado:** Borrador para desarrollo. Contiene puntos `[PENDIENTE]` que deben cerrarse antes de construir esa parte del sistema.

---

## 1. Objetivos

- Proveer a la empresa (10 personas) una herramienta interna ligera de gestión de tickets, agrupados por proyecto, que sustituya la necesidad de un Jira "pesado" (transcripción, línea 6, 9).
- Ofrecer una experiencia visual moderna, limpia y minimalista ("estilo Apple": blanco, sombras suaves), fácil de usar sin manual (transcripción, líneas 9, 55).
- Entregar una primera versión funcional en un plazo de 3 semanas, con holgura confirmada para ese mismo rango (transcripción, línea 6; respuesta P13).

## 2. In-Scope / Out-of-Scope

### In-Scope (MVP)
- Autenticación propia (usuario/contraseña) con email obligatorio por cuenta (respuesta P1).
- Roles: Admin y Usuario normal, con permisos diferenciados (respuestas P2, P3).
- Gestión de proyectos: creación, edición, visibilidad restringida por rol (respuestas P5, P6).
- Gestión de tickets: creación, edición, cambio de estado, soft-delete/archivado (transcripción línea 18; respuestas P2, P3).
- Asociación ticket → proyecto (relación uno a uno) (respuesta P4).
- Asignación de múltiples personas a un ticket (respuesta P7).
- Campos de ticket: título, descripción, prioridad, fecha, responsable, proyecto, etiquetas (respuesta P10).
- Filtros de tickets por los mismos campos (transcripción línea 27; respuesta P10).
- Tablero con 4 estados: Por hacer, En progreso, Review, Terminado (respuesta P8).
- Resolución de conflictos de edición concurrente por "last-write-wins" (respuesta P9).
- Comentarios dentro del ticket (transcripción línea 40).
- Modo oscuro (respuesta P14).
- Estética visual moderna tipo Apple (transcripción líneas 9, 55).

### Out-of-Scope (Fase 2 / posterior al MVP)
- Notificaciones por email (menciones, asignaciones) (respuesta P11).
- Dashboard de métricas (tickets cerrados por mes/proyecto) (transcripción línea 44; respuesta P11-bis).

## 3. Stack Tecnológico

(Fuente: respuesta P12)

- **Frontend:** React
- **Backend:** Node.js
- **Base de datos:** SQLite (relacional)

## 4. Supuestos

- La empresa tiene ~10 empleados, por lo que no se asumen requisitos de escalabilidad horizontal ni alta concurrencia masiva (transcripción, línea 6).
- El plazo de 3 semanas es una fecha con holgura, no estrictamente rígida (respuesta P13), pero se toma como objetivo de planificación del MVP.
- "Eliminar" en la interfaz de usuario será, técnicamente, un soft-delete/archivado; se mantiene la etiqueta "Eliminar" en el botón por claridad de uso, aunque el registro no se borra físicamente (transcripción, líneas 49–50; respuestas P2, P3).
- El campo de email del usuario se recolecta desde el MVP aunque las notificaciones por email queden diferidas a fase 2, para no requerir una migración de esquema posterior (respuesta P1, P11).

## 5. Requerimientos Funcionales

| ID | Requerimiento | Fuente |
|----|----------------|--------|
| RF-01 | El sistema debe permitir registro/login con usuario y contraseña propios; toda cuenta requiere un email asociado. | (respuesta P1) |
| RF-02 | Deben existir dos roles: Admin y Usuario normal. | (transcripción línea 15; respuesta P2) |
| RF-03 | Un Admin puede editar y borrar (soft-delete) tickets de cualquier usuario. | (respuesta P2, P3) |
| RF-04 | Un Usuario normal puede crear/editar proyectos, crear/editar tickets que creó o en los que fue asignado, y cambiar su estado. | (respuesta P2, P-propios) |
| RF-05 | Un Usuario normal solo puede eliminar (archivar) tickets que creó o en los que fue asignado; un Admin puede archivar tickets de cualquier usuario, dejando trazabilidad del cambio. | (respuesta P3, P-propios) |
| RF-06 | El borrado de tickets es lógico (soft-delete/archivado), nunca físico. | (transcripción línea 49; respuestas P2, P3) |
| RF-07 | Un ticket pertenece exactamente a un proyecto (relación 1:N proyecto→ticket). | (respuesta P4) |
| RF-08 | Tanto un Admin como un Usuario normal pueden crear proyectos. | (respuesta P5) |
| RF-09 | Un Admin puede ver todos los proyectos. Un Usuario normal solo ve los proyectos que creó o a los que fue asignado. | (respuesta P6) |
| RF-09-bis | La membresía de un usuario normal a un proyecto (asignación) la realiza quien creó el proyecto; un Admin también puede asignar usuarios a cualquier proyecto. | (respuesta P-mem) |
| RF-10 | Un ticket puede tener múltiples personas asignadas simultáneamente. Cualquier usuario (Admin o normal) puede asignar el ticket a otros usuarios o a sí mismo. | (respuesta P7, P7-bis) |
| RF-11 | El ticket debe contener los campos: título, descripción, prioridad (valores: Alta, Media, Baja), fecha, responsable(s), proyecto y etiquetas (texto libre, sin lista predefinida). | (respuesta P10, P-prioridad, P-etiquetas) |
| RF-12 | El listado de tickets debe poder filtrarse por: fecha, prioridad, responsable, proyecto y etiquetas. | (transcripción línea 27; respuesta P10) |
| RF-13 | El tablero de tickets debe tener 4 estados/columnas: "Por hacer", "En progreso", "Review", "Terminado". La transición entre estados es secuencial y obligatoria, en ese mismo orden (no se permite saltar columnas). | (respuesta P8, P-flujo) |
| RF-14 | Si dos usuarios editan el mismo ticket y ambos guardan, prevalece la última escritura (last-write-wins), sin bloqueo optimista ni aviso de conflicto. | (respuesta P9) |
| RF-15 | Los tickets deben soportar comentarios internos (hilo de conversación dentro del ticket). | (transcripción línea 40) |
| RF-16 | La interfaz debe soportar modo claro y modo oscuro. | (respuesta P14) |
| RF-17 | La estética visual debe ser moderna, limpia, con sombras suaves ("estilo Apple"), evitando la apariencia "gris" de un Jira tradicional. | (transcripción líneas 9, 55) |
| RF-18 | Las notificaciones por email (por mención o asignación) quedan fuera del MVP y se implementan en una fase posterior. | (respuesta P11) |
| RF-19 | El Dashboard de métricas (tickets cerrados por mes/proyecto) queda fuera del MVP y se implementa en una fase posterior. | (transcripción línea 44; respuesta P11-bis) |

## 6. Requerimientos No Funcionales

| ID | Requerimiento | Fuente |
|----|----------------|--------|
| RNF-01 | El sistema debe tener un tiempo de carga percibido como "rápido" por el usuario. | (transcripción línea 35) — `[PENDIENTE]` definir SLA/umbral numérico concreto (ej. tiempo máximo de respuesta en ms). Se deja pendiente deliberadamente, sin fecha de resolución asignada (respuesta P-sla). |
| RNF-02 | Plazo objetivo de entrega a producción: 3 semanas desde el inicio de desarrollo. | (transcripción línea 6; respuesta P13) |

## 7. Puntos Pendientes (a resolver antes de implementar esa parte)

1. **`[PENDIENTE]`** Definir SLA/umbral numérico de rendimiento (ver RNF-01). Dejado pendiente de forma deliberada; no se implementará ninguna métrica de rendimiento específica hasta que se defina.
