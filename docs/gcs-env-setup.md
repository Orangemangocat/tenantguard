## GCP setup you need to do once:

1. Create two buckets (if they don't exist):
  - tenantguard-media — public-readable, for uploaded images
  - tenantguard-secrets — private, for env files
2. Upload your env files:
```
gsutil cp backend/.env gs://tenantguard-secrets/prod/backend.env
gsutil cp frontend/.env.local gs://tenantguard-secrets/prod/frontend.env
```
# repeat with /staging/ path for staging
3. Grant the VM service account permissions:
  - Storage Object Viewer on tenantguard-secrets (to fetch env files)
  - Storage Object User on tenantguard-media (to upload media)
4. Add to your prod/staging env files (then re-upload to GCS):
```
GCS_MEDIA_BUCKET=tenantguard-media
GCS_SECRETS_BUCKET=gs://tenantguard-secrets
ARTIFACT_REGISTRY=us-central1-docker.pkg.dev/your-project/tenantguard
```
5. First-time auth on each VM (one-time only):
gcloud auth configure-docker REGION-docker.pkg.dev
---
After that, every deploy is just:
```
DEPLOY_ENV=prod IMAGE_TAG=latest bash scripts/deploy.sh
```
