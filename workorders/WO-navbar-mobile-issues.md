# WO: Fix Mobile Navbar and User Menu Display

Summary
---
Update the frontend navbar so that on mobile the hamburger menu properly reveals the same navigation links as desktop, and when a user is logged in the dropdown shows a user icon and first name (not the full email) to avoid header crowding.

Acceptance Criteria
---
- On mobile widths, the hamburger button toggles a menu listing the same primary navigation links as the desktop header.
- Logged-in user display shows a user icon plus the user's first name only (no full email address) in the dropdown trigger area.
- Header layout avoids overlap between the user menu and hamburger button at mobile breakpoints.

Files in Scope
---
- frontend/** (navbar/header components and related styles only)

Out of Scope
---
- Backend changes
- Auth provider changes
- New dependencies or design overhauls

Verification
---
- `cd frontend && pnpm lint`
- `cd frontend && pnpm build`
