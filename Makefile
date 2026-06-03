# =============================================================================
# TenantGuard — Developer Makefile
# =============================================================================
# Usage: make <target>
#        make help   (shows all available targets)
# =============================================================================

SHELL := /bin/bash
.DEFAULT_GOAL := help

# ── Paths ─────────────────────────────────────────────────────────────────────
BACKEND_DIR  := backend
FRONTEND_DIR := frontend
VENV         := $(BACKEND_DIR)/venv
PYTHON       := $(VENV)/bin/python
PIP          := $(VENV)/bin/pip
MANAGE       := $(PYTHON) $(BACKEND_DIR)/manage.py

# ── Colours ───────────────────────────────────────────────────────────────────
BOLD  := \033[1m
RESET := \033[0m
CYAN  := \033[36m
GREEN := \033[32m
YELLOW:= \033[33m

# =============================================================================
# HELP
# =============================================================================

.PHONY: help
help: ## Show this help message
	@echo ""
	@printf "  $(BOLD)TenantGuard — Developer Makefile$(RESET)\n"
	@echo ""
	@printf "  $(CYAN)%-30s$(RESET) %s\n" "Target" "Description"
	@printf "  $(CYAN)%-30s$(RESET) %s\n" "──────────────────────────────" "───────────────────────────────────────────────"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-30s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# =============================================================================
# SETUP & INSTALL
# =============================================================================

.PHONY: setup
setup: backend-venv backend-install frontend-install env-check ## Full first-time setup (venv + deps + env check)
	@echo ""
	@printf "  $(GREEN)✓ Setup complete.$(RESET) Run 'make dev' to start both servers.\n\n"

.PHONY: install
install: backend-install frontend-install ## Install/update all dependencies

.PHONY: backend-venv
backend-venv: ## Create the Python virtual environment
	@if [ ! -d "$(VENV)" ]; then \
		echo "Creating Python virtualenv..."; \
		python3 -m venv $(VENV); \
	else \
		echo "Virtualenv already exists — skipping."; \
	fi

.PHONY: backend-install
backend-install: backend-venv ## Install Python dependencies
	$(PIP) install --upgrade pip --quiet
	$(PIP) install -r $(BACKEND_DIR)/requirements.txt --quiet
	@echo "Backend dependencies installed."

.PHONY: frontend-install
frontend-install: ## Install Node dependencies
	cd $(FRONTEND_DIR) && npm install
	@echo "Frontend dependencies installed."

.PHONY: env-check
env-check: ## Verify required .env files are present
	@missing=0; \
	for f in "$(BACKEND_DIR)/.env" "$(FRONTEND_DIR)/.env.local"; do \
		if [ ! -f "$$f" ]; then \
			printf "  $(YELLOW)⚠  Missing: $$f$(RESET)\n"; \
			missing=1; \
		fi; \
	done; \
	if [ "$$missing" -eq 1 ]; then \
		echo "  Copy the .example files and fill in your values:"; \
		echo "    cp backend/.env.example backend/.env"; \
		echo "    cp frontend/.env.local.example frontend/.env.local"; \
	else \
		echo "  All required .env files present."; \
	fi

# =============================================================================
# LOCAL DEVELOPMENT
# =============================================================================

.PHONY: dev
dev: ## Start backend + frontend dev servers in parallel
	@printf "$(BOLD)Starting backend (port 8000) and frontend (port 3000)...$(RESET)\n"
	@trap 'kill 0' SIGINT; \
	$(MAKE) backend-run & \
	$(MAKE) frontend-dev & \
	wait

.PHONY: backend-run
backend-run: ## Start the Django development server (port 8000)
	$(MANAGE) runserver

.PHONY: frontend-dev
frontend-dev: ## Start the Next.js development server (port 3000)
	cd $(FRONTEND_DIR) && npm run dev

# =============================================================================
# DATABASE
# =============================================================================

.PHONY: migrate
migrate: ## Apply all pending database migrations
	$(MANAGE) migrate

.PHONY: migrations
migrations: ## Create new migrations from model changes
	$(MANAGE) makemigrations

.PHONY: migrations-check
migrations-check: ## Check for missing migrations without writing them
	$(MANAGE) makemigrations --check --dry-run

.PHONY: superuser
superuser: ## Create a Django superuser (interactive)
	$(MANAGE) createsuperuser

.PHONY: db-shell
db-shell: ## Open a Django database shell (psql)
	$(MANAGE) dbshell

.PHONY: django-shell
django-shell: ## Open the Django interactive Python shell
	$(MANAGE) shell

# =============================================================================
# LINT & FORMAT
# =============================================================================

.PHONY: lint
lint: lint-frontend lint-backend ## Run all linters

.PHONY: lint-frontend
lint-frontend: ## Run ESLint on the frontend
	cd $(FRONTEND_DIR) && npm run lint

.PHONY: lint-backend
lint-backend: ## Run flake8 on the backend (install if needed)
	@if $(VENV)/bin/python -c "import flake8" 2>/dev/null; then \
		$(VENV)/bin/flake8 $(BACKEND_DIR) \
			--exclude=$(BACKEND_DIR)/venv,$(BACKEND_DIR)/migrations,$(BACKEND_DIR)/staticfiles \
			--max-line-length=120; \
	else \
		echo "flake8 not installed — run: $(PIP) install flake8"; \
	fi

# =============================================================================
# BUILD
# =============================================================================

.PHONY: build
build: build-backend build-frontend ## Build both Docker images

.PHONY: build-backend
build-backend: ## Build the backend Docker image
	docker build -t tenantguard-backend:local $(BACKEND_DIR)/

.PHONY: build-frontend
build-frontend: ## Build the frontend Docker image
	docker build -t tenantguard-frontend:local $(FRONTEND_DIR)/

.PHONY: frontend-build
frontend-build: ## Run the Next.js production build (no Docker)
	cd $(FRONTEND_DIR) && npm run build

.PHONY: collectstatic
collectstatic: ## Collect Django static files into staticfiles/
	$(MANAGE) collectstatic --noinput

# =============================================================================
# DOCKER
# =============================================================================

.PHONY: up
up: ## Start all services via Docker Compose
	docker compose up -d

.PHONY: down
down: ## Stop all Docker Compose services
	docker compose down

.PHONY: restart
restart: down up ## Restart all Docker Compose services

.PHONY: logs
logs: ## Tail logs from all services (Ctrl-C to stop)
	docker compose logs -f

.PHONY: logs-backend
logs-backend: ## Tail backend service logs
	docker compose logs -f backend

.PHONY: logs-frontend
logs-frontend: ## Tail frontend service logs
	docker compose logs -f frontend

.PHONY: logs-nginx
logs-nginx: ## Tail nginx service logs
	docker compose logs -f nginx

.PHONY: ps
ps: ## Show status of all Docker Compose services
	docker compose ps

.PHONY: exec-backend
exec-backend: ## Open a shell inside the running backend container
	docker compose exec backend bash

.PHONY: exec-frontend
exec-frontend: ## Open a shell inside the running frontend container
	docker compose exec frontend sh

.PHONY: docker-migrate
docker-migrate: ## Run Django migrations inside the running backend container
	docker compose exec backend python manage.py migrate

# =============================================================================
# RELEASE & DEPLOY
# =============================================================================

.PHONY: tag
tag: ## Create and push a release tag (usage: make tag VERSION=1.2.3)
ifndef VERSION
	$(error VERSION is required. Usage: make tag VERSION=1.2.3)
endif
	@echo "Tagging release v$(VERSION)..."
	git tag v$(VERSION)
	git push origin v$(VERSION)
	@printf "$(GREEN)✓ Tag v$(VERSION) pushed — CI will deploy to production.$(RESET)\n"

.PHONY: deploy-staging
deploy-staging: ## Trigger a staging deploy by pushing to main
	@echo "Pushing to main to trigger staging deploy..."
	git push origin main
	@printf "$(GREEN)✓ Pushed. Check GitHub Actions for deploy status.$(RESET)\n"

.PHONY: fetch-env-staging
fetch-env-staging: ## Pull staging .env files from GCS
	bash scripts/fetch-env.sh staging

.PHONY: fetch-env-prod
fetch-env-prod: ## Pull production .env files from GCS
	bash scripts/fetch-env.sh prod

# =============================================================================
# CLEAN
# =============================================================================

.PHONY: clean
clean: clean-pyc clean-static ## Remove all generated build artefacts

.PHONY: clean-pyc
clean-pyc: ## Remove Python bytecode files
	find $(BACKEND_DIR) -type f -name "*.pyc" -delete
	find $(BACKEND_DIR) -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@echo "Cleaned .pyc / __pycache__."

.PHONY: clean-static
clean-static: ## Remove collected static files
	rm -rf $(BACKEND_DIR)/staticfiles
	@echo "Cleaned staticfiles/."

.PHONY: clean-venv
clean-venv: ## Delete the Python virtual environment
	rm -rf $(VENV)
	@echo "Deleted $(VENV)."

.PHONY: clean-node
clean-node: ## Delete frontend node_modules
	rm -rf $(FRONTEND_DIR)/node_modules
	@echo "Deleted frontend/node_modules."

.PHONY: clean-all
clean-all: clean clean-venv clean-node ## Remove everything (venv, node_modules, artefacts)
	@echo "Full clean complete."
