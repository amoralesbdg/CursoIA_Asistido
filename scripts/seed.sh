#!/usr/bin/env bash
#
# seed.sh — Siembra datos de desarrollo para Mini Jira.
#
# Inserta exactamente 2 proyectos, 3 usuarios y 5 tickets (status variado),
# truncando antes las tablas afectadas en el orden correcto de FKs
# (ver database-schema.yaml). Es idempotente: al truncar antes de insertar,
# correr el script N veces deja siempre el mismo resultado.
#
# Uso:
#   scripts/seed.sh             # ejecuta el seed contra la base configurada
#   scripts/seed.sh --dry-run   # solo imprime el SQL que se ejecutaría
#
set -euo pipefail

# ---------------------------------------------------------------------------
# Colores / logging
# ---------------------------------------------------------------------------
RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; BLUE=$'\033[0;34m'; NC=$'\033[0m'
log_info()    { printf '%s[seed]%s %s\n' "$BLUE" "$NC" "$1"; }
log_success() { printf '%s[seed]%s %s\n' "$GREEN" "$NC" "$1"; }
log_warn()    { printf '%s[seed]%s %s\n' "$YELLOW" "$NC" "$1"; }
log_error()   { printf '%s[seed]%s %s\n' "$RED" "$NC" "$1" >&2; }

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

# ---------------------------------------------------------------------------
# Rutas y configuración
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
GENERATED_DIR="$ROOT_DIR/scripts/.generated"
SEED_SQL_FILE="$GENERATED_DIR/seed.sql"

# Carga DATABASE_URI desde apps/api/.env.local, si existe, sin pisar lo ya exportado.
if [[ -z "${DATABASE_URI:-}" && -f "$ROOT_DIR/apps/api/.env.local" ]]; then
  # shellcheck disable=SC1091
  set -a; source "$ROOT_DIR/apps/api/.env.local"; set +a
fi
if [[ -z "${DATABASE_URI:-}" && -f "$ROOT_DIR/.env" ]]; then
  # shellcheck disable=SC1091
  set -a; source "$ROOT_DIR/.env"; set +a
fi

# ---------------------------------------------------------------------------
# SQL: truncate en orden de FKs (hijas -> padres, ver database-schema.yaml)
# seguido de los INSERTs con UUIDs fijos (idempotente junto al truncate previo).
# ---------------------------------------------------------------------------
read -r -d '' SEED_SQL <<'SQL' || true
BEGIN;

-- Truncate en orden de dependencias de FK (de hijas a padres).
TRUNCATE TABLE audit_log, ticket_locks, comments, ticket_tags, ticket_assignees,
  tags, tickets, project_members, projects, users;

-- 3 usuarios
-- password de desarrollo para los 3: "Password123!" (bcrypt, costo 10)
INSERT INTO users (id, name, username, email, password_hash, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Admin Uno', 'admin1', 'admin1@minijira.dev', '$2a$10$k5tiDRdbeD0rvLZITJYJV.yfh8gODYQ4AOMRl3BOBN5qTqVpihl4O', 'admin'),
  ('22222222-2222-2222-2222-222222222222', 'User Dos', 'user2', 'user2@minijira.dev', '$2a$10$k5tiDRdbeD0rvLZITJYJV.yfh8gODYQ4AOMRl3BOBN5qTqVpihl4O', 'user'),
  ('33333333-3333-3333-3333-333333333333', 'User Tres', 'user3', 'user3@minijira.dev', '$2a$10$k5tiDRdbeD0rvLZITJYJV.yfh8gODYQ4AOMRl3BOBN5qTqVpihl4O', 'user');

-- 2 proyectos
INSERT INTO projects (id, name, description, creator_id) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Proyecto Alpha', 'Proyecto semilla de desarrollo', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Proyecto Beta', 'Segundo proyecto semilla de desarrollo', '22222222-2222-2222-2222-222222222222');

-- membresías
INSERT INTO project_members (project_id, user_id) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333');

-- 5 tickets con status variado
INSERT INTO tickets (id, key, project_id, title, description, status, priority, creator_id) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'ALPHA-1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Configurar entorno de desarrollo', 'Dejar el repo listo para onboarding', 'todo', 'high', '11111111-1111-1111-1111-111111111111'),
  ('c0000000-0000-0000-0000-000000000002', 'ALPHA-2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Implementar login', 'RF-01: login con usuario y contraseña', 'in-progress', 'medium', '22222222-2222-2222-2222-222222222222'),
  ('c0000000-0000-0000-0000-000000000003', 'ALPHA-3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Revisar filtros del tablero', 'RF-12: filtros combinados', 'review', 'low', '11111111-1111-1111-1111-111111111111'),
  ('c0000000-0000-0000-0000-000000000004', 'BETA-1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Auditoria WCAG inicial', 'Auditoria de accesibilidad del prototipo', 'done', 'medium', '33333333-3333-3333-3333-333333333333'),
  ('c0000000-0000-0000-0000-000000000005', 'BETA-2', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Definir esquema de base de datos', 'RF relacionadas con el modelo de datos', 'todo', 'high', '22222222-2222-2222-2222-222222222222');

-- asignaciones
INSERT INTO ticket_assignees (ticket_id, user_id) VALUES
  ('c0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111'),
  ('c0000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222'),
  ('c0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111'),
  ('c0000000-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333'),
  ('c0000000-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222');

COMMIT;
SQL

mkdir -p "$GENERATED_DIR"
printf '%s\n' "$SEED_SQL" > "$SEED_SQL_FILE"

if [[ "$DRY_RUN" == "true" ]]; then
  log_warn "Modo --dry-run: no se ejecuta nada. SQL que se correría:"
  echo "----------------------------------------------------------------------"
  cat "$SEED_SQL_FILE"
  echo "----------------------------------------------------------------------"
  exit 0
fi

log_info "Sembrando 2 proyectos, 3 usuarios y 5 tickets..."

if command -v psql >/dev/null 2>&1 && [[ -n "${DATABASE_URI:-}" ]]; then
  log_info "Conexión directa detectada (psql + DATABASE_URI). Ejecutando SQL..."
  psql "$DATABASE_URI" -v ON_ERROR_STOP=1 -f "$SEED_SQL_FILE"
  log_success "Seed aplicado directamente contra la base de datos."
else
  # Sin psql/DATABASE_URI disponibles en este shell: no hay forma de ejecutar
  # SQL contra Supabase desde un script bash. Se deja el archivo generado
  # para correrlo con el MCP de Supabase (execute_sql) o pegarlo en el SQL
  # Editor del dashboard.
  log_warn "No se encontró psql y/o DATABASE_URI configurado."
  log_warn "Se generó el SQL en: $SEED_SQL_FILE"
  log_warn "Ejecútalo con el MCP de Supabase (execute_sql) o en el SQL Editor del dashboard."
fi

log_success "seed.sh terminado."
