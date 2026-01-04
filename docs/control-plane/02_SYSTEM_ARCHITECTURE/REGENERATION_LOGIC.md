# Regeneration Logic

## Rule
Any upstream change triggers downstream regeneration.

Upstream changes include:
- new evidence uploaded
- corrected dates
- changed jurisdiction/caption
- updated notebook facts

## Requirements
- Regeneration must increment notebook_version.
- Artifacts must record notebook_version and timestamp.
- Old artifacts remain accessible (version history).

## Determinism
Given the same notebook version and the same generator version:
- outputs should be stable within acceptable variance.
