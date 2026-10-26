# syntax=docker/dockerfile:1
#
# Build desde la raíz del monorepo (pnpm workspace):
#   docker build -f apps/api/Dockerfile -t minijira-api .
# El docker-compose.yml de la raíz ya referencia context: . y este dockerfile.

ARG NODE_VERSION=20-alpine

# ---------- deps: resuelve e instala solo el workspace @minijira/api ----------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
RUN corepack enable

# Copiamos primero los manifests de TODO el workspace (no el código) para que
# pnpm-lock.yaml valide contra la misma topología con la que fue generado
# (pnpm-workspace.yaml incluye apps/* y packages/*), y para cachear esta capa
# entre builds. El --filter de abajo igual instala únicamente lo que @minijira/api
# necesita (no tiene dependencias workspace:* propias).
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

# node-linker=hoisted (solo para este install, no afecta pnpm-lock.yaml ni el dev
# local): el linker por defecto de pnpm symlinkea node_modules hacia un store interno
# (.pnpm/). El "output: standalone" de Next copia esos symlinks tal cual a .next/standalone,
# con rutas relativas que calculan mal al quedar un nivel más profundo — el módulo
# termina roto en runtime. Con node-linker=hoisted, pnpm coloca los paquetes reales
# directamente en node_modules, que es justo lo que el tracing de standalone sabe empaquetar.
RUN pnpm install --frozen-lockfile --filter @minijira/api... --node-linker=hoisted

# ---------- builder: compila con output standalone ----------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY apps/api ./apps/api

# Con pnpm-workspace.yaml presente, Next detecta la raíz real del monorepo y el
# output queda anidado en .next/standalone/apps/api/server.js (en vez de aplanarse),
# que es la estructura que la imagen final espera.
RUN pnpm --filter @minijira/api build

# ---------- runner: solo los artefactos de standalone, usuario no-root ----------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -s /bin/sh -D nextjs

# .next/standalone ya es autocontenido (server.js + solo los node_modules que el
# tracing de Next detectó como necesarios en runtime). Solo falta sumarle .next/static
# y public/, que standalone no incluye por diseño.
COPY --from=builder --chown=nextjs:nodejs /app/apps/api/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/api/.next/static ./apps/api/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/api/public ./apps/api/public

USER nextjs

EXPOSE 3000

CMD ["node", "apps/api/server.js"]
