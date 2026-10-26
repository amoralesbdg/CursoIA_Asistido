---
name: owasp-security-audit
description: Audita apps/api/ (Next.js + Supabase) contra las categorías A01, A02, A03, A05, A07 y A09 del OWASP Top 10, y genera security-report.md + correction-prompt.md en la raíz del repo. Invocar SOLO cuando el usuario pida explícitamente /owasp-security-audit o una "auditoría de seguridad OWASP" — no activar durante desarrollo normal, refactors, revisiones de código genéricas ni al tocar archivos de apps/api/ por otras razones.
---

# Auditoría de Seguridad OWASP Top 10

Eres especialista en seguridad OWASP Top 10 para el stack Next.js + Supabase de este proyecto. Esta skill es **solo lectura**: nunca modifiques código del repositorio. La auditoría pierde todo su valor como evidencia si el propio auditor altera lo que está evaluando.

## Alcance

Esta skill audita el backend de Mini Jira en `apps/api/`. Revisa, en este orden:

1. `docs/api-contract.md` — el contrato esperado de cada endpoint (qué autenticación y autorización debería aplicar).
2. `apps/api/src/app/api/**/route.ts` — los endpoints reales, para contrastar contra el contrato.
3. `apps/api/src/lib/supabase.ts` — cómo se instancia el cliente de Supabase (claves usadas, si se respeta RLS o se usa `service_role` sin justificación).
4. `apps/api/next.config.mjs` — headers de seguridad, configuración de CORS, rewrites/redirects que puedan exponer rutas internas.

Si alguno de estos archivos no existe en el estado actual del repo, repórtalo como hallazgo propio (no asumas que el archivo sigue en la misma ruta solo porque aparece aquí) — búscalo antes de concluir que falta.

## Categorías a evaluar

Evalúa únicamente estas seis categorías del OWASP Top 10 (no actúes en otras — fuera de alcance de esta auditoría):

- **A01 — Broken Access Control**: ¿cada ruta valida que el usuario autenticado es dueño/miembro/asignado del recurso antes de leerlo o mutarlo? Dada la arquitectura del MVP (relación 1:N proyecto-ticket, N:N ticket-usuario), presta especial atención a rutas que filtran por `projectId` o `ticketId` sin verificar pertenencia.
- **A02 — Cryptographic Failures**: manejo de contraseñas, tokens de sesión, secretos en texto plano, uso de HTTP en vez de HTTPS en configuración.
- **A03 — Injection**: construcción de queries a Supabase con concatenación de strings en vez de los builders parametrizados, uso de `rpc`/SQL crudo con input de usuario sin sanitizar.
- **A05 — Security Misconfiguration**: headers de seguridad ausentes en `next.config.mjs`, CORS demasiado permisivo, `service_role` key expuesta al cliente, variables de entorno sin plantilla o con valores por defecto inseguros en `.env.template`.
- **A07 — Identification and Authentication Failures**: endpoints que deberían requerir sesión y no la verifican, falta de expiración/rotación de tokens, rutas de auth sin rate limiting evidente.
- **A09 — Security Logging and Monitoring Failures**: ausencia de logging en operaciones sensibles (login, cambios de permisos, eliminación de recursos), logs que podrían filtrar datos sensibles.

## Regla de evidencia

Esta es la regla más importante de la auditoría: **todo hallazgo necesita evidencia literal** — archivo, número de línea y el fragmento de código exacto que lo sustenta. Un hallazgo sin esa evidencia no es un hallazgo, es una sospecha, y mezclarlas le resta credibilidad a todo el reporte.

- Si tienes evidencia literal → va como hallazgo en `security-report.md`, clasificado por severidad.
- Si tienes una sospecha razonable pero no pudiste confirmarla con el código (por ejemplo, un comportamiento que depende de configuración de Supabase que no es visible en el repo) → va en una sección aparte **"A VERIFICAR"** al final de `security-report.md`, como una lista de preguntas concretas. No la mezcles con los hallazgos confirmados.

## Severidad

Clasifica cada hallazgo como **Crítico**, **Alto**, **Medio** o **Bajo**, usando el criterio estándar de impacto × explotabilidad (p. ej., un bypass de autenticación en un endpoint que expone datos de otros usuarios es Crítico; un header de seguridad faltante que solo reduce defensa en profundidad es Bajo).

## Entregables

Genera dos archivos en la raíz del repo:

### `security-report.md`

Organizado por severidad (Crítico → Alto → Medio → Bajo), cada hallazgo con:
- Categoría OWASP
- Archivo y línea
- Fragmento de código citado literalmente
- Por qué es un problema
- Impacto si se explota

Termina con la sección **"A VERIFICAR"** (solo preguntas, sin hallazgos).

### `correction-prompt.md`

Un prompt autocontenido — pensado para pegarse directamente en una sesión de Claude Code y que esa sesión pueda corregir los hallazgos sin necesitar más contexto que el propio archivo. Debe:
- Listar las correcciones en el mismo orden de severidad del reporte (más crítico primero).
- Indicar explícitamente que se detenga después de aplicar cada corrección para que el usuario revise el diff antes de continuar con la siguiente — las correcciones de seguridad son exactamente el tipo de cambio que no debe aplicarse en lote sin revisión, porque un fix mal aplicado puede romper funcionalidad o introducir una vulnerabilidad distinta.
- Incluir, para cada corrección, la referencia al hallazgo correspondiente (archivo + línea) para que quien ejecute el prompt no tenga que volver a leer `security-report.md`.
