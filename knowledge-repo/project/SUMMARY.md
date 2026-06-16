# TenantGuard Project Summary

## Overview

TenantGuard is a legal-tech platform designed to connect tenants in Davidson County, Tennessee with qualified attorneys for landlord-tenant disputes. The platform streamlines case intake, provides AI-powered case analysis, and offers tools for attorneys to efficiently manage their caseload.

## Mission

Empower tenants facing disputes with their landlords by providing accessible, affordable legal representation through technology.

## Target Users

**Primary Users:**
- **Tenants:** Individuals renting properties who need legal assistance with landlord disputes (especially eviction defense)
- **Attorneys:** Licensed legal professionals specializing in landlord-tenant law

**Secondary Users:**
- **Staff/Admin:** Internal users managing intake, content, and operational tasks

**Geographic Scope:**
- Davidson County / Nashville, Tennessee (with plans to expand to additional Tennessee counties and eventually other states)

## Value Proposition

**For Tenants:**
- 60% cost reduction compared to traditional legal services
- Guided intake process with document upload
- AI-powered case analysis and notebook generation
- Access to qualified attorneys
- Transparent case tracking via dashboard

**For Attorneys:**
- 70% reduction in case setup time (from 4.5 hours to under 1 hour)
- Pre-analyzed case notebooks with structured facts, timelines, and recommendations
- Streamlined client intake
- Efficient case management tools

## Current Status

**Phase:** Active Development (post-migration, feature expansion)

**Live Site:** https://tenantguard.net (production) and https://staging.tenantguard.net (staging)

**Repository:** https://github.com/Orangemangocat/tenantguard

## Technology Stack

**Frontend:** Next.js 16, React 18, TypeScript, Tailwind CSS 4, Chakra UI 2, next-auth 4

**Backend:** Django 5.0.3, Django REST Framework, SimpleJWT, django-allauth, OpenAI SDK

**Database:** PostgreSQL (Google Cloud SQL)

**Infrastructure:** Docker Compose, GitHub Actions CI/CD, Google Cloud Platform, Cloudflare

## Key Features (Implemented)

1. **Guided Intake System** — Multi-step intake for tenants and attorneys with document upload
2. **AI Case Analysis** — Automated case notebook generation (summary, facts, timeline, key terms, recommendations)
3. **AI Blog Generation** — Multi-agent pipeline for legal content creation
4. **User Dashboard** — Case overview, documents, motions, actions, alerts
5. **JWT + OAuth Authentication** — Google and GitHub social login, role-based access
6. **Blog/Resource Center** — SEO-optimized legal content with search and categories
7. **Staff Todo Panel** — Internal task management with activity tracking
8. **SEO Dashboard** — Google Search Console integration for site visibility
9. **SMS Intake** — Phone-based intake session mapping (in progress)
10. **Stripe Payments** — Case analysis fee processing (test mode)

## Key Features (Planned / In Progress)

1. Attorney matching algorithm
2. In-platform messaging between tenants and attorneys
3. Email notification system
4. Full payment system (subscriptions, per-case billing)
5. Analytics and reporting dashboards
6. Document automation (demand letters, court filings)
7. Mobile applications
8. Geographic expansion to additional Tennessee counties

## Deployment Model

- Push to `main` → automatic staging deployment
- Git tag `v*` → automatic production deployment
- Docker images built and pushed to Google Artifact Registry
- GitHub Actions orchestrates the full pipeline

## Market Context

- 85% of tenants lack legal representation
- Tennessee eviction notice period: 14 days
- Attorney case setup time: 3-5 hours (TenantGuard targets under 1 hour)
- Platform targets 90% case preparation completeness
