#!/usr/bin/env bash
#
# cleanup.sh — Limpia datos de prueba y archivos temporales de Mini Jira.
#
# Trunca las tablas de datos de prueba en el orden correcto de FKs y borra
# los archivos temporales generados por scripts/ (p. ej. scripts/.generated).
# Pide confirmación interactiva antes de tocar la base de datos, salvo que
# se pase --force.
#
# Uso:
#   scripts/cleanup.sh             # pide confirmación antes de truncar la BD
#   scripts/cleanup.sh --force     # no pide confirmación
#   scripts/cleanup.sh --dry-run   # solo imprime lo que haría, no toca nada
#
set -euo pipefail

# ---------------------------------------------------------------------------
# Colores / logging
# ---------------------------------------------------------------------------
RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; BLUE=$'\033[0;34m'; NC=$'\033[0m'
log_info()    { printf '%s[cleanup]%s %s\n' "$BLUE" "$NC" "$1"; }
log_success() { printf '%s[cleanup]%s %s\n' "$GREEN" "$NC" "$1"; }
log_warn()    { printf '%s[cleanup]%s %s\n' "$YELLOW" "$NC" "$1"; }
log_error()   { printf '%s[cleanup]%s %s\n' "$RED" "$NC" "$1" >&2; }

# ---------------------------------------------------------------------------
# Argumentos
# ---------------------------------------------------------------------------
DRY_RUN=false
FORCE=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --force) FORCE=true ;;
    *) log_error "Argumento desconocido: $arg"; exit 1 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
GENERATED_DIR="$ROOT_DIR/scripts/.generated"

# Tablas de datos de prueba, en orden de truncate correcto para FKs
# (hijas -> padres; ver database-schema.yaml).
TRUNCATE_SQL="TRUNCATE TABLE audit_log, ticket_locks, comments, ticket_tags, ticket_assignees, tags, tickets, project_members, projects, users;"

if [[ -z "${DATABASE_URI:-}" && -f "$ROOT_DIR/apps/api/.env.local" ]]; then
  # shellcheck disable=SC1091
  set -a; source "$ROOT_DIR/apps/api/.env.local"; set +a
fi
if [[ -z "${DATABASE_URI:-}" && -f "$ROOT_DIR/.env" ]]; then
  # shellcheck disable=SC1091
  set -a; source "$ROOT_DIR/.env"; set +a
fi

# ---------------------------------------------------------------------------
# Dry-run: solo informar, no tocar nada
# ---------------------------------------------------------------------------
if [[ "$DRY_RUN" == "true" ]]; then
  log_warn "Modo --dry-run: no se ejecuta nada."
  log_warn "Se truncarían estas tablas (orden FK): $TRUNCATE_SQL"
  log_warn "Se borraría el directorio temporal: $GENERATED_DIR"
  exit 0
fi

# ---------------------------------------------------------------------------
# Confirmación interactiva, salvo --force
# ---------------------------------------------------------------------------
if [[ "$FORCE" != "true" ]]; then
  log_warn "Esto truncará TODAS las tablas de datos de prueba (users, projects, tickets, ...)."
  read -r -p "¿Confirmas que quieres continuar? [y/N] " reply
  case "$reply" in
    y|Y|yes|YES) ;;
    *) log_info "Cancelado por el usuario."; exit 0 ;;
  esac
fi

# ---------------------------------------------------------------------------
# Truncar tablas de prueba
# ---------------------------------------------------------------------------
if command -v psql >/dev/null 2>&1 && [[ -n "${DATABASE_URI:-}" ]]; then
  log_info "Truncando tablas de prueba..."
  psql "$DATABASE_URI" -v ON_ERROR_STOP=1 -c "$TRUNCATE_SQL"
  log_success "Tablas de prueba truncadas."
else
  log_warn "No se encontró psql y/o DATABASE_URI configurado."
  log_warn "Ejecuta manualmente este SQL (con el MCP de Supabase o el SQL Editor):"
  echo "  $TRUNCATE_SQL"
fi

# ---------------------------------------------------------------------------
# Borrar archivos temporales generados por scripts/
# ---------------------------------------------------------------------------
if [[ -d "$GENERATED_DIR" ]]; then
  log_info "Borrando archivos temporales en $GENERATED_DIR..."
  rm -rf "$GENERATED_DIR"
  log_success "Archivos temporales borrados."
else
  log_info "No hay archivos temporales que borrar."
fi

log_success "cleanup.sh terminado."
