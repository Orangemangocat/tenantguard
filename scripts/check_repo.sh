#!/usr/bin/env bash
set -euo pipefail

echo "== Backend: install deps =="
venv/bin/python -m pip install --upgrade pip
venv/bin/pip install -r requirements.txt

echo "== Backend: compile check =="
venv/bin/python -m compileall src

echo "== Backend: import/smoke check =="
venv/bin/python -c "import importlib; importlib.import_module('src.main'); print('OK: imported src.main')"
venv/bin/python -c "import importlib; importlib.import_module('src.worker'); print('OK: imported src.worker')"

echo "== Frontend: install/lint/build =="
cd frontend
# corepack enable
pnpm install --frozen-lockfile
# pnpm lint
pnpm build
cd ..
cd frontend-next
pnpm install --frozen-lockfile
pnpm build

echo "All checks passed."

