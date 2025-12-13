# TenantGuard System Architecture

## Overview

TenantGuard follows a traditional three-tier web application architecture with a React frontend, Flask backend, and SQLite database.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Users                                │
│              (Tenants, Attorneys, Visitors)                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      Nginx Web Server                        │
│                  (www.tenantguard.net)                       │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │   Static Files       │  │   Proxy to Flask     │        │
│  │   /src/static/       │  │   Port 5000          │        │
│  └──────────────────────┘  └──────────────────────┘        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP (internal)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   Flask Application                          │
│                    (Python Backend)                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Routes    │  │    Models    │  │   Business   │      │
│  │              │  │              │  │     Logic    │      │
│  │  /api/cases  │  │    Case      │  │              │      │
│  │  /api/attor  │  │  Attorney    │  │  Validation  │      │
│  │  /api/contact│  │    User      │  │   Matching   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ SQLAlchemy ORM
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    SQLite Database                           │
│              /var/www/tenantguard/database/                  │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │  users   │  │  cases   │  │attorneys │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Technology Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Component Library:** Shadcn/UI
- **State Management:** React Context API (for themes)
- **Routing:** React Router (assumed, to be verified)

### Component Hierarchy

```
App.jsx
├── ThemeProvider (Context)
│   ├── Header
│   │   ├── Logo
│   │   ├── Navigation
│   │   └── ThemeSwitcher
│   ├── Hero Section
│   ├── Features Section
│   ├── How It Works Section
│   ├── CTA Section
│   ├── Footer
│   └── Modals
│       ├── CaseIntakeForm (8 steps)
│       ├── AttorneyIntakeForm (7 steps)
│       └── ContactPage
```

### Build Process

1. Source files in `frontend/src/`
2. Vite builds and bundles to `frontend/dist/`
3. Built files copied to `src/static/` for serving by Flask

### Theme System

The theme system uses CSS custom properties (variables) defined in `theme.css`:

```css
:root {
  --primary: #dc2626;
  --secondary: #1e293b;
  --background: #ffffff;
  --text: #1e293b;
  /* ... more variables ... */
}
```

Themes are defined in `themes.js` and managed by `ThemeContext.jsx`. The `ThemeSwitcher.jsx` component allows users to select a theme, which is persisted in localStorage.

## Backend Architecture

### Technology Stack

- **Framework:** Flask
- **ORM:** SQLAlchemy
- **Database:** SQLite
- **Process Manager:** Systemd

### Application Structure

```
src/
├── main.py (application entry point)
├── models/
│   ├── user.py (User model, shared db instance)
│   ├── case.py (Case model)
│   └── attorney.py (Attorney model)
└── routes/
    ├── user.py (user-related endpoints)
    ├── attorney.py (attorney-related endpoints)
    └── contact.py (contact form endpoint)
```

### API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/cases` | POST | Create a new tenant case |
| `/api/cases/<id>` | GET | Retrieve a specific case |
| `/api/attorneys` | POST | Submit attorney application |
| `/api/attorneys/<id>` | GET | Retrieve attorney application |
| `/api/contact` | POST | Submit contact form |

### Database Models

**User Model:**
- Stores user account information
- Includes email, password hash, role

**Case Model:**
- Stores tenant case information
- Includes case number, tenant details, property info, dispute details
- Status field tracks case lifecycle

**Attorney Model:**
- Stores attorney application information
- Includes name, contact info, bar number, expertise, budget

### Shared Database Instance

All models import the shared `db` instance from `src/models/user.py`:

```python
from src.models.user import db
```

This ensures all models use the same SQLAlchemy instance, preventing initialization errors.

## Database Architecture

### Database Type

SQLite (file-based relational database)

### Location

`/var/www/tenantguard/database/tenantguard.db`

### Permissions

- Owner: `www-data:www-data`
- Permissions: `664` (read/write for owner and group)

### Schema Management

Currently, schema is managed through SQLAlchemy models. No migration system is in place yet.

**Future:** Implement Alembic for database migrations.

## Deployment Architecture

### Server Setup

- **OS:** Linux (Ubuntu/Debian assumed)
- **Web Server:** Nginx
- **Application Server:** Flask (via Systemd)
- **Process Manager:** Systemd

### Nginx Configuration

Nginx serves as a reverse proxy, forwarding requests to the Flask application:

- Static files served directly from `/var/www/tenantguard/src/static/`
- API requests proxied to Flask on `localhost:5000`
- HTTPS enabled with SSL certificates

### Systemd Service

The Flask application runs as a systemd service:

- **Service Name:** `tenantguard`
- **User:** `www-data`
- **Working Directory:** `/var/www/tenantguard`
- **Command:** Runs Flask using the Python virtual environment

### Deployment Process

1. **Git Pull:** Pull latest code from GitHub to `/home/manus/repos/tenantguard`
2. **Build Frontend:** Run `pnpm run build` in `/var/www/tenantguard/frontend`
3. **Copy Static Files:** Copy `frontend/dist/*` to `src/static/`
4. **Sync Backend:** Rsync backend files from repo to `/var/www/tenantguard`
5. **Fix Permissions:** Set correct ownership and permissions for database
6. **Restart Service:** Restart the `tenantguard` systemd service

## Security Architecture

### Current Security Measures

1. **HTTPS:** All traffic encrypted with SSL/TLS
2. **Input Validation:** Form inputs validated on frontend and backend
3. **Database Permissions:** Database files owned by `www-data` with restricted permissions

### Planned Security Measures

1. **User Authentication:** Secure login with password hashing (bcrypt)
2. **Session Management:** Secure session cookies with CSRF protection
3. **API Rate Limiting:** Prevent abuse and DDoS attacks
4. **SQL Injection Prevention:** Parameterized queries via SQLAlchemy
5. **XSS Prevention:** Input sanitization and output encoding

## Scalability Considerations

### Current Limitations

- **SQLite:** Not suitable for high-concurrency or large-scale deployments
- **Single Server:** No load balancing or redundancy
- **No Caching:** Every request hits the database

### Future Scalability Improvements

1. **Migrate to PostgreSQL:** Better concurrency and scalability
2. **Add Redis:** Caching and session storage
3. **Load Balancing:** Multiple application servers behind a load balancer
4. **CDN:** Serve static assets from a CDN
5. **Database Replication:** Read replicas for improved performance
6. **Containerization:** Docker for easier deployment and scaling

## Monitoring and Logging

### Current State

- **Systemd Logs:** Application logs via `journalctl -u tenantguard`
- **Nginx Logs:** Access and error logs in `/var/log/nginx/`

### Future Improvements

1. **Application Logging:** Structured logging with log levels
2. **Error Tracking:** Sentry or similar for error monitoring
3. **Performance Monitoring:** New Relic, Datadog, or similar
4. **Uptime Monitoring:** Pingdom or UptimeRobot
5. **Analytics:** Google Analytics or Plausible for user behavior tracking

## Data Flow

### Tenant Case Submission

1. User fills out CaseIntakeForm in React frontend
2. Form data validated on frontend
3. POST request sent to `/api/cases`
4. Flask validates data and creates Case object
5. SQLAlchemy saves Case to database
6. Response sent back to frontend with case number
7. Frontend displays confirmation

### Attorney Application

1. User fills out AttorneyIntakeForm in React frontend
2. Form data validated on frontend
3. POST request sent to `/api/attorneys`
4. Flask validates data and creates Attorney object
5. SQLAlchemy saves Attorney to database
6. Response sent back to frontend with application ID
7. Frontend displays confirmation

### Contact Form Submission

1. User fills out ContactPage form in React frontend
2. Form data validated on frontend
3. POST request sent to `/api/contact`
4. Flask logs contact information (SMTP to be configured)
5. Response sent back to frontend
6. Frontend displays success message

## Integration Points

### Current Integrations

- **GitHub:** Code repository and version control
- **pnpm:** Package management for frontend dependencies
- **Vite:** Frontend build tool

### Planned Integrations

- **Email Service:** SendGrid, Mailgun, or AWS SES for transactional emails
- **Payment Processor:** Stripe or PayPal for attorney payments
- **Document Storage:** AWS S3 or similar for uploaded documents
- **SMS Service:** Twilio for text notifications
- **Analytics:** Google Analytics or Plausible

## Development Workflow

1. **Local Development:** Make changes in sandbox environment
2. **Testing:** Build frontend and test locally
3. **Version Control:** Commit changes to Git
4. **Push to GitHub:** Push changes to remote repository
5. **Deployment:** Run deployment script on server
6. **Verification:** Test on live site

## Technology Decisions

### Why React?

- Modern, popular framework with strong ecosystem
- Component-based architecture for reusability
- Good performance with virtual DOM
- Excellent developer experience

### Why Flask?

- Lightweight and flexible Python framework
- Easy to learn and use
- Good for rapid prototyping
- Strong ecosystem of extensions

### Why SQLite?

- Simple setup, no separate database server needed
- Sufficient for current scale and testing
- Easy to back up (single file)
- Plan to migrate to PostgreSQL for production

### Why Tailwind CSS?

- Utility-first approach for rapid development
- Consistent design system
- Small bundle size with purging
- Excellent documentation

### Why Vite?

- Fast build times
- Modern development experience
- Hot module replacement
- Optimized production builds
