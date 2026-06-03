# TenantGuard

A legal-tech platform for tenant protection and eviction defense, focused on Tennessee tenants. Pairs a Django REST API backend with a Next.js frontend, JWT-based auth (with Google/GitHub OAuth), an AI-powered blog generation pipeline, and a legal assistant chat system.

## Repository Structure

```
backend/          Django REST API (Python)
frontend/         Next.js + TypeScript + Tailwind UI
nginx/            Reverse proxy config
docs/             Agent directives, governance, project vision
knowledge-repo/   Knowledge base read by AI blog agents
.github/
  workflows/
    deploy.yml    CI/CD pipeline (build → staging → production)
```

---

## Local Development

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill in your values
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver    # http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in your values
npm run dev                         # http://localhost:3000
```

### Environment variables

**`backend/.env`**
```
SECRET_KEY=
OPENAI_API_KEY=
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
```

**`frontend/.env.local`**
```
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_BACKEND_URL=http://127.0.0.1:8000/api/
NEXT_PUBLIC_API_URL=http://localhost:8000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_ID=
GITHUB_SECRET=
```

---

## CI/CD Pipeline

The pipeline is defined in `.github/workflows/deploy.yml` and uses **GitHub Actions + Docker + Google Artifact Registry**.

### Deployment flow

| Trigger | Target |
|---|---|
| Push to `main` | Staging VM (automatic) |
| Git tag `v*` (e.g. `v1.2.0`) | Production VM (automatic) |

```
Push / Tag
    │
    ▼
GitHub Actions
    ├── Build backend Docker image
    ├── Build frontend Docker image
    ├── Push both to Google Artifact Registry
    └── SSH into target VM
         ├── git pull (latest compose files)
         ├── docker compose pull (new images)
         ├── python manage.py migrate
         └── docker compose up -d
```

### Infrastructure on each VM

```
nginx (ports 80/443)
  ├── /api/*   → Django (port 8000)
  ├── /admin/* → Django (port 8000)
  ├── /media/* → served from volume directly
  └── /*       → Next.js (port 3000)

cloud-sql-proxy  → Cloud SQL (PostgreSQL)
```

---

## GitHub Secrets & Variables Setup

Go to **Settings → Secrets and variables → Actions** in GitHub.

### Secrets (sensitive)

| Secret | Description |
|---|---|
| `GCP_SA_KEY` | GCP service account JSON key (Artifact Registry write + Cloud SQL access) |
| `STAGING_HOST` | Staging VM public IP |
| `STAGING_SSH_USER` | SSH user on staging VM (e.g. `ubuntu`) |
| `STAGING_SSH_KEY` | Private SSH key for staging VM |
| `PROD_HOST` | Production VM public IP |
| `PROD_SSH_USER` | SSH user on production VM |
| `PROD_SSH_KEY` | Private SSH key for production VM |
| `CLOUD_SQL_INSTANCE_CONNECTION_NAME` | e.g. `my-project:us-central1:tenantguard-db` |

### Variables (non-sensitive)

| Variable | Description |
|---|---|
| `ARTIFACT_REGISTRY_URL` | e.g. `us-central1-docker.pkg.dev/my-project/tenantguard` |
| `ARTIFACT_REGISTRY_REGION` | e.g. `us-central1` |
| `NEXT_PUBLIC_API_URL` | Public API base URL (baked into frontend build) |

---

## VM Bootstrap (one-time per server)

Run this on both the staging and production VMs the first time:

```bash
# Install Docker
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER && newgrp docker

# Clone the repo
sudo git clone https://github.com/your-org/tenantguard2 /opt/tenantguard
cd /opt/tenantguard

# Place environment files
cp /path/to/backend.env backend/.env
cp /path/to/frontend.env.local frontend/.env.local

# Place GCP service account credentials (used by cloud-sql-proxy)
cp /path/to/gcp-credentials.json gcp-credentials.json
```

Then start the stack manually the first time:

```bash
cd /opt/tenantguard
export ARTIFACT_REGISTRY=us-central1-docker.pkg.dev/my-project/tenantguard
export IMAGE_TAG=latest
export CLOUD_SQL_INSTANCE_CONNECTION_NAME=my-project:us-central1:tenantguard-db

docker compose pull
docker compose run --rm backend python manage.py migrate --noinput
docker compose up -d
```

After that, all future deploys are handled automatically by the CI/CD pipeline.

---

## SSL Certificates

Nginx expects certificates at:

```
ssl_certs/fullchain.pem
ssl_certs/privkey.pem
```

To obtain/renew with Let's Encrypt (certbot):

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/tenantguard/ssl_certs/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/tenantguard/ssl_certs/
docker compose restart nginx
```

---

## Releasing to Production

```bash
# Tag a release — this triggers the production deploy
git tag v1.0.0
git push origin v1.0.0
```

Monitor the deploy in the **Actions** tab on GitHub.

---

## Key API Routes

```
POST  /api/auth/register/
POST  /api/auth/login/
POST  /api/auth/google/
POST  /api/auth/github/
POST  /api/auth/token/refresh/

GET   /api/blog/posts/           supports ?search=
GET   /api/blog/posts/<slug>/
GET   /api/blog/categories/
POST  /api/blog/posts/<slug>/comments/

GET   /api/chat/messages/        requires auth

GET   /admin/ai-generator/       AI blog generation UI
POST  /admin/blog/ai-generate-api/
```
