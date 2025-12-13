# Project State Reconstructed

This document provides a complete reconstruction of the current state of the TenantGuard project as of December 13, 2025.

## Current Status

**Project Phase:** Active Development and Testing

**Deployment Status:** Deployed to testing server at https://www.tenantguard.net

**Repository:** https://github.com/Orangemangocat/tenantguard

**Last Major Update:** December 13, 2025 - Theme system implementation and deployment script fixes

---

## Technical Infrastructure

### Server Environment

| Component | Details |
| :--- | :--- |
| **Server IP** | 35.237.102.136 |
| **Domain** | www.tenantguard.net |
| **OS** | Linux (assumed Ubuntu/Debian) |
| **Web Server** | Nginx (proxying to Flask on port 5000) |
| **Application Server** | Flask (Python) running as systemd service |
| **Database** | SQLite at `/var/www/tenantguard/database/tenantguard.db` |
| **Deployment Directory** | `/var/www/tenantguard` |
| **Repository Directory** | `/home/manus/repos/tenantguard` |
| **User Account** | `manus` (with sudo privileges) |
| **Service User** | `www-data` (runs the Flask app) |

---

### Technology Stack

**Frontend:**
- React 18
- Vite (build tool)
- Tailwind CSS (styling)
- Shadcn/UI (component library)
- React Context API (theme management)

**Backend:**
- Python 3.x
- Flask (web framework)
- SQLAlchemy (ORM)
- SQLite (database)

**Deployment:**
- Git (version control)
- GitHub (repository hosting)
- Custom bash deployment script
- Systemd (service management)
- Nginx (web server)

---

## Codebase Structure

```
/home/ubuntu/tenantguard/
├── frontend/
│   ├── src/
│   │   ├── App.jsx (main application component)
│   │   ├── themes.js (theme configurations)
│   │   ├── theme.css (CSS variables for theming)
│   │   ├── contexts/
│   │   │   └── ThemeContext.jsx (theme state management)
│   │   ├── components/
│   │   │   ├── CaseIntakeForm.jsx (tenant case intake)
│   │   │   ├── AttorneyIntakeForm.jsx (attorney application)
│   │   │   ├── ContactPage.jsx (contact form)
│   │   │   └── ThemeSwitcher.jsx (theme selection UI)
│   │   └── assets/ (images, logos)
│   ├── dist/ (build output, not in version control)
│   ├── package.json (dependencies)
│   └── vite.config.js (build configuration)
├── src/
│   ├── main.py (Flask application entry point)
│   ├── models/
│   │   ├── user.py (User model and shared db instance)
│   │   ├── case.py (Case model)
│   │   └── attorney.py (Attorney model)
│   ├── routes/
│   │   ├── user.py (user-related routes)
│   │   ├── attorney.py (attorney-related routes)
│   │   └── contact.py (contact form route)
│   └── static/ (served static files from frontend build)
├── database/
│   └── tenantguard.db (SQLite database file)
├── .gitignore (excludes dist/, venv/, database/)
└── README.md (project documentation)
```

---

## Database Schema

### Table: users

| Column | Type | Description |
| :--- | :--- | :--- |
| id | Integer (PK) | Unique user ID |
| email | String | User email address |
| password_hash | String | Hashed password |
| role | String | User role (tenant, attorney, admin) |
| created_at | DateTime | Account creation timestamp |

### Table: cases

| Column | Type | Description |
| :--- | :--- | :--- |
| id | Integer (PK) | Unique case ID |
| case_number | String (Unique) | Case number (TD2025XXXXXX) |
| tenant_name | String | Tenant's full name |
| tenant_email | String | Tenant's email |
| tenant_phone | String | Tenant's phone number |
| property_address | String | Address of the rental property |
| landlord_name | String | Landlord's name |
| dispute_type | String | Type of dispute (eviction, deposit, etc.) |
| description | Text | Detailed description of the case |
| status | String | Case status (intake_submitted, matched, etc.) |
| created_at | DateTime | Case creation timestamp |
| updated_at | DateTime | Last update timestamp |

### Table: attorneys

| Column | Type | Description |
| :--- | :--- | :--- |
| id | Integer (PK) | Unique attorney ID |
| application_id | String (Unique) | Application ID (ATT2025XXXXXX) |
| name | String | Attorney's full name |
| email | String | Attorney's email |
| phone | String | Attorney's phone number |
| bar_number | String | Bar association number |
| expertise | String | Areas of legal expertise |
| budget | String | Lead generation budget range |
| status | String | Application status (pending, approved, etc.) |
| created_at | DateTime | Application timestamp |

---

## Features Implemented

### Core Features

1. **Tenant Case Intake**
   - 8-step guided form
   - Document upload capability
   - Unique case number generation
   - Data stored in SQLite database

2. **Attorney Application**
   - 7-step professional intake form
   - Budget and preference configuration
   - Unique application ID generation
   - Data stored in SQLite database

3. **Contact Form**
   - Professional contact modal
   - Fields: Name, Email, Phone, Subject, Message
   - Backend API endpoint (currently logs to console)
   - Email functionality ready for SMTP configuration

4. **Theme System**
   - 4 color schemes: Light, Dark, Blue Professional, Green Legal
   - Theme switcher in navigation bar
   - Persistent theme selection (localStorage)
   - Smooth transitions between themes
   - CSS variables for dynamic theming

5. **Responsive Design**
   - Mobile-friendly layout
   - Tailwind CSS for responsive styling
   - Works on all modern devices

---

## Features Not Yet Implemented

1. **User Authentication**
   - Login/logout functionality
   - Session management
   - Password reset

2. **Attorney Matching Algorithm**
   - Automated case assignment
   - Matching based on expertise, availability, budget

3. **Case Management Dashboard**
   - Tenant workspace (view cases, documents, messages)
   - Attorney workspace (manage cases, tasks, KPIs)

4. **Communication System**
   - In-platform messaging between tenants and attorneys
   - Email notifications

5. **Payment System**
   - Attorney compensation
   - Subscription or per-case billing

6. **Analytics and Reporting**
   - Key metrics tracking (time to match, resolution rate)
   - Performance dashboards

---

## Known Issues and Limitations

### Current Limitations

1. **Email Functionality:** Contact form logs to console instead of sending emails (SMTP not configured)
2. **No User Authentication:** Users cannot create accounts or log in
3. **No Case Matching:** Cases are not automatically assigned to attorneys
4. **SQLite Scalability:** May not scale for high-traffic production use
5. **No Staging Environment:** Changes are deployed directly to the testing server

### Recently Fixed Issues

1. ✅ Navigation links now use onClick handlers instead of broken href links
2. ✅ Button spacing fixed (Tenants and Attorneys buttons properly grouped)
3. ✅ "Join as Attorney" button visibility fixed
4. ✅ Database initialization error in Case model resolved
5. ✅ Database permissions fixed (www-data ownership)
6. ✅ Deployment script properly excludes venv/ and dist/ from version control
7. ✅ Frontend build process integrated into deployment workflow

---

## Deployment Process

### Current Deployment Workflow

1. **Develop Locally:** Make changes in the sandbox environment
2. **Test:** Build frontend and test functionality
3. **Commit:** Commit changes to Git with descriptive message
4. **Push:** Push changes to GitHub
5. **Deploy:** Run `./deploy_fixed.sh` on the server
6. **Verify:** Check service status and test live site

### Deployment Script Features

- Pulls latest code from GitHub
- Builds frontend with pnpm
- Copies files to production directory
- Excludes venv/, dist/, and database/ from overwriting
- Fixes database permissions
- Restarts systemd service
- Creates timestamped backups
- Includes error handling

---

## Configuration Files

### Environment Variables (on server)

- Database path
- Secret keys
- SMTP settings (to be configured)

### Nginx Configuration

- Location: `/etc/nginx/sites-available/tenantguard`
- Proxies requests to Flask on port 5000
- Serves static files from `/var/www/tenantguard/src/static`
- HTTPS configured

### Systemd Service

- Service name: `tenantguard`
- Location: `/etc/systemd/system/tenantguard.service`
- Runs Flask app with Python virtual environment
- User: `www-data`

---

## Git Repository State

### Recent Commits

1. `9a1253d6` - Fix tenant intake form database error
2. `a080949d` - Fix Join as Attorney button visibility
3. `d9481968` - Remove dist folder from git, add to gitignore
4. `5a5cdf9b` - Fix navigation, button spacing, add contact page
5. (Earlier) - Add theme system with 4 color schemes

### Branches

- `main` (default branch, deployed to testing server)

### .gitignore Contents

```
frontend/dist/
venv/
database/
node_modules/
__pycache__/
*.pyc
.env
```

---

## Access and Credentials

### Server Access

- **SSH:** `ssh manus@35.237.102.136`
- **Authentication:** SSH key (passwordless)
- **Sudo:** Full sudo access with NOPASSWD

### GitHub Repository

- **Repository:** `Orangemangocat/tenantguard`
- **Access:** Configured via GitHub CLI (`gh`)

---

## Next Steps and Priorities

### Immediate Priorities

1. Configure SMTP for email functionality
2. Implement user authentication system
3. Create tenant and attorney dashboards
4. Implement attorney matching algorithm

### Medium-Term Priorities

1. Add in-platform messaging
2. Implement payment system
3. Add analytics and reporting
4. Migrate to PostgreSQL or MySQL

### Long-Term Priorities

1. Expand to additional jurisdictions
2. Build mobile apps
3. Add advanced features (document automation, AI-powered matching)
4. Scale infrastructure for production use

---

## Documentation Artifacts

### Created During This Session

1. `tenantguard_analysis.md` - Platform analysis
2. `DEPLOYMENT_GUIDE.md` - Deployment documentation
3. `DEPLOYMENT_QUICK_REFERENCE.md` - Quick reference
4. `deploy_tenantguard_fixed.sh` - Deployment script
5. `THEME_SYSTEM_SUCCESS_REPORT.md` - Theme implementation report
6. `TenantGuard_Workspace_Design_Report.md` - Workspace design research
7. `tenant_dashboard_mockup.png` - Tenant dashboard mockup
8. `attorney_dashboard_mockup.png` - Attorney dashboard mockup
9. Various verification and testing reports

---

## Key Learnings and Insights

1. **Deployment Challenges:** The deployment process required multiple iterations to handle frontend builds, file permissions, and virtual environment preservation correctly.

2. **Database Architecture:** Sharing a single SQLAlchemy instance across models is critical to avoid initialization errors.

3. **User Experience:** Small details like button spacing, theme options, and clear navigation significantly impact user experience.

4. **Documentation Value:** Comprehensive documentation is essential for project continuity and knowledge transfer.

5. **Iterative Development:** Building quickly, testing, and iterating based on feedback is more effective than trying to build everything perfectly the first time.

---

## Success Metrics

### Platform Goals (from documentation)

- **60% cost reduction** for tenants
- **70% time savings** for attorneys (case setup time reduced from 4.5 hours to under 1 hour)
- **90% case preparation completeness**

### Current Achievement

- Platform is functional and deployed
- Core intake forms are working
- Theme system enhances user experience
- Deployment process is automated and reliable

---

## Project Health

**Overall Status:** Healthy and progressing

**Strengths:**
- Solid technical foundation
- Clean, maintainable codebase
- Automated deployment process
- User-centric design

**Areas for Improvement:**
- Need to implement authentication
- Need to add dashboard functionality
- Need to configure email system
- Need to plan for scalability

**Risk Level:** Low to Medium
- Technical risks are manageable
- Main risks are around user adoption and legal compliance
