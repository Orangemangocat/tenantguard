# Knowledge Export Instructions

This document contains the original command used to create this knowledge repository, along with instructions for future exports.

---

## Original Export Command

This knowledge repository was created on **December 13, 2025** using the following command:

```
MANUS KNOWLEDGE EXTRACTION COMMAND

You are now required to produce a complete and exhaustive export of all knowledge you possess about this project — both explicit and implicit.

Generate a full structured knowledge dump that includes:

Project Summary — the big picture in your own words

Assumptions You Have Been Using

Rules You Have Derived

Constraints You Have Identified

Patterns You Have Learned About User Preferences

Important Context You Rely On That Has Not Been Written Down

Decisions Made and the Rationale Behind Them

Rejected Ideas and Why They Were Rejected

Risks, Confusions, and Open Questions You Believe Exist

All Workflows You Have Been Following

All Internal Checklists or Reasoning Habits

All Entities, Definitions, and Terms You Treat as Canonical

A Unified, Clean, Authoritative Reconstruction of the Entire Project

Format output into FOUR files:

1. PROJECT_IDENTITY.md
2. PROJECT_CONTEXT.md
3. PROJECT_DECISIONS.yaml
4. PROJECT_ARTIFACT_INDEX.md (a structured list of all past outputs)

Do not omit anything.
Do not summarize too lightly.
If unsure whether something matters, include it.

This export must be complete enough that a brand-new agent could take over the project with full competence on first load.
```

This command was followed by:

```
STOP NORMAL TASK EXECUTION — ENTER ARCHIVIST MODE

Your temporary role is Knowledge Externalization Agent.
Your goal is to fully externalize all internal knowledge used in this project into a structured Git‑ready repository.

You MUST externalize:

Implicit assumptions
Inferred constraints or rules
Internal heuristics and shortcuts
Latent workflows you follow even if never requested
User preference models (formatting, depth, style, priorities)
Decision-making logic, including tradeoffs you apply silently
Hidden dependencies in your reasoning
Domain frameworks, concepts, and mental models
Risk models and uncertainty-handling methods
Everything you internally treat as necessary for this project

Convert all hidden or internal knowledge into explicit human‑readable files.

Create the following Git repository structure:
/knowledge/
  INTERNAL_ASSUMPTIONS.md
  INTERNAL_RULES_AND_HEURISTICS.md
  DECISION_LOGIC_AND_TRADEOFFS.md
  PREFERENCES_AND_PATTERNS.md
  HIDDEN_DEPENDENCIES.md
  DOMAIN_MODEL.md
  RISKS_AND_UNCERTAINTY_MODEL.md
  WORKFLOW_MODEL.md
  PROJECT_STATE_RECONSTRUCTED.md

/project/
  SUMMARY.md
  OBJECTIVES.md
  SYSTEM_ARCHITECTURE.md
  ROADMAP.md
  OPEN_QUESTIONS.md
  TODOS.md

/meta/
  HOW_TO_UPDATE_THIS_STRUCTURE.md
  MANUS_BEHAVIOR_PROFILE.md
  EXPORT_INSTRUCTIONS.md

README.md
```

---

## When to Re-Export

Consider creating a fresh export when:

1. **Major Milestones Reached**
   - Completion of a major phase (e.g., Phase 1, Phase 2)
   - Launch of significant new features
   - Major architecture changes

2. **Significant Knowledge Accumulation**
   - Many new decisions have been made
   - New patterns and preferences have emerged
   - The project has evolved significantly

3. **Onboarding New Team Members**
   - A new developer or agent joins the project
   - Need a comprehensive snapshot of current state

4. **Quarterly Reviews**
   - As part of regular project maintenance
   - To ensure documentation stays current

---

## How to Perform a New Export

### Step 1: Prepare

Before running the export command:

1. Review recent work and identify key changes
2. Gather any notes or documentation created since last export
3. Ensure all recent commits are pushed to GitHub

### Step 2: Run the Export Command

Copy the original export command (above) into a new Manus session and execute it.

### Step 3: Review the Output

After the export is complete:

1. Review all generated files for completeness
2. Check that new knowledge is captured
3. Verify that existing knowledge is still accurate
4. Look for gaps or missing information

### Step 4: Merge with Existing Repository

If updating an existing knowledge repository:

1. Compare new export with existing files
2. Merge new information into existing files
3. Update outdated information
4. Preserve historical context where relevant

### Step 5: Commit and Archive

1. Commit the updated knowledge repository to Git
2. Tag the commit with the export date (e.g., `knowledge-export-2025-12-13`)
3. Optionally, create a backup of the previous version

---

## Incremental Updates vs. Full Exports

### Incremental Updates

**When to Use:**
- After completing individual tasks
- When specific knowledge changes
- For day-to-day maintenance

**How to Do It:**
- Update specific files as needed
- Follow guidelines in `HOW_TO_UPDATE_THIS_STRUCTURE.md`
- Commit changes with descriptive messages

### Full Exports

**When to Use:**
- At major milestones
- When significant knowledge has accumulated
- For comprehensive reviews

**How to Do It:**
- Run the full export command
- Review and merge with existing repository
- Ensure nothing is lost or overwritten

---

## Export Quality Checklist

After performing an export, verify:

- [ ] All files in the repository structure are present
- [ ] Files are complete and not truncated
- [ ] New knowledge since last export is captured
- [ ] Existing knowledge is still accurate
- [ ] No sensitive information is exposed
- [ ] Files are properly formatted (Markdown, YAML)
- [ ] Links and references are valid
- [ ] Repository is committed to Git
- [ ] Export is tagged with date

---

## Customizing the Export

The export command can be customized for specific needs:

### Focus on Specific Areas

Add to the command:
```
Focus particularly on [specific area, e.g., "deployment process" or "user authentication"].
```

### Include Additional Context

Add to the command:
```
Also include information about [specific context, e.g., "recent user feedback" or "performance issues"].
```

### Change Output Format

Modify the command to request different file formats or structures as needed.

---

## Automation Opportunities

Consider automating the export process:

1. **Scheduled Exports**
   - Set up a monthly or quarterly reminder
   - Run the export command automatically
   - Review and commit the results

2. **Triggered Exports**
   - After major commits or releases
   - When certain files are updated
   - As part of CI/CD pipeline

3. **Partial Exports**
   - Export only changed areas
   - Incremental updates to specific files
   - Merge automatically with existing repository

---

## Best Practices

### Do:

- **Be Thorough:** Include all relevant knowledge, even if it seems obvious
- **Be Explicit:** Don't rely on implicit understanding
- **Be Organized:** Use clear structure and formatting
- **Be Current:** Update regularly to keep knowledge fresh
- **Be Accessible:** Write for humans who are new to the project

### Don't:

- **Don't Omit Details:** Even small details can be important
- **Don't Assume Prior Knowledge:** Explain everything
- **Don't Let It Get Stale:** Update regularly
- **Don't Expose Secrets:** Redact sensitive information
- **Don't Forget to Commit:** Always version control the knowledge repository

---

## Troubleshooting

### Export is Incomplete

If the export seems incomplete:

1. Review the original command for any modifications
2. Check if the agent ran out of context or tokens
3. Run the command again with focus on missing areas
4. Manually add any missing information

### Files are Inconsistent

If files contradict each other:

1. Identify the source of truth
2. Update all files to be consistent
3. Add a note about the correction
4. Review for other inconsistencies

### Export is Too Large

If the export is overwhelming:

1. Break it into smaller, focused exports
2. Create separate repositories for different aspects
3. Use summaries with links to detailed documents
4. Archive historical information

---

## Version History

| Date | Version | Changes |
| :--- | :--- | :--- |
| 2025-12-13 | 1.0 | Initial export and repository creation |

---

## Contact

For questions about the export process or this knowledge repository, refer to the project documentation or contact the project owner.
