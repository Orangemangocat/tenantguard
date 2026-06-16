# Project State — Current

This document provides the authoritative reconstruction of the current state of the TenantGuard project as of June 2026.

> **Important:** This file supersedes any legacy references to Flask, SQLite, Vite, or direct-server deployment. The project was fully migrated to Django + Next.js + PostgreSQL + GCP in early 2026. The legacy Flask/Vite codebase is preserved on the `legacy/flask-vite` branch for historical reference only.

---

## Current Status

**Project Phase:** Active Development (post-migration, feature expansion)

**Live Production Site:** https://tenantguard.net and https://www.tenantguard.net

**Staging Site:** https://staging.tenantguard.net

**Primary Repository:** https://github.com/Orangemangocat/tenantguard

**Secondary Repository (empty, reserved):** https://github.com/Orangemangocat/tennantdefend

**Also referenced:** https://github.com/KarlHaines82/tenantguard2 (same codebase, alternate account)

**Last Major Commits (as of March 2026):**
- `bc7c6f2` — Fix NextAuth secret env fallback
- `ceda98d` — Add robots.txt pointing crawlers to sitemap
- `f78b127` — Add dynamic sitemap for public pages and blog posts
- `83eaf5f` — Fixed env script to copy env files to docker containers
- `54cb164` — Fixed blog URLs, added Django image URL repair command, intake work, SMS functionality

---

## Technical Infrastructure

### Server Environment

| Component | Details |
| :--- | :--- |
| **Production Domain** | tenantguard.net (Cloudflare-fronted) |
| **Staging Domain** | staging.tenantguard.net |
| **DNS/Proxy** | Cloudflare (nameservers: meilani.ns.cloudflare.com, garret.ns.cloudflare.com) |
| **Cloudflare A Records** | 172.67.157.108, 104.21.82.117 |
| **Hosting Provider** | Google Cloud Platform |
| **Compute** | GCE-style VMs (staging + production) |
| **Database** | Cloud SQL (PostgreSQL) via cloud-sql-proxy |
| **Container Registry** | Google Artifact Registry |
| **Media/Secrets Storage** | Google Cloud Storage buckets |
| **Containerization** | Docker Compose |
| **CI/CD** | GitHub Actions |

### Runtime Services (per VM)

| Service | Port | Purpose |
| :--- | :--- | :--- |
| nginx | 80/443 | Reverse proxy, SSL termination |
| Django backend | 8000 | REST API, admin, AI pipelines |
| Next.js frontend | 3000 | User-facing UI, NextAuth |
| cloud-sql-proxy | 5432 | Secure PostgreSQL tunnel |

### Public Host Routing (nginx)

| Path Pattern | Routes To |
| :--- | :--- |
| `/api/auth/` | Frontend (NextAuth) |
| `/api/*`, `/admin/*`, `/staff/*`, `/summernote/*`, `/static/*` | Django backend |
| `/*` (everything else) | Next.js frontend |

---

## Technology Stack

### Frontend
- Next.js 16
- React 18
- TypeScript
- Tailwind CSS 4
- Chakra UI 2
- Framer Motion
- Axios
- next-auth 4

### Backend
- Django 5.0.3
- Django REST Framework 3.15
- djangorestframework-simplejwt (JWT auth)
- django-allauth (OAuth: Google, GitHub)
- CKEditor / django-summernote (rich text)
- django-taggit (blog tags)
- django-jazzmin (admin UI)
- OpenAI SDK (AI blog generation, case analysis)

### Database
- PostgreSQL (Cloud SQL)
- Default DB name: `tenantguard_db`
- Access via Cloud SQL proxy on localhost:5432

### Infrastructure
- Docker + Docker Compose
- GitHub Actions CI/CD
- Google Artifact Registry (container images)
- Google Cloud Storage (media, env files, secrets)
- Cloudflare (DNS, CDN, DDoS protection)
- Let's Encrypt SSL certificates

---

## Repository Structure

```
tenantguard/
├── AGENTS.md                  # Canonical agent instructions
├── CLAUDE.md                  # Pointer to AGENTS.md
├── README.md                  # Developer setup and CI/CD docs
├── TEST_ACCOUNTS.md           # Staging test credentials
├── Makefile                   # Developer convenience targets
├── docker-compose.yml         # Local/production orchestration
├── docker-compose.staging.yml # Staging-specific overrides
├── backend/
│   ├── Dockerfile
│   ├── manage.py
│   ├── requirements.txt
│   ├── core/                  # Django project settings
│   ├── authentication/        # Registration, login, OAuth, JWT
│   ├── blog/                  # Blog posts, AI generation pipeline
│   ├── chat/                  # Legal assistant chat messages
│   ├── intake/                # Intake submissions, documents, case notebooks, SMS
│   ├── seo/                   # SEO dashboard (Google Search Console)
│   ├── stafftodo/             # Internal staff task management
│   ├── staticfiles/           # Collected static files
│   └── templates/             # Admin templates
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── pages/                 # Next.js pages (file-based routing)
│   ├── components/            # Shared React components
│   ├── lib/                   # API client, utilities
│   ├── styles/                # Global styles
│   ├── public/                # Static assets
│   └── types/                 # TypeScript type definitions
├── nginx/                     # Reverse proxy configuration
├── docs/
│   ├── control-plane/         # Agent directives, governance, schemas
│   └── deployment/            # Deploy workflow reference
├── knowledge-repo/            # Knowledge base for AI/content workflows
└── scripts/                   # Utility scripts
```

---

## Database Models (Django)

### Core Auth
- Django's built-in `User` model (extended with roles)

### Intake App
- **IntakeSubmission** — Full tenant/attorney intake: role, status, contact info, demographics, rental/property info, landlord info, issue/dispute details, timeline/urgency, desired outcome, representation preferences, consent fields, attorney-specific fields, timestamps, payment_status, stripe_session_id
- **IntakeDocument** — Document uploads: type, file, original filename, extracted text, timestamp, linked to IntakeSubmission
- **CaseNotebook** — AI-generated case analysis: summary, facts, timeline, key terms, disputed points, open questions, urgent deadlines, recommended next steps, raw output
- **IntakeChatLog** — Permanent web/SMS intake conversation records
- **SMSSession** — Maps inbound phone numbers to active intake submissions

### Blog App
- **Category** — Blog categories
- **Post** — Blog posts with SEO fields, images, tags, status, rich text
- **Comment** — User comments on posts

### Chat App
- **Message** — User-linked legal assistant chat messages

### Staff Todo App
- **Todo** — Internal staff tasks
- **TodoComment** — Comments on todos
- **TodoActivity** — Activity log for todos

---

## Authentication Architecture

Three-layer auth system:

1. **NextAuth** (`frontend/pages/api/auth/[...nextauth].js`) — Session management, token storage, OAuth provider callbacks (Google, GitHub)
2. **Axios client** (`frontend/lib/api.ts`) — Attaches `Authorization: Bearer <token>` headers; handles token refresh before expiry
3. **Django backend** (`backend/authentication/`) — Issues and validates JWT tokens (45-min access, 7-day refresh) via `djangorestframework-simplejwt`; OAuth social login via `django-allauth`

---

## AI Blog Generation Pipeline

Located in `backend/blog/ai_agents.py`. Admin triggers via `/admin/ai-generator/`.

Multi-agent pipeline:
1. **ContextualResearcherAgent** — Reads `docs/` and `knowledge-repo/` for brand/legal alignment context
2. **TopicsAgent** — Suggests 5 blog topic ideas
3. **BlogAuthorAgent** — Writes full article from research brief
4. Agents extend a `BaseAgent` class, use OpenAI (`gpt-4o-mini`), fall back to simulated responses if no API key

---

## Deployment Architecture

### CI/CD Flow

| Trigger | Target |
| :--- | :--- |
| Push to `main` | Staging VM (automatic) |
| Git tag `v*` | Production VM (automatic) |

Pipeline steps:
1. GitHub Actions builds backend + frontend Docker images
2. Pushes images to Google Artifact Registry
3. SSHes into target VM
4. Fetches env files from GCS bucket
5. Runs `docker compose pull`
6. Runs Django migrations
7. Restarts Docker Compose services
8. Seeds test accounts (staging only)

### GitHub Actions Secrets Required

| Secret | Purpose |
| :--- | :--- |
| `GCP_SA_KEY` | Service account JSON (Artifact Registry + Cloud SQL) |
| `STAGING_HOST` | Staging VM IP |
| `STAGING_SSH_USER` | SSH user for staging |
| `STAGING_SSH_KEY` | Private SSH key for staging |
| `PROD_HOST` | Production VM IP |
| `PROD_SSH_USER` | SSH user for production |
| `PROD_SSH_KEY` | Private SSH key for production |
| `CLOUD_SQL_INSTANCE_CONNECTION_NAME` | Cloud SQL connection string |

### GitHub Actions Variables

| Variable | Purpose |
| :--- | :--- |
| `ARTIFACT_REGISTRY_URL` | Container registry URL |
| `ARTIFACT_REGISTRY_REGION` | GCP region |
| `NEXT_PUBLIC_API_URL` | Public API base URL (baked into frontend) |

---

## Environment Variables

### Backend (`backend/.env`)
```
SECRET_KEY=
OPENAI_API_KEY=
DB_NAME=tenantguard_db
DB_USER=
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=5432
GCS_BUCKET_NAME=
STRIPE_SECRET_KEY=
INTAKE_ANALYSIS_PRICE_CENTS=4900
```

### Frontend (`frontend/.env.local`)
```
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_BACKEND_URL=http://127.0.0.1:8000/api/
NEXT_PUBLIC_API_URL=http://localhost:8000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_ID=
GITHUB_SECRET=
```

---

## Key API Routes

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

## Frontend Pages

| Path | Purpose |
| :--- | :--- |
| `/` | Landing page (hero, features, tenant challenges) |
| `/blog`, `/blog/[slug]` | Blog index + post detail |
| `/intake` | Guided intake form |
| `/tenant-intake` | Tenant-specific intake |
| `/attorney-intake` | Attorney-specific intake |
| `/dashboard` | User dashboard |
| `/case/[id]` | Case detail view |
| `/case/[id]/documents` | Case documents |
| `/case/[id]/motions` | Case motions |
| `/case/[id]/actions` | Case actions |
| `/case/[id]/alerts` | Case alerts |
| `/profile` | User profile |
| `/auth/signin` | Sign-in page |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |

---

## Known Improvement Areas

1. **Security:** Move any hardcoded Django SECRET_KEY/JWT signing material to environment variables; rotate any exposed values
2. **Deployment:** Production deploy workflow references `STAGING_SSH_PASSWORD` in the production SSH step — verify and fix
3. **SSL:** Replace snakeoil SSL certificate paths in nginx config with real mounted certificate paths
4. **Testing:** No automated test suites configured — add unit/integration tests
5. **Features in progress:** Complete authentication flows, tenant/attorney dashboards, attorney matching, email notifications, payment system, analytics, monitoring, backups, rate limiting, CSRF/security hardening, accessibility checks, legal compliance review

---

## Legacy Architecture (Archived)

The prior implementation used:
- Flask + SQLAlchemy + SQLite
- React + Vite + Tailwind + Shadcn/UI
- Direct deployment to a single GCE VM (35.237.102.136)
- Custom bash deployment script (`deploy_fixed.sh`)
- Systemd service management
- Nginx proxying to Flask on port 5000

This architecture is preserved on the `legacy/flask-vite` branch. **Do not follow legacy deployment instructions.** The current architecture is Django + Next.js + PostgreSQL + Docker + GCP as described above.
