# Reporte de Auditoría de Seguridad OWASP — Mini Jira API (`apps/api/`)

**Fecha:** 2026-10-14
**Alcance:** `docs/api-contract.md`, `apps/api/src/app/api/**/route.ts`, `apps/api/src/lib/supabase.ts`, `apps/api/next.config.mjs`.
**Categorías evaluadas:** A01, A02, A03, A05, A07, A09.

---

## Crítico

### 1. [A07/A01] Ningún endpoint valida el header `Authorization` — identidad completamente auto-declarada por el cliente

**Archivos y líneas:**
- `apps/api/src/lib/jwt.ts:14-15` — comentario explícito: `// El token se emite en /auth/register y /auth/login por contrato, pero en esta // fase ningún endpoint valida Authorization`.
- `apps/api/src/lib/ownership.ts:5-6` — `// Fase sin JWT: el actor se identifica con un id explícito en el request // (ver CLAUDE.md / instrucciones de fase), nunca derivado de Authorization.`
- `apps/api/src/app/api/tickets/[id]/route.ts:39` — `const { actorId, title, ... } = parsed.data;` (actorId viene del body JSON).
- `apps/api/src/app/api/tickets/[id]/route.ts:165` — `const { actorId } = parsedQuery.data;` (actorId viene de query string).
- `apps/api/src/app/api/projects/[id]/members/route.ts:33` — `const { userId, actorId } = parsed.data;` (actorId viene del body).
- `apps/api/src/app/api/tickets/route.ts:130` — `const { title, description, projectId, priority, assigneeIds, tags, dueDate, creatorId } = parsed.data;` (creatorId viene del body).
- `apps/api/src/app/api/tickets/[id]/comments/route.ts:109` — `const { body: commentBody, authorId } = parsed.data;` (authorId viene del body).
- `apps/api/src/app/api/tickets/[id]/lock/route.ts:31` y `:86` — `userId` viene del body/query sin verificación de que corresponda al solicitante real.

**Por qué es un problema:** El contrato (`docs/api-contract.md:54`) establece que *"Todo endpoint salvo `/auth/*` requiere este header [Authorization: Bearer]"* y que *"El `userId` del token define el 'usuario actual' para las reglas de ownership"*. En la implementación real, ningún route handler lee ni verifica el header `Authorization`; en su lugar, cada endpoint acepta un `actorId`/`creatorId`/`authorId`/`userId` como parámetro de entrada (body o query string) y confía en él ciegamente. `resolveActor()` (`ownership.ts:7-16`) simplemente busca en la tabla `users` el id que el propio cliente envía, sin ningún paso de autenticación previo.

**Impacto si se explota:** Cualquier llamante no autenticado puede suplantar a cualquier usuario (incluyendo un admin) con solo conocer o adivinar su `id` — por ejemplo, enviando `actorId: "<id-de-un-admin>"` en `PATCH /tickets/:id` o `DELETE /tickets/:id` para editar/archivar tickets ajenos saltándose por completo el control de ownership descrito en H2/H3/H4 del contrato. También permite crear tickets, comentarios y auditoría atribuidos falsamente a cualquier usuario (`creatorId`, `authorId` en `POST /tickets`, `POST /tickets/:id/comments`), y agregar miembros a cualquier proyecto suplantando al creador (`POST /projects/:id/members`). Esto rompe simultáneamente autenticación (A07) y todo el control de acceso basado en ownership del sistema (A01) — es un bypass total de autorización.

---

### 2. [A01] `GET /projects` no filtra por usuario — expone todos los proyectos a cualquier llamante

**Archivo y línea:** `apps/api/src/app/api/projects/route.ts:30-39`

```ts
const {
  data: rows,
  error,
  count,
} = await supabase
  .from('projects')
  .select('id, name, description, creator_id, created_at', { count: 'exact' })
  .order('created_at', { ascending: false })
  .range(from, to);
```

**Por qué es un problema:** El contrato (`docs/api-contract.md:117`) exige: *"Admin ve todos (H5); user normal solo ve los suyos/donde es miembro — filtrado server-side por `userId` del token"*. La consulta no aplica ningún filtro por `creator_id` ni por membresía (`project_members`), y no hay ningún paso previo que determine quién es el "usuario actual" (ver hallazgo #1). El endpoint devuelve la lista completa de proyectos de todos los usuarios a cualquiera que lo invoque.

**Impacto si se explota:** Fuga de datos de todos los proyectos de la plataforma (nombres, descripciones, creadores) a cualquier actor, autenticado o no, incluidos proyectos donde el llamante no es miembro ni creador.

---

### 3. [A05] `service_role` key de Supabase usada en todos los endpoints sin ninguna capa de autorización que la sustituya

**Archivo y línea:** `apps/api/src/lib/supabase.ts:12-17`

```ts
// Singleton: nunca instanciar un cliente nuevo dentro de un route handler.
// Usa la service_role key porque corre solo en el servidor y RLS sigue
// deshabilitado en esta fase (ver docs/adr/001-database-selection.md).
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false },
});
```

**Por qué es un problema:** Usar `service_role` server-side es un patrón válido *solo si* el código de aplicación implementa consistentemente el control de acceso que normalmente delegaría a RLS. Aquí el comentario admite que RLS está deshabilitado y que la autorización depende enteramente de la lógica de cada route handler — lógica que, según los hallazgos #1 y #2, está rota o ausente en varios endpoints. El resultado es un cliente con privilegios totales sobre la base de datos (bypassa cualquier policy) combinado con cero verificación de identidad real.

**Impacto si se explota:** Al no haber autenticación real (hallazgo #1) y no haber RLS como red de seguridad, cualquier bug de autorización en un endpoint (como los hallazgos #1 y #2) se traduce directamente en acceso irrestricto a *toda* la base de datos a través de ese endpoint — no hay segunda capa de defensa.

---

## Alto

### 4. [A01] `isOwnerOrAdmin` es correcto en su lógica, pero inútil como control porque el `actor` se auto-declara (dependiente del hallazgo #1)

**Archivo y línea:** `apps/api/src/lib/ownership.ts:18-26`

```ts
export function isOwnerOrAdmin(
  actor: Actor,
  ticket: { creator_id: string },
  assigneeIds: string[],
): boolean {
  if (actor.role === 'admin') return true;
  if (actor.id === ticket.creator_id) return true;
  return assigneeIds.includes(actor.id);
}
```

**Por qué es un problema:** La función en sí implementa correctamente la regla de negocio de `docs/api-contract.md:191` (admin O creador O asignado). Sin embargo, como el `actor` se construye a partir de un `actorId` enviado por el propio cliente (ver hallazgo #1) y no de una sesión verificada, un atacante puede simplemente enviar el `actorId` de un usuario con `role: 'admin'` y la función devolverá `true` sin que el atacante haya demostrado ser ese admin. Se reporta por separado del hallazgo #1 porque es el punto exacto donde la decisión de autorización se toma sobre un dato no confiable — el fix de autenticación debe garantizar que `actor` provenga del JWT verificado, no de `parsed.data.actorId`.

**Impacto si se explota:** Escalación de privilegios: cualquier llamante puede operar como admin sobre `PATCH /tickets/:id` y `DELETE /tickets/:id` sin poseer credenciales de admin.

---

## Medio

### 5. [A05] Ausencia total de headers de seguridad HTTP en `next.config.mjs`

**Archivo y línea:** `apps/api/next.config.mjs:1-4`

```js
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
```

**Por qué es un problema:** No se configuran headers como `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`/`frame-ancestors`, ni una `Content-Security-Policy`. Next.js no los añade por defecto; hay que declararlos explícitamente vía la función `headers()` del config.

**Impacto si se explota:** Reduce la defensa en profundidad del API (p. ej. facilita MIME-sniffing o clickjacking si en el futuro se sirve contenido HTML, como ya ocurre en `/api/docs`, ver hallazgo #7). Por sí solo no es explotable directamente contra una API JSON pura, de ahí la severidad Media y no Alta.

---

### 6. [A05] CORS permite credenciales (`Access-Control-Allow-Credentials: true`) combinado con configuración de origen basada en una lista editable por variable de entorno sin validación de formato

**Archivo y línea:** `apps/api/src/middleware.ts:6-18`

```js
const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5175')
  .split(',')
  .map((origin) => origin.trim());

function applyCorsHeaders(res: NextResponse, origin: string | null) {
  if (origin && allowedOrigins.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    res.headers.set('Vary', 'Origin');
  }
  ...
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  return res;
}
```

**Por qué es un problema:** La lógica de allowlist en sí es correcta (no hace echo del origin sin validarlo, y no usa `*`), pero `Access-Control-Allow-Credentials: true` se envía incondicionalmente en *toda* respuesta, incluso cuando el origin no está en la allowlist y por tanto no se setea `Access-Control-Allow-Origin`. No es explotable tal cual (sin `Allow-Origin` el navegador igual bloquea la respuesta), pero es una configuración fallback inesperada: si `FRONTEND_URL` se deja mal configurado en algún entorno (p. ej. vacío, o con un valor por defecto demasiado amplio), el único control que quedaría entre un origen no autorizado y credenciales compartidas sería esa comparación de string.

**Impacto si se explota:** Bajo configuración actual, ninguno directo. El riesgo es de misconfiguración futura: un error al definir `FRONTEND_URL` (p. ej. dejar el default de `.env.template` en producción) ampliaría la superficie de CSRF/credential leakage.

---

## Bajo

### 7. [A05] `/api/docs` sirve Swagger UI sin restricción de entorno, cargando recursos desde CDN externo sin SRI

**Archivo y línea:** `apps/api/src/app/api/docs/route.ts:1-20`

```js
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
...
<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
```

**Por qué es un problema:** No hay verificación de entorno (`NODE_ENV`) para deshabilitar la documentación interactiva en producción, y los scripts se cargan sin `integrity` (Subresource Integrity), dependiendo de la disponibilidad e integridad de `unpkg.com`.

**Impacto si se explota:** Exposición de la superficie de la API (rutas, shapes) a cualquier visitante en producción; si `unpkg.com` o el paquete fueran comprometidos, se serviría JS de terceros sin verificación a los usuarios de `/api/docs`.

---

### 8. [A09] Ausencia de logging de seguridad en operaciones sensibles (login, cambios de permisos, archivado)

**Archivos y líneas:**
- `apps/api/src/app/api/auth/login/route.ts:46-53` — el intento de login fallido (`unauthenticated`) no se registra en ningún log ni tabla de auditoría, solo se devuelve el `problem()`.
- `apps/api/src/app/api/projects/[id]/members/route.ts:56-63` — un intento rechazado de agregar miembro (403 `forbidden`) no genera ninguna entrada de auditoría o log distinta del `console.error` genérico de `internalError`.
- `apps/api/src/app/api/tickets/[id]/route.ts:70-77` — igual: un intento de `PATCH`/`DELETE` rechazado por `isOwnerOrAdmin` no deja rastro alguno más allá de la respuesta HTTP.

**Por qué es un problema:** `apps/api/src/lib/audit.ts` registra correctamente `created`/`updated`/`archived` en `audit_log`, pero solo para operaciones *exitosas* y limitadas a tickets. No existe ningún registro de intentos fallidos de autenticación ni de autorización (login fallido, 403 de ownership), que son precisamente las señales necesarias para detectar fuerza bruta o intentos de escalación de privilegios.

**Impacto si se explota:** Un atacante puede intentar fuerza bruta de credenciales en `/auth/login` o probar sistemáticamente `actorId`/`userId` ajenos en endpoints de ownership (ver hallazgos #1 y #4) sin dejar ninguna huella detectable, retrasando o impidiendo la respuesta a incidentes.

---

## A VERIFICAR

- ¿Existen políticas RLS definidas a nivel de Supabase sobre las tablas (`users`, `projects`, `tickets`, etc.) aunque el cliente use `service_role` y por tanto las bypass? El comentario en `supabase.ts:13-14` dice que "RLS sigue deshabilitado en esta fase", pero esto no se puede confirmar leyendo solo el repo — depende de la configuración remota del proyecto Supabase.
- ¿El `JWT_SECRET` usado en `jwt.ts` se genera y almacena de forma segura en los entornos de despliegue (no solo en `.env.local`)? El repo no permite verificar el valor real usado en producción.
- Dado que `signToken()` se invoca en `/auth/login` y `/auth/register` pero ningún endpoint valida el token emitido (hallazgo #1): ¿es esto una fase de desarrollo intermedia deliberada (como sugieren los comentarios "ver CLAUDE.md / instrucciones de fase") con un plan de habilitar la verificación antes de producción, o quedó así por un descuido? No se encontró ninguna instrucción de fase en `CLAUDE.md` ni en `docs/` que respalde esa referencia.
- `apps/api/.env.template:4` expone la URL real del proyecto Supabase (`https://wugxkiytgjlticzyxxem.supabase.co`) como valor por defecto en el template versionado — ¿se considera esto información sensible en este proyecto, o es aceptable porque la URL del proyecto no es secreta por sí sola (solo lo es `SUPABASE_SERVICE_ROLE_KEY`, que sí está vacía en el template)?
- ¿Hay algún rate limiting configurado a nivel de infraestructura (proxy, Supabase, CDN) para `/auth/login` y `/auth/register` que no sea visible en el código de `apps/api/`?
