# WO: AI Blog Writer Admin UI

Summary
---
Add an admin-facing UI in the frontend to create and revise AI-generated blog posts and submit drafts to the existing approval queue.

Acceptance Criteria
---
- Admins can access an AI blog writer view from the admin dashboard.
- The UI can submit generation requests and show success/error states.
- The UI can request revisions for existing draft posts.
- Generated posts remain drafts and flow through the existing approval queue.
- Only supported LLM providers are selectable.

Files in Scope
---
- frontend/** (admin dashboard UI components and routing)

Out of Scope
---
- Backend route changes
- New LLM provider integrations
- Changes to approval queue logic

Verification
---
- `cd frontend && pnpm lint`
- `cd frontend && pnpm build`
