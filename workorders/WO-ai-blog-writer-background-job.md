# WO: AI Blog Writer Background Job Integration

Summary
---
Queue AI blog generation as a background job and wire it into existing schedule controls so auto-posting respects configured cadence.

Acceptance Criteria
---
- AI generation uses an RQ background job instead of running inline.
- Scheduling honors the existing blog schedule configuration (max days between posts).
- Job enqueueing is protected by admin auth when triggered manually.
- Errors are logged and returned clearly when queuing fails.

Files in Scope
---
- src/routes/**
- src/tasks/**
- src/scheduler/**
- docs/** (if needed for configuration notes)

Out of Scope
---
- New database tables or migrations
- Frontend UI changes

Verification
---
- `python -m compileall src`
- `python -c "import importlib; importlib.import_module('src.main')"`
