# Makefile
# Development workflow commands

.PHONY: help up down restart logs clean migrate-all seed-data generate-keys

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Docker
up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: down up ## Restart all services

logs: ## View all service logs
	docker-compose logs -f

clean: ## Remove all containers and volumes
	docker-compose down -v
	rm -rf keys/

# Database
migrate-all: migrate-menu migrate-inventory ## Run all migrations
	@echo "All migrations completed"

migrate-menu: ## Run menu service migrations
	docker-compose exec menu-service npm run typeorm migration:run

migrate-inventory: ## Run inventory service migrations
	docker-compose exec inventory-service npm run typeorm migration:run

seed-data: ## Seed test data
	bash scripts/seed-data.sh

# Security
generate-keys: ## Generate JWT RSA key pair
	mkdir -p keys
	openssl genrsa -out keys/jwt-private.pem 2048
	openssl rsa -in keys/jwt-private.pem -pubout -out keys/jwt-public.pem
	chmod 600 keys/jwt-private.pem

# Dependencies
install-deps: ## Install all Node.js dependencies
	cd services/api-gateway && npm install
	cd services/menu-service && npm install
	cd services/inventory-service && npm install

build-all: ## Build all Docker images
	docker-compose build

test: ## Run all tests
	cd services/api-gateway && npm test
	cd services/menu-service && npm test
	cd services/inventory-service && npm test
	cd services/order-service && go test ./...
	cd services/auth-service && pytest
	cd services/analytics-service && pytest
