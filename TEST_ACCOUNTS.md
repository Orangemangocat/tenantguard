# Test Accounts — TenantGuard Staging

These accounts are seeded on the **staging** environment for testing purposes.

---

## Super Admin (Full Site Control)

| Field    | Value                          |
|----------|--------------------------------|
| Username | `superadmin`                   |
| Password | `SuperAdmin123!`               |
| Email    | admin@tenantguard.net          |
| Role     | Superuser (full site control)  |

**What the Super Admin can do:**

- Manage ALL users (create, edit, delete, promote to staff/superuser)
- Blog management (create, edit, publish, approve posts)
- AI Blog Writer tool (`/admin/ai-generator/`)
- Intake submissions (view, override, manage all cases)
- Staff Todo panel (`/staff/todos/`)
- Site settings and configuration
- Override anything on the site

**Login URL:** `https://staging.tenantguard.net/admin/`

---

## Test Attorney

| Field    | Value                          |
|----------|--------------------------------|
| Username | `testattorney`                 |
| Password | `TestAttorney123!`             |
| Email    | testattorney@tenantguard.net   |
| Role     | Staff (Attorney)               |

---

## Test Tenant

| Field    | Value                          |
|----------|--------------------------------|
| Username | `testtenant`                   |
| Password | `TestTenant123!`               |
| Email    | testtenant@tenantguard.net     |
| Role     | Regular user (Tenant)          |

---

## How to Seed

### Option A — Via the API (no SSH needed)

Hit this endpoint on staging to create/reset ALL test accounts:

```
GET https://staging.tenantguard.net/api/seed-test-users/
```

It returns the credentials as JSON.

### Option B — Via Django management command (on the server)

```bash
docker compose run --rm backend python manage.py seed_test_users
```

### Option C — Automatic on deploy

The staging deploy workflow (`deploy-workflow-reference.yml`) runs `seed_test_users` after every migration, so the accounts are always available.

---

## Login URLs

| Role         | URL                                                |
|--------------|----------------------------------------------------|
| Super Admin  | `https://staging.tenantguard.net/admin/`           |
| Attorney     | `https://staging.tenantguard.net/auth/signin`      |
| Tenant       | `https://staging.tenantguard.net/auth/signin`      |

The credentials are also displayed directly on the sign-in page in a yellow banner.

---

## Admin Panel Features (Super Admin)

| Feature           | URL                                      |
|-------------------|------------------------------------------|
| Django Admin Home | `/admin/`                                |
| User Management   | `/admin/auth/user/`                      |
| SEO Dashboard     | `/admin/seo-dashboard/`                  |
| Blog Posts        | `/admin/blog/post/`                      |
| AI Blog Writer    | `/admin/ai-generator/`                   |
| Categories        | `/admin/blog/category/`                  |
| Comments          | `/admin/blog/comment/`                   |
| Staff Todos       | `/staff/todos/`                          |
| Intake Cases      | `/admin/intake/intakesubmission/`        |

---

## Stripe Test Mode

Stripe is configured in **test mode** on staging. See `backend/intake/payment_views.py` for the checkout integration. The analysis fee is $49 (configurable via `INTAKE_ANALYSIS_PRICE_CENTS` env var).
