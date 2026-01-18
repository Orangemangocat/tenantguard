# TenantGuard - Complete Source Code

## Overview

TenantGuard is a full-stack landlord-tenant legal support platform focused on Tennessee (Davidson County by default). It provides tenant and attorney intake, admin tooling, content management, and background processing. Authoritative AI behavior constraints live in `docs/control-plane/`.

## Architecture

This is a **full-stack web application** consisting of:

- **Frontend**: Vite + React application with modern UI components
- **Backend**: Flask API server with SQLAlchemy models
- **Database**: PostgreSQL configuration with SQLite fallback for local/dev
- **Background**: RQ workers and scheduled jobs for blog/AI tasks
- **Deployment**: Static file serving via Flask + optional Nginx reverse proxy

## Features

### For Tenants
- **Guided Intake**: Multi-step intake form and intake chat flow
- **Evidence Capture**: Intake fields capture evidence and notice details
- **Status Updates**: Case status tracking via API
- **Mobile Responsive**: Works on all devices

### For Attorneys
- **Attorney Intake**: Multi-step intake form and intake chat flow
- **Profile Details**: Credentials, experience, service areas
- **Case Matching**: Backend matching endpoint

### Admin and Content
- **Admin Dashboards**: Intake review and admin panels
- **Blog Management**: Admin blog editor, approvals, and publishing
- **Groups**: Team-based group and membership management

## Directory Structure

```
tenantguard/
├── src/                          # Flask backend
│   ├── main.py                   # Flask application
│   ├── worker.py                 # RQ worker entrypoint
│   ├── config/                   # Database configuration
│   ├── models/                   # SQLAlchemy models
│   ├── routes/                   # API endpoints
│   ├── services/                 # AI + storage helpers
│   ├── tasks/                    # Background task definitions
│   ├── scheduler/                # Scheduled job runners
│   ├── templates/                # Server-rendered templates (blog)
│   └── static/                   # Built frontend files (if deployed)
├── frontend/                     # Vite + React frontend source
├── frontend-next/                # Static blog generation frontend
├── docs/                         # Documentation
├── workorders/                   # Work orders and templates
├── scripts/                      # Utility scripts
├── alembic/                      # Database migrations
├── requirements.txt              # Python dependencies
├── README.md                     # This file
└── DEPLOYMENT.md                 # Deployment instructions
```

## Technology Stack

### Frontend
- **React 18**: Modern React with hooks
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/UI**: High-quality UI components
- **Lucide Icons**: Beautiful icon library
- **Vite**: Fast build tool and development server

### Backend
- **Flask**: Lightweight Python web framework
- **SQLAlchemy**: ORM and database layer
- **PostgreSQL**: Primary database configuration
- **SQLite**: Fallback for local/dev environments
- **Flask-CORS**: Cross-origin resource sharing
- **Python 3.11**: Modern Python runtime

### Infrastructure
- **Static File Serving**: Integrated frontend/backend
- **RESTful APIs**: Clean API design
- **Database Migrations**: Alembic migrations
- **Production Ready**: Optimized for deployment

## API Endpoints

### Case Management
- `POST /api/cases` - Create new case
- `GET /api/cases` - List all cases
- `GET /api/cases/{case_number}` - Get specific case
- `PUT /api/cases/{case_number}` - Update case
- `PUT /api/cases/{case_number}/status` - Update case status
- `GET /api/cases/search` - Search cases
- `GET /api/cases/stats` - Case statistics
- `GET /api/cases/{case_number}/analyses` - Get case analyses
- `POST /api/cases/{case_number}/intake-conversations` - Log intake chat
- `POST /api/cases/{case_number}/process` - Trigger case processing

### Attorney Management
- `POST /api/attorneys` - Create attorney application
- `GET /api/attorneys` - List all attorneys
- `GET /api/attorneys/{application_id}` - Get specific attorney
- `PUT /api/attorneys/{application_id}/status` - Update status
- `GET /api/attorneys/search` - Search attorneys
- `GET /api/attorneys/stats` - Attorney statistics
- `GET /api/attorneys/email/{email}` - Get attorney by email
- `POST /api/attorneys/match` - Match attorneys to cases

### Group Management
- `GET /api/groups` - List groups
- `POST /api/groups` - Create group
- `GET /api/groups/{group_id}` - Group details
- `PUT /api/groups/{group_id}` - Update group
- `DELETE /api/groups/{group_id}` - Delete group

See `src/routes/` for the full API surface.

## Database Schema

### Cases Table
- Tenant contact and property details
- Legal issue and notice details
- Case status tracking

### Attorneys Table
- Professional credentials and experience
- Practice areas and expertise levels
- Case preferences and capacity
- Budget and pricing structure
- Lead generation preferences
- Service coverage areas

### Additional Models
- Auth users, groups, and group memberships
- Blog content and topics
- Case analyses and AI artifacts

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- pnpm or npm

### Backend Setup
```bash
cd /path/to/tenantguard
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python src/main.py
```

### Frontend Development
```bash
cd frontend
pnpm install
pnpm run dev
```

### Production Build
```bash
cd frontend
pnpm run build
# Copy build output into Flask static folder if serving via Flask
rsync -a --delete dist/ ../src/static/
```

## Deployment

See `DEPLOYMENT.md` for detailed deployment instructions including:
- Server requirements
- Nginx configuration
- SSL certificate setup
- Environment variables
- Database initialization

## Key Features Implementation

### Multi-Step Forms
Both tenant and attorney intake forms use a sophisticated multi-step wizard with:
- Progress tracking
- Data validation
- State persistence
- Conditional logic
- Professional UI/UX

### Case-Attorney Matching
Intelligent matching algorithm considers:
- Geographic service areas
- Practice area expertise
- Case type preferences
- Attorney availability
- Experience levels

### Data Management
Comprehensive data handling with:
- Input validation and sanitization
- Error handling and logging
- Search and filtering capabilities
- Statistics and analytics
- Audit trails

## Security Features
- Input validation and sanitization
- CORS configuration
- SQL injection prevention
- Error handling without data exposure
- Secure file upload handling

## Performance Optimizations
- Static file serving
- Database indexing
- Efficient queries
- Frontend code splitting
- Image optimization

## Browser Support
Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
## CI Secrets

We use a dedicated CI secret name for repository CI tasks (notably running database migrations during preview/deploy workflows).

- `CI_DB_URL`: Database connection URL used by CI to run Alembic migrations. Add this as a GitHub Actions secret named `CI_DB_URL` in the repository settings when you want CI to run `alembic upgrade head` during preview/deploy. Using a dedicated secret avoids exposing production credentials to CI workflows.

Recommended additional secrets used by CI/deploy workflows:

- `VERCEL_TOKEN`: Token used by the Vercel CLI for preview deployments.
- `REDIS_URL`: Redis connection URL for workers and queue monitoring.
- `LLM_API_KEY` (provider-specific name): API key for any LLM provider used by background analysis jobs (store under a provider-specific secret name if preferred).

Note: After adding `CI_DB_URL` to repository secrets, update `.github/workflows/vercel-preview.yml` (if needed) to reference `CI_DB_URL` for migration steps instead of any other DB secret name. Be sure secrets are scoped appropriately (deployment vs preview) according to your environment strategy.


## License
Proprietary - TenantGuard Platform

## Support
For technical support or questions about the platform, contact the development team.
---

**TenantGuard** - Transforming tenant legal representation in Tennessee.
