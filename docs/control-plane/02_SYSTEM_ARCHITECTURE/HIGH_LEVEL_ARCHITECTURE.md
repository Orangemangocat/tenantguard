# High-Level Architecture

TenantGuard is a pipeline system:

1) Raw Inputs
2) Normalization
3) Case Notebook (single source of truth)
4) Structured Derivatives (summary/FAQ/motions/timeline)
5) Presentation (web views, PDFs, decks)
6) Publication (tenant UI + admin UI)

Core requirement:
- every downstream output must be traceable to notebook + evidence IDs.
