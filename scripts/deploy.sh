#!/usr/bin/env bash
# deploy.sh — Zero-intervention deploy for TenantGuard.
#
# Usage (run from the repo root on the target VM):
#   DEPLOY_ENV=prod    IMAGE_TAG=latest bash scripts/deploy.sh
#   DEPLOY_ENV=staging IMAGE_TAG=latest bash scripts/deploy.sh
#
# What it does:
#   1. Pulls env files for this environment from GCS (no manual login needed on GCE)
#   2. Exports those env vars so docker compose can substitute ${ARTIFACT_REGISTRY} etc.
#   3. Pulls the latest Docker images from Artifact Registry
#   4. Restarts all services with the new images (zero-downtime rolling restart)
#
# First-time setup on a new VM:
#   1. Install docker, docker-compose-plugin, google-cloud-sdk
#   2. Authenticate docker with Artifact Registry once:
#        gcloud auth configure-docker REGION-docker.pkg.dev
#   3. Run this script — everything else is automated from here on.

set -euo pipefail

DEPLOY_ENV="${DEPLOY_ENV:-prod}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

echo "=== TenantGuard deploy [${DEPLOY_ENV}] tag=${IMAGE_TAG} ==="

# Step 1: Fetch env files from GCS
bash scripts/fetch-env.sh

# Step 2: Export vars needed by docker-compose (ARTIFACT_REGISTRY, IMAGE_TAG, etc.)
set -a
# shellcheck source=/dev/null
source ./backend/.env
set +a
export IMAGE_TAG

# Step 3: Pull latest images
echo "[deploy] Pulling images..."
docker compose pull

# Step 4: Restart services
echo "[deploy] Starting services..."
docker compose up -d --remove-orphans

echo "=== Deploy complete ==="
docker compose ps
