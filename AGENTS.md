# AGENTS.md — TenantGuard Patch-Only Contract (Flask + Vite React)

Agents must operate in PATCH-ONLY mode. No direct overwrites. All changes are delivered as unified diff patches and merged via PR.

## ALL AGENTS MUST READ 'docs/control-plane' IMMEDIATELY!
- Once you're ve read and understand the control-plane, you MUST say to the user:
  "I UNDERSTAND THE CONTROL-PLANE DOCUMENTATION!"

Repo layout:
- `src/` = Flask backend (Python 3.12), entrypoint `src/main.py`
- `src/worker.py` = Background worker (Python)
- `frontend/` = Vite + React frontend (pnpm)
- `frontend-next/` = blog static file generation frontend (pnpm)
- `docs/control-plane/` = Control Plane docs (Markdown, AGENTS READ THIS FIRST)
- `docs/` = Documentation (Markdown)
- `workorders/` = Work Orders (Markdown)
- `.github/` = GitHub Actions workflows
- `scripts/` = Utility scripts (Python/JS)
- `AGENTS.md` = This file


---

## 1) Non-Negotiable Rules

1. Patch-only output
   - All code changes MUST be delivered as unified diffs (`diff --git ...`).
   - Do not output full replacement file contents unless explicitly approved in a Work Order.

2. Scope discipline
   - Every change MUST reference a Work Order in `/workorders/` (or the agent must propose one first).
   - Touch only files required to satisfy acceptance criteria.

3. No secrets
   - Never add API keys, tokens, credentials, or service account JSON files to the repo.
   - Never commit `.env` values. Env var names only.

4. No destructive edits
   - Do not delete directories or do sweeping rewrites without explicit approval.
   - Avoid mass formatting unless it is the task.

---

## 2) Allowed Paths (Strict)

Agents may modify ONLY:
- `src/**`
- `frontend/**`
- `docs/**`
- `scripts/**`
- `.github/**`
- `workorders/**`
- `AGENTS.md`

---

## 3) Blocked Paths (Unless Work Order Explicitly Allows)

Agents MUST NOT touch:
- `**/.env*`
- `**/secrets/**`
- `**/*.pem`
- `**/*id_rsa*`
- `**/__pycache__/**`
- `**/*.pyc`
- SQLite databases and generated data:
  - `src/database/*.db`
- Build output unless explicitly requested:
  - `frontend/dist/**` (if generated)
- Lockfile unless dependency changes require it:
  - `frontend/pnpm-lock.yaml`

---

## 4) Required Output Format (Strict)

Any response that changes code MUST include:

1) Plan (5–15 lines)
   - Bullet list
   - Exact file paths to be changed/added

2) Patch
   - Unified diff only in a fenced `diff` block
   - No commentary inside the diff block

3) Verification
   - Exact commands to run for impacted areas

---

## 5) Verification Commands (Current Defaults)

Frontend (from `frontend/package.json`):
- `cd frontend && pnpm install --frozen-lockfile`
- `cd frontend && pnpm lint`
- `cd frontend && pnpm build`

Backend (repo-safe checks without assuming dependencies):
- `python -m pip install -r requirements.txt -r requirements_auth.txt`
- `python -m compileall src`
- `python -c "import importlib; importlib.import_module('src.main')"`

If backend tests exist later, add:
- `pytest` or `python -m unittest`

Agents must not invent test commands.

---

## 6) Manus Prompt Template (Mandatory)

You are operating under AGENTS.md (Patch-Only).
Repo layout: `src/` Flask backend, `frontend/` Vite React frontend.
Output: (1) plan (2) unified diff patch (3) verification commands.
Do NOT overwrite files. Do NOT output full file replacements.
Do NOT touch blocked paths (env/secrets/credentials/__pycache__/*.pyc/sqlite db/build output/lockfile unless required).

Begin by listing the exact files you will change.

---
Version: v0

