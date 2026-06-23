# ☕ Café Management Backend Microservices

Production-grade microservices architecture for multi-tenant café management application. Developed in 2020.

## Architecture

```

Client → API Gateway → Auth Service (FastAPI)
→ Menu Service (Node/TS + PostgreSQL)
→ Order Service (Go/Gin + MongoDB)
→ Inventory Service (Node/TS + PostgreSQL)
→ Analytics Service (Python + ClickHouse)
↔ Redis (Cache & Pub/Sub)

```

## Services

| Service | Stack | Database | Port |
|---------|-------|----------|------|
| API Gateway | TypeScript/Express | - | 3000 |
| Auth Service | Python/FastAPI | MongoDB 4.2 | 3001 |
| Menu Service | TypeScript/TypeORM | PostgreSQL 12 | 3002 |
| Order Service | Go/Gin | MongoDB 4.2 | 3003 |
| Inventory Service | TypeScript/Express | PostgreSQL 12 | 3004 |
| Analytics Service | Python/FastAPI | ClickHouse 20.3 | 3005 |

## Quick Start

```bash
git clone <repo-url> && cd cafe-management-backend
cp .env.example .env
make generate-keys
docker-compose up -d
make migrate-all
make seed-data
```

Tech Stack (2020)

TypeScript 3.9, Python 3.8, Go 1.14, PostgreSQL 12, MongoDB 4.2, Redis 6, ClickHouse 20.3, Docker 19.03, Kubernetes 1.18

```

---

## `/.gitignore`

```gitignore
# Dependencies
node_modules/
__pycache__/
*.pyc
vendor/

# Environment
.env
.env.local
.env.production

# Keys & Secrets
keys/
*.pem
*.key
credentials.json

# IDE
.vscode/
.idea/
*.swp
*.swo

# Build outputs
dist/
build/
*.tsbuildinfo

# Terraform
.terraform/
terraform.tfstate
terraform.tfstate.backup
*.tfvars

# Docker
docker-compose.override.yml

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Test coverage
coverage/
*.coverage
coverage.out

# Go
go.sum
```
