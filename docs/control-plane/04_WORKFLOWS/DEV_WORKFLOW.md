# Development Workflow

## Branching
- main: stable
- dev: integration
- feature/*: isolated work

## Required execution model
- Work-order first: create/update a Work Order before code changes.
- Patch-only: all agent edits must be represented as unified diffs.
- Chat-only compatible flow:
  1. Create Work Order JSON
  2. Build AI task packet with repo contracts
  3. Receive unified diff
  4. Validate/apply patch
  5. Run verification commands
  6. Update changelog(s) before merge
- Supporting scripts (planned — not yet implemented):
  - `scripts/new_workorder.py`
  - `scripts/build_ai_packet.py`
  - `scripts/extract_ai_patch.py`
  - `scripts/apply_patch.py`

## Definition of done
- directive updates added to this Drive directory AND committed to repo
- schema changes versioned
- migrations documented
- UI references evidence IDs for claims
- root `CHANGELOG.md` updated for completed work order
- control-plane changelog updated when directive/workflow/schema files change

## No undocumented changes
If it changes agent behavior, it must be written into directives.
