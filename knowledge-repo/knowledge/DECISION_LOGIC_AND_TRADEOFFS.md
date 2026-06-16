# Decision Logic and Tradeoffs

This document captures the architectural and operational decisions made for TenantGuard, including the rationale and tradeoffs. Updated to reflect the current Django/Next.js/PostgreSQL/GCP architecture (June 2026).

> **Note:** The project was originally built with Flask/SQLite/Vite and later migrated to the current stack in early 2026. Legacy decisions are preserved in the "Historical Decisions" section at the bottom for context.

---

## Current Architecture Decisions

### Decision 1: Django over Flask (Migration)

**Choice:** Migrated from Flask to Django 5.0.3 with Django REST Framework.

**Rationale:**
- Django's built-in admin, auth, ORM, and migration system eliminate significant custom code
- DRF provides standardized API patterns (serializers, viewsets, permissions)
- django-allauth handles OAuth complexity (Google, GitHub) out of the box
- Django's mature ecosystem supports the growing feature set (blog, intake, chat, staff tools)
- Better suited for a multi-app architecture with clear boundaries

**Tradeoffs:**
- Heavier framework with more conventions to learn
- Less flexibility for unconventional patterns
- Migration required significant rewrite effort

**Status:** Complete. Django is the production backend.

---

### Decision 2: PostgreSQL over SQLite

**Choice:** PostgreSQL via Google Cloud SQL, accessed through cloud-sql-proxy.

**Rationale:**
- Production-grade concurrency and reliability
- Cloud SQL provides managed backups, replication, and monitoring
- Required for multi-user concurrent access patterns
- Better support for complex queries, JSON fields, full-text search
- cloud-sql-proxy provides secure, credential-free local access

**Tradeoffs:**
- More complex local development setup (need proxy or local PostgreSQL)
- Cloud SQL has ongoing cost
- Dependency on GCP infrastructure

**Status:** Complete. PostgreSQL is the production database.

---

### Decision 3: Next.js over Vite/React SPA

**Choice:** Next.js with TypeScript, pages router, and server-side rendering.

**Rationale:**
- SSR/SSG improves SEO (critical for legal content/blog)
- File-based routing simplifies page organization
- Built-in API routes support NextAuth without a separate auth server
- TypeScript catches errors at build time
- Better performance for initial page loads

**Tradeoffs:**
- More complex than a simple Vite SPA
- Server-side rendering adds deployment complexity
- Pages router (not app router) — chosen for stability and next-auth 4 compatibility

**Status:** Complete. Next.js is the production frontend.

---

### Decision 4: Docker Compose + GitHub Actions CI/CD

**Choice:** Containerized deployment with automated CI/CD pipeline.

**Rationale:**
- Reproducible environments across staging and production
- GitHub Actions provides free CI/CD for the repo
- Docker images ensure consistent behavior regardless of VM state
- Artifact Registry provides secure, versioned image storage
- Separation of staging (push to main) and production (git tag) reduces risk

**Tradeoffs:**
- More complex than direct server deployment
- Docker adds resource overhead on VMs
- Debugging requires container-aware tooling
- Image builds take time in CI

**Status:** Complete. This is the production deployment model.

---

### Decision 5: Cloudflare for DNS/CDN/Security

**Choice:** Cloudflare fronts the public domain with DNS, CDN, and WAF.

**Rationale:**
- Free tier provides DDoS protection, CDN caching, and SSL
- Hides origin server IPs
- Easy DNS management
- Performance benefits from edge caching

**Tradeoffs:**
- Adds a dependency on Cloudflare's infrastructure
- Some debugging complexity when issues are at the edge vs. origin
- Must configure origin certificates correctly

**Status:** Active. Cloudflare manages tenantguard.net DNS.

---

### Decision 6: JWT Authentication with NextAuth

**Choice:** Three-layer auth: NextAuth (frontend session) → Axios interceptor (token attachment) → Django SimpleJWT (backend validation).

**Rationale:**
- NextAuth handles OAuth complexity on the frontend
- JWT tokens are stateless and scalable
- Short-lived access tokens (45 min) limit exposure
- Refresh tokens (7 days) provide session continuity
- Backend remains the authoritative permission enforcer

**Tradeoffs:**
- Three-layer auth is complex to debug
- Token refresh logic must be carefully synchronized
- Any auth change requires checking both layers
- High-risk area for bugs

**Status:** Active. Auth changes are treated as high-risk.

---

### Decision 7: AI Blog Generation Pipeline

**Choice:** Multi-agent pipeline using OpenAI API with fallback to simulated responses.

**Rationale:**
- Automated content generation reduces manual effort
- Multi-agent approach (researcher → topics → author) produces higher quality
- Fallback mode allows development/testing without API costs
- Admin-triggered (not automated) maintains editorial control
- Knowledge-repo provides brand/legal alignment context

**Tradeoffs:**
- Depends on OpenAI API availability and pricing
- Generated content requires editorial review
- Prompt changes can silently alter output quality
- Knowledge-repo must stay current for good results

**Status:** Active. Accessible via `/admin/ai-generator/`.

---

### Decision 8: Staging-First Deployment Protocol

**Choice:** All changes deploy to staging first; production only via explicit git tag after testing.

**Rationale:**
- Reduces risk of breaking production
- Staging environment mirrors production for realistic testing
- Test accounts are auto-seeded on staging for verification
- Clear separation of "deployed" vs. "released"

**Tradeoffs:**
- Slower path to production
- Staging must be maintained as a separate environment
- Requires discipline to actually test before tagging

**Status:** Active. This is a standing operational rule.

---

## Operational Heuristics

### When to add a new Django app
- When the feature has its own models, views, and URL namespace
- When it represents a distinct domain concept (not just a utility)
- When it would clutter an existing app to add it there

### When to add a new frontend page
- When the feature needs its own URL for navigation/bookmarking
- When it represents a distinct user workflow
- When it would make an existing page too complex

### When to add a dependency
- Only when the existing stack cannot reasonably do it
- Only when the operational cost (Docker build, maintenance) is justified
- Prefer Django/Next.js built-in capabilities first

### When to create a migration
- Any time a model field is added, removed, or changed
- Keep migrations small and focused
- Consider existing data and nullable/default implications
- Always mention migrations in commit messages and summaries

---

## Tradeoff Patterns

### Pattern: Speed vs. Perfection
**Approach:** Prioritize getting a working solution quickly, then iterate and improve.
**Current application:** Ship to staging fast, test thoroughly, tag for production only when confident.

### Pattern: Simplicity vs. Scalability
**Approach:** Choose solutions that work for current scale but are replaceable.
**Current application:** Cloud SQL handles current load; can add read replicas or Redis caching later if needed.

### Pattern: User Experience vs. Development Effort
**Approach:** Prioritize user experience, but look for efficient implementation paths.
**Current application:** Guided intake forms, AI case analysis, and clean dashboards are worth the effort because they directly serve vulnerable users.

### Pattern: Consistency vs. Innovation
**Approach:** Favor consistency with established patterns; innovate only when it provides clear user value.
**Current application:** Follow Django/Next.js conventions; innovate in the AI pipeline and legal workflow areas.

---

## Decision-Making Process

1. **Understand the requirement** — Clarify what the user/task is trying to achieve
2. **Identify constraints** — Technical, time, resource, and architectural constraints
3. **Generate options** — Multiple approaches including simple and complex
4. **Evaluate tradeoffs** — Development time, maintainability, performance, UX, security
5. **Choose the safest correct option** — Most value with least risk
6. **Implement and verify** — Test before declaring done
7. **Document** — Record the decision and rationale

---

## Historical Decisions (Legacy — For Context Only)

These decisions applied to the original Flask/SQLite/Vite implementation (December 2025). They are **fully superseded** by the current architecture.

### Why Flask was originally chosen
- Lightweight for rapid prototyping
- Simple to deploy on a single server
- Low learning curve for initial development

### Why SQLite was originally chosen
- Zero configuration for initial development
- Single-file database easy to backup
- Sufficient for single-user testing

### Why Vite/React SPA was originally chosen
- Fast build times for development
- Simple client-side routing
- Modern developer experience

### Why direct server deployment was originally used
- Simplest possible deployment for a testing server
- No CI/CD overhead during initial prototyping
- Custom bash script (`deploy_fixed.sh`) handled the workflow

### Why a theme switcher was implemented
- User-requested feature
- Provides personalization (Light, Dark, Blue Professional, Green Legal)
- Uses CSS custom properties for performance

**All legacy architectural decisions were superseded when the project matured and required production-grade infrastructure, multi-user concurrency, and automated deployment.**
