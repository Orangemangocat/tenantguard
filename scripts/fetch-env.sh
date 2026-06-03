#!/usr/bin/env bash
# fetch-env.sh — Pull environment files from GCS onto this VM.
#
# Usage:
#   DEPLOY_ENV=prod    bash scripts/fetch-env.sh   # production
#   DEPLOY_ENV=staging bash scripts/fetch-env.sh   # staging
#
# Requires:
#   - gsutil (part of google-cloud-sdk, pre-installed on GCE VMs)
#   - The VM's service account must have Storage Object Viewer on GCS_SECRETS_BUCKET
#   - No manual login needed on GCE — the instance service account is used automatically
#
# GCS layout expected:
#   gs://tenantguard-secrets/
#     prod/
#       backend.env
#       frontend.env
#     staging/
#       backend.env
#       frontend.env

set -euo pipefail

DEPLOY_ENV="${DEPLOY_ENV:-prod}"

# GCS_SECRETS_BUCKET must be set in the environment or passed in.
# It is intentionally NOT read from .env — that file doesn't exist yet (that's why we're here).
# Set it as a GitHub Actions variable (vars.GCS_SECRETS_BUCKET) or export it before calling this script.
GCS_SECRETS_BUCKET="${GCS_SECRETS_BUCKET:?GCS_SECRETS_BUCKET env var is required}"

echo "[fetch-env] Environment : ${DEPLOY_ENV}"
echo "[fetch-env] Secrets bucket: ${GCS_SECRETS_BUCKET}"

gsutil cp "${GCS_SECRETS_BUCKET}/${DEPLOY_ENV}/backend.env"  ./backend/.env
gsutil cp "${GCS_SECRETS_BUCKET}/${DEPLOY_ENV}/frontend.env" ./frontend/.env.local

echo "[fetch-env] Done."

echo "[fetch-env] Copying to docker containers..."

docker compose cp frontend/.env.local frontend:.env.local
docker compose cp backend/.env backend:.env

echo "[fetch-env] Done, restarting containers ..."

docker compose restart

echo "[fetch-env] Finished!"
