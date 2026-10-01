# CLAUDE.md

## Decisiones de arquitectura

- Base de datos del MVP: **Supabase (PostgreSQL)** en lugar de Firebase, por el modelo de datos relacional (1:N proyecto-ticket, N:N ticket-usuario, filtrado combinado) y las reglas de autorización basadas en propiedad/asignación — ver [docs/adr/001-database-selection.md](docs/adr/001-database-selection.md).

## Componentes reutilizables

- Antes de crear cualquier componente, consulta [COMPONENTS.md](COMPONENTS.md). Nunca dupliques lo que ya existe.
- Cada vez que crees un componente reutilizable nuevo, actualiza COMPONENTS.md con: nombre, ruta relativa, props principales y cuándo usarlo.
