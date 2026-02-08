# Conversational AI Patch Workflow (No IDE)

This workflow lets you use any chat AI that can return unified diffs, while keeping TenantGuard's patch-only contract.

## 0) Load the Repo Contract First

Before requesting any code change, provide the AI with:
- `AGENTS.md`
- `docs/control-plane/` (or at least `docs/control-plane/00_READ_FIRST/`)

The AI must explicitly confirm control-plane understanding before acting.

## 0.5) Install Dev-Only Branch Guard Hooks

Install local hooks that block commits/pushes unless current branch is `dev`:

```bash
bash scripts/install_branch_guard_hooks.sh
```

## 1) Create a Work Order

Create a scoped JSON work order before asking an AI to modify code:

```bash
venv/bin/python scripts/new_workorder.py --title "Short task title"
```

This prints a new file path such as `workorders/WO-20260207-006.json`.

## 2) Build an AI Task Packet

Generate a single packet with the task request, contract files, and target files:

```bash
venv/bin/python scripts/build_ai_packet.py \
  --task "Describe the exact code change you want" \
  --workorder WO-20260207-006 \
  --file frontend/src/App.jsx \
  --file src/routes/blog_admin.py \
  --output /tmp/tenantguard-ai-packet.md
```

Then paste `/tmp/tenantguard-ai-packet.md` into your chat AI session.

Notes:
- The packet includes `AGENTS.md`, `README.md`, and `docs/control-plane/`.
- Use `--read-first-only` if you need a smaller packet for tighter context windows.
- Blocked paths (`.env`, secrets, keys) are rejected by the packet builder.

## 3) Ask for Strict Output

In your AI chat request, require:
- Plan (5-15 bullet lines)
- One fenced `diff` patch block only
- Verification commands

## 4) Extract the Patch from AI Output

Save the AI response to a file, then extract the patch:

```bash
venv/bin/python scripts/extract_ai_patch.py \
  --response /tmp/ai-response.md \
  --output /tmp/tenantguard-ai.patch
```

## 5) Validate and Apply the Patch

Use the existing repo guard script:

```bash
venv/bin/python scripts/apply_patch.py --patch /tmp/tenantguard-ai.patch --check
venv/bin/python scripts/apply_patch.py --patch /tmp/tenantguard-ai.patch
```

## 6) Run Verification Commands

Run the standard commands from `AGENTS.md`:

```bash
cd frontend && pnpm install --frozen-lockfile
cd frontend && pnpm lint
cd frontend && pnpm build
cd frontend-next && pnpm install --frozen-lockfile
cd frontend-next && pnpm lint
cd frontend-next && pnpm build
venv/bin/python -m pip install -r requirements.txt
venv/bin/python -m compileall src
venv/bin/python -c "import importlib; importlib.import_module('src.main')"
venv/bin/python -c "import importlib; importlib.import_module('src.worker')"
```

## 7) Commit and Open PR

Keep commits scoped to the Work Order and include the Work Order ID in commit/PR notes.

## 8) Keep Documentation in Sync

If behavior or process changed, update:
- `CHANGELOG.md`
- `docs/control-plane/99_CHANGELOG/CHANGELOG.md` when control-plane files changed
