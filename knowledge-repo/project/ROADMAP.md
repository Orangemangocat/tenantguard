# TenantGuard Product Roadmap

Updated June 2026 to reflect actual progress. The project migrated from Flask/SQLite to Django/Next.js/PostgreSQL in early 2026, completing many items that were previously planned.

---

## Completed (as of June 2026)

### Infrastructure Migration (Completed Q1 2026)
- Migrated from Flask/SQLite/Vite to Django/Next.js/PostgreSQL
- Deployed on Google Cloud Platform (GCE VMs, Cloud SQL, Artifact Registry, GCS)
- Docker Compose containerization for all services
- GitHub Actions CI/CD (push to main → staging, git tag → production)
- Cloudflare DNS/CDN/WAF protection
- Staging environment at staging.tenantguard.net
- Production at tenantguard.net

### User Authentication (Completed Q1 2026)
- JWT-based authentication (45-min access, 7-day refresh tokens)
- Google OAuth social login
- GitHub OAuth social login
- NextAuth session management on frontend
- Role-based access (tenant, attorney, staff, superadmin)
- Test account seeding for staging

### Content and Blog System (Completed Q1 2026)
- AI blog generation pipeline (multi-agent: researcher → topics → author)
- Blog with categories, tags, search, SEO fields
- CKEditor/Summernote rich text editing
- Dynamic sitemap and robots.txt
- SEO dashboard with Google Search Console integration

### Intake System (Completed Q1 2026)
- Guided intake form for tenants and attorneys
- Document upload with OCR text extraction
- AI-powered case notebook generation (summary, facts, timeline, key terms, recommendations)
- SMS intake session mapping (partially implemented)
- Stripe payment integration for analysis fee (test mode)

### User Dashboard (Completed Q1 2026)
- Case overview page
- Document management
- Motions view
- Actions view
- Alerts view

### Admin and Staff Tools (Completed Q1 2026)
- Django admin with Jazzmin theme
- Staff todo panel with comments and activity log
- AI blog generator admin interface
- User management
- Intake submission management

---

## In Progress (Q2-Q3 2026)

### Attorney Matching System
- Automated case-to-attorney matching based on expertise, location, caseload
- Manual override for admin
- Notification to both parties when matched
- **Priority:** High
- **Target:** Q3 2026

### Email Notification System
- Transactional email service integration (SendGrid or similar)
- Case status update notifications
- New message alerts
- Welcome emails and onboarding sequences
- **Priority:** High
- **Target:** Q2-Q3 2026

### In-Platform Messaging
- Real-time messaging between tenants and attorneys
- Message history and search
- File attachments in messages
- Email notifications for new messages
- **Priority:** Medium-High
- **Target:** Q3 2026

### Payment System Completion
- Move Stripe from test mode to production
- Attorney subscription plans
- Per-case billing options
- Payment history and invoices
- **Priority:** Medium
- **Target:** Q3 2026

### Automated Testing
- Backend unit tests (Django TestCase)
- Frontend component tests
- Integration tests for auth flow
- CI pipeline test step
- **Priority:** Medium
- **Target:** Q2-Q3 2026

---

## Planned (Q4 2026)

### Analytics and Reporting
- Key metrics tracking (time to match, resolution rate, user satisfaction)
- Admin dashboard with visualizations
- Exportable reports
- User feedback collection

### Security Hardening
- Rate limiting on all endpoints
- CSRF hardening
- Security audit
- Penetration testing
- Automated vulnerability scanning

### Performance Optimization
- Redis caching layer
- Database query optimization
- CDN optimization for static assets
- Monitoring and alerting (uptime, error rates, response times)

### Geographic Expansion Preparation
- Research legal requirements for additional Tennessee counties
- Adapt platform for multi-jurisdiction support
- Begin attorney recruitment in new areas

---

## Future (2027+)

### Mobile Applications
- Native iOS and Android apps
- Feature parity with web platform
- Push notifications
- Offline mode for case information

### Document Automation
- Auto-generate legal documents from case details
- Templates for demand letters, court filings
- E-signature integration
- Document version control

### Advanced AI Features
- Predictive analytics for case outcomes
- Enhanced chatbot for tenant questions
- Automated case summarization improvements
- AI-powered attorney recommendations

### Court System Integration
- Electronic filing where available
- Automated court date tracking
- Real-time case status from courts

### National Expansion
- Expand beyond Tennessee
- Partner with legal aid organizations
- Multi-state legal compliance

---

## Success Metrics

| Phase | Key Metric | Target |
| :--- | :--- | :--- |
| Current (Q2 2026) | Platform fully functional | Active staging + production |
| Q3 2026 | Attorney matching live | 80% cases matched within 24 hours |
| Q4 2026 | Active users | 100 tenants, 20 attorneys |
| 2027 | Revenue | $10,000/month |
| 2027+ | Geographic reach | 5+ Tennessee counties |

---

## Dependencies and Risks

### Critical Dependencies
- Legal compliance in all jurisdictions served
- Sufficient attorney recruitment to meet tenant demand
- Funding for infrastructure and development
- Reliable GCP infrastructure

### Key Risks
- Low user adoption (tenants and attorneys may not use the platform)
- Legal/regulatory challenges
- Competition from other legal-tech platforms
- Technical debt from rapid development

### Mitigation Strategies
- Continuous user feedback and iteration
- Legal consultation and compliance monitoring
- Differentiation through superior UX and AI-powered features
- Regular code review, testing, and documentation

---

This roadmap is a living document updated as the project progresses. Priorities may shift based on user feedback, market conditions, and resource availability.
