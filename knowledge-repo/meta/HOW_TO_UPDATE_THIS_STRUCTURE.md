# How to Update This Knowledge Repository

This document explains how to keep the TenantGuard knowledge repository up to date as the project evolves.

## Purpose

This repository externalizes all internal knowledge about the TenantGuard project, including:

- Assumptions and rules
- Decision logic and tradeoffs
- User preferences and patterns
- Hidden dependencies
- Domain models and workflows
- Risks and uncertainties
- Project state and artifacts

The goal is to ensure that any agent (or human) can take over the project with full competence by reading these documents.

---

## When to Update

Update this repository whenever:

1. **Major features are added or changed**
2. **Important decisions are made**
3. **New patterns or preferences are discovered**
4. **Technical architecture changes**
5. **Risks or open questions are identified or resolved**
6. **The project roadmap is updated**
7. **New artifacts are created**

**Frequency:** At minimum, update this repository at the end of each major task or milestone.

---

## How to Update

### Step 1: Identify What Changed

After completing work on the project, ask yourself:

- What new features were added?
- What decisions were made?
- What new patterns or preferences did I learn?
- What assumptions or rules changed?
- What new risks or questions emerged?
- What artifacts were created?

### Step 2: Update Relevant Files

Based on what changed, update the appropriate files:

| What Changed | File to Update |
| :--- | :--- |
| New assumptions or constraints | `knowledge/INTERNAL_ASSUMPTIONS.md` |
| New rules or heuristics | `knowledge/INTERNAL_RULES_AND_HEURISTICS.md` |
| New decisions or tradeoffs | `knowledge/DECISION_LOGIC_AND_TRADEOFFS.md` |
| New user preferences or patterns | `knowledge/PREFERENCES_AND_PATTERNS.md` |
| New dependencies | `knowledge/HIDDEN_DEPENDENCIES.md` |
| Domain model changes | `knowledge/DOMAIN_MODEL.md` |
| New risks or questions | `knowledge/RISKS_AND_UNCERTAINTY_MODEL.md` |
| Workflow changes | `knowledge/WORKFLOW_MODEL.md` |
| Project state changes | `knowledge/PROJECT_STATE_RECONSTRUCTED.md` |
| New features or milestones | `project/ROADMAP.md` |
| New open questions | `project/OPEN_QUESTIONS.md` |
| New tasks | `project/TODOS.md` |
| New artifacts | `PROJECT_ARTIFACT_INDEX.md` |

### Step 3: Commit Changes

After updating the files:

```bash
cd /home/ubuntu/tenantguard-knowledge-repo
git add .
git commit -m "Update knowledge repository: [brief description of changes]"
git push origin main
```

### Step 4: Verify Completeness

Ask yourself:

- Would a new agent be able to understand the current state of the project?
- Are all important decisions documented?
- Are all assumptions explicit?
- Are all artifacts indexed?

If the answer to any of these is "no," add more detail.

---

## Snippet for Manus Agents

Copy and paste this snippet into any Manus agent to instruct it to update the knowledge repository:

```
After completing this task, please update the TenantGuard knowledge repository at /home/ubuntu/tenantguard-knowledge-repo.

Review the following files and update them as needed:
- knowledge/INTERNAL_ASSUMPTIONS.md
- knowledge/INTERNAL_RULES_AND_HEURISTICS.md
- knowledge/DECISION_LOGIC_AND_TRADEOFFS.md
- knowledge/PREFERENCES_AND_PATTERNS.md
- knowledge/HIDDEN_DEPENDENCIES.md
- knowledge/DOMAIN_MODEL.md
- knowledge/RISKS_AND_UNCERTAINTY_MODEL.md
- knowledge/WORKFLOW_MODEL.md
- knowledge/PROJECT_STATE_RECONSTRUCTED.md
- project/ROADMAP.md
- project/OPEN_QUESTIONS.md
- project/TODOS.md
- PROJECT_ARTIFACT_INDEX.md

Add any new decisions, patterns, risks, or artifacts that emerged during this task.

Commit the changes to Git with a descriptive message.
```

---

## Rules for Keeping Knowledge Externalized

### Rule 1: No Implicit Knowledge

All knowledge used to make decisions should be explicitly documented. If you find yourself relying on an assumption or pattern that isn't written down, add it to the repository.

### Rule 2: Document Decisions and Rationale

When a decision is made, document:
- What was decided
- What options were considered
- Why this option was chosen
- What tradeoffs were made

### Rule 3: Update Immediately

Don't wait to update the repository. Do it immediately after completing a task or making a decision, while the details are fresh.

### Rule 4: Be Thorough

Don't summarize too lightly. Include enough detail that someone unfamiliar with the project can understand.

### Rule 5: Keep It Organized

Use clear headings, tables, and formatting to make the documents easy to navigate.

### Rule 6: Version Control Everything

All changes to the knowledge repository should be committed to Git with descriptive commit messages.

---

## File-Specific Update Guidelines

### INTERNAL_ASSUMPTIONS.md

**When to Update:** When you discover a new assumption you're making about the project.

**What to Include:**
- The assumption
- Why you're making it
- What would happen if it's wrong
- Confidence level

**Example:**
```markdown
### Assumption: Users Have Modern Browsers

**Statement:** Users are accessing the platform with modern browsers (Chrome, Firefox, Safari, Edge) from the last 2 years.

**Rationale:** Modern JavaScript features and CSS variables are used throughout the platform.

**Risk if Wrong:** Users on older browsers may have a degraded or broken experience.

**Confidence:** High (based on typical internet usage patterns)
```

---

### DECISION_LOGIC_AND_TRADEOFFS.md

**When to Update:** When you make a decision that involves tradeoffs.

**What to Include:**
- The decision
- Options considered
- Tradeoffs made
- Rationale

**Example:**
```yaml
- decision_id: DEC-008
  title: "Use SQLite for initial deployment"
  date: "2025-12-13"
  context: "Need a database for the testing phase"
  options:
    - option: "SQLite"
      pros: ["Simple setup", "No separate server", "Good for testing"]
      cons: ["Not suitable for production scale", "Limited concurrency"]
    - option: "PostgreSQL"
      pros: ["Production-ready", "Better concurrency", "More features"]
      cons: ["More complex setup", "Requires separate server"]
  decision: "Use SQLite for testing, plan to migrate to PostgreSQL later"
  rationale: "SQLite is sufficient for current needs and allows faster development. We can migrate to PostgreSQL when we need better performance and scalability."
```

---

### PROJECT_STATE_RECONSTRUCTED.md

**When to Update:** After any significant change to the project (new features, bug fixes, infrastructure changes).

**What to Include:**
- Current status of all components
- Recent changes
- Known issues
- Next steps

**Tip:** This file should be a complete snapshot of the project at any given time.

---

### PROJECT_ARTIFACT_INDEX.md

**When to Update:** Whenever you create a new document, script, image, or other artifact.

**What to Include:**
- File name and path
- Brief description
- Date created
- Purpose

---

## Automation Opportunities

Consider automating parts of the update process:

1. **Git Hooks:** Automatically remind to update knowledge repository before committing to the main project
2. **CI/CD Integration:** Check that knowledge repository has been updated recently
3. **Scheduled Reviews:** Set a recurring task to review and update the repository monthly

---

## Maintenance Schedule

### Weekly

- Review and update `project/TODOS.md`
- Add any new open questions to `project/OPEN_QUESTIONS.md`

### Monthly

- Review and update `knowledge/PROJECT_STATE_RECONSTRUCTED.md`
- Update `PROJECT_ARTIFACT_INDEX.md` with new artifacts
- Review and update `project/ROADMAP.md` if priorities have changed

### Quarterly

- Comprehensive review of all knowledge files
- Archive resolved questions and completed tasks
- Update risk assessments

---

## Questions or Issues

If you're unsure how to update the repository or which file to update, err on the side of including more information rather than less. It's better to have redundant documentation than missing information.

If a new type of knowledge emerges that doesn't fit into the existing structure, create a new file in the appropriate directory (`knowledge/`, `project/`, or `meta/`) and document it there.

---

## Contact

For questions about this knowledge repository structure, contact the project owner or refer to `meta/EXPORT_INSTRUCTIONS.md` for the original export command.
