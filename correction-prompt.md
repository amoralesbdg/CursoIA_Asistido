Actúa como ingeniero de seguridad corrigiendo hallazgos de una auditoría OWASP Top 10 sobre `apps/api/` (Next.js + Supabase) del proyecto Mini Jira. Trabaja **una corrección a la vez, en el orden listado abajo (más crítico primero), y detente después de aplicar cada una** para que yo revise el diff antes de continuar con la siguiente. No apliques varias correcciones en lote: un fix de seguridad mal aplicado puede romper funcionalidad existente o introducir una vulnerabilidad distinta, así que cada una necesita revisión humana independiente antes de seguir.

No necesitas releer `security-report.md`; cada corrección abajo incluye su referencia (archivo + línea) y el contexto necesario.

---

## Corrección 1 (Crítico) — Implementar verificación real de `Authorization: Bearer <token>` y derivar el actor del JWT, no de parámetros del cliente

**Referencia del hallazgo:** `apps/api/src/lib/jwt.ts:14-15`, `apps/api/src/lib/ownership.ts:5-16`, y todos los route handlers que leen `actorId`/`creatorId`/`authorId`/`userId` del body o query string: `apps/api/src/app/api/tickets/[id]/route.ts:39,165`, `apps/api/src/app/api/projects/[id]/members/route.ts:33`, `apps/api/src/app/api/tickets/route.ts:130`, `apps/api/src/app/api/tickets/[id]/comments/route.ts:109`, `apps/api/src/app/api/tickets/[id]/lock/route.ts:31,86`.

**Qué hacer:**
1. Crea una función `getAuthenticatedActor(req: Request): Promise<{ id: string; role: 'admin' | 'user' } | null>` (p. ej. en `apps/api/src/lib/auth.ts`) que lea el header `Authorization`, extraiga el Bearer token, lo verifique con `jsonwebtoken.verify` usando `JWT_SECRET`, y devuelva `{ id: payload.sub, role: payload.role }` o `null` si falta/es inválido/expiró.
2. En cada route handler que hoy acepta `actorId`/`creatorId`/`authorId` como parámetro de entrada (body o query), elimina ese campo del schema de request y, en su lugar, llama a `getAuthenticatedActor(req)` al inicio del handler. Si devuelve `null`, responde `problem('unauthenticated', ...)` (401) de inmediato.
3. Usa el `id`/`role` devuelto por `getAuthenticatedActor` en todos los lugares donde hoy se usa el `actorId` del cliente: `resolveActor()` ya no debería ser necesario como paso separado si el JWT ya trae el `role`; si prefieres mantenerlo para revalidar contra la DB (p. ej. por si el rol cambió desde que se emitió el token), hazlo con el `id` del JWT, nunca con un id enviado por el cliente.
4. Mantén `POST /auth/login` y `POST /auth/register` sin esta verificación (son los únicos endpoints públicos por contrato).
5. Actualiza `docs/api-contract.md` si cambia algún shape de payload (p. ej. `actorId` deja de ser parte del body/query de `PATCH /tickets/:id`, `DELETE /tickets/:id`, `POST /projects/:id/members`, `POST /tickets`, `POST /tickets/:id/comments`, `POST`/`DELETE /tickets/:id/lock`).

**Detente aquí y espera mi revisión del diff antes de continuar.**

---

## Corrección 2 (Crítico) — Filtrar `GET /projects` por usuario autenticado (admin ve todo, user normal solo lo suyo/donde es miembro)

**Referencia del hallazgo:** `apps/api/src/app/api/projects/route.ts:30-39`.

**Qué hacer:**
1. Esta corrección depende de la Corrección 1 (necesitas el actor autenticado). Usa `getAuthenticatedActor(req)` al inicio de `GET /projects`.
2. Si `actor.role === 'admin'`, mantén la query actual sin filtro adicional.
3. Si no es admin, agrega el filtro: el proyecto debe tener `creator_id = actor.id` O el actor debe aparecer en `project_members` para ese proyecto. Esto probablemente requiere un `OR` vía `.or()` de supabase-js sobre un subquery de `project_members`, o dos queries combinadas (ids de proyectos donde es miembro + filtro `creator_id.eq.<id>,id.in.(<ids>)`).
4. Verifica que la paginación (`count: 'exact'`) siga siendo correcta sobre el conjunto ya filtrado.

**Detente aquí y espera mi revisión del diff antes de continuar.**

---

## Corrección 3 (Alto) — Confirmar que `isOwnerOrAdmin` solo recibe actores derivados del JWT verificado

**Referencia del hallazgo:** `apps/api/src/lib/ownership.ts:18-26` (dependiente de la Corrección 1).

**Qué hacer:**
1. Esta corrección es principalmente de verificación, no de código nuevo: una vez aplicada la Corrección 1, confirma que **todos** los call sites de `isOwnerOrAdmin` (`apps/api/src/app/api/tickets/[id]/route.ts`, y cualquier otro que uses) reciben el `actor` desde `getAuthenticatedActor(req)` y no desde un `actorId` parseado del body/query.
2. Si en la Corrección 1 decidiste mantener `resolveActor(actorId)` como paso de revalidación contra la DB, asegúrate de que el `actorId` que le pasas ahí es `jwtPayload.sub` (del token verificado), nunca `parsed.data.actorId`.
3. Opcional pero recomendado: elimina por completo la capacidad de `resolveActor` de aceptar un id arbitrario sin contexto de request — hazla recibir el `TokenPayload` ya verificado en vez de un string suelto, para que sea imposible volver a introducir este bug por accidente en un endpoint futuro.

**Detente aquí y espera mi revisión del diff antes de continuar.**

---

## Corrección 4 (Medio) — Agregar headers de seguridad HTTP en `next.config.mjs`

**Referencia del hallazgo:** `apps/api/next.config.mjs:1-4`.

**Qué hacer:**
1. Agrega una función `headers()` en `nextConfig` que aplique a todas las rutas (`source: '/:path*'`) al menos:
   - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Content-Security-Policy` razonable para una API JSON (p. ej. `default-src 'none'; frame-ancestors 'none'`), salvo que debas dejar una política más permisiva específicamente para `/api/docs` (ver Corrección 6).
2. No rompas el `OPTIONS`/CORS existente en `apps/api/src/middleware.ts` — confirma que ambos mecanismos (middleware y `next.config.mjs` headers) coexisten sin pisarse (Next.js aplica los headers de config antes del middleware; revisa que no haya headers duplicados o contradictorios en la respuesta final).

**Detente aquí y espera mi revisión del diff antes de continuar.**

---

## Corrección 5 (Medio) — Endurecer el fallback de CORS con credenciales

**Referencia del hallazgo:** `apps/api/src/middleware.ts:6-18`.

**Qué hacer:**
1. Mueve `res.headers.set('Access-Control-Allow-Credentials', 'true')` dentro del bloque `if (origin && allowedOrigins.includes(origin))`, de modo que las credenciales solo se habiliten cuando el origin fue efectivamente validado y reflejado.
2. Considera validar que cada valor de `FRONTEND_URL` sea una URL bien formada (p. ej. con `new URL(origin)` en un try/catch) antes de añadirla a `allowedOrigins`, para evitar que un typo silencioso (espacio, protocolo faltante) deje la lista vacía o mal formada sin que nadie lo note en el arranque.

**Detente aquí y espera mi revisión del diff antes de continuar.**

---

## Corrección 6 (Bajo) — Restringir `/api/docs` a entornos no productivos y añadir SRI a los scripts de Swagger UI

**Referencia del hallazgo:** `apps/api/src/app/api/docs/route.ts:1-20`.

**Qué hacer:**
1. Al inicio del handler `GET`, si `process.env.NODE_ENV === 'production'`, responde 404 (usa el helper `problem('not-found', ...)` existente en `@/lib/http`, o un 404 plano si prefieres no exponer que la ruta existió alguna vez).
2. Para los `<script>`/`<link>` que cargan desde `unpkg.com`, agrega atributos `integrity` (hash SRI) y `crossorigin="anonymous"`, fijando la versión exacta del paquete (ya está fijada a `swagger-ui-dist@5`, pero confirma que apunta a una versión patch específica, no a un rango).

**Detente aquí y espera mi revisión del diff antes de continuar.**

---

## Corrección 7 (Bajo) — Registrar intentos fallidos de autenticación y autorización

**Referencia del hallazgo:** `apps/api/src/app/api/auth/login/route.ts:46-53`, `apps/api/src/app/api/projects/[id]/members/route.ts:56-63`, `apps/api/src/app/api/tickets/[id]/route.ts:70-77`.

**Qué hacer:**
1. En `POST /auth/login`, cuando las credenciales son incorrectas (antes de devolver el `problem('unauthenticated', ...)`), agrega un `console.warn` o, si prefieres persistencia, una tabla `auth_log` (fuera de alcance si no existe ya — en ese caso usa logging estructurado a stdout por ahora) con al menos: `username` intentado (no la contraseña), timestamp, y un indicador de resultado fallido.
2. En los puntos donde `isOwnerOrAdmin` devuelve `false` (tanto en `PATCH` como en `DELETE /tickets/:id`) y en `POST /projects/:id/members` cuando el actor no es creador ni admin, agrega un log de advertencia con `actorId` (del JWT, no del cliente, tras la Corrección 1), el recurso objetivo, y la acción rechazada — esto es lo mínimo para poder detectar intentos de escalación de privilegios después de las Correcciones 1-3.
3. No registres nunca el valor de `password` ni el JWT completo en estos logs.

**Detente aquí y espera mi revisión final.**
