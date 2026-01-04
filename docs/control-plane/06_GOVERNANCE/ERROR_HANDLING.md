# Error Handling

## When inputs are missing
- Generate `open_questions[]`
- Do not guess

## When conflicts exist
- Generate `contradictions[]`
- Prefer evidence-dated facts over narrative

## When tool output fails
- Return a structured error:
  - `error_type`
  - `what_failed`
  - `required_next_action`
