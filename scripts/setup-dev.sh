#!/usr/bin/env bash
#
# setup-dev.sh — Prepara el entorno de desarrollo de Mini Jira.
#
# 1) Instala dependencias con pnpm.
# 2) Crea .env / apps/api/.env.local desde su *.env.template SOLO si no existen
#    (nunca sobrescribe un .env existente).
# 3) Corre migraciones si el proyecto las tiene.
# 4) Verifica que la base de datos responde con un SELECT 1.
#
# Uso:
#   scripts/setup-dev.sh             # ejecuta todos los pasos
#   scripts/setup-dev.sh --dry-run   # solo imprime lo que haría
#
set -euo pipefail

# ---------------------------------------------------------------------------
# Colores / logging
# ---------------------------------------------------------------------------
RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; BLUE=$'\033[0;34m'; NC=$'\033[0m'
log_info()    { printf '%s[setup-dev]%s %s\n' "$BLUE" "$NC" "$1"; }
log_success() { printf '%s[setup-dev]%s %s\n' "$GREEN" "$NC" "$1"; }
log_warn()    { printf '%s[setup-dev]%s %s\n' "$YELLOW" "$NC" "$1"; }
log_error()   { printf '%s[setup-dev]%s %s\n' "$RED" "$NC" "$1" >&2; }

# ---------------------------------------------------------------------------
# Argumentos
# ---------------------------------------------------------------------------
DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    *) log_error "Argumento desconocido: $arg"; exit 1 ;;
  esac
done

run() {
  if [[ "$DRY_RUN" == "true" ]]; then
    printf '  %s[dry-run]%s %s\n' "$YELLOW" "$NC" "$*"
  else
    "$@"
  fi
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

# ---------------------------------------------------------------------------
# 1) Dependencias
# ---------------------------------------------------------------------------
log_info "Instalando dependencias con pnpm..."
if ! command -v pnpm >/dev/null 2>&1; then
  log_error "pnpm no está instalado. Instálalo (corepack enable && corepack prepare pnpm@10.33.2 --activate) y vuelve a intentar."
  exit 1
fi
run pnpm install

# ---------------------------------------------------------------------------
# 2) Archivos .env, solo si no existen ya
# ---------------------------------------------------------------------------
declare -a ENV_PAIRS=(
  "$ROOT_DIR/.env.template:$ROOT_DIR/.env"
  "$ROOT_DIR/apps/api/.env.template:$ROOT_DIR/apps/api/.env.local"
)

for pair in "${ENV_PAIRS[@]}"; do
  template="${pair%%:*}"
  target="${pair##*:}"
  if [[ ! -f "$template" ]]; then
    log_warn "No existe plantilla $template, se omite."
    continue
  fi
  if [[ -f "$target" ]]; then
    log_info "Ya existe $target, no se sobrescribe."
  else
    log_info "Creando $target desde $(basename "$template")..."
    run cp "$template" "$target"
  fi
done

# ---------------------------------------------------------------------------
# 3) Migraciones (si el proyecto las tiene)
# ---------------------------------------------------------------------------
if [[ -d "$ROOT_DIR/supabase/migrations" ]]; then
  if command -v supabase >/dev/null 2>&1; then
    log_info "Aplicando migraciones con Supabase CLI..."
    run supabase db push
  else
    log_warn "Se encontraron migraciones en supabase/migrations pero no está instalado el CLI de Supabase. Instálalo para aplicarlas."
  fi
elif [[ -f "$ROOT_DIR/prisma/schema.prisma" ]]; then
  log_info "Aplicando migraciones con Prisma..."
  run pnpm exec prisma migrate deploy --schema "$ROOT_DIR/prisma/schema.prisma"
else
  log_info "No se encontraron migraciones (sin supabase/migrations ni prisma/schema.prisma). Se omite este paso."
fi

# ---------------------------------------------------------------------------
# 4) Verificar que la base de datos responde
# ---------------------------------------------------------------------------
if [[ -z "${DATABASE_URI:-}" && -f "$ROOT_DIR/.env" ]]; then
  # shellcheck disable=SC1091
  set -a; source "$ROOT_DIR/.env"; set +a
fi

if [[ "$DRY_RUN" == "true" ]]; then
  log_warn "[dry-run] Verificaría conectividad con: psql \"\$DATABASE_URI\" -c 'SELECT 1;'"
else
  if command -v psql >/dev/null 2>&1 && [[ -n "${DATABASE_URI:-}" ]]; then
    log_info "Verificando conectividad con la base de datos..."
    if psql "$DATABASE_URI" -v ON_ERROR_STOP=1 -c 'SELECT 1;' >/dev/null; then
      log_success "La base de datos responde correctamente (SELECT 1)."
    else
      log_error "No se pudo ejecutar SELECT 1 contra la base de datos."
      exit 1
    fi
  else
    log_warn "No se puede verificar la base de datos: falta psql o DATABASE_URI en .env."
    log_warn "Completa DATABASE_URI en .env (ver .env.template) y vuelve a correr este script."
  fi
fi

log_success "setup-dev.sh terminado."
