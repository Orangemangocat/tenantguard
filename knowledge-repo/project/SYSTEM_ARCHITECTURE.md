# TenantGuard System Architecture

## Overview

TenantGuard is a split-stack web application with a Django REST API backend and a Next.js TypeScript frontend, deployed via Docker Compose on Google Cloud Platform VMs with PostgreSQL (Cloud SQL) as the database.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Users                                │
│              (Tenants, Attorneys, Staff, Admin)              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTPS (Cloudflare CDN/WAF)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge                           │
│            (DNS, CDN, DDoS protection, SSL)                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Nginx (ports 80/443)                       │
│                                                              │
│  Routing:                                                    │
│  /api/auth/*           → Next.js (port 3000)                │
│  /api/*, /admin/*,     → Django  (port 8000)                │
│  /staff/*, /static/*                                        │
│  /*                    → Next.js (port 3000)                │
└───────┬───────────────────────────────┬─────────────────────┘
        │                               │
        ▼                               ▼
┌───────────────────┐     ┌───────────────────────────────────┐
│   Next.js App     │     │         Django REST API            │
│   (port 3000)     │     │         (port 8000)               │
│                   │     │                                    │
│  - Pages/routing  │     │  Apps:                             │
│  - NextAuth       │     │  - authentication (JWT, OAuth)    │
│  - React UI       │     │  - blog (posts, AI generation)    │
│  - TypeScript     │     │  - chat (legal assistant)         │
│  - Tailwind CSS   │     │  - intake (submissions, docs,     │
│  - Chakra UI      │     │           notebooks, SMS)         │
│                   │     │  - seo (Search Console dashboard) │
│                   │     │  - stafftodo (internal tasks)     │
└───────────────────┘     └───────────────┬───────────────────┘
                                          │
                                          │ localhost:5432
                                          ▼
                          ┌───────────────────────────────────┐
                          │       cloud-sql-proxy             │
                          │     (secure tunnel to Cloud SQL)  │
                          └───────────────┬───────────────────┘
                                          │
                                          ▼
                          ┌───────────────────────────────────┐
                          │     Google Cloud SQL               │
                          │     (PostgreSQL)                   │
                          │     DB: tenantguard_db             │
                          └───────────────────────────────────┘
```

---

## Frontend Architecture

### Technology Stack

| Technology | Purpose |
| :--- | :--- |
| Next.js 16 | Framework (pages router, SSR/SSG) |
| React 18 | UI library |
| TypeScript | Type safety |
| Tailwind CSS 4 | Utility-first styling |
| Chakra UI 2 | Component library |
| Framer Motion | Animations |
| Axios | HTTP client with interceptors |
| next-auth 4 | Authentication (session, OAuth) |

### Page Structure

```
frontend/
├── pages/
│   ├── index.tsx              # Landing page
│   ├── auth/signin.tsx        # Sign-in (with test account banner)
│   ├── dashboard.tsx          # User dashboard
│   ├── intake.tsx             # Guided intake form
│   ├── tenant-intake.tsx      # Tenant-specific intake
│   ├── attorney-intake.tsx    # Attorney-specific intake
│   ├── case/[id].tsx          # Case detail
│   ├── case/[id]/documents.tsx
│   ├── case/[id]/motions.tsx
│   ├── case/[id]/actions.tsx
│   ├── case/[id]/alerts.tsx
│   ├── blog/index.tsx         # Blog listing
│   ├── blog/[slug].tsx        # Blog post detail
│   ├── profile.tsx            # User profile
│   ├── privacy.tsx            # Privacy policy
│   ├── terms.tsx              # Terms of service
│   └── api/auth/[...nextauth].js  # NextAuth API route
├── components/
│   ├── Navbar.tsx
│   ├── Chat.tsx
│   ├── RecentPostsSidebar.tsx
│   └── StaffTodoWidget.tsx
├── lib/                       # API client, auth utilities
├── styles/                    # Global CSS
├── public/                    # Static assets
└── types/                     # TypeScript definitions
```

### Auth Flow (Frontend Side)

1. User signs in via `/auth/signin` (credentials or OAuth)
2. NextAuth handles session creation and token storage
3. Axios interceptor attaches `Authorization: Bearer <access_token>` to API calls
4. Token refresh happens automatically before expiry
5. Protected pages check session before rendering

---

## Backend Architecture

### Technology Stack

| Technology | Purpose |
| :--- | :--- |
| Django 5.0.3 | Web framework |
| Django REST Framework 3.15 | API layer |
| djangorestframework-simplejwt | JWT token auth (45-min access, 7-day refresh) |
| django-allauth | OAuth social login (Google, GitHub) |
| django-jazzmin | Admin UI theme |
| django-taggit | Blog tagging |
| CKEditor / Summernote | Rich text editing |
| OpenAI SDK | AI blog generation, case analysis |
| Stripe SDK | Payment processing |

### Django Apps

| App | Purpose |
| :--- | :--- |
| `core` | Project settings, base configuration |
| `authentication` | Registration, login, OAuth callbacks, JWT endpoints, user management |
| `blog` | Blog posts, categories, comments, AI generation pipeline |
| `chat` | Legal assistant chat message storage |
| `intake` | Intake submissions, documents, case notebooks, SMS sessions, payments |
| `seo` | SEO dashboard (Google Search Console integration) |
| `stafftodo` | Internal staff task management with comments and activity log |

### Key Backend Patterns

- ViewSets and ModelSerializers for CRUD
- Permission classes for access control
- Custom management commands (e.g., `seed_test_users`, image URL repair)
- Admin customization with Jazzmin theme
- AI agents as class hierarchy extending `BaseAgent`

---

## Database Architecture

### Engine

PostgreSQL (Google Cloud SQL), accessed via cloud-sql-proxy on localhost:5432.

### Core Models

See `PROJECT_STATE_RECONSTRUCTED.md` for full model field details.

**Key entities:**
- `User` (Django auth)
- `IntakeSubmission` (full case intake data)
- `IntakeDocument` (uploaded documents with OCR text)
- `CaseNotebook` (AI-generated case analysis)
- `IntakeChatLog` (conversation records)
- `SMSSession` (phone-to-intake mapping)
- `Post`, `Category`, `Comment` (blog)
- `Message` (chat)
- `Todo`, `TodoComment`, `TodoActivity` (staff tasks)

### Migration Management

Django's built-in migration system. Migrations run automatically during deployment via GitHub Actions.

---

## Deployment Architecture

### Environments

| Environment | Domain | Trigger |
| :--- | :--- | :--- |
| Staging | staging.tenantguard.net | Push to `main` |
| Production | tenantguard.net | Git tag `v*` |

### Deployment Pipeline

```
Push/Tag → GitHub Actions
  ├── Build backend Docker image
  ├── Build frontend Docker image
  ├── Push to Google Artifact Registry
  └── SSH into target VM
       ├── Fetch env files from GCS bucket
       ├── docker compose pull
       ├── Run Django migrations
       ├── Seed test accounts (staging only)
       └── docker compose up -d
```

### VM Stack (each environment)

```
Docker Compose orchestrates:
  ├── nginx          (ports 80/443, reverse proxy)
  ├── backend        (Django on port 8000)
  ├── frontend       (Next.js on port 3000)
  └── cloud-sql-proxy (PostgreSQL tunnel on port 5432)
```

---

## Security Architecture

### Current Measures

1. **HTTPS everywhere** — Cloudflare SSL + Let's Encrypt on VMs
2. **JWT authentication** — Short-lived access tokens (45 min), long-lived refresh (7 days)
3. **OAuth integration** — Google and GitHub social login via django-allauth
4. **Backend-enforced permissions** — DRF permission classes on all protected endpoints
5. **Secrets management** — Environment variables, GCS bucket for deployment secrets
6. **Cloudflare WAF** — DDoS protection and edge security
7. **Docker isolation** — Services run in containers with limited exposure

### Known Security Gaps (to address)

1. Hardcoded SECRET_KEY in some config paths — move to env-only
2. Production deploy may reference staging SSH password — verify
3. Snakeoil SSL paths in nginx config — replace with real certs
4. No automated security testing
5. Rate limiting not yet implemented
6. CSRF hardening incomplete

---

## Integration Points

### Active Integrations

| Service | Purpose |
| :--- | :--- |
| Google Cloud Platform | Hosting, database, storage, registry |
| Cloudflare | DNS, CDN, WAF |
| OpenAI API | AI blog generation, case analysis |
| Google OAuth | Social login |
| GitHub OAuth | Social login |
| Stripe | Payment processing (test mode) |
| Google Search Console | SEO dashboard |

### Planned Integrations

| Service | Purpose |
| :--- | :--- |
| Twilio/SMS | Intake via text message (partially implemented) |
| Email service | Transactional notifications |
| Document OCR | Enhanced document processing |

---

## Development Workflow

1. **Local development:** `make dev` starts both backend and frontend
2. **Backend checks:** `python manage.py check`, `makemigrations`, `migrate`
3. **Frontend checks:** `npm run lint`, `npm run build`
4. **Commit to main:** Triggers automatic staging deployment
5. **Verify on staging:** Test at staging.tenantguard.net
6. **Tag for production:** `git tag v1.x.x && git push origin v1.x.x`
7. **Monitor:** Check GitHub Actions tab for deploy status

---

## Legacy Architecture (Archived — Do Not Use)

The prior implementation (preserved on `legacy/flask-vite` branch) used Flask, SQLite, Vite, React (JSX), direct server deployment via bash script, and systemd. **All legacy deployment instructions are obsolete.** The current architecture is as described in this document.
