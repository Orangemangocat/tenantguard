WO: Add `start_role` to OAuthState and Alembic migration

Goal
- Add a nullable `start_role` column to the `oauth_states` table (stores intended onboarding role e.g. 'tenant' or 'attorney') and ship an Alembic migration to apply it.

Files to change/add
- alembic/versions/0002_add_oauth_start_role.py  (new)

Acceptance criteria
- Alembic migration file exists and can be used to upgrade the DB schema, adding `start_role` (VARCHAR(50), nullable) to `oauth_states`.
- Downgrade removes the column.

Notes
- Developer must run Alembic migration in their environment (or run a DB schema update) before OAuth flows will store/read `start_role`.
- This work order documents the change as required by AGENTS.md.
