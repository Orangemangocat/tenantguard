# TenantGuard Project Objectives

Updated June 2026 to reflect actual progress after the Django/Next.js migration.

---

## Mission

Empower tenants facing disputes with their landlords by providing accessible, affordable legal representation through technology.

---

## Core Product Goals

### Goal 1: Streamlined Tenant Intake

Provide tenants with an easy, guided process to submit their case information and documents, reducing barriers to seeking legal help.

**Status:** Implemented. Multi-step guided intake form with document upload, OCR text extraction, and AI-powered case notebook generation.

### Goal 2: Efficient Attorney Case Setup

Reduce attorney case setup time from 3-5 hours to under 1 hour by providing pre-analyzed case notebooks with structured facts, timelines, and recommendations.

**Status:** Implemented (AI case notebook generation). Attorney matching and assignment not yet complete.

### Goal 3: Accessible Legal Content

Provide tenants with educational resources about their rights, the eviction process, and legal options through an SEO-optimized blog and resource center.

**Status:** Implemented. AI blog generation pipeline, SEO dashboard, dynamic sitemap, and blog with search/categories.

### Goal 4: Attorney-Tenant Matching

Automatically connect tenants with qualified attorneys based on expertise, location, caseload, and budget preferences.

**Status:** Not yet implemented. This is the next major feature priority.

### Goal 5: Affordable Legal Services

Reduce tenant legal costs by 60% compared to traditional legal services through technology-enabled efficiency.

**Status:** Platform infrastructure complete. Payment system in test mode. Full cost reduction depends on attorney matching and case management completion.

---

## Key Performance Indicators

| Metric | Target | Current Status |
| :--- | :--- | :--- |
| Tenant cost reduction | 60% | Infrastructure ready; measuring after launch |
| Attorney time savings | 70% (case setup) | AI notebooks implemented; measuring after matching |
| Case preparation completeness | 90% | AI analysis provides structured output |
| Cases matched within 24 hours | 80% | Matching not yet implemented |
| Platform uptime | 99.9% | Staging and production deployed |

---

## Technical Objectives

### Completed

The following technical milestones have been achieved:

- Django/Next.js/PostgreSQL architecture migration from Flask/SQLite/Vite
- Docker containerization and GitHub Actions CI/CD pipeline
- JWT + OAuth authentication system (Google, GitHub)
- AI-powered blog generation and case analysis pipelines
- User dashboard with case management views (documents, motions, actions, alerts)
- SEO optimization (dynamic sitemap, robots.txt, Google Search Console dashboard)
- Staging/production deployment separation with automatic deploys
- Stripe payment integration (test mode)
- Staff todo panel with activity tracking
- SMS intake session mapping (partial)

### In Progress

- Attorney matching algorithm
- Email notification system
- In-platform messaging between tenants and attorneys
- SMS intake completion
- Automated testing (unit, integration, CI)

### Planned

- Payment system production launch
- Analytics and reporting dashboards
- Security hardening (rate limiting, CSRF, security audit)
- Geographic expansion to additional Tennessee counties
- Mobile applications (iOS, Android)
- Document automation (demand letters, court filings)

---

## Audience Priorities

1. **Tenants** — Primary users. Everything should be clear, calm, and accessible. Users may be stressed or vulnerable.
2. **Attorneys** — Secondary users. Tools should save time and reduce friction. Professional interface.
3. **Staff/Admin** — Internal users. Pragmatic tools for content, intake, and task management.

---

## Constraints

The project operates under several important constraints that inform all design and development decisions:

- Must comply with Tennessee landlord-tenant law
- Must avoid unauthorized practice of law (UPL)
- Must maintain user trust through professional, non-manipulative design
- Must protect sensitive personal and legal information
- Must remain deployable and maintainable by a small team
- Must deploy to staging first; production only after testing

---

## Alignment with Mission

All objectives support the core mission of empowering tenants and providing accessible legal representation. Success is measured not just by financial metrics, but by the positive impact on tenants' lives and the legal system. The platform targets Davidson County, Tennessee initially, with plans to expand to additional counties and eventually other states as the model is proven.
