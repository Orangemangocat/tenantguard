# AGENTS.md

Canonical repository instructions for coding agents working in this repo.

This file is intended to be the single source of truth for:
- Claude Code
- Codex CLI
- Gemini CLI
- Cursor / Windsurf / aider-style agents
- any other terminal or IDE coding agent

If a tool supports a repo instruction file, point it at this file.
If tool-specific files also exist (for example `CLAUDE.md`), they should simply direct the agent here.

---

## 1. Prime directive

Make the smallest correct change that cleanly fits the existing architecture.

Do not rewrite the repo.
Do not “modernize” things speculatively.
Do not introduce new dependencies, new frameworks, or new infrastructure unless the task truly requires it.
Do not break auth, deployment, content workflows, or admin operations.

Optimize for:
- correctness
- maintainability
- security
- production safety
- consistency with the existing codebase

---

## 2. Product context

TenantGuard is a legal-tech platform focused on tenant protection and eviction defense, with a Tennessee-specific orientation.

The product is trust-sensitive.
Users may be stressed, vulnerable, or dealing with housing instability.
That means all user-facing changes should feel:
- clear
- calm
- credible
- non-manipulative
- professional

Avoid:
- gimmicky legal copy
- exaggerated claims
- dark patterns
- unexplained AI behavior
- “clever” UX that makes legal/help flows harder to understand

Internal/admin tools can be more pragmatic, but still should be polished.

---

## 3. Current stack and repo shape

This is a split-stack application.

Primary structure:

    backend/          Django REST API
    frontend/         Next.js + TypeScript frontend
    docs/             directives, governance, product/agent context
    knowledge-repo/   knowledge inputs for AI/content workflows
    nginx/            reverse proxy config
    .github/workflows deployment automation
    docker-compose.yml local/server orchestration

Important current realities:
- backend uses Django 5.0.3
- backend uses DRF + JWT auth
- frontend uses Next.js + TypeScript
- the repo includes an AI-powered blog generation pipeline
- deployment uses GitHub Actions, Docker images, Artifact Registry, SSH, and VM targets
- deployment flow is:
  - push to `main` => staging
  - tag `v*` => production

Treat those as high-signal constraints unless the task explicitly changes them.

---

## 4. Non-negotiable operating rules

### 4.1 Inspect before editing
Before changing code:
- inspect the relevant files
- understand the existing pattern
- identify the narrowest correct integration point

Never start by scaffolding blindly.

### 4.2 Respect existing architecture
Keep backend concerns in backend.
Keep frontend concerns in frontend.
Do not blur boundaries without a strong reason.

### 4.3 Prefer existing conventions
Match:
- naming
- directory layout
- import style
- API patterns
- UI composition style
- auth handling style
- admin style

If the repo already has a way of doing something, use it.

### 4.4 Avoid unnecessary dependencies
Do not add packages casually.
Before adding a dependency, ask:
- can the existing stack already do this?
- is this truly worth the operational cost?
- does this complicate Docker/build/deploy?

### 4.5 Server-side security is authoritative
Never rely on hiding UI alone.
If something is restricted:
- enforce it on the backend
- keep frontend behavior aligned with backend permissions

### 4.6 Be explicit about risk
Call out:
- migration risk
- auth risk
- deployment risk
- env var changes
- API contract changes
- irreversible or destructive behavior

### 4.7 Keep changes reviewable
Prefer focused diffs over sweeping refactors.
Leave the repo easier to understand than you found it.

---

## 5. Repo-specific high-risk areas

Treat these as sensitive:

### Authentication
Changes touching any of the following are high-risk:
- login
- logout
- token refresh
- social auth
- protected API calls
- session handling
- admin access
- permission checks

If auth changes in one layer, check the other layer too.

### Deployment / infrastructure
Changes touching any of the following are high-risk:
- `.github/workflows/`
- `docker-compose.yml`
- image names/tags
- nginx config
- env var names/contracts
- startup commands
- migration execution during deploy
- Cloud SQL / proxy assumptions
- VM path assumptions

Do not “clean up” deployment code unless requested.

### AI/content systems
Changes touching blog generation, AI prompts, research pipelines, or knowledge inputs are product-sensitive.
Inspect the current implementation first.
Do not make silent behavior changes.

### Legal or tenant-facing copy
User-facing language should remain professional and trustworthy.
Do not introduce casual/jokey tone into legal-help flows.

---

## 6. Expected workflow for agents

For any meaningful task, follow this sequence:

### Step 1: inspect
Read the relevant files first.

At minimum, inspect:
- the directly relevant module(s)
- nearby imports/usages
- config/routes wired into that area
- likely frontend/backend counterpart if the change crosses layers

### Step 2: map impact
Before editing, identify whether the task affects:
- backend only
- frontend only
- backend + frontend contract
- auth
- admin
- migrations
- deployment
- environment variables
- documentation

### Step 3: implement narrowly
Make the smallest clean change that solves the task.

### Step 4: verify
Run the most relevant checks you can.

### Step 5: report clearly
When done, summarize:
1. what changed
2. files modified/added
3. commands run
4. migrations created
5. env/deploy changes
6. risks / assumptions
7. next steps

Do not just say “done” or “implemented requested changes.”

---

## 7. Backend instructions

The backend is Django + DRF.

When changing backend code, inspect the app structure first:
- `models.py`
- `views.py`
- `serializers.py`
- `urls.py`
- `admin.py`
- `apps.py`
- existing migrations
- relevant settings
- any frontend consumer of the endpoint

### Backend rules
- Use Django-native patterns.
- Use DRF patterns already present in the repo.
- Put business logic in sensible places.
- Avoid dumping too much logic into views.
- Keep serializers predictable.
- Keep permissions explicit.
- Keep URLs conventional.

### When models change
You must:
- create proper Django migrations
- keep migrations small and understandable
- mention migration commands in your final summary

Do not:
- fake migrations
- handwave migration steps
- delete old migrations casually
- make schema changes without considering existing data

### Admin expectations
If a model is operationally useful, consider admin support:
- list display
- filters
- search fields
- readonly metadata where appropriate

But do not add noisy admin config for trivial or internal-only objects unless there is real value.

### Backend verification
After backend changes, prefer to run:

    cd backend
    python manage.py check

If models changed, also run:

    python manage.py makemigrations
    python manage.py migrate

If you cannot run checks, say so clearly.

---

## 8. Frontend instructions

The frontend is Next.js + TypeScript.

Before editing:
- inspect the page/component involved
- inspect shared UI components
- inspect auth/session/api utilities if relevant
- inspect current styling conventions

### Frontend rules
- Keep components small and composable.
- Keep data flow explicit.
- Reuse existing UI patterns before inventing new ones.
- Avoid creating competing paradigms in the same app.
- Keep TypeScript happy.
- Avoid unnecessary global state.
- Avoid overengineering.

### UX rules
Changes should be:
- responsive
- accessible where practical
- calm and readable
- not visually noisy
- aligned with the repo’s current design language

### Frontend verification
After frontend changes, prefer to run:

    cd frontend
    npm run lint
    npm run build

If you cannot run them, say so clearly.

---

## 9. Auth contract rules

This repo uses auth across frontend and backend boundaries.

Treat auth as a contract, not a local detail.

If you change:
- token handling
- refresh behavior
- auth headers
- session shape
- protected endpoint requirements
- social login behavior

then inspect the corresponding layer too.

Never:
- secure something only in the frontend
- change response payloads without checking consumers
- assume session behavior without reading current implementation

For restricted functionality:
- backend enforcement is mandatory
- frontend hiding is additive only

---

## 10. API contract discipline

If you change an API endpoint, serializer, URL, field name, permission requirement, or response shape:

You must:
- search for frontend consumers
- update the consumer if needed
- mention the contract change explicitly

Do not leave backend/frontend mismatches behind.

Prefer boring, predictable API design unless the repo clearly uses another pattern.

---

## 11. AI and content workflow rules

The repo includes AI-assisted content/blog functionality and knowledge sources.

If a task touches:
- blog generation
- AI agents
- prompt construction
- editorial logic
- research inputs
- `docs/`
- `knowledge-repo/`

then inspect those areas first.

Rules:
- preserve legal/brand alignment
- do not silently weaken safeguards
- do not silently change output behavior
- document meaningful behavior changes
- preserve fallback behavior where applicable

If prompt behavior changes, mention it explicitly in your final summary.

---

## 12. Deployment and infrastructure rules

Deployment is production-sensitive.

Before changing deployment-related code, inspect:
- `.github/workflows/deploy.yml`
- `docker-compose.yml`
- relevant Dockerfiles if present
- `nginx/`
- any startup or migration commands invoked by deploy

### Deployment rules
- make the minimum safe change
- preserve current image/service contracts unless required
- preserve current deploy targets/flow unless requested
- do not rename env vars casually
- do not alter ports casually
- do not alter VM path assumptions casually
- do not alter migration timing casually

If a change requires new secrets or variables:
- say so explicitly
- document exact variable names
- do not hardcode values
- do not invent insecure defaults for sensitive values

---

## 13. Environment and secrets policy

Never commit secrets.
Never print secrets into source files.
Never hardcode:
- API keys
- JWT secrets
- OAuth secrets
- DB credentials
- SSH keys
- service-account material
- private URLs or tokens

Assume env-based configuration is the correct path.

Common env surfaces in this repo include:
- `backend/.env`
- `frontend/.env.local`
- GitHub Actions secrets/variables
- VM/server-local env files
- cloud / proxy credential files

If you add a new env var:
- keep the name clear
- wire it only where needed
- mention it in the final summary
- update setup/docs if appropriate

---

## 14. Database and migration policy

Schema changes must be deliberate.

When changing models:
- create a real migration
- ensure defaults/nullability are intentional
- think about existing rows
- think about admin implications
- think about frontend/API implications

If a migration could be risky, say why.
If data backfill is needed, say so.
If the task is ambiguous, choose the safest schema evolution path.

---

## 15. Documentation policy

Update docs when the change introduces or alters:
- setup steps
- commands
- env vars
- deployment requirements
- operator/admin workflow
- AI behavior
- API usage patterns
- architectural expectations

Possible places:
- `README.md`
- `AGENTS.md`
- `CLAUDE.md` pointer
- `docs/`
- inline comments only where they actually help

Do not add noisy documentation for trivial internal implementation details.

---

## 16. Testing and verification policy

If there is not a mature automated test suite in a given area, be stricter about manual verification and static checks.

Minimum expectations by change type:

### Backend-only change
Try to run:

    cd backend
    python manage.py check

### Model change
Try to run:

    cd backend
    python manage.py makemigrations
    python manage.py migrate

### Frontend-only change
Try to run:

    cd frontend
    npm run lint
    npm run build

### Cross-layer change
Try to run both backend and frontend checks.

If you did not run something, say:
- what you did run
- what you did not run
- why

Do not imply verification you did not perform.

---

## 17. Code style expectations

Prefer:
- clear names
- straightforward control flow
- explicit permissions
- small focused functions/components
- minimal surface area changes
- conventional Django / Next.js patterns

Avoid:
- speculative abstraction
- giant helper files
- magic behavior
- hidden coupling
- dead code
- TODO comments with no value
- massive “cleanup” changes bundled with feature work

Comments should explain why, not restate what the code obviously does.

---

## 18. Performance and reliability expectations

Do not introduce obvious performance regressions.

Be mindful of:
- N+1 queries
- unnecessary client fetch churn
- over-fetching
- avoidable rerenders
- blocking work in request paths
- expensive admin views
- brittle deploy steps

Do not prematurely optimize, but do avoid obviously poor patterns.

---

## 19. Change-size discipline

If the user asks for one thing, do that one thing well.

Do not pad tasks with unrelated refactors.
Do not sneak in style rewrites.
Do not upgrade packages “while you’re there.”
Do not rename files/modules unless needed.

If you notice adjacent issues:
- mention them briefly in final notes
- do not automatically fix everything

---

## 20. Safe ambiguity handling

If something is ambiguous:
- prefer the existing repo convention
- choose the most Django-native or Next-native path
- choose the least risky implementation
- keep the change small
- document assumptions in the final summary

Do not stop at vague handwaving.
Make a practical decision and proceed unless the ambiguity makes the task unsafe.

---

## 21. Suggested repo-aware checklist

Use this mental checklist before finishing:

- Did I inspect before editing?
- Did I match the existing pattern?
- Did I avoid unnecessary dependencies?
- Did I preserve auth correctness?
- Did I preserve backend/frontend contract correctness?
- Did I create migrations if needed?
- Did I avoid breaking deploy assumptions?
- Did I avoid exposing secrets?
- Did I verify what I reasonably could?
- Did I clearly report risks and follow-up steps?

If any answer is “no,” fix it or state it explicitly.

---

## 22. Preferred final response format

When reporting completed work, use this structure:

### What changed
A concise explanation of the implementation.

### Files changed
List files added/modified.

### Commands run
List actual commands run.

### Migrations
List migrations created, if any.

### Env / deploy changes
List any required environment or deployment updates.

### Risks / assumptions
State anything important that was not fully verified or that depends on assumptions.

### Recommended next steps
Only include meaningful next steps.

---

## 23. Tool-specific compatibility notes

This file is canonical.

If you keep tool-specific files, they should be tiny pointers.

Recommended `CLAUDE.md`:

    # CLAUDE.md

    See `AGENTS.md` for the canonical repository instructions.

If another tool wants its own repo instruction file, point it here instead of maintaining multiple divergent instruction sets.

---

## 24. Repo-specific reminders

- This is a split backend/frontend app; keep both sides aligned.
- Django is currently 5.0.3; do not assume 5.0.2.
- Auth changes are high-risk.
- Deploy changes are high-risk.
- AI/blog changes are product-sensitive.
- Legal/tenant-facing copy must remain trustworthy and professional.
- Small, correct, reviewable changes are better than broad rewrites.

---

## 25. Bottom line

Act like a senior engineer joining an existing production codebase:
- inspect first
- change narrowly
- preserve trust
- preserve security
- preserve deployability
- verify honestly
- document clearly

When in doubt, choose the simpler, safer, more conventional path.
