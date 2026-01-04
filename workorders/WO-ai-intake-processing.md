# WO: AI-assisted Intake Processing (Placeholder)

Summary
---
Add a backend endpoint to perform AI-assisted analysis of intake submissions and a frontend case-detail modal to trigger analysis and admin actions. The implementation uses a local heuristic service (`src/services/ai_processor.py`) to avoid requiring secrets or external API calls. This is intentionally non-persistent (does not modify DB schema).

Files changed/added
---
- src/routes/case.py (modified): added POST `/cases/<case_number>/process` route
- src/services/ai_processor.py (added): placeholder heuristic analysis service
- frontend/src/components/CaseDetailModal.jsx (added): modal UI for admins
- frontend/src/components/IntakeReview.jsx (modified): opens modal and refreshes list after actions
- workorders/WO-ai-intake-processing.md (added): this work order

Notes & Rationale
---
- To avoid schema changes and secret leakage, analysis results are returned in the response and NOT stored. If you want persistence, create a migration to add an `analysis` JSON column or separate `case_analyses` table and update the route to save results.
- The `ai_processor` module is intentionally simple and deterministic. It can be replaced by a real LLM call — do not commit API keys; use environment variables in deployment (OPENAI_API_KEY, AI_PROVIDER, etc.).

Follow-up work (recommended)
---
1. Add persistence for analysis results (DB migration + model changes).
2. Implement an async background job queue (Redis + RQ/Celery) for long-running LLM calls.
3. Hook up a real LLM provider in `src/services/ai_processor.py` (use env vars and secure storage).
4. Add tests for the new route and frontend interactions.

Verification commands
---
- Backend quick-checks:
  - `python -m pip install -r requirements.txt -r requirements_auth.txt`
  - `python -m compileall src`
  - `python -c "import importlib; importlib.import_module('src.main')"`

- Frontend quick-checks (from repo root):
  - `cd frontend && pnpm install --frozen-lockfile`
  - `cd frontend && pnpm lint`
  - `cd frontend && pnpm build`

Security
---
- Do not add API keys to the repository. Configure LLM credentials via environment variables in your deployment platform (Vercel, Heroku, etc.).
