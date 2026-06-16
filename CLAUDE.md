# CLAUDE.md

See `AGENTS.md` for the canonical repository instructions.

This file provides guidance to Claude Code (claude.ai/code), Claude in Cursor, and any Claude-based agent when working with code in this repository.

---

## Quick Orientation

TenantGuard is a legal-tech platform for tenant protection and eviction defense (Tennessee/Davidson County focus). It uses a Django REST API backend + Next.js TypeScript frontend, deployed via Docker Compose on Google Cloud Platform.

**Read these files first (in order):**
1. `AGENTS.md` — Canonical agent instructions (prime directive, rules, workflow)
2. This file (`CLAUDE.md`) — Claude-specific commands and architecture reference
3. `README.md` — Developer setup, CI/CD, environment variables
4. `TEST_ACCOUNTS.md` — Staging test credentials

**For deeper context:**
- `knowledge-repo/knowledge/PROJECT_STATE_RECONSTRUCTED.md` — Full current project state
- `knowledge-repo/project/SYSTEM_ARCHITECTURE.md` — Architecture details
- `knowledge-repo/knowledge/WORKFLOW_MODEL.md` — Development and deployment workflows
- `knowledge-repo/knowledge/CONTEXT.md` — User preferences and standing instructions
- `docs/control-plane/` — Agent directives, governance, output schemas

---

## Critical Rules

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

## Commands

### Frontend

```bash
cd frontend
npm install
npm run dev       # Dev server at http://localhost:3000
npm run build     # Production build (also validates TypeScript)
npm run lint      # ESLint check
```

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver   # API at http://localhost:8000
python manage.py check       # Django system checks
python manage.py makemigrations  # After model changes
python manage.py seed_test_users # Seed staging test accounts
```

### Both (via Makefile)

```bash
make setup    # Creates venv, installs deps, checks env files
make dev      # Starts both backend and frontend dev servers
```

No automated test suites are currently configured.

---

## Repository Structure

```
tenantguard/
├── AGENTS.md                  # Canonical agent instructions
├── CLAUDE.md                  # This file (Claude-specific guidance)
├── CODEX.md                   # Codex-specific guidance
├── README.md                  # Developer setup and CI/CD docs
├── TEST_ACCOUNTS.md           # Staging test credentials
├── Makefile                   # Developer convenience targets
├── docker-compose.yml         # Local/production orchestration
├── docker-compose.staging.yml # Staging-specific overrides
├── backend/
│   ├── core/                  # Django project settings
│   ├── authentication/        # Registration, login, OAuth, JWT
│   ├── blog/                  # Blog posts, AI generation pipeline
│   ├── chat/                  # Legal assistant chat messages
│   ├── intake/                # Intake submissions, documents, case notebooks, SMS
│   ├── seo/                   # SEO dashboard (Google Search Console)
│   └── stafftodo/             # Internal staff task management
├── frontend/
│   ├── pages/                 # Next.js pages (file-based routing)
│   ├── components/            # Shared React components
│   ├── lib/                   # API client, utilities
│   └── types/                 # TypeScript type definitions
├── nginx/                     # Reverse proxy configuration
├── docs/control-plane/        # Agent directives, governance, schemas
└── knowledge-repo/            # Knowledge base for AI/content workflows
```

---

## Architecture

### Auth Flow

Authentication is split across three layers:
1. **NextAuth** (`frontend/pages/api/auth/[...nextauth].js`) — handles session, token storage, and OAuth provider callbacks (Google, GitHub)
2. **Axios client** (`frontend/lib/api.ts`) — attaches `Authorization: Bearer <token>` headers; handles token refresh before expiry
3. **Django backend** (`backend/authentication/`) — issues and validates JWT tokens (45-min access, 7-day refresh) via `djangorestframework-simplejwt`; OAuth social login via `django-allauth`

### Backend Apps

| App | Purpose |
| :--- | :--- |
| `authentication` | Registration, login, OAuth callbacks, JWT token endpoints, user management |
| `blog` | Blog posts (CKEditor/Summernote rich text), categories, tags, comments, AI generation pipeline |
| `chat` | Legal assistant chat message storage/retrieval |
| `intake` | Intake submissions, document uploads, AI case notebooks, SMS sessions, Stripe payments |
| `seo` | SEO dashboard (Google Search Console integration) |
| `stafftodo` | Internal staff task management with comments and activity log |

### AI Blog Generation Pipeline

Located in `backend/blog/ai_agents.py`. Admin triggers it via `/admin/ai-generator/` (custom admin view). The multi-agent pipeline:

1. **ContextualResearcherAgent** — reads `docs/` and `knowledge-repo/` for brand/legal alignment context
2. **TopicsAgent** — suggests 5 blog topic ideas
3. **BlogAuthorAgent** — writes the full article from a research brief
4. Agents extend a `BaseAgent` class, use OpenAI (`gpt-4o-mini`), and fall back to simulated responses if no API key is set.

### Frontend Pages & Routing

| Path | Purpose |
| :--- | :--- |
| `/` | Landing page (hero, features, tenant challenges) |
| `/blog`, `/blog/[slug]` | Blog index + post detail |
| `/intake` | Guided intake form |
| `/tenant-intake` | Tenant-specific intake |
| `/attorney-intake` | Attorney-specific intake |
| `/dashboard` | User dashboard |
| `/case/[id]` | Case detail (with sub-pages: documents, motions, actions, alerts) |
| `/profile` | User profile |
| `/auth/signin` | Sign-in page |
| `/privacy`, `/terms` | Legal pages |

### Key API Routes (Backend)

```
POST  /api/auth/register/
POST  /api/auth/login/
POST  /api/auth/google/
POST  /api/auth/github/
POST  /api/auth/token/refresh/

GET   /api/blog/posts/           (supports ?search=)
GET   /api/blog/posts/<slug>/
GET   /api/blog/categories/
POST  /api/blog/posts/<slug>/comments/

GET   /api/chat/messages/        (requires auth)

GET   /api/intake/submissions/   (requires auth)
POST  /api/intake/submissions/
GET   /api/intake/case-notebook/<id>/

GET   /api/seed-test-users/      (staging only)

GET   /admin/ai-generator/       (AI blog generation UI)
POST  /admin/blog/ai-generate-api/
GET   /admin/seo-dashboard/      (Google Search Console)
```

---

## Deployment

| Trigger | Target | Domain |
| :--- | :--- | :--- |
| Push to `main` | Staging VM (automatic) | staging.tenantguard.net |
| Git tag `v*` | Production VM (automatic) | tenantguard.net |

Pipeline: GitHub Actions builds Docker images → pushes to Artifact Registry → SSHes into VM → pulls images → runs migrations → restarts Docker Compose.

**Never deploy to production without testing on staging first.**

---

## Environment Variables

**Backend** (`backend/.env`): `SECRET_KEY`, `OPENAI_API_KEY`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `GCS_BUCKET_NAME`, `STRIPE_SECRET_KEY`, `INTAKE_ANALYSIS_PRICE_CENTS`

**Frontend** (`frontend/.env.local`): `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXTAUTH_BACKEND_URL`, `NEXT_PUBLIC_API_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_ID`, `GITHUB_SECRET`

---

## Key Tech

- **Frontend**: Next.js 16, React 18, TypeScript, Tailwind CSS 4, Chakra UI 2, Framer Motion, Axios, next-auth 4
- **Backend**: Django 5.0.3, DRF 3.15, simplejwt, django-allauth, CKEditor/Summernote, django-taggit, django-jazzmin, OpenAI SDK
- **Database**: PostgreSQL (Cloud SQL via cloud-sql-proxy); DB name `tenantguard_db`
- **Infrastructure**: Docker Compose, GitHub Actions, Google Artifact Registry, GCS, Cloudflare

---

## Legacy Warning

The `knowledge-repo/` directory previously contained references to an older Flask/SQLite/Vite architecture. Those files have been updated (June 2026) to reflect the current stack. The old codebase is preserved on the `legacy/flask-vite` branch for historical reference only. **Do not follow any instructions referencing Flask, SQLite, systemd, `deploy_fixed.sh`, or SSH to `35.237.102.136`.**

---

## Where to Leave Notes for Future Sessions

If you learn something important about the project during your session, update:
- `AGENTS.md` — for rules/directives that affect how agents work
- `knowledge-repo/knowledge/PROJECT_STATE_RECONSTRUCTED.md` — for project state changes
- `knowledge-repo/project/ROADMAP.md` — for progress on features
- `docs/control-plane/99_CHANGELOG/CHANGELOG.md` — for directive/schema changes

Always commit documentation updates alongside code changes so the next session has full context.
