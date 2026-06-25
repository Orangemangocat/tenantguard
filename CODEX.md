# CODEX.md

**CRITICAL UPDATE (June 25, 2026):**
The canonical knowledge base has been moved to a dedicated repository to prevent context fragmentation across different agents.

To understand what you are supposed to do, you MUST read the `START_HERE.md` file in the knowledge repository.

If you do not have the knowledge repository cloned locally, clone it now:
```bash
git clone https://github.com/Orangemangocat/tenantguard-manus-retained.git
```

Once cloned, read `tenantguard-manus-retained/START_HERE.md` to orient yourself. Do not rely on the rest of this file as it may contain outdated information from before the architecture migration.

---

## Quick Orientation

TenantGuard is a legal-tech platform for tenant protection and eviction defense (Tennessee/Davidson County focus). It uses a Django REST API backend + Next.js TypeScript frontend, deployed via Docker Compose on Google Cloud Platform.

**Read these files first (in order):**
1. `AGENTS.md` — Canonical agent instructions (prime directive, rules, workflow)
2. `README.md` — Developer setup, CI/CD, environment variables
3. `TEST_ACCOUNTS.md` — Staging test credentials

**For deeper context:**
- `knowledge-repo/knowledge/PROJECT_STATE_RECONSTRUCTED.md` — Full current project state
- `knowledge-repo/project/SYSTEM_ARCHITECTURE.md` — Architecture details
- `knowledge-repo/knowledge/WORKFLOW_MODEL.md` — Development and deployment workflows
- `docs/control-plane/` — Agent directives, governance, output schemas

---

## Critical Rules for Codex

1. **Inspect before editing.** Always read the relevant files before making changes.
2. **Smallest correct change.** Do not rewrite, modernize, or refactor beyond what the task requires.
3. **Respect the split stack.** Backend (Django) and frontend (Next.js) are separate. Keep them aligned.
4. **Auth is high-risk.** Any change touching login, tokens, sessions, or permissions requires extra care.
5. **Deploy is high-risk.** Do not alter Docker, nginx, CI/CD, or env var contracts without explicit need.
6. **Never commit secrets.** No API keys, passwords, tokens, or credentials in source files.
7. **Create migrations.** If you change a Django model, run `makemigrations` and commit the migration.
8. **Verify your work.** Run `python manage.py check` (backend) and `npm run lint && npm run build` (frontend).
9. **Report clearly.** Summarize what changed, files modified, risks, and next steps.

---

## Current Stack Summary

| Layer | Technology |
| :--- | :--- |
| Frontend | Next.js 16, React 18, TypeScript, Tailwind CSS 4, Chakra UI, next-auth 4 |
| Backend | Django 5.0.3, DRF 3.15, SimpleJWT, django-allauth, OpenAI SDK |
| Database | PostgreSQL (Cloud SQL via cloud-sql-proxy) |
| Deployment | Docker Compose, GitHub Actions, Google Artifact Registry |
| CDN/DNS | Cloudflare |

---

## Deployment Flow

- Push to `main` → automatic staging deploy (staging.tenantguard.net)
- Git tag `v*` → automatic production deploy (tenantguard.net)
- **Never deploy to production without testing on staging first.**

---

## Backend Apps

| App | Purpose |
| :--- | :--- |
| `authentication` | Registration, login, OAuth, JWT tokens |
| `blog` | Blog posts, categories, AI generation pipeline |
| `chat` | Legal assistant chat messages |
| `intake` | Intake submissions, documents, case notebooks, SMS, payments |
| `seo` | SEO dashboard (Google Search Console) |
| `stafftodo` | Internal staff task management |

---

## Frontend Pages

Key pages: `/` (landing), `/auth/signin`, `/dashboard`, `/intake`, `/tenant-intake`, `/attorney-intake`, `/case/[id]` (with sub-pages for documents, motions, actions, alerts), `/blog`, `/blog/[slug]`, `/profile`, `/privacy`, `/terms`.

---

## Environment Variables

**Backend** (`backend/.env`): `SECRET_KEY`, `OPENAI_API_KEY`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `GCS_BUCKET_NAME`, `STRIPE_SECRET_KEY`, `INTAKE_ANALYSIS_PRICE_CENTS`

**Frontend** (`frontend/.env.local`): `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXTAUTH_BACKEND_URL`, `NEXT_PUBLIC_API_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_ID`, `GITHUB_SECRET`

---

## Legacy Warning

The `knowledge-repo/` directory previously contained references to an older Flask/SQLite/Vite architecture. Those files have been updated to reflect the current stack. The old codebase is preserved on the `legacy/flask-vite` branch for historical reference only. **Do not follow any instructions referencing Flask, SQLite, systemd, `deploy_fixed.sh`, or SSH to `35.237.102.136`.**

---

## Known Improvement Areas

1. Move any hardcoded SECRET_KEY/JWT signing material to environment variables
2. Fix production deploy workflow referencing `STAGING_SSH_PASSWORD`
3. Replace snakeoil SSL paths in nginx config with real certificate paths
4. Add automated test suites
5. Complete: attorney matching, email notifications, payment system, analytics

---

## Where to Leave Notes for Future Sessions

If you learn something important about the project during your session, update:
- `AGENTS.md` — for rules/directives that affect how agents work
- `knowledge-repo/knowledge/PROJECT_STATE_RECONSTRUCTED.md` — for project state changes
- `knowledge-repo/project/ROADMAP.md` — for progress on features
- `docs/control-plane/99_CHANGELOG/CHANGELOG.md` — for directive/schema changes

Always commit documentation updates alongside code changes so the next session has full context.
