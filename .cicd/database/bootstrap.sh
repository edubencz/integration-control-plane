#!/bin/sh
set -eu

wait_for_database() {
  host="$1"
  port="$2"
  database="$3"
  username="$4"
  password="$5"
  sslmode="$6"
  attempts=0
  until PGPASSWORD="$password" PGSSLMODE="$sslmode" pg_isready -h "$host" -p "$port" -d "$database" -U "$username" >/dev/null 2>&1; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 30 ]; then
      echo "PostgreSQL indisponível em ${host}:${port}/${database}."
      return 1
    fi
    sleep 2
  done
}

run_psql() {
  host="$1"
  port="$2"
  database="$3"
  username="$4"
  password="$5"
  sslmode="$6"
  shift 6
  PGPASSWORD="$password" PGSSLMODE="$sslmode" psql \
    -v ON_ERROR_STOP=1 -h "$host" -p "$port" -d "$database" -U "$username" "$@"
}

wait_for_database "$DB_HOST" "$DB_PORT" "$DB_NAME" "$DB_USERNAME" "$DB_PASSWORD" "$DB_SSL_MODE"
wait_for_database "$CREDENTIALS_DB_HOST" "$CREDENTIALS_DB_PORT" "$CREDENTIALS_DB_NAME" \
  "$CREDENTIALS_DB_USERNAME" "$CREDENTIALS_DB_PASSWORD" "$DB_SSL_MODE"

main_schema=$(run_psql "$DB_HOST" "$DB_PORT" "$DB_NAME" "$DB_USERNAME" "$DB_PASSWORD" \
  "$DB_SSL_MODE" -Atqc "SELECT to_regclass('public.organizations')")
if [ -z "$main_schema" ]; then
  echo "Inicializando o schema principal do ICP."
  run_psql "$DB_HOST" "$DB_PORT" "$DB_NAME" "$DB_USERNAME" "$DB_PASSWORD" \
    "$DB_SSL_MODE" -1 -f /scripts/postgresql_init.sql
fi

credentials_schema=$(run_psql "$CREDENTIALS_DB_HOST" "$CREDENTIALS_DB_PORT" "$CREDENTIALS_DB_NAME" \
  "$CREDENTIALS_DB_USERNAME" "$CREDENTIALS_DB_PASSWORD" "$DB_SSL_MODE" \
  -Atqc "SELECT to_regclass('public.user_credentials')")
if [ -z "$credentials_schema" ]; then
  echo "Inicializando o schema de credenciais do ICP."
  run_psql "$CREDENTIALS_DB_HOST" "$CREDENTIALS_DB_PORT" "$CREDENTIALS_DB_NAME" \
    "$CREDENTIALS_DB_USERNAME" "$CREDENTIALS_DB_PASSWORD" "$DB_SSL_MODE" \
    -1 -f /scripts/credentials_postgresql_init.sql
fi

for migration in /scripts/migration-*.sql; do
  run_psql "$DB_HOST" "$DB_PORT" "$DB_NAME" "$DB_USERNAME" "$DB_PASSWORD" \
    "$DB_SSL_MODE" -f "$migration"
done

admin_hash=$(cat /work/admin.hash)
run_psql "$CREDENTIALS_DB_HOST" "$CREDENTIALS_DB_PORT" "$CREDENTIALS_DB_NAME" \
  "$CREDENTIALS_DB_USERNAME" "$CREDENTIALS_DB_PASSWORD" "$DB_SSL_MODE" \
  -v admin_hash="$admin_hash" -f /scripts/admin_credentials.sql
run_psql "$DB_HOST" "$DB_PORT" "$DB_NAME" "$DB_USERNAME" "$DB_PASSWORD" \
  "$DB_SSL_MODE" -f /scripts/admin_user.sql

echo "Banco de dados e usuário administrativo preparados."
