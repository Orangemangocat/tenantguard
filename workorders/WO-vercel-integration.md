---
title: Vercel GitHub Integration Setup
id: WO-vercel-integration
owner: devops
created: 2026-01-04

summary:
  Guide for connecting the TenantGuard repository to Vercel for automatic preview and production deployments.

scope:
  - Document the exact steps to create a Vercel Project linked to this GitHub repository.
  - Provide required project settings and environment variables.
  - Add a minimal `vercel.json` to provide Vercel with build target information.

files to be added/changed:
  - vercel.json
  - workorders/WO-vercel-integration.md (this file)

acceptance_criteria:
  - Vercel is connected to the GitHub repository and creates preview deployments for branches/PRs.
  - The project build root is set to the `frontend` directory.
  - Required environment variables are configured in Vercel (no secrets committed to repo).

required repository secrets / env vars (configure in Vercel dashboard, do NOT commit):
  - Any runtime envs your frontend needs (example: VITE_API_BASE_URL)
  - For serverless functions or backend integration: API keys (as needed)

recommended Vercel project settings:
  - Root directory: `frontend`
  - Install Command: `pnpm install --frozen-lockfile` (Vercel will auto-detect pnpm if lockfile exists)
  - Build Command: `pnpm build`
  - Output Directory: `dist`
  - Framework Preset: `Other` (or `Vite` if available)

notes:
  - If you want the GitHub Action previously added to continue providing explicit preview deployments, you can keep it. Vercel's native GitHub integration usually provides previews automatically.
  - After connecting the repo in Vercel, set environment variables under Project Settings → Environment Variables (e.g., `VITE_API_BASE_URL`).

steps to connect:
  1. Sign in to https://vercel.com and create/select your team.
  2. Click "New Project" → Import Git Repository → choose this repository.
  3. When prompted for settings, set the root directory to `frontend` (or adjust if you prefer root).
  4. Set Build Command to `pnpm build` and Output Directory to `dist`.
  5. Add required Environment Variables in the Vercel project settings (do NOT commit secrets).
  6. Enable automatic GitHub Preview Deployments (default) or use the GitHub Actions approach in `.github/workflows/vercel-preview.yml`.

verification:
  - Push a branch or open a PR — Vercel should create a preview deployment and provide a preview URL in the PR.
  - Confirm frontend loads and API calls use the correct `VITE_API_BASE_URL` environment variable.
