# TenantGuard Open Questions

This document tracks unresolved questions, uncertainties, and decisions that need to be made.

## Technical Questions

### Q1: What email service should we use?

**Context:** The contact form currently logs to console. We need to configure SMTP for actual email delivery.

**Options:**
- SendGrid (popular, good free tier)
- AWS SES (cost-effective, requires AWS account)
- Mailgun (reliable, good API)
- Postmark (focused on transactional emails)

**Considerations:**
- Cost (especially at scale)
- Deliverability rates
- Ease of integration
- Support for templates

**Decision Needed By:** January 2026

**Owner:** TBD

---

### Q2: Should we migrate to PostgreSQL now or later?

**Context:** SQLite is sufficient for current scale but may not handle production traffic.

**Options:**
- Migrate now (before user authentication is implemented)
- Migrate in Q4 2026 (as planned in roadmap)
- Wait until SQLite becomes a bottleneck

**Considerations:**
- Complexity of migration with vs. without user data
- Performance requirements
- Development timeline

**Decision Needed By:** January 2026

**Owner:** TBD

---

### Q3: What authentication library should we use?

**Context:** Need to implement user authentication and session management.

**Options:**
- Flask-Login (simple, widely used)
- Flask-Security (more features, includes authorization)
- Flask-JWT-Extended (for token-based auth)
- Custom implementation

**Considerations:**
- Security best practices
- Ease of implementation
- Flexibility for future needs

**Decision Needed By:** January 2026

**Owner:** TBD

---

### Q4: How should we handle file uploads?

**Context:** Tenants need to upload documents (lease agreements, photos, etc.).

**Options:**
- Store files on server filesystem
- Use AWS S3 or similar cloud storage
- Use a CDN for serving uploaded files

**Considerations:**
- Storage costs
- Scalability
- Security and access control
- Backup and redundancy

**Decision Needed By:** February 2026

**Owner:** TBD

---

### Q5: What testing framework should we use?

**Context:** No automated testing is currently in place.

**Options:**
- Frontend: Jest + React Testing Library
- Backend: pytest
- End-to-end: Playwright or Cypress

**Considerations:**
- Coverage requirements
- Development time
- CI/CD integration

**Decision Needed By:** February 2026

**Owner:** TBD

---

## Business Questions

### Q6: What is the pricing model for attorneys?

**Context:** Attorneys can set budget preferences, but the exact pricing model is not defined.

**Options:**
- Subscription (monthly fee for unlimited leads)
- Per-case fee (pay for each matched case)
- Tiered pricing (different levels based on volume)
- Freemium (free tier with paid upgrades)

**Considerations:**
- Attorney willingness to pay
- Revenue potential
- Competitive pricing
- Value proposition

**Decision Needed By:** Q3 2026 (before payment system implementation)

**Owner:** TBD

---

### Q7: Should tenants pay anything?

**Context:** Platform aims to reduce costs for tenants, but should they pay a fee?

**Options:**
- Free for tenants (attorneys pay for the platform)
- Small fee for tenants (e.g., $25 case submission fee)
- Freemium (free basic service, paid premium features)

**Considerations:**
- Accessibility and mission alignment
- Revenue needs
- Market expectations
- Legal and ethical considerations

**Decision Needed By:** Q3 2026

**Owner:** TBD

---

### Q8: How do we recruit attorneys?

**Context:** Need a sufficient number of attorneys to meet tenant demand.

**Options:**
- Direct outreach to law firms
- Partnerships with bar associations
- Online advertising (Google Ads, LinkedIn)
- Referral program

**Considerations:**
- Cost per acquisition
- Quality of attorneys
- Time to recruit
- Geographic coverage

**Decision Needed By:** Q1 2026

**Owner:** TBD

---

### Q9: What is the go-to-market strategy?

**Context:** How do we attract tenants to the platform?

**Options:**
- SEO and content marketing
- Social media advertising
- Partnerships with tenant advocacy groups
- Community outreach and events

**Considerations:**
- Budget
- Target audience
- Competitive landscape
- Measurable ROI

**Decision Needed By:** Q1 2026

**Owner:** TBD

---

## Product Questions

### Q10: What features should be in the MVP?

**Context:** Need to prioritize features for the minimum viable product.

**Current Thinking:**
- User authentication
- Tenant and attorney dashboards
- Basic messaging
- Attorney matching

**Questions:**
- Is messaging essential for MVP, or can we start with email?
- Do we need payment processing for MVP?
- What analytics are essential vs. nice-to-have?

**Decision Needed By:** January 2026

**Owner:** TBD

---

### Q11: How should the matching algorithm work?

**Context:** Need to define the logic for matching tenants with attorneys.

**Factors to Consider:**
- Attorney expertise (landlord-tenant law, eviction defense, etc.)
- Attorney availability (current caseload)
- Attorney budget preferences
- Case complexity and requirements
- Geographic location
- Tenant preferences (if any)

**Questions:**
- Should matching be fully automated or require admin approval?
- How do we handle cases that don't match any attorney?
- Should tenants be able to choose from multiple matches?

**Decision Needed By:** Q2 2026

**Owner:** TBD

---

### Q12: What metrics should we track?

**Context:** Need to define KPIs for measuring platform success.

**Potential Metrics:**
- User acquisition (tenants, attorneys)
- Time to match (case submission to attorney assignment)
- Case resolution rate
- User satisfaction (NPS, surveys)
- Revenue and growth
- Platform usage (active users, session duration)

**Questions:**
- Which metrics are most important?
- How often should we review metrics?
- What tools should we use for tracking?

**Decision Needed By:** Q3 2026

**Owner:** TBD

---

## Legal and Compliance Questions

### Q13: What are the legal requirements for operating in multiple jurisdictions?

**Context:** Plan to expand beyond Davidson County.

**Questions:**
- Do we need to register as a business in each jurisdiction?
- Are there specific regulations for legal tech platforms?
- Do we need to verify attorney licenses in each jurisdiction?
- Are there data protection laws we need to comply with?

**Decision Needed By:** Q4 2026

**Owner:** TBD

---

### Q14: Do we need terms of service and privacy policy?

**Context:** Currently no legal documents on the site.

**Answer:** Yes, definitely needed before collecting user data.

**Questions:**
- Should we hire a lawyer to draft these?
- What should be included?
- How do we ensure compliance with GDPR, CCPA, etc.?

**Decision Needed By:** January 2026 (before user authentication)

**Owner:** TBD

---

### Q15: What insurance do we need?

**Context:** Legal tech platforms may need specific insurance coverage.

**Questions:**
- Do we need professional liability insurance?
- What about cyber liability insurance?
- Are there other types of insurance we should consider?

**Decision Needed By:** Q2 2026

**Owner:** TBD

---

## Design and UX Questions

### Q16: Should we build mobile apps or focus on responsive web?

**Context:** Users may prefer native mobile apps.

**Options:**
- Responsive web only (works on all devices)
- Progressive Web App (PWA)
- Native iOS and Android apps

**Considerations:**
- Development cost and time
- User preferences
- App store presence
- Maintenance burden

**Decision Needed By:** Q4 2026

**Owner:** TBD

---

### Q17: What accessibility standards should we follow?

**Context:** Platform should be accessible to users with disabilities.

**Options:**
- WCAG 2.1 Level A (minimum)
- WCAG 2.1 Level AA (recommended)
- WCAG 2.1 Level AAA (highest)

**Considerations:**
- Legal requirements
- User needs
- Development effort

**Decision Needed By:** Q1 2026

**Owner:** TBD

---

## Infrastructure Questions

### Q18: What cloud provider should we use?

**Context:** Plan to move to cloud hosting in Q4 2026.

**Options:**
- AWS (most features, complex)
- Google Cloud Platform (good for startups)
- Azure (good for enterprise)
- DigitalOcean (simple, affordable)

**Considerations:**
- Cost
- Features and services
- Ease of use
- Support and documentation

**Decision Needed By:** Q3 2026

**Owner:** TBD

---

### Q19: How should we handle backups?

**Context:** Need a robust backup strategy to prevent data loss.

**Questions:**
- How often should we back up the database?
- Where should backups be stored?
- How long should we retain backups?
- How do we test backup restoration?

**Decision Needed By:** Q1 2026

**Owner:** TBD

---

### Q20: What monitoring and alerting tools should we use?

**Context:** Need to monitor platform health and performance.

**Options:**
- Sentry (error tracking)
- Datadog (comprehensive monitoring)
- New Relic (APM)
- Prometheus + Grafana (open source)

**Considerations:**
- Cost
- Features
- Ease of setup
- Integration with existing tools

**Decision Needed By:** Q2 2026

**Owner:** TBD

---

## Process for Resolving Questions

1. **Research:** Gather information and evaluate options
2. **Consult:** Seek input from stakeholders (users, team, advisors)
3. **Decide:** Make a decision based on available information
4. **Document:** Record the decision and rationale
5. **Implement:** Execute the decision
6. **Review:** Evaluate the outcome and adjust if needed

## Adding New Questions

When a new question arises:

1. Add it to this document with context and options
2. Assign an owner (if known)
3. Set a decision deadline
4. Update the question as new information becomes available
5. Move to a "Resolved Questions" section when answered
