WO: Add blog API client for frontend-next

Goal
- Provide a small `src/lib/blogApi.js` helper inside `frontend-next` so both blog routes can call the backend blog APIs without repeating fetch logic and to make the `@/lib/blogApi` alias resolve during build.

Files to change/add
- frontend-next/src/lib/blogApi.js (new)
- workorders/WO-blog-api-client.md (new)

Acceptance criteria
- A plain JS module under `frontend-next/src/lib` exports `getPublishedPosts` and `getPostBySlug` that call the backend API via `fetch`, share common error handling, and respect ISR-friendly caching.
- The alias `@/lib/blogApi` can resolve because the file exists within the `src` tree and the existing `jsconfig.json` already maps `@/*` to `./src/*`.
- The Work Order records the task details against AGENTS.md’s patch-only requirement.
