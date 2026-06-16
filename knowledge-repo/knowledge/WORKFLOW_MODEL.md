# Workflow Model

This document describes the development, deployment, and operational workflows for TenantGuard. Updated June 2026 to reflect the current Django/Next.js/Docker/GCP architecture.

> **Important:** This file supersedes all legacy references to Flask, SQLite, direct server deployment, `deploy_fixed.sh`, systemd services, or SSH to `35.237.102.136`. Those workflows are obsolete.

---

## Development Workflow

### Local Development Setup

The project uses a Makefile for convenience. First-time setup:

```bash
make setup    # Creates venv, installs deps, checks env files
make dev      # Starts both backend and frontend dev servers
```

Manual setup if needed:

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver    # http://localhost:8000

# Frontend
cd frontend
npm install
npm run dev                   # http://localhost:3000
```

### Development Cycle

The standard development cycle follows this sequence:

1. **Inspect** the relevant code before making changes. Read models, views, serializers, URLs, and any frontend consumers.
2. **Implement** the smallest correct change that fits the existing architecture.
3. **Verify** locally. Run `python manage.py check` for backend changes, `npm run lint && npm run build` for frontend changes.
4. **Commit** with a clear, descriptive message following conventional commit style (e.g., `feat:`, `fix:`, `docs:`).
5. **Push to main** which triggers automatic staging deployment.
6. **Verify on staging** at https://staging.tenantguard.net using the test accounts.
7. **Tag for production** only after staging verification: `git tag v1.x.x && git push origin v1.x.x`.

### Branching Strategy

The current model is trunk-based development on `main`. Feature branches may be used for large changes but are merged via pull request. The `legacy/flask-vite` branch preserves the old codebase for historical reference only.

---

## Deployment Workflow

### Staging Deployment (Automatic)

Every push to `main` triggers the staging deployment via GitHub Actions:

1. GitHub Actions builds backend and frontend Docker images
2. Images are pushed to Google Artifact Registry
3. Actions SSHes into the staging VM
4. Fetches environment files from GCS bucket
5. Runs `docker compose pull` to get new images
6. Runs Django migrations (`python manage.py migrate --noinput`)
7. Seeds test accounts (`python manage.py seed_test_users`)
8. Restarts services with `docker compose up -d`

Staging is available at https://staging.tenantguard.net immediately after a successful deploy.

### Production Deployment (Tag-Triggered)

Production deploys are triggered by pushing a git tag matching `v*`:

```bash
git tag v1.2.0
git push origin v1.2.0
```

The pipeline follows the same steps as staging but targets the production VM and does not seed test accounts.

**Production deployment rules:**
- Never deploy to production without testing on staging first
- Always ask for confirmation before tagging for production
- Monitor the GitHub Actions tab for deploy status
- Verify the live site after deployment

### Deployment Verification

After any deployment, verify:

1. Site loads correctly (check homepage, blog, intake pages)
2. Authentication works (sign in with test accounts on staging)
3. API endpoints respond (check `/api/blog/posts/`, admin panel)
4. No console errors in browser dev tools
5. Check GitHub Actions logs for any warnings

### Rollback Procedure

If a deployment causes issues:

1. Identify the last known-good image tag in Artifact Registry
2. SSH into the affected VM
3. Update `IMAGE_TAG` in the compose environment
4. Run `docker compose pull && docker compose up -d`
5. Verify the rollback resolved the issue

---

## Testing Workflow

### Current State

No automated test suites are configured. Verification relies on:

- `python manage.py check` (Django system checks)
- `npm run lint` (ESLint for frontend)
- `npm run build` (TypeScript compilation check)
- Manual testing on staging with test accounts

### Test Accounts (Staging Only)

| Role | Username | Password |
| :--- | :--- | :--- |
| Super Admin | `superadmin` | `SuperAdmin123!` |
| Attorney | `testattorney` | `TestAttorney123!` |
| Tenant | `testtenant` | `TestTenant123!` |

These are auto-seeded on every staging deploy and displayed on the sign-in page.

---

## Content Workflow (AI Blog Generation)

The AI blog generation pipeline is admin-triggered:

1. Admin navigates to `/admin/ai-generator/`
2. Pipeline runs three agents sequentially:
   - ContextualResearcherAgent reads `docs/` and `knowledge-repo/` for context
   - TopicsAgent suggests 5 topic ideas
   - BlogAuthorAgent writes the full article
3. Generated post is saved as a draft for editorial review
4. Admin reviews, edits if needed, and publishes

Content must remain legally accurate, professionally toned, and aligned with TenantGuard's brand voice.

---

## Debugging Workflow

### Phase 1: Identify the Problem
Observe symptoms, reproduce the issue, gather information from logs and error messages. Check `docker compose logs` on the relevant VM if it's a deployment issue.

### Phase 2: Hypothesize the Cause
Form hypotheses based on symptoms. Prioritize by likelihood. Consider recent commits and deploys.

### Phase 3: Test the Hypothesis
Design a test to confirm or refute. Check relevant code, run commands, review Docker logs.

### Phase 4: Implement the Fix
Make the smallest correct change. Test locally. Commit with a clear message explaining the fix.

### Phase 5: Deploy and Verify
Push to main (staging auto-deploys). Verify the fix on staging. Only tag for production after confirmation.

---

## Operational Workflows

### Adding a New Feature

1. Determine if it affects backend, frontend, or both
2. If backend: create models, migrations, serializers, views, URLs, admin config
3. If frontend: create pages/components, wire API calls, handle auth if needed
4. If cross-layer: ensure API contract is consistent between both sides
5. Update documentation if the change affects setup, env vars, or deployment
6. Commit, push, verify on staging

### Database Schema Changes

1. Modify the Django model
2. Run `python manage.py makemigrations`
3. Review the generated migration file
4. Run `python manage.py migrate` locally
5. Commit the migration file with the model change
6. Migration runs automatically on deploy

### Environment Variable Changes

1. Add the variable to the appropriate `.env` file template
2. Update `README.md` with the new variable
3. If needed for deployment, add to GitHub Actions secrets/variables
4. If needed on VMs, update the GCS bucket env files
5. Document the change in the commit message

---

## Recovery Procedures

### If staging is broken
- Check GitHub Actions logs for the failed deploy
- SSH into staging VM and check `docker compose logs`
- Fix the issue, push to main, let it redeploy

### If production is broken
- Immediately check if it's a Cloudflare issue (check status.cloudflare.com)
- Check GitHub Actions logs for the last production deploy
- If the deploy caused it, rollback to the previous image tag
- If it's a database issue, check Cloud SQL console

### If auth is broken
- Check both NextAuth config and Django JWT settings
- Verify environment variables (NEXTAUTH_SECRET, backend SECRET_KEY)
- Check token refresh logic in `frontend/lib/api.ts`
- Test with a fresh browser session (clear cookies)

---

## Documentation Maintenance

When completing significant work, update:

1. `AGENTS.md` — if the change affects how agents should work in the repo
2. `README.md` — if setup steps, env vars, or deployment process changed
3. `knowledge-repo/` — if project state, architecture, or decisions changed
4. `docs/` — if control-plane directives, schemas, or governance changed
5. Commit documentation updates alongside code changes

---

## Error Recovery Workflow

1. **Acknowledge** the error immediately; do not hide it
2. **Assess impact** — what is affected (site, data, functionality)?
3. **Quick fix** if possible (restart service, rollback image)
4. **Investigate root cause** — review logs, code, recent changes
5. **Implement permanent fix** — smallest correct change
6. **Document** what went wrong and how it was fixed
