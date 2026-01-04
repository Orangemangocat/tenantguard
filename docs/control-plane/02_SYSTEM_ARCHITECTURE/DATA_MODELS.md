# Data Models (Conceptual)

## Case
- case_id
- parties (tenant/landlord)
- jurisdiction
- deadlines

## Evidence
- evidence_id
- source (tenant/landlord/court/attorney)
- document_type
- received_date
- file metadata (hash, filename, mime)

## Case Notebook (authoritative)
- facts[]
- timeline[]
- key_terms[]
- disputed_points[]
- evidence_map[]
- assumptions[]

## Artifacts (generated)
- artifact_id
- type (exec_summary, faq, motion_draft, timeline_pdf, deck)
- notebook_version
- created_at
- content + refs
