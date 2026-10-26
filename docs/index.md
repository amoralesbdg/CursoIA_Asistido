# Mini Jira — Documentación Técnica

Documentación técnica generada a partir de las fuentes de verdad del proyecto: el contrato de API, las specs funcionales, el backlog, el código del backend y el schema de base de datos. Ningún contenido fue inventado: donde la fuente no especificaba algo, se marcó explícitamente como pendiente.

## Secciones

- **[API Reference](api-reference.md)** — Tabla de endpoints (método, ruta, auth, body, response, status codes) extraída de `docs/api-contract.md`, con ejemplos `curl` para los endpoints P0 y los P2 marcados como pendientes de implementación.
- **[Diagramas](diagramas.md)** — Diagramas Mermaid del flujo de autenticación JWT, el flujo de cambio de status de un ticket (con lock y audit log) y el ciclo de vida del ticket, basados en el código real del backend. Incluye notas sobre discrepancias encontradas entre las specs y la implementación actual.
- **[Cobertura de Tests](cobertura-tests.md)** — Cruce entre las historias de `docs/backlog.md` y los tests existentes (`*.test.ts`), con el top 3 de deuda de testing.
- **[Base de Datos](base-de-datos.md)** — ERD en Mermaid, tablas de columnas y decisiones de diseño (soft-delete, soft lock informativo, audit log inmutable) extraídas de `database-schema.yaml`.

!!! warning "Hallazgos relevantes"
    El análisis de diagramas detectó discrepancias entre specs y código que afectan seguridad y trazabilidad (ver notas al pie en [Diagramas](diagramas.md)): el JWT se emite pero ningún endpoint lo valida, el cambio de status no valida ownership/rol, y `PATCH /tickets/{id}/status` no genera entradas en `audit_log` pese a que `status_changed` está contemplado en el modelo.
