# Internal Assumptions

This document externalizes all implicit assumptions I operate under when working on the TenantGuard project.

## Project Ownership and Authority

**Assumption:** The user (johnb@tenantguard.net) is the sole decision-maker and project owner.

**Implication:** I defer to the user for all final decisions, but I am empowered to make technical implementation choices unless explicitly told otherwise.

**Confidence:** Very High

---

## Server Environment

**Assumption:** The testing server at `35.237.102.136` is a dedicated, isolated environment where breaking changes are acceptable.

**Implication:** I can restart services, modify files, and deploy experimental changes without fear of affecting production users.

**Confidence:** High

**Risk:** If this server is actually serving real users, my actions could cause disruption.

---

## GitHub as Source of Truth

**Assumption:** The `Orangemangocat/tenantguard` GitHub repository is the canonical source for all code.

**Implication:** All changes must be committed and pushed to GitHub. The server's `/var/www/tenantguard` directory is a deployment target, not a source.

**Confidence:** Very High

---

## User Prefers Action Over Discussion

**Assumption:** The user values results and demonstrations over theoretical discussions.

**Implication:** When faced with a choice, I should implement a working solution and show it, rather than presenting multiple options and waiting for approval.

**Confidence:** High

**Evidence:** User frequently says "go ahead" or "work your magic" rather than requesting detailed plans.

---

## Implicit Approval for Minor Fixes

**Assumption:** I have implicit approval to fix obvious bugs, typos, and minor issues without explicit permission.

**Implication:** If I notice a broken link, a typo, or a minor styling issue, I can fix it as part of a larger task.

**Confidence:** Medium-High

**Boundary:** I should still ask before making significant architectural changes or removing features.

---

## Testing is Expected Before Deployment

**Assumption:** The user expects me to test changes locally before deploying to the server.

**Implication:** I should build the frontend, check for errors, and verify functionality before running the deployment script.

**Confidence:** Very High

---

## Documentation is Valued

**Assumption:** The user appreciates comprehensive documentation of work completed.

**Implication:** I should create detailed reports, guides, and summaries after completing significant tasks.

**Confidence:** Very High

**Evidence:** User has explicitly requested documentation multiple times and has praised detailed reports.

---

## The Platform is for Davidson County, Tennessee

**Assumption:** The platform is geographically scoped to Davidson County, Tennessee.

**Implication:** Legal references, court information, and attorney licensing should be specific to this jurisdiction.

**Confidence:** Very High

**Evidence:** Explicitly stated in the project documentation.

---

## Tenants are the Primary Beneficiaries

**Assumption:** While the platform serves both tenants and attorneys, tenants are the primary beneficiaries and the user's main concern.

**Implication:** When making design decisions, I should prioritize the tenant experience and ensure the platform is accessible and empowering for tenants.

**Confidence:** High

---

## The Platform Will Eventually Have Real Users

**Assumption:** This is not just a prototype or demo; the platform is intended to serve real tenants and attorneys.

**Implication:** I should prioritize security, data integrity, and user experience as if the platform were already in production.

**Confidence:** Very High

---

## SMTP Configuration is Pending

**Assumption:** The contact form and email functionality are currently logging to console because SMTP has not been configured yet.

**Implication:** This is a known limitation and will be addressed in the future. I should not treat it as a bug.

**Confidence:** Very High

---

## The User is Technically Proficient

**Assumption:** The user has a strong technical background and can understand technical explanations, code, and infrastructure details.

**Implication:** I can use technical language and provide detailed technical explanations without oversimplifying.

**Confidence:** Very High

**Evidence:** User has demonstrated understanding of Git, deployment processes, server administration, and web development concepts.

---

## The Project is Under Active Development

**Assumption:** The project is in an active development phase, and new features and changes are expected regularly.

**Implication:** I should be prepared for frequent changes to requirements and should design systems to be flexible and adaptable.

**Confidence:** Very High

---

## The User Values Clean Code and Best Practices

**Assumption:** The user appreciates clean, well-organized code that follows best practices.

**Implication:** I should write readable code, use proper naming conventions, and follow established patterns in the codebase.

**Confidence:** High

**Evidence:** User has requested fixes for code organization issues (e.g., removing `dist` and `venv` from version control).
