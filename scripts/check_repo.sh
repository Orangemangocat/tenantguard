#!/usr/bin/env bash
set -euo pipefail

echo "== Backend: install deps =="
python -m pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements_auth.txt

echo "== Backend: compile check =="
python -m compileall src

echo "== Backend: import/smoke check =="
python -c "import importlib; importlib.import_module('src.main'); print('OK: imported src.main')"

echo "== Frontend: install/lint/build =="
cd frontend
corepack enable
pnpm install --frozen-lockfile
pnpm lint
pnpm build
cd ..
cd frontend-next
pnpm install --frozen-lockfile
pnpm build

echo "All checks passed."

