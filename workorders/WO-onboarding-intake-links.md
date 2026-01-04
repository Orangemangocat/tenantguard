---
title: Onboarding → Intake Pages Linking
id: WO-onboarding-intake-links
owner: frontend
created: 2026-01-04

summary:
  Add full-page intake routes for tenant and attorney intake forms and link the onboarding finish step to them.

scope:
  - Add routes `/tenant-intake` and `/attorney-intake` to render the existing `CaseIntakeForm` and `AttorneyIntakeForm` as full pages.
  - Update `frontend/src/components/Onboarding.jsx` to include buttons on the final step that navigate to those pages.

files changed:
  - frontend/src/App.jsx
  - frontend/src/components/Onboarding.jsx
  - workorders/WO-onboarding-intake-links.md (this file)

acceptance_criteria:
  - Visiting `/tenant-intake` renders the tenant intake form.
  - Visiting `/attorney-intake` renders the attorney intake form.
  - The final onboarding step includes buttons that navigate to those routes.

verification:
  - Start dev server and visit `/tenant-intake` and `/attorney-intake`.
  - Complete onboarding and click the new buttons to confirm navigation.
