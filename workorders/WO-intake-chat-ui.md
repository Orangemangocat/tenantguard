# WO: In-App Intake Chat UI (TN-Specific)

Summary
---
Implement a new in-app chat intake flow for tenants using Tennessee-specific prompts. The chat should collect required fields for case creation, guide the user through eviction/notice details, and persist the conversation payload via the intake conversation queue endpoint.

Acceptance Criteria
---
- New `IntakeChat` UI is available at `/tenant-intake` and replaces the current form in that route.
- Conversation uses TN-specific prompts for notices (3/10/14/30 day, pay/cure/no-cause, court summons).
- Intake collects required fields to create a case: first name, last name, email, phone, rental address, monthly rent.
- On completion, the app creates a case via `POST /api/cases`.
- After case creation, the full chat transcript is posted to `POST /api/cases/<case_number>/intake-conversations`.
- UI shows progress and a final summary with remaining open questions.

Files changed/added
---
- frontend/src/components/IntakeChat.tsx (new)
- frontend/src/App.jsx (updated)
