# CLAUDE.md

## Decisiones de arquitectura

- Base de datos del MVP: **Supabase (PostgreSQL)** en lugar de Firebase, por el modelo de datos relacional (1:N proyecto-ticket, N:N ticket-usuario, filtrado combinado) y las reglas de autorización basadas en propiedad/asignación — ver [docs/adr/001-database-selection.md](docs/adr/001-database-selection.md).
