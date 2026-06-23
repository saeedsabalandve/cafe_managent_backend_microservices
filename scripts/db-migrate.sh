#!/bin/bash
# scripts/db-migrate.sh
# #migration-script #database

set -e

MIGRATION_TYPE=${1:-"up"}

echo "Running database migrations ($MIGRATION_TYPE)..."

if [ "$MIGRATION_TYPE" = "up" ]; then
  docker-compose exec menu-service npm run typeorm migration:run
  docker-compose exec inventory-service npm run typeorm migration:run
elif [ "$MIGRATION_TYPE" = "down" ]; then
  docker-compose exec menu-service npm run typeorm migration:revert
  docker-compose exec inventory-service npm run typeorm migration:revert
elif [ "$MIGRATION_TYPE" = "generate" ]; then
  docker-compose exec menu-service npm run typeorm migration:generate -- -n "$2"
fi

echo "✅ Migrations completed"
