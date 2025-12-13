# Hidden Dependencies

This document externalizes the hidden dependencies in my reasoning—things that I rely on but that are not explicitly stated in the code or documentation.

## Infrastructure Dependencies

### Dependency: SSH Key Authentication

**What:** SSH key authentication is configured between the sandbox and the testing server.

**Why It Matters:** All deployment commands assume passwordless SSH access.

**Risk:** If the SSH key is lost or the server is rebuilt, deployment will fail.

**Mitigation:** The SSH key setup process is documented in the deployment guide.

---

### Dependency: Nginx Configuration

**What:** Nginx is configured to proxy requests to the Flask backend on port 5000.

**Why It Matters:** The Flask app doesn't serve static files directly; Nginx handles that.

**Risk:** If the Nginx configuration is changed or corrupted, the site will break.

**Mitigation:** The Nginx configuration is stored on the server at `/etc/nginx/sites-available/tenantguard`.

---

### Dependency: Systemd Service

**What:** The Flask backend runs as a systemd service called `tenantguard`.

**Why It Matters:** The deployment script assumes it can restart the service using `systemctl`.

**Risk:** If the service is disabled or the service file is deleted, deployment will fail.

**Mitigation:** The service file is stored on the server at `/etc/systemd/system/tenantguard.service`.

---

### Dependency: Python Virtual Environment

**What:** A Python virtual environment exists at `/var/www/tenantguard/venv` with all required dependencies installed.

**Why It Matters:** The Flask app runs using this virtual environment.

**Risk:** If the virtual environment is deleted or corrupted, the app will fail to start.

**Mitigation:** The deployment script now excludes `venv/` from being overwritten.

---

### Dependency: Node.js and pnpm

**What:** Node.js and pnpm are installed on the server.

**Why It Matters:** The deployment script uses pnpm to build the frontend.

**Risk:** If Node.js or pnpm is uninstalled or updated to an incompatible version, builds will fail.

**Mitigation:** Document the required versions and consider using a version manager like `nvm`.

---

## Code Dependencies

### Dependency: Shared Database Instance

**What:** The `db` instance is created in `src/models/user.py` and imported by other models.

**Why It Matters:** All models must use the same database instance to avoid initialization errors.

**Risk:** If a new model is created and doesn't import the shared `db` instance, it will cause errors.

**Mitigation:** Document this pattern and ensure all new models follow it.

---

### Dependency: React Router

**What:** The frontend uses React Router for navigation (assumed, based on the structure).

**Why It Matters:** Navigation between pages relies on React Router being properly configured.

**Risk:** If React Router is not installed or configured, navigation will break.

**Mitigation:** Verify that React Router is in `package.json` and properly configured in `App.jsx`.

---

### Dependency: Tailwind CSS

**What:** The frontend uses Tailwind CSS for styling.

**Why It Matters:** All component styling relies on Tailwind classes being available.

**Risk:** If Tailwind is not properly configured or built, styles will not apply.

**Mitigation:** Ensure Tailwind is configured in `tailwind.config.js` and included in the build process.

---

## Data Dependencies

### Dependency: Database File Location

**What:** The SQLite database file is located at `/var/www/tenantguard/database/tenantguard.db`.

**Why It Matters:** The Flask app expects to find the database at this location.

**Risk:** If the database file is moved or deleted, the app will fail to start or lose all data.

**Mitigation:** Regular backups and documentation of the database location.

---

### Dependency: Database Schema

**What:** The database schema is defined by the SQLAlchemy models in `src/models/`.

**Why It Matters:** Changes to the models require database migrations.

**Risk:** If the models are changed without updating the database, the app will crash.

**Mitigation:** Implement a migration system (e.g., Alembic) for future schema changes.

---

## External Service Dependencies

### Dependency: GitHub Availability

**What:** The deployment script pulls code from GitHub.

**Why It Matters:** If GitHub is down or the repository is inaccessible, deployment will fail.

**Risk:** Deployment cannot proceed without access to GitHub.

**Mitigation:** Have a backup plan, such as deploying from a local copy of the repository.

---

### Dependency: DNS Resolution

**What:** The domain `www.tenantguard.net` resolves to `35.237.102.136`.

**Why It Matters:** Users access the site via the domain name.

**Risk:** If DNS fails or the domain expires, the site will be inaccessible.

**Mitigation:** Monitor DNS settings and domain expiration.

---

## Browser Dependencies

### Dependency: Modern Browser Features

**What:** The frontend uses modern JavaScript features (ES6+) and CSS variables.

**Why It Matters:** The site may not work correctly in very old browsers.

**Risk:** Users on old browsers may have a degraded experience.

**Mitigation:** Consider adding a browser compatibility notice or polyfills.

---

### Dependency: JavaScript Enabled

**What:** The frontend is a React app and requires JavaScript to function.

**Why It Matters:** Users with JavaScript disabled will see a blank page.

**Risk:** Accessibility issue for users who disable JavaScript.

**Mitigation:** Consider adding a `<noscript>` message explaining that JavaScript is required.

---

## Implicit Knowledge Dependencies

### Dependency: Understanding of Flask Blueprints

**What:** The backend uses Flask blueprints to organize routes.

**Why It Matters:** New routes must be added to the appropriate blueprint and registered in `main.py`.

**Risk:** If someone unfamiliar with Flask blueprints tries to add a route, they may do it incorrectly.

**Mitigation:** Document the blueprint structure and provide examples.

---

### Dependency: Understanding of React Context API

**What:** The theme system uses React Context to manage global state.

**Why It Matters:** Changes to the theme system require understanding how Context works.

**Risk:** Incorrect modifications could break the theme system.

**Mitigation:** Document the Context API usage and provide clear examples.

---

### Dependency: Understanding of CSS Variables

**What:** The theme system uses CSS custom properties (variables) to apply themes.

**Why It Matters:** Adding new themed components requires using the CSS variables.

**Risk:** New components may not respect the theme if they don't use the variables.

**Mitigation:** Document the CSS variable naming convention and provide examples.

---

## File System Dependencies

### Dependency: Directory Structure

**What:** The project has a specific directory structure (e.g., `frontend/`, `src/`, `database/`).

**Why It Matters:** Scripts and configurations assume this structure.

**Risk:** Moving files or directories could break the deployment script or the app.

**Mitigation:** Document the directory structure and avoid making changes without updating all dependencies.

---

### Dependency: File Permissions

**What:** Certain files and directories must have specific permissions (e.g., `www-data` ownership for the database).

**Why It Matters:** Incorrect permissions will cause the app to fail.

**Risk:** File permission errors are common after deployments.

**Mitigation:** The deployment script now includes a step to fix database permissions.

---

## Timing Dependencies

### Dependency: Service Restart Timing

**What:** The deployment script restarts the systemd service after copying files.

**Why It Matters:** The service must be restarted for changes to take effect.

**Risk:** If the service is not restarted, users will see the old version of the app.

**Mitigation:** The deployment script includes a service restart step.

---

### Dependency: Build Order

**What:** The frontend must be built before the static files are copied.

**Why It Matters:** The static files are generated by the build process.

**Risk:** If the build step is skipped, the site will serve old or missing files.

**Mitigation:** The deployment script enforces the correct build order.

---

## Environment Dependencies

### Dependency: Environment Variables

**What:** The Flask app relies on environment variables for configuration (e.g., database path, secret keys).

**Why It Matters:** Without the correct environment variables, the app will fail to start.

**Risk:** If the environment variables are not set or are incorrect, the app will crash.

**Mitigation:** Document all required environment variables and their expected values.

---

### Dependency: Working Directory

**What:** Some scripts assume they are run from a specific directory.

**Why It Matters:** Relative paths will break if the script is run from the wrong directory.

**Risk:** Deployment or build failures due to incorrect working directory.

**Mitigation:** Use absolute paths or include `cd` commands in scripts to ensure the correct working directory.

---

## Conceptual Dependencies

### Dependency: Understanding of the Tenant-Attorney Relationship

**What:** The platform is designed around the concept of tenants seeking legal help from attorneys.

**Why It Matters:** Design and feature decisions are based on this relationship.

**Risk:** Changes that don't account for this relationship could break the user experience.

**Mitigation:** Keep this core concept in mind when making design decisions.

---

### Dependency: Understanding of Legal Workflows

**What:** The platform is designed to support legal workflows (case intake, document submission, attorney matching).

**Why It Matters:** Features should align with how legal cases are actually handled.

**Risk:** Features that don't fit the legal workflow will be confusing or useless.

**Mitigation:** Research legal workflows and consult with legal professionals when designing new features.
