# Project Context and User Preferences

This document captures persistent context about the project owner, communication preferences, and standing instructions that all agents (Codex, Claude Code, Manus, etc.) should follow when working on TenantGuard.

---

## 1. Project Architecture (Current)

We have permanently migrated away from the old Flask + SQLite + Vite stack.

- **Frontend:** Next.js 16 + TypeScript, Pages Router, NextAuth, Chakra UI + Tailwind CSS, Framer Motion, Lucide icons
- **Backend:** Django 5.0.3 + DRF, JWT auth, allauth OAuth, Jazzmin admin
- **Database:** PostgreSQL 16 (Docker on staging, Cloud SQL on production)
- **Deployment:** Docker Compose (nginx, backend, frontend, db)
- **AI:** OpenAI GPT-4o for document analysis (vision), GPT-4o-mini for chat

## 2. Server Environments

### Development/Staging (Testing Environment)
- **Domain:** staging.tenantguard.net
- **IP:** 34.23.105.126 (GCP VM name: `web-development`, us-east1-d)
- **⚠️ CORRECTED 2026-06-22:** Old IP `34.138.86.218` was stale/wrong. Verified correct IP is `34.23.105.126`.
- **Role:** ALWAYS test changes here first before touching production.
- **Access:** SSH as `manus-tenantguard-agent` using key from `tenantguard-manus-retained/secrets/tenantguard_prod`. (Old cloud-pc mount path is no longer valid.)
- **⚠️ WARNING:** App at `/opt/tenantguard` on this VM is the **old March 2026 Flask/Vite stack** owned by user `karl`. The current Django/Next.js stack lives only on production and in GitHub `main`. This VM needs migration before it can serve as a true staging environment.

### Production (Live Environment)
- **Domain:** tenantguard.net
- **IP:** 34.75.162.207 (GCP)
- **Role:** Do not touch unless explicitly authorized.
- **SSH:** `ssh -i ~/.ssh/tenantguard_prod manus-tenantguard-agent@34.75.162.207` (key stored in `tenantguard-manus-retained/secrets/tenantguard_prod`)

## 3. GitHub Repositories

- **Canonical Repo:** `Orangemangocat/tenantguard` (main branch) — All commits MUST go here.
- **Mirror Repo:** `KarlHaines82/tenantguard2` — Used only because the CI/CD `deploy.yml` lives here.
- **Known Bug:** The `deploy.yml` in the mirror repo has an SSH password bug where the production step uses `STAGING_SSH_PASSWORD` instead of `PROD_SSH_KEY`.
- **Git Identity:** John Bransford <gigipennyjohn@gmail.com>

## 4. User Preferences & Idiosyncrasies (CRITICAL)

1. **Design-First Approach:** The user ALWAYS wants to see a design mockup or plan before ANY code is written or implemented. Never build a feature without asking for design approval first.
2. **Staging First:** Implement everything on the staging site first. Only push to production after the user tests and approves it.
3. **Smartphone Mirroring:** The user prefers graphical sophistication akin to "bizee", specifically mirroring forms inside a smartphone mockup (as done on the `/get-help` page).
4. **Reassuring Tone:** AI must NEVER scare tenants, NEVER tell them to contact the landlord's attorney, and NEVER suggest moving out unless absolutely legally required.
5. **Extract-and-Confirm:** AI should read uploaded documents and present extracted info for confirmation ("I see the address is X — is that correct?") rather than asking blank questions.
6. **Model-Agnostic:** Architecture should not be wedded to any single AI provider.
7. **Full-Stack Delivery:** The user expects to see live webpages on staging, not just code snippets.

## 5. CaseLink Integration (Davidson County)

CaseLink is the official electronic court records system for Davidson County General Sessions Civil Court. We use this to scrape court dates, pleadings, and judgments.

- **URL:** caselink.nashville.gov
- **Login Email:** bransfordbacktwo@gmail.com
- **Password:** Orangemango+4034044
- **Subscription #:** 72228 ($25.56/month via LexisNexis, Visa ending in 6069)
- **Renewal:** ~18th of each month (Reminder set for the 15th)
- **Case Format:** `24GT10013` (Year + Type + Number)
- **More Info:** See `knowledge-repo/integrations/CASELINK.md` for full tab structure and scraping strategy.

## 6. Current Status & Next Steps

### Recently Completed (June 18, 2026)
- Built `/get-help` landing page with smartphone mockup and AI chat.
- Fixed AI document analysis to use GPT-4o with vision (converts scanned PDFs to images via `pdftoppm`).
- Created CaseLink integration documentation.
- **Built `/workspace-demo` page** — fully functional demo workspace with:
  - CaseLink Court Records panel (pleadings table + court dates table, live from case 24GT10013)
  - Evidence Locker (photos/recordings with annotations and timestamps)
  - Diary/Notes (date-stamped personal entries)
  - Communication Log (sent/received with direction badges)
  - Case Status Timeline (visual progress tracker)
  - Payment Tier badge (Basic $50 / Standard $250 / Premium $500)
  - Right rail with plan details, court countdown, case stats, CaseLink sync status
  - All names redacted for promotional screenshots
  - **Live at:** https://staging.tenantguard.net/workspace-demo

### Currently In Progress
- Integrating workspace features into the real `case/[id].tsx` page (backend API endpoints needed)
- CaseLink automated scraping (scheduled pull of court records into our database)
- Payment tier selection UI in the real checkout flow

### Launch Target
- **July 7, 2026** (First week of July)
- Need to finalize the AI Memory Core (Rules, Identity, Tennessee Law, Document Patterns).

---

## 7. Geographic and Legal Context

TenantGuard operates in the Tennessee landlord-tenant legal space:

- **Primary jurisdiction:** Davidson County (Nashville), Tennessee
- **Key legal facts:** Tennessee eviction notice period is 14 days; 85% of tenants lack legal representation
- **Legal constraints:** Platform must avoid unauthorized practice of law (UPL); must comply with Tennessee landlord-tenant statutes
- **Expansion plans:** Additional Tennessee counties first, then other states

---

## 8. AI-Assisted Development Context

The project uses AI agents (Codex, Claude Code, Manus) for development. Key principles:

- Agents should read `AGENTS.md` and `CODEX.md` before starting work
- Agents should update documentation when they learn something new about the project
- The `knowledge-repo/` directory is the persistent memory for AI agents
- The `docs/control-plane/` directory defines governance and output schemas for AI content generation
- If an agent discovers a discrepancy between documentation and code, the code is authoritative and the documentation should be updated
