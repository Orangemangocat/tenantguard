WO: Implement Onboarding-Gated Intake Flow

Goal
- When a user clicks "Tenants" or "Attorneys" buttons (or intake links), they should:
  1. Authenticate if not already logged in.
  2. Upon successful authentication, redirect to `/onboarding?start=<role>` to begin onboarding.
  3. Upon onboarding completion, redirect to the appropriate intake form (`/tenant-intake` or `/attorney-intake`).
  4. Once the intake form is submitted, the user is directed to document retrieval and next steps.
- Add an "Onboarding" link in the user dropdown menu so authenticated users can always revisit onboarding.

Files to change/add
- frontend/src/App.jsx (refactor nav to wire intake buttons through `handleRequireOnboarding`)
- workorders/WO-onboarding-intake-flow.md (new)

Acceptance criteria
- Clicking "Tenants" or "Attorneys" buttons without authentication triggers login modal with pending role stored.
- Upon login success, user is redirected to `/onboarding?start=<role>` instead of homepage.
- Onboarding finish step respects the `?start=<role>` parameter and directs to `/tenant-intake` or `/attorney-intake`.
- User dropdown always includes "Onboarding" link (for users not yet fully onboarded).
- Desktop and mobile nav both trigger the same flow.

Notes
- Backend must provide an API endpoint for the intake form submission to indicate completion and next steps.
- The redirect flow is linear: login → onboarding → intake form → document retrieval (future backend work).
