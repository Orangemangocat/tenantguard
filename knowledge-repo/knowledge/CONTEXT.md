# Project Context and User Preferences

This document captures persistent context about the project owner, communication preferences, and standing instructions that all agents (Codex, Claude Code, Manus, etc.) should follow when working on TenantGuard.

---

## Project Owner

**Name:** John Bransford

**GitHub Accounts:** KarlHaines82, Orangemangocat

**Role:** Owner, operator, and product lead for TenantGuard

**Location/Timezone:** United States, America/Chicago (Central Time)

**Responsibilities:** Product direction, deployment coordination, repository management, legal-tech workflow design, frontend/backend iteration, documentation, and server operations

**Professional Skills:** Web application development, deployment troubleshooting, Git/GitHub workflow, documentation, product design, legal-tech domain modeling, and AI-assisted development

---

## Communication Preferences

The project owner has consistent communication patterns that agents should respect:

| Preference | Description |
| :--- | :--- |
| Task start | Concise acknowledgment; do not over-explain before starting |
| Task completion | Comprehensive reports with results, links, commands, examples |
| Transparency | Be direct about what works, what failed, what was fixed, what remains |
| Documentation style | Structured headings and tables for comparisons in longer docs |
| Problem-solving | Proactive; investigate and fix rather than only describe problems |
| Verification | Always verify deployed changes directly on the live/staging site |

---

## Standing Instructions

These instructions apply to all development sessions on TenantGuard:

1. **Test before deploying.** Never ship untested changes.
2. **Commit frequently** with clear, descriptive messages.
3. **Follow established codebase patterns.** Do not introduce new patterns without justification.
4. **Avoid unnecessary dependencies.** Use what Django/Next.js provide before adding packages.
5. **Never commit secrets.** No API keys, passwords, tokens, or credentials in source files.
6. **Deploy to staging first.** Production only after staging verification.
7. **Prioritize in this order:** User experience > Stability > Security > Maintainability > Performance.
8. **Document after major work.** Update AGENTS.md, knowledge-repo, or docs as appropriate.
9. **Ask before production deployment.** Always confirm with the owner before tagging for production.

---

## Known Dislikes and Constraints

- **Do not** hide errors or give vague reports
- **Do not** ship untested changes
- **Do not** commit secrets to the repository
- **Do not** mix legacy architecture (Flask/SQLite) with current architecture (Django/PostgreSQL)
- **Do not** over-engineer; prefer the simplest correct solution
- **Do not** make changes without reading the relevant code first

---

## Recurring Workflow Patterns

The typical development cycle observed across sessions:

1. Iterative development with frequent commits
2. Local testing before any deployment
3. GitHub commits with clear messages
4. Live-site verification after deployment
5. Deployment troubleshooting when issues arise
6. Durable documentation after major work

---

## Repository Cross-References

| Repository | Purpose | Status |
| :--- | :--- | :--- |
| Orangemangocat/tenantguard | Primary development repo (this repo) | Active |
| Orangemangocat/tennantdefend | Reserved secondary repo | Empty |
| KarlHaines82/tenantguard2 | Same codebase, alternate account | Active mirror |

The `KarlHaines82/tenantguard2` repository contains the same Django/Next.js codebase and may have commits not yet in `Orangemangocat/tenantguard`. When in doubt, check both for the latest state.

---

## Geographic and Legal Context

TenantGuard operates in the Tennessee landlord-tenant legal space:

- **Primary jurisdiction:** Davidson County (Nashville), Tennessee
- **Key legal facts:** Tennessee eviction notice period is 14 days; 85% of tenants lack legal representation
- **Legal constraints:** Platform must avoid unauthorized practice of law (UPL); must comply with Tennessee landlord-tenant statutes
- **Expansion plans:** Additional Tennessee counties first, then other states

---

## AI-Assisted Development Context

The project uses AI agents (Codex, Claude Code, Manus) for development. Key principles:

- Agents should read `AGENTS.md` and `CODEX.md` before starting work
- Agents should update documentation when they learn something new about the project
- The `knowledge-repo/` directory is the persistent memory for AI agents
- The `docs/control-plane/` directory defines governance and output schemas for AI content generation
- If an agent discovers a discrepancy between documentation and code, the code is authoritative and the documentation should be updated
