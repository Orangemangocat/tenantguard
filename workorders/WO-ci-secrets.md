---
title: "Work Order — Add CI secret for DB migrations and CI preview"
id: WO-CI-SECRETS-001
status: proposed
created: 2026-01-04
owner: ops
---

Summary
-------

Add documentation and a coordinated work order for a dedicated CI secret to run database migrations and support CI preview deployments.

Background
----------

Current CI workflows conditionally run Alembic migrations when a database URL secret is present. To avoid re-using production secrets and to make the intention explicit, we introduce a dedicated secret name for CI use.

Acceptance Criteria
-------------------

- Add `CI_DB_URL` as the recommended secret name in the repository README (`README.md`).
- Add this work order file `workorders/WO-ci-secrets.md` describing how to add the secret and what workflows reference it.
- Provide verification steps to ensure workflows execute migrations when `CI_DB_URL` is present.

Implementation Steps
--------------------

1. Add GitHub Actions secret `CI_DB_URL` in the repository settings (Settings → Secrets & variables → Actions).
2. If your CI currently references a different secret name (for example `DB_URL`), update `.github/workflows/vercel-preview.yml` to reference `CI_DB_URL` where appropriate for migration steps.
3. Ensure the secret value is scoped to the appropriate environment (preview/staging/production) per deployment needs.
4. Optionally add `VERCEL_TOKEN`, `REDIS_URL`, and provider-specific LLM secret(s) for full CI/deploy functionality.

Verification
------------

Local quick checks (developer machine):

```bash
# show the new documentation
sed -n '1,240p' README.md
sed -n '1,240p' workorders/WO-ci-secrets.md

# Run the usual backend verification steps (see AGENTS.md defaults)
python -m pip install -r requirements.txt
python -m compileall src
python -c "import importlib; importlib.import_module('src.main')"

# To test migrations with a CI secret locally, set the env var and run alembic
export CI_DB_URL="postgresql://user:pass@localhost:5432/tenantguard_ci"
alembic upgrade head
```

Notes
-----

Do NOT store production secrets in repository files. Use GitHub Actions secrets or your cloud provider's secret manager. This work order intentionally documents a separate CI-only secret name to reduce the risk of accidental exposure.
