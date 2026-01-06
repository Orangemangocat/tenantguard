WO: Add root Makefile for routine tasks

Goal
- Provide a Makefile at the repo root that exposes the most common backend and frontend commands so contributors can run them with `make` instead of juggling cwd switches and long commands.

Files to change/add
- Makefile (new)
- workorders/WO-makefile-tasks.md (new)

Acceptance criteria
- A root-level Makefile exists that declares `help`, `setup`, backend install/run/worker/compile, frontend install/dev/lint/build/preview, and `verify` targets.
- Each Makefile target simply wraps the existing `python` and `pnpm` commands that are already used across the repo.
- The Work Order documents the addition as required by AGENTS.md's patch-only process.

Notes
- Running `make verify` should exercise the `compileall` check plus a frontend build so reviewers can confirm the file behaves as expected.
