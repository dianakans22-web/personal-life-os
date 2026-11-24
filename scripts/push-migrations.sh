#!/usr/bin/env bash
set -euo pipefail

# Push all 7 Personal Life OS PostgreSQL 16 migrations in deterministic order.
# Usage:
#   DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres" ./scripts/push-migrations.sh

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Error: Variabel lingkungan DATABASE_URL belum diset."
  echo "Contoh: DATABASE_URL='postgresql://postgres:pass@host:5432/postgres' ./scripts/push-migrations.sh"
  exit 1
fi

MIGRATIONS_DIR="$(cd "$(dirname "$0")/../supabase/migrations" && pwd)"

echo "Menerapkan migrasi SQL dari: ${MIGRATIONS_DIR}"
for f in "${MIGRATIONS_DIR}"/*.sql; do
  echo "  -> $(basename "$f")"
  psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "$f"
done

echo "Selesai: Seluruh 7 migrasi Personal Life OS + RLS berhasil diterapkan."
