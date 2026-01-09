# WO: Integrate AI Blog Writer

Summary
---
Integrate the AI-generated blog post writer from `blog_system_test` into the main app, aligning it with existing approval workflows and current data models.

Acceptance Criteria
---
- AI generation endpoints are added to the main app and protected by admin auth.
- Generated posts are saved as drafts with valid category values and metadata.
- Revision endpoint updates existing posts without breaking slugs.
- Approval and rejection continue to use existing approval queue routes (no duplicate approve/reject endpoints).
- LLM provider list is limited to implemented providers.
- LLM responses are parsed safely, with clear error messages on malformed output.

Files in Scope
---
- src/routes/** (new AI blog routes)
- src/main.py (register blueprint)
- docs/** (if needed for configuration notes)

Out of Scope
---
- New frontend UI for AI blog authoring
- New background job queues
- Additional provider integrations beyond existing implemented ones

Verification
---
- `python -m compileall src`
- `python -c "import importlib; importlib.import_module('src.main')"`
