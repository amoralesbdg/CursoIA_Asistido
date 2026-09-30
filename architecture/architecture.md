# Arquitectura — Mini Jira (MVP)

**Fuente:** `docs/specs.md` (sección 3, Stack Tecnológico; requerimientos funcionales RF-01 a RF-19) y `docs/backlog.md`.
**Alcance:** Este documento no introduce contenedores ni servicios que no estén respaldados por el stack declarado en specs.md (React / Node.js / SQLite). No se incluyen colas, cachés, servicios de notificación por email ni microservicios adicionales, ya que están fuera de alcance del MVP (RF-18, RF-19).

---

## 1. Diagrama de Contenedores (C4 — Nivel 2 / HLD)

Deriva directamente de la sección "3. Stack Tecnológico" de `specs.md`: una SPA en React, un backend en Node.js que concentra toda la lógica de negocio (autenticación, autorización por rol, reglas de transición de tablero, resolución last-write-wins) y una base de datos relacional SQLite.

```mermaid
C4Container
    title Diagrama de Contenedores (C4 - Nivel 2) - Mini Jira MVP

    Person(empleado, "Empleado", "Admin o Usuario normal de la empresa (RF-02). Gestiona proyectos y tickets.")

    System_Boundary(minijira, "Mini Jira") {
        Container(spa, "SPA Frontend", "React", "Interfaz web: proyectos, tickets, tablero Kanban, filtros, comentarios y modo oscuro (RF-11 a RF-17)")
        Container(api, "API Backend", "Node.js", "Lógica de negocio: registro/login, autorización por rol, reglas de proyecto/ticket, transición secuencial de estado y last-write-wins (RF-01 a RF-14)")
        ContainerDb(db, "Base de datos", "SQLite", "Persiste usuarios, proyectos, tickets, asignaciones, etiquetas y comentarios")
    }

    Rel(empleado, spa, "Usa", "HTTPS")
    Rel(spa, api, "Consume API REST", "JSON / HTTPS")
    Rel(api, db, "Lee y escribe", "SQL")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

**Notas de diseño:**
- No existe un contenedor de "servicio de autenticación" separado: RF-01 no especifica un proveedor externo (OAuth, IdP), por lo que la autenticación vive dentro del único backend Node.js.
- No se incluye un contenedor de notificaciones/email ni de métricas: RF-18 y RF-19 están explícitamente fuera de alcance del MVP.
- SQLite se modela como `ContainerDb` embebido en el mismo proceso/servidor que la API, consistente con el supuesto de baja concurrencia (~10 empleados, sin requisitos de escalabilidad horizontal).

---

## 2. Diagrama de Secuencia (LLD) — Historia 9: Tablero Kanban con transición secuencial obligatoria

Se eligió la **Historia 9** (`docs/backlog.md`) como la más representativa porque combina, en un único flujo, autorización por rol (RF-03/RF-04), una regla de negocio central del producto (transición secuencial obligatoria del tablero, RF-13) y la política de concurrencia del MVP (last-write-wins, RF-14), atravesando las tres capas: frontend, API y datos.

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario (Admin o Usuario normal)
    participant FE as SPA Frontend (React)
    participant API as API Backend (Node.js)
    participant DB as Base de datos (SQLite)

    U->>FE: Arrastra el ticket a la siguiente columna del tablero
    FE->>FE: Calcula estado destino según orden Por hacer -> En progreso -> Review -> Terminado (RF-13)
    FE->>API: PATCH /tickets/{id}/status { estado: "En progreso" }

    API->>API: Valida sesión/credenciales del usuario (RF-01)
    API->>DB: SELECT ticket (creador, asignados, estado actual)
    DB-->>API: Ticket encontrado

    alt Usuario no autorizado (no es Admin, ni creador, ni asignado)
        API-->>FE: 403 Forbidden
        FE-->>U: Muestra error de permisos
    else Transición no secuencial (salto de columnas o retroceso, RF-13)
        API-->>FE: 400 Bad Request (transición inválida)
        FE-->>U: Muestra error: transición no permitida
    else Autorizado y transición válida
        API->>DB: UPDATE ticket SET estado = "En progreso" (last-write-wins, RF-14)
        DB-->>API: OK
        API-->>FE: 200 OK { ticket actualizado }
        FE-->>U: Actualiza el tablero mostrando el ticket en la nueva columna
    end
```

**Notas de diseño:**
- El rechazo de saltos de columna y de retrocesos se modela como ramas explícitas del `alt`, reflejando los escenarios de fallo deducidos en la Historia 9 (`docs/backlog.md`, líneas 268-277).
- La actualización en base de datos no incluye bloqueo optimista ni verificación de versión, conforme a RF-14 (last-write-wins sin aviso de conflicto).
