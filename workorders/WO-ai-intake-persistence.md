# WO: Persist AI Analysis for Intake Submissions

Summary
---
Persist AI analysis results for intake submissions by adding a `case_analyses` table and saving analysis output when `/cases/<case_number>/process` is called. This patch adds a SQLAlchemy model `CaseAnalysis` and updates the route to store analysis JSON, provider, and confidence.

Files changed/added
---
- src/models/case_analysis.py (new): SQLAlchemy model for analysis records
- src/routes/case.py (updated): now saves analysis result after processing
- frontend components unchanged from previous work — modal shows returned analysis and now results are persisted on backend

Migration note
---
This repo does not include an alembic migration in this change. To apply the new table to your database, run a migration tool or create the table manually. Example SQL (SQLite/Postgres-compatible):

```sql
CREATE TABLE case_analyses (
  id SERIAL PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES cases(id),
  analysis TEXT NOT NULL,
  provider VARCHAR(50),
  confidence VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Recommended follow-ups
---
1. Add Alembic migrations and run them in CI/deploy.
2. Add indexing on `case_id` for faster lookups.
3. Add access controls: ensure only authorized users can read/create analyses.
4. Add API to fetch analyses for a case (e.g., GET `/cases/<case_number>/analyses`).

Verification commands
---
- Create DB table (example using psql or sqlite3). Then run backend quick-checks:
  - `python -m pip install -r requirements.txt -r requirements_auth.txt`
  - `python -m compileall src`
  - `python -c "import importlib; importlib.import_module('src.main')"`

Security
---
- Do not store LLM keys in repo. Use environment variables in deployment.
