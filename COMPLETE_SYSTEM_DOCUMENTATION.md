# TenantGuard Complete System Documentation

## Overview
TenantGuard is a full-stack landlord-tenant legal support platform focused on Tennessee (Davidson County by default). The system includes tenant and attorney intake, admin tooling, content management, and a background processing pipeline. Authoritative constraints for AI behavior live in `docs/control-plane/`.

## Control-Plane (Authoritative Instructions)
The control-plane documentation in `docs/control-plane/` defines:
- Legal and ethical constraints for agents.
- Required data flow (input to case notebook to derivatives).
- Output schemas for structured artifacts.
- Regeneration, versioning, and escalation rules.

If a behavior is not documented there, it should not be assumed.

## Repository Layout (Current)
```
tenantguard/
├── src/                         # Flask API, models, services, worker
│   ├── main.py                  # Flask entrypoint, static serving
│   ├── worker.py                # RQ worker entrypoint
│   ├── config/                  # Database configuration
│   ├── models/                  # SQLAlchemy models
│   ├── routes/                  # Flask blueprints (API + admin)
│   ├── services/                # AI + storage helpers
│   ├── tasks/                   # Background task definitions
│   ├── scheduler/               # Scheduled job runners
│   └── templates/               # Server-rendered templates (blog)
├── frontend/                    # Vite + React frontend source
├── frontend-next/               # Static blog generation frontend
├── docs/                        # Documentation
├── workorders/                  # Work orders and templates
├── scripts/                     # Utility scripts
├── alembic/                     # Database migrations
├── requirements.txt             # Python dependencies
└── CHANGELOG.md                 # Work log
```

## Frontend (Vite + React)
- **Location:** `frontend/`
- **Core UI:** Landing page, tenant intake (form + chat), attorney intake (form + chat), admin dashboards, blog management.
- **Build Output:** Vite default output is `frontend/dist/`. The Flask app serves static assets from `src/static/` when present; deployment may require copying `frontend/dist/` into `src/static/`.

## Backend (Flask API)
- **Location:** `src/`
- **Framework:** Flask with CORS enabled.
- **Database:** SQLAlchemy with SQLite fallback or PostgreSQL configuration (see `src/config/database.py`).
- **Static Serving:** `src/main.py` serves `src/static/` for SPA routes when the static build is available.

### Key Blueprints (High-Level)
- Case intake and management (`/api/cases`)
- Attorney intake and management (`/api/attorneys`)
- Authentication (`/auth` and API auth endpoints)
- Blog content (public and admin)
- AI blog tooling and admin queue
- Groups and user administration
- Contact and sitemap helpers

## Data Models (High-Level)
Key models defined in `src/models/` include:
- Case, CaseAnalysis
- Attorney
- User, AuthUser
- Blog, BlogTopic, BlogEnhanced
- Group

## Background Processing
- **RQ Worker:** `src/worker.py` runs background jobs against Redis.
- **Schedulers:** `src/scheduler/` contains automated blog posting workflows.
- **Tasks:** `src/tasks/` holds blog AI and LLM task definitions.

## Services and Integrations
- AI helpers for case/blog processing in `src/services/`.
- Optional cloud storage helpers (see `src/services/gcs_storage.py`).

## Deployment Notes
- Build the frontend with Vite (`frontend/`) and ensure static assets are available in `src/static/` if you want Flask to serve the SPA.
- The backend auto-creates tables on startup where possible, but Alembic migrations exist for managed environments.
- Database defaults to PostgreSQL configuration with SQLite fallback if credentials or drivers are unavailable.

## Security and Governance
- Legal and ethical constraints are defined in `docs/control-plane/06_GOVERNANCE/`.
- Avoid legal guarantees and ensure outputs are tied to evidence in the Case Notebook.
- Follow control-plane escalation rules when user safety or deadlines are critical.
