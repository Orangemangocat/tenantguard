# CLAUDE.md

    See `AGENTS.md` for the canonical repository instructions.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TenantGuard is a legal-tech platform for tenant protection and eviction defense, focused on Tennessee tenants. It pairs a Django REST API backend with a Next.js frontend, using JWT-based auth (with Google/GitHub OAuth), an AI-powered blog generation pipeline, and a basic legal assistant chat system.

## Repository Structure

```
backend/    # Django REST API (Python)
frontend/   # Next.js + TypeScript + Tailwind UI
docs/       # Agent directives, governance, project vision
knowledge-repo/  # Knowledge base read by AI blog agents
```

## Commands

### Frontend

```bash
cd frontend
npm install
npm run dev       # Dev server at http://localhost:3000
npm run build     # Production build
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
```

No test suites are currently configured.

## Architecture

### Auth Flow

Authentication is split across three layers:
1. **NextAuth** (`frontend/pages/api/auth/[...nextauth].js`) — handles session, token storage, and OAuth provider callbacks
2. **Axios client** (`frontend/lib/api.ts`) — attaches `Authorization: Bearer <token>` headers; handles token refresh before expiry
3. **Django backend** (`backend/authentication/`) — issues and validates JWT tokens (45-min access, 7-day refresh) via `djangorestframework-simplejwt`; OAuth social login via `django-allauth`

### Backend Apps

- `authentication/` — registration, login, OAuth callbacks, token endpoints
- `blog/` — blog posts (CKEditor rich text), categories, tags, comments, and the AI generation pipeline
- `chat/` — simple message storage/retrieval for the legal assistant chat

### AI Blog Generation Pipeline

Located in `backend/blog/ai_agents.py`. Admin triggers it via `/admin/ai-generator/` (custom admin view). The multi-agent pipeline:

1. **ContextualResearcherAgent** — reads `docs/` and `knowledge-repo/` for brand/legal alignment context
2. **TopicsAgent** — suggests 5 blog topic ideas
3. **BlogAuthorAgent** — writes the full article from a research brief
4. Agents extend a `BaseAgent` class, use OpenAI (`gpt-4o-mini`), and fall back to simulated responses if no API key is set.

### Frontend Pages & Routing

- `/` — landing page (hero, features, tenant challenge section)
- `/blog`, `/blog/[slug]` — blog index (search + categories) and post detail
- `/profile` — authenticated user profile
- `/api/auth/[...nextauth]` — NextAuth catch-all route

### Key API Routes (Backend)

```
POST  api/auth/register/
POST  api/auth/login/
POST  api/auth/google/
POST  api/auth/github/
POST  api/auth/token/refresh/

GET   api/blog/posts/          (supports ?search=)
GET   api/blog/posts/<slug>/
GET   api/blog/categories/
POST  api/blog/posts/<slug>/comments/

GET   api/chat/messages/       (authenticated)

GET   admin/ai-generator/      (custom admin UI)
POST  admin/blog/ai-generate-api/
```

## Environment Variables

**Backend** (`backend/.env`): `SECRET_KEY`, `OPENAI_API_KEY`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`

**Frontend** (`frontend/.env.local`):
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (http://localhost:3000), `NEXTAUTH_BACKEND_URL` (http://127.0.0.1:8000/api/)
- `NEXT_PUBLIC_API_URL`
- `GOOGLE_CLIENT_ID/SECRET`, `GITHUB_ID/SECRET`

## Key Tech

- **Frontend**: Next.js 16, React 18, TypeScript, Tailwind CSS 4, Chakra UI 2, Framer Motion, Axios, next-auth 4
- **Backend**: Django 5, DRF 3.15, simplejwt, django-allauth, CKEditor, django-taggit, django-jazzmin (admin UI), OpenAI SDK
- **Database**: PostgreSQL 18 (`tenantguard_db`); path alias `@/*` maps to `frontend/` root
