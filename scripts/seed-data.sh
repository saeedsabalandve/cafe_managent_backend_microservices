#!/bin/bash
# scripts/seed-data.sh
# #seed-script #test-data

set -e

echo "🌱 Seeding test data..."

# Seed menu data via API
curl -X POST http://localhost:3002/api/categories \
  -H "Content-Type: application/json" \
  -H "x-cafe-id: 00000000-0000-0000-0000-000000000001" \
  -d '{"name": "Hot Drinks", "sort_order": 1}'

curl -X POST http://localhost:3002/api/categories \
  -H "Content-Type: application/json" \
  -H "x-cafe-id: 00000000-0000-0000-0000-000000000001" \
  -d '{"name": "Cold Drinks", "sort_order": 2}'

curl -X POST http://localhost:3002/api/categories \
  -H "Content-Type: application/json" \
  -H "x-cafe-id: 00000000-0000-0000-0000-000000000001" \
  -d '{"name": "Pastries", "sort_order": 3}'

echo "✅ Test data seeded successfully"
