# Hidden Dependencies

This document captures the non-obvious dependencies, assumptions, and coupling in the TenantGuard project that are not immediately visible from reading the code alone. Updated June 2026 for the current Django/Next.js/Docker/GCP architecture.

> **Important:** All references to Flask, SQLite, systemd, `deploy_fixed.sh`, or SSH to `35.237.102.136` are obsolete. This document reflects the current production architecture.

---

## Infrastructure Dependencies

### Google Cloud Platform

The project depends on multiple GCP services that must be configured and available:

| Service | Purpose | Failure Impact |
| :--- | :--- | :--- |
| Cloud SQL (PostgreSQL) | Primary database | Complete data loss / site down |
| Google Artifact Registry | Docker image storage | Cannot deploy new versions |
| Google Cloud Storage | Env files, media, secrets | Cannot deploy; media broken |
| GCE VMs | Staging and production hosting | Site down |
| cloud-sql-proxy | Secure DB connection from VMs | Database unreachable |

The cloud-sql-proxy runs as a Docker container alongside the app and must be healthy for the backend to connect to PostgreSQL. If it crashes, the backend will return 500 errors on any database operation.

### Cloudflare

DNS and CDN are managed by Cloudflare. Dependencies:

- A records point to Cloudflare IPs (172.67.157.108, 104.21.82.117), not directly to origin VMs
- SSL is terminated at Cloudflare edge; origin uses Let's Encrypt certificates
- If Cloudflare is misconfigured, the site appears down even if the origin is healthy
- Cloudflare caching may serve stale content after deployments (purge cache if needed)

### GitHub Actions

CI/CD depends on GitHub Actions being available and having valid secrets:

- `GCP_SA_KEY` — service account JSON for Artifact Registry and GCS access
- `STAGING_HOST`, `STAGING_SSH_USER`, `STAGING_SSH_KEY` — staging VM access
- `PROD_HOST`, `PROD_SSH_USER`, `PROD_SSH_KEY` — production VM access
- `CLOUD_SQL_INSTANCE_CONNECTION_NAME` — database connection string

If any secret expires or is rotated without updating GitHub, deployments will fail silently or with SSH errors.

---

## Authentication Dependencies

### Three-Layer Auth Chain

Authentication depends on three systems being correctly synchronized:

1. **NextAuth** (frontend) — requires `NEXTAUTH_SECRET` and OAuth client credentials
2. **Axios interceptor** (frontend) — requires correct `NEXT_PUBLIC_API_URL` pointing to backend
3. **Django SimpleJWT** (backend) — requires `SECRET_KEY` for token signing

If any of these are misconfigured or out of sync:
- `NEXTAUTH_SECRET` mismatch → sessions invalid after restart
- `NEXT_PUBLIC_API_URL` wrong → API calls fail silently
- `SECRET_KEY` changed → all existing JWT tokens become invalid

### OAuth Provider Dependencies

Google and GitHub OAuth require:
- Valid OAuth app credentials (client ID + secret) in both frontend and backend env
- Correct redirect URIs configured in Google Cloud Console and GitHub OAuth app settings
- If redirect URIs don't match the current domain, OAuth login will fail with a redirect error

---

## Data Dependencies

### Database Schema and Migrations

Django migrations must run in order. Dependencies:

- Migrations are applied automatically during deployment
- If a migration fails, the deploy may leave the database in an inconsistent state
- The `seed_test_users` management command depends on the User model schema being current
- CaseNotebook depends on IntakeSubmission existing (foreign key)
- IntakeDocument depends on IntakeSubmission existing (foreign key)
- IntakeChatLog and SMSSession depend on IntakeSubmission

### AI Blog Pipeline Dependencies

The blog generation pipeline depends on:
- `OPENAI_API_KEY` being set and valid in `backend/.env`
- `docs/` and `knowledge-repo/` containing current, accurate content (the ContextualResearcherAgent reads these)
- If the knowledge-repo is stale, generated blog content may reference outdated information
- If no API key is set, the pipeline falls back to simulated responses (useful for testing but not production)

---

## Build and Deploy Dependencies

### Docker Image Build

Backend Dockerfile depends on:
- `requirements.txt` being complete and installable
- Python version compatibility with all packages
- `staticfiles/` being collectible via `python manage.py collectstatic`

Frontend Dockerfile depends on:
- `package.json` and `package-lock.json` being in sync
- Environment variables being available at build time for `NEXT_PUBLIC_*` vars
- TypeScript compilation succeeding (no type errors)

### Deploy Script Dependencies

The GitHub Actions deploy workflow depends on:
- SSH access to target VMs (keys must be valid and not expired)
- GCS bucket containing current `.env` and `.env.local` files
- Docker and Docker Compose being installed on target VMs
- Sufficient disk space on VMs for new images
- Network connectivity between GitHub Actions runners and GCP

### Environment File Chain

Environment files flow through multiple locations:

```
Developer's local .env files
    ↓ (manual upload)
GCS bucket (canonical source for deployment)
    ↓ (fetched by deploy script)
VM filesystem (used by Docker Compose)
    ↓ (mounted into containers)
Running containers (read by Django/Next.js)
```

If the GCS bucket files are outdated, deployments will use stale configuration.

---

## Frontend-Backend Coupling

### API Contract

The frontend depends on specific backend API response shapes:

- Blog post list/detail endpoints return specific field names
- Auth endpoints return tokens in expected format
- Intake endpoints accept specific field structures
- Any backend serializer change can break the frontend silently

### URL Routing Coupling

Nginx routing rules create implicit coupling:

- `/api/auth/*` must route to Next.js (not Django) for NextAuth to work
- `/api/*` (except auth) must route to Django
- `/admin/*` must route to Django
- If nginx config is changed without updating both sides, routes will 404

### Static File Serving

- Django's `collectstatic` must run for admin/DRF static files to be served
- Frontend static assets are served by Next.js directly
- Media uploads go to GCS (not local filesystem)

---

## Timing Dependencies

### Deployment Order

During deployment, operations must happen in this order:
1. Pull new Docker images
2. Run migrations (before starting new backend)
3. Start new containers

If migrations run against the old code or new code starts before migrations complete, errors can occur.

### Token Expiry

- Access tokens expire after 45 minutes
- Refresh tokens expire after 7 days
- If a user's session is older than 7 days, they must re-authenticate
- Token refresh happens automatically via Axios interceptor, but if the refresh endpoint is down, users get logged out

---

## Knowledge and Content Dependencies

### Knowledge-Repo → AI Pipeline

The AI blog generation pipeline reads from `docs/` and `knowledge-repo/` at generation time. If these files contain outdated information (e.g., references to Flask or SQLite), the generated content will be inaccurate.

### AGENTS.md → Agent Behavior

Coding agents (Codex, Claude Code, etc.) read `AGENTS.md` as their primary instruction source. If this file is outdated or contradicts the actual codebase, agents will make incorrect decisions.

### Control-Plane Docs → Governance

The `docs/control-plane/` directory defines agent directives, output schemas, and governance rules. These must stay aligned with the actual implementation.

---

## External Service Dependencies

| Service | Used For | Failure Mode |
| :--- | :--- | :--- |
| OpenAI API | Blog generation, case analysis | AI features degrade to fallback |
| Stripe | Payment processing | Payments fail |
| Google OAuth | Social login | Google sign-in unavailable |
| GitHub OAuth | Social login | GitHub sign-in unavailable |
| Google Search Console | SEO dashboard | SEO data unavailable |
| Twilio (planned) | SMS intake | SMS intake unavailable |

---

## Conceptual Dependencies

### Tenant-Attorney Relationship Model

The platform is designed around tenants seeking legal help from attorneys. All features should support this core relationship. Changes that don't account for this can break the user experience.

### Legal Workflow Assumptions

The platform assumes specific legal workflows: intake → document collection → case analysis → attorney matching → representation. Features should align with how landlord-tenant cases are actually handled in Tennessee courts.

### Trust Sensitivity

Users may be stressed, vulnerable, or dealing with housing instability. All user-facing changes must feel clear, calm, credible, and professional. This is a hidden dependency on tone and UX quality that affects every frontend change.

---

## Common Failure Patterns

1. **Deploy succeeds but site is broken** — Usually a missing env var or stale GCS bucket file
2. **Auth stops working after deploy** — Usually SECRET_KEY or NEXTAUTH_SECRET changed
3. **API returns 500** — Usually cloud-sql-proxy is down or migration failed
4. **OAuth login fails** — Usually redirect URI mismatch after domain/URL change
5. **Blog generation produces bad content** — Usually knowledge-repo is stale
6. **Static files missing** — Usually `collectstatic` didn't run or nginx config is wrong
