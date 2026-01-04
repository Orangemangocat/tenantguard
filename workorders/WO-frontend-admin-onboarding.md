---
title: Frontend Admin Panel & Onboarding Implementation
id: WO-frontend-admin-onboarding
owner: frontend-team
created: 2026-01-04

summary:
  Implement the frontend user admin panel and onboarding flow for TenantGuard.

scope:
  - Add a lightweight `UserManagement` wrapper around the existing `AdminUserManagement` component.
  - Add an `Onboarding` component to guide new users through profile setup.
  - Wire `/admin-panel` and `/onboarding` paths in `frontend/src/App.jsx` to render the new views.

acceptance_criteria:
  - Visiting `/admin-panel` displays the admin dashboard when authenticated as an admin.
  - Visiting `/onboarding` displays the onboarding flow for authenticated users.
  - Changes touch only `frontend/src/components/*` and `frontend/src/App.jsx` and reference this work order.

notes:
  - Backend API endpoints are used via existing `apiBase.js` and auth tokens in `localStorage`.
  - This work intentionally adds minimal UI scaffolding; backend behavior is unchanged.
