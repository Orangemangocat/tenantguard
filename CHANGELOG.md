# Changelog

- 2026-01-10: Added workorder `WO-blog-quirks` to fix blog admin image/date fields and ordering issues.
- 2026-01-10: Added blog admin image/date inputs, stored published dates, and ordered public listings by published/created date.
- 2026-01-10: Added featured image upload endpoint and admin UI uploader for blog posts (WO-blog-quirks).
- 2026-01-10: Allowed relative paths in the blog featured image field (WO-blog-quirks).
- 2026-01-10: Removed the /blog admin overlay and added a rich text editor with media uploads for blog posts (WO-blog-quirks).
- 2026-01-10: Wired TinyMCE to read the API key from env configuration (WO-blog-quirks).
- 2026-01-10: Added published date column to the blog management table (WO-blog-quirks).
- 2026-01-10: Stabilized IntakeChat auto-scroll to prevent window scroll jumps (WO-20260110-003).
- 2026-01-10: Added workorder `WO-20260110-003` to investigate IntakeChat scrollbar behavior.
- 2026-01-10: Added workorder `WO-20260110-002` and removed Tennessee references from the front-page hero copy.
- 2026-01-10: Fixed AI blog admin panel to load posts from the admin blog posts endpoint.
- 2026-01-10: Added workorder `WO-20260110-001` for AI blog generation scheduling/visibility investigation.
- 2026-01-10: Fixed blog scheduler cron target path, clarified cadence text, and surfaced job IDs in blog AI admin UI.
- 2026-01-10: Added UI controls for blog cadence in hours and updated schedule/analytics to report hours.
- 2026-01-10: Added a worker launch script and ensured worker entrypoint adds repo root for RQ imports.
