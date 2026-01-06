SHELL := /bin/bash
PYTHON := python
PNPM := pnpm
FRONTEND_DIR := frontend
FRONTEND_BLOG_DIR := frontend-next
VENV_DIR := venv

.PHONY: help venv setup backend-install backend-check backend-run worker-run \
  frontend-install frontend-dev frontend-lint frontend-build frontend-preview verify

help:
	@printf "Targets:\n"
	@printf "  setup             Install backend and frontend dependencies\n"
	@printf "  backend-install   Install Python dependencies with pip\n"
	@printf "  backend-check     Compile backend modules to find syntax issues early\n"
	@printf "  backend-run       Launch the Flask app (src.main)\n"
	@printf "  worker-run        Launch the background worker (src.worker)\n"
	@printf "  frontend-install  Install frontend packages with pnpm\n"
	@printf "  frontend-dev      Start the frontend dev server\n"
	@printf "  frontend-lint     Run the frontend linter\n"
	@printf "  frontend-build    Build the frontend for production\n"
	@printf "  frontend-preview  Run the frontend preview server\n"
	@printf "  verify            Run backend syntax checks and frontend build\n"

# install both back and front dependencies
setup: venv backend-install frontend-install

venv:
	$(PYTHON) -m venv $(VENV_DIR) && source $(VENV_DIR)/bin/activate

backend-install:
	$(PYTHON) -m pip install -r requirements.txt

backend-check:
	$(PYTHON) -m compileall src

backend-run:
	$(PYTHON) -m src.main

worker-run:
	$(PYTHON) -m src.worker

frontend-install:
	cd $(FRONTEND_DIR) && $(PNPM) install --frozen-lockfile && \
	cd ../$(FRONTEND_BLOG_DIR) && $(PNPM) install --frozen-lockfile

frontend-dev:
	cd $(FRONTEND_DIR) && $(PNPM) run dev

frontend-lint:
	cd $(FRONTEND_DIR) && $(PNPM) run lint && \
	cd ../$(FRONTEND_BLOG_DIR) && $(PNPM) run lint

frontend-build:
	cd $(FRONTEND_DIR) && $(PNPM) run build && \
	cd ../$(FRONTEND_BLOG_DIR) && $(PNPM) run build

frontend-preview:
	cd $(FRONTEND_DIR) && $(PNPM) run preview

verify: backend-check frontend-install frontend-build
