---
title: Vercel Preview Deploy Workflow
id: WO-vercel-preview
owner: devops
created: 2026-01-04

summary:
  Add a GitHub Actions workflow that deploys a preview build to Vercel on push and pull requests.

scope:
  - Add `.github/workflows/vercel-preview.yml` to trigger preview deployments on push and PRs.
  - Document required GitHub repository secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

acceptance_criteria:
  - Pushing a branch or opening/updating a PR triggers the workflow.
  - The workflow runs `pnpm install` in `frontend` and executes `vercel` to create a preview deployment.
  - No secrets are committed to the repo; workflow uses GitHub Actions secrets.

notes:
  - Configure the required secrets in the repository Settings → Secrets before enabling this workflow.
  - Vercel may also provide automatic preview deployments via its GitHub integration; this action offers an alternate explicit deploy step.
