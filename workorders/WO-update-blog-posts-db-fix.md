# WO: Fix update_blog_posts.py for Current Database

Summary
---
Update `scripts/update_blog_posts.py` to work with the current database schema and ensure it repairs blog articles missing images without breaking existing records.

Acceptance Criteria
---
- Script connects to the current database configuration and runs without schema errors.
- Articles missing images are updated with appropriate image references.
- No changes are made to articles that already have valid image data.
- Script provides clear console output for actions taken (updated/skipped).

Files in Scope
---
- scripts/update_blog_posts.py

Out of Scope
---
- Database schema migrations
- Frontend rendering changes
- New dependencies

Verification
---
- `python scripts/update_blog_posts.py --dry-run` (if supported)
- `python scripts/update_blog_posts.py`
