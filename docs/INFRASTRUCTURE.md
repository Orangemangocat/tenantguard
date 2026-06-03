# TenantGuard Infrastructure & Cloudflare Configuration

## Production Environment

| Setting | Value |
|---------|-------|
| Domain | tenantguard.net |
| Origin IP | 34.75.162.207 |
| Hosting | Google Cloud |
| Origin Web Server | Nginx 1.27.5 + Next.js |
| Origin SSL | Google-managed cert (Google Trust Services / WE1) |
| Database | Google Cloud SQL (PostgreSQL with SSL client certs) |

## Staging Environment

| Setting | Value |
|---------|-------|
| Domain | staging.tenantguard.net |
| Origin IP | 34.138.86.218 |
| Hosting | Cloud Computer (Manus) |
| Origin Web Server | Nginx 1.24.0 + Flask |
| Origin SSL | Self-signed certificate |
| Database | Local PostgreSQL 16.14 |

## Cloudflare DNS & CDN Configuration

| Setting | Value |
|---------|-------|
| DNS Provider | Cloudflare |
| Zone ID | `39e97850cf317d4df2f122c276b53cae` |
| Plan | Free |
| Auth Email | j.bransford@gmail.com |
| Auth Method | Global API Key (X-Auth-Email + X-Auth-Key) |
| SSL/TLS Mode | **Full** |
| Proxy Status | Proxied (orange cloud) |

### API Access

To query or modify Cloudflare settings via the API:

```bash
# Check current SSL mode
curl -s -X GET "https://api.cloudflare.com/client/v4/zones/39e97850cf317d4df2f122c276b53cae/settings/ssl" \
  -H "X-Auth-Email: j.bransford@gmail.com" \
  -H "X-Auth-Key: <GLOBAL_API_KEY>" \
  -H "Content-Type: application/json"

# Change SSL mode (e.g., to "full")
curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/39e97850cf317d4df2f122c276b53cae/settings/ssl" \
  -H "X-Auth-Email: j.bransford@gmail.com" \
  -H "X-Auth-Key: <GLOBAL_API_KEY>" \
  -H "Content-Type: application/json" \
  --data '{"value":"full"}'
```

## Critical: SSL/TLS Mode Must Stay "Full"

The production origin server (Nginx at 34.75.162.207) is configured to redirect all HTTP traffic to HTTPS. This means the Cloudflare SSL/TLS encryption mode **must** be set to "Full" or "Full (Strict)".

**If the mode is changed to "Flexible", it causes ERR_TOO_MANY_REDIRECTS:**

1. Cloudflare (Flexible mode) connects to origin on HTTP (port 80)
2. Origin Nginx redirects the request to HTTPS (301)
3. Cloudflare follows the redirect but connects to origin on HTTP again (because Flexible)
4. Origin redirects again → infinite loop

This issue was diagnosed and fixed on **June 3, 2026** by changing the SSL mode from "Flexible" to "Full" via the Cloudflare API.

### SSL Mode Reference

| Mode | Behavior | Safe for this setup? |
|------|----------|---------------------|
| Off | No encryption | No |
| Flexible | HTTPS to visitor, HTTP to origin | **No — causes redirect loop** |
| Full | HTTPS to visitor, HTTPS to origin (no cert validation) | **Yes — current setting** |
| Full (Strict) | HTTPS to visitor, HTTPS to origin (validates cert) | Yes (requires valid cert on origin) |

## DNS Records (Key Entries)

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | tenantguard.net | 34.75.162.207 | Proxied |
| A | www | 34.75.162.207 | Proxied |
| A | staging | 34.138.86.218 | Proxied |

## Change Log

| Date | Change | By |
|------|--------|-----|
| 2026-06-03 | SSL/TLS mode changed from "Flexible" to "Full" (production) | Manus agent |
| 2026-06-03 | SSL/TLS mode changed from "Flexible" to "Full" (staging) | Manus agent |
