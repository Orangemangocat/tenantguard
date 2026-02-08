# Work Orders

All agent work must map to a Work Order JSON.

A Work Order defines:
- scope
- allowed paths
- blocked paths
- acceptance criteria
- risk and rollback plan (when relevant)

No Work Order = no code changes.

## Chat-Only Workflow Quick Start

1. Install branch guard hooks:
   - `bash scripts/install_branch_guard_hooks.sh`
2. Create a work order:
   - `venv/bin/python scripts/new_workorder.py --title "Short task title"`
3. Build a task packet for your AI chat:
   - `venv/bin/python scripts/build_ai_packet.py --task "Describe requested change" --workorder WO-YYYYMMDD-### --output /tmp/tenantguard-ai-packet.md`
4. Extract and validate the returned patch:
   - `venv/bin/python scripts/extract_ai_patch.py --response /tmp/ai-response.md --output /tmp/tenantguard-ai.patch`
   - `venv/bin/python scripts/apply_patch.py --patch /tmp/tenantguard-ai.patch --check`
5. Apply the patch and run verification commands.

Reference: `docs/conversational-ai-workflow.md`
