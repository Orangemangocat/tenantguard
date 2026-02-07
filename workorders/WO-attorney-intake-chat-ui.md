# WO: In-App Attorney Intake Chat UI

Summary
---
Implement a simplified in-app chat intake flow for attorneys that collects the required fields for attorney applications and submits to the existing `/api/attorneys` endpoint.

Acceptance Criteria
---
- New `AttorneyIntakeChat` UI is available at `/attorney-intake`.
- Chat collects all fields required by the backend `POST /api/attorneys` endpoint.
- Submission succeeds and displays the returned application ID.

Files changed/added
---
- frontend/src/components/AttorneyIntakeChat.jsx (new)
- frontend/src/App.jsx (updated)
