# Using TenantGuard's Chat-Only Workflow

This guide is for contributors who want to make code and documentation updates through AI chat tools (ChatGPT, Claude, Gemini, etc.) without working directly in an IDE.

The TenantGuard process is **workorder-first** and **patch-only**:
- Workorder-first means every change maps to a file in `workorders/`.
- Patch-only means AI output must be a unified diff (`diff --git ...`) rather than full file replacements.

## What You Need Before Starting

1. A local clone of this repository.
2. Python `3.12` and an active virtual environment.
3. The helper scripts available in `scripts/`:
   - `scripts/new_workorder.py`
   - `scripts/build_ai_packet.py`
   - `scripts/extract_ai_patch.py`
   - `scripts/apply_patch.py`
4. Access to a chat AI that can return unified diff patches.

## Workflow Summary

1. Install branch guard hooks (dev-only commits/pushes).
2. Create a Work Order.
3. Build a task packet for the AI.
4. Send the packet to the AI chat.
5. Extract the patch from the AI response.
6. Validate and apply the patch locally.
7. Run verification commands.
8. Update changelog entries and open a PR.

## Step-by-Step

### Step 0: Install Dev-Only Branch Guard Hooks

Install local git hooks that block commits and pushes outside `dev`:

```bash
bash scripts/install_branch_guard_hooks.sh
```

This installs:
- `.git/hooks/pre-commit`
- `.git/hooks/pre-push`

Note:
- This is a local safeguard for your clone.
- You should still keep remote branch protection enabled on the repository.

### Step 1: Create a Work Order

Create a scoped workorder before asking the AI to edit anything:

```bash
venv/bin/python scripts/new_workorder.py --title "Short task title"
```

This prints a new file path like:

```text
workorders/WO-20260208-002.json
```

Review the generated workorder and make sure:
- scope is accurate
- `allowed_paths` includes only what you need
- `blocked_paths` remains strict
- acceptance criteria are concrete

### Step 2: Build the AI Task Packet

Generate a packet that includes your task and repository rules:

```bash
venv/bin/python scripts/build_ai_packet.py \
  --task "Describe exactly what should change" \
  --workorder WO-20260208-002 \
  --file docs/using-chat-only-workflow.md \
  --output /tmp/tenantguard-ai-packet.md
```

This packet includes:
- `AGENTS.md`
- control-plane docs (`docs/control-plane/`)
- your selected files
- current git status
- strict output contract for the AI

### Step 3: Send the Packet to the AI

Open your AI chat and paste:
1. your instruction prompt
2. the full contents of `/tmp/tenantguard-ai-packet.md`

Require the AI to return:
1. Plan
2. Unified diff patch (single fenced `diff` block)
3. Verification commands

### Step 4: Save AI Output and Extract Patch

Save the AI response to a local file, for example:

```text
/tmp/ai-response.md
```

Extract the patch:

```bash
venv/bin/python scripts/extract_ai_patch.py \
  --response /tmp/ai-response.md \
  --output /tmp/tenantguard-ai.patch
```

### Step 5: Validate and Apply Patch

Run a safety check first:

```bash
venv/bin/python scripts/apply_patch.py --patch /tmp/tenantguard-ai.patch --check
```

If check passes, apply:

```bash
venv/bin/python scripts/apply_patch.py --patch /tmp/tenantguard-ai.patch
```

### Step 6: Run Verification Commands

Run required commands from `AGENTS.md`.

Frontend:

```bash
cd frontend && pnpm install --frozen-lockfile
cd frontend && pnpm lint
cd frontend && pnpm build
cd frontend-next && pnpm install --frozen-lockfile
cd frontend-next && pnpm lint
cd frontend-next && pnpm build
```

Backend:

```bash
venv/bin/python -m pip install -r requirements.txt
venv/bin/python -m compileall src
venv/bin/python -c "import importlib; importlib.import_module('src.main')"
venv/bin/python -c "import importlib; importlib.import_module('src.worker')"
```

### Step 7: Finish the Work Order Correctly

Before opening a PR:

1. Confirm acceptance criteria in the Work Order are met.
2. Update `CHANGELOG.md` with:
   - workorder creation/completion line
   - what changed
3. If control-plane files were changed, also update:
   - `docs/control-plane/99_CHANGELOG/CHANGELOG.md`
4. Commit and open a PR referencing the Work Order ID.

## Common Issues and Fixes

1. AI returned full files instead of diff:
   - Ask it to regenerate with one fenced `diff` block only.
2. Patch touches blocked paths:
   - Refine prompt and Work Order scope, then regenerate.
3. Patch check fails:
   - Rebuild packet with additional file context and retry.
4. Verification fails:
   - Treat as incomplete; fix issues before PR.

## Quick Command Reference

```bash
# 1) create workorder
venv/bin/python scripts/new_workorder.py --title "Short task title"

# 2) build AI packet
venv/bin/python scripts/build_ai_packet.py --task "Describe exactly what should change" --workorder WO-YYYYMMDD-### --output /tmp/tenantguard-ai-packet.md

# 3) extract patch
venv/bin/python scripts/extract_ai_patch.py --response /tmp/ai-response.md --output /tmp/tenantguard-ai.patch

# 4) check/apply patch
venv/bin/python scripts/apply_patch.py --patch /tmp/tenantguard-ai.patch --check
venv/bin/python scripts/apply_patch.py --patch /tmp/tenantguard-ai.patch
```
