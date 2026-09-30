# 001 — Selección de Backend-as-a-Service para la base de datos del MVP

## Estado

Aceptada

## Contexto

`docs/specs.md` (Sección 3, "Stack Tecnológico") ya fija como base de datos objetivo un motor **relacional** (SQLite) junto a un backend Node.js y frontend React. El plazo objetivo de entrega es de 3 semanas (RNF-02), con holgura pero tomado como meta de planificación, y el supuesto explícito es que la empresa tiene ~10 empleados, por lo que **no se requiere escalabilidad horizontal ni alta concurrencia masiva** (Sección 4, Supuestos).

Sobre ese punto de partida, el modelo de datos que exigen los requerimientos funcionales tiene las siguientes características:

- **Relaciones estructurales fijas**: un ticket pertenece exactamente a un proyecto (RF-07, relación 1:N proyecto→ticket) y puede tener múltiples personas asignadas simultáneamente (RF-10, relación N:N ticket↔usuario).
- **Comentarios anidados al ticket** (RF-15): relación 1:N ticket→comentario.
- **Filtrado combinado**: el listado de tickets debe poder filtrarse simultáneamente por fecha, prioridad, responsable, proyecto y etiquetas (RF-12).
- **Autorización fina basada en propiedad/asignación**: un Admin puede editar/archivar tickets de cualquier usuario (RF-03), un Usuario normal solo puede editar/archivar tickets que creó o en los que fue asignado (RF-04, RF-05), y la visibilidad de proyectos también depende de si el usuario es Admin, creador o miembro asignado (RF-09, RF-09-bis).
- **Autenticación propia con email obligatorio** (RF-01): usuario/contraseña, no solo redes sociales o "magic link".
- **Concurrencia simple**: la resolución de conflictos de edición es "last-write-wins", sin bloqueo optimista ni aviso de conflicto (RF-14); no se pide sincronización en tiempo real en ningún requerimiento.

Dado que el equipo debe decidir sobre un backend-as-a-service (BaaS) que reemplace/hostee esa base de datos relacional dentro del plazo de 3 semanas (RNF-02), se evalúan dos candidatos.

## Opciones consideradas

### Opción A — Supabase (PostgreSQL + Auth + Row Level Security)

**Pros**

- Motor **PostgreSQL relacional**: modela de forma nativa, con claves foráneas y tablas intermedias, la relación 1:N proyecto→ticket (RF-07) y la relación N:N ticket↔usuario (RF-10), sin necesidad de desnormalizar datos.
- El filtrado combinado exigido por RF-12 (fecha + prioridad + responsable + proyecto + etiquetas) se resuelve con una única consulta SQL (`WHERE`/`JOIN`), sin restricciones sobre qué combinaciones de campos se pueden filtrar a la vez.
- **Row Level Security (RLS)** permite expresar como políticas declarativas exactamente las reglas de RF-03, RF-04, RF-05, RF-09 y RF-09-bis (p. ej. "el usuario ve/edita el ticket si es Admin, si lo creó o si está asignado"), aplicando la autorización a nivel de base de datos en vez de reimplementarla en cada endpoint.
- Incluye **Auth con usuario/contraseña y email obligatorio**, cubriendo RF-01 directamente.
- Los comentarios de RF-15 se modelan como una tabla estándar con clave foránea al ticket, sin diseño adicional.
- Al ser relacional, conserva el mismo paradigma que ya fue decidido en Sección 3 de `specs.md` (SQLite), minimizando el rediseño del modelo de datos ya acordado dentro del plazo de 3 semanas (RNF-02).

**Contras**

- No ofrece de fábrica bloqueo optimista ni notificación de conflictos; sin embargo, esto no es un contra real frente a los requerimientos porque RF-14 pide explícitamente "last-write-wins, sin bloqueo optimista ni aviso de conflicto", es decir, el comportamiento por defecto ya es el requerido.
- Escribir políticas RLS en SQL añade una curva de aprendizaje si el equipo no tiene experiencia previa con Postgres, lo que consume parte del margen de RNF-02 (mitigado por ser un supuesto de holgura, no una fecha rígida).

### Opción B — Firebase (Firestore + Firebase Authentication)

**Pros**

- Firebase Authentication soporta usuario/contraseña con email obligatorio, cubriendo RF-01 igual que la Opción A.

**Contras**

- Firestore es una base **de documentos NoSQL**. Representar la relación 1:N proyecto→ticket (RF-07) y, sobre todo, la relación N:N ticket↔usuario de RF-10 (asignación de múltiples personas a un ticket) exige desnormalizar datos (arrays de IDs duplicados en ticket y en usuario, o subcolecciones), lo que complica mantener consistencia cuando se edita una asignación o se aplica el soft-delete de RF-06.
- El filtrado combinado de RF-12 (fecha + prioridad + responsable + proyecto + etiquetas a la vez) requiere que Firestore tenga un **índice compuesto pre-declarado** para cada combinación de campos usada; no soporta filtros arbitrarios combinados sobre campos no indexados de antemano, lo que obliga a anticipar y mantener manualmente cada combinación de filtro que use la interfaz, agregando trabajo operativo dentro del plazo de 3 semanas (RNF-02).
- Expresar las reglas de autorización de RF-03, RF-04, RF-05, RF-09 y RF-09-bis ("Admin ve/edita todo; usuario normal solo lo que creó o donde fue asignado; visibilidad de proyecto según creador o membresía") en **Firestore Security Rules** es posible pero más verboso y menos directo que en SQL/RLS, porque las reglas de Firestore evalúan documento por documento y no expresan con la misma naturalidad condiciones que combinan varias colecciones (tickets, proyectos, membresías).
- Adoptar Firestore implica descartar el modelo relacional ya fijado en la Sección 3 de `specs.md` (SQLite) y rediseñar el esquema de datos como documentos, en lugar de reutilizar el modelo ya acordado, lo que introduce riesgo de rediseño adicional contra el plazo de 3 semanas (RNF-02).

## Decisión

Se selecciona **Supabase** como backend-as-a-service para la base de datos del MVP.

La razón central es que el modelo de datos exigido por los requerimientos (RF-07, RF-10, RF-12, RF-15) es intrínsecamente relacional —con relaciones 1:N y N:N y filtrado combinado por múltiples campos— y coincide con el motor relacional que `specs.md` ya había fijado en su Sección 3 (SQLite). Supabase, al ser PostgreSQL, permite implementar ese modelo sin desnormalizar ni rediseñarlo, y además resuelve de forma declarativa (RLS) las reglas de autorización basadas en propiedad/asignación que piden RF-03, RF-04, RF-05, RF-09 y RF-09-bis. Firebase/Firestore cubre igual de bien la autenticación (RF-01), pero su modelo de documentos NoSQL obliga a desnormalizar las relaciones N:N de RF-10, a pre-declarar índices compuestos para cada combinación de filtros de RF-12, y a rediseñar desde cero el esquema relacional ya acordado, lo cual añade riesgo evitable dentro del plazo de 3 semanas (RNF-02).

## Consecuencias

- El esquema de datos se implementará como tablas PostgreSQL (proyectos, tickets, usuarios, tabla intermedia de asignación ticket↔usuario, comentarios), reutilizando el modelo relacional ya previsto en `specs.md`.
- Las reglas de autorización de RF-03, RF-04, RF-05, RF-09 y RF-09-bis se implementarán como políticas de Row Level Security en Supabase, además de (o en lugar de) validaciones equivalentes en el backend Node.js.
- El registro/login de RF-01 usará Supabase Auth (usuario/contraseña, email obligatorio), reduciendo el código de autenticación a escribir a mano.
- El filtrado de RF-12 se implementará como consultas SQL con múltiples condiciones sobre las tablas relacionadas, sin necesidad de gestionar índices compuestos manuales por combinación de filtro.
- El comportamiento "last-write-wins" de RF-14 no requiere configuración adicional: al no añadirse bloqueo optimista, la última escritura prevalece por defecto.
- Queda pendiente, como siguiente paso de diseño, definir el esquema exacto de tablas y las políticas RLS concretas antes de iniciar la implementación.
