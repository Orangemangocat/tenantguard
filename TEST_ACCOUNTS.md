# Test Accounts — TenantGuard Staging

These accounts are seeded on the **staging** environment for testing purposes.

## Test Attorney

| Field    | Value                          |
|----------|--------------------------------|
| Username | `testattorney`                 |
| Password | `TestAttorney123!`             |
| Email    | testattorney@tenantguard.net   |
| Role     | Staff (Attorney)               |

## Test Tenant

| Field    | Value                          |
|----------|--------------------------------|
| Username | `testtenant`                   |
| Password | `TestTenant123!`               |
| Email    | testtenant@tenantguard.net     |
| Role     | Regular user (Tenant)          |

## How to Seed

### Option A — Via the API (no SSH needed)

Hit this endpoint on staging to create/reset the test accounts:

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

## Login URL

```
https://staging.tenantguard.net/auth/signin
```

The credentials are also displayed directly on the sign-in page in a yellow banner.

## Stripe Test Mode

Stripe is configured in **test mode** on staging. See `backend/intake/payment_views.py` for the checkout integration.
