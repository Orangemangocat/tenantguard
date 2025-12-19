# TenantGuard Knowledge Repository

This repository contains a complete externalization of all knowledge about the TenantGuard project, including implicit assumptions, decision logic, workflows, and project state.

## Purpose

The goal of this repository is to ensure that any agent (or human) can take over the TenantGuard project with full competence by reading these documents. All internal knowledge has been made explicit and organized for easy access.

## Repository Structure

```
tenantguard-knowledge-repo/
├── knowledge/               # Internal knowledge and reasoning
│   ├── CHECKPOINTS/         # Daily checkpoint files
│   │   ├── CHECKPOINT_TEMPLATE.md
│   │   └── CHECKPOINT_YYYY-MM-DD.md (daily files)
│   ├── INTERNAL_ASSUMPTIONS.md
│   ├── INTERNAL_RULES_AND_HEURISTICS.md
│   ├── DECISION_LOGIC_AND_TRADEOFFS.md
│   ├── PREFERENCES_AND_PATTERNS.md
│   ├── HIDDEN_DEPENDENCIES.md
│   ├── DOMAIN_MODEL.md
│   ├── RISKS_AND_UNCERTAINTY_MODEL.md
│   ├── WORKFLOW_MODEL.md
│   └── PROJECT_STATE_RECONSTRUCTED.md
├── project/                 # Project documentation
│   ├── SUMMARY.md
│   ├── OBJECTIVES.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── ROADMAP.md
│   ├── OPEN_QUESTIONS.md
│   └── TODOS.md
├── meta/                    # Repository maintenance
│   ├── HOW_TO_UPDATE_THIS_STRUCTURE.md
│   ├── MANUS_BEHAVIOR_PROFILE.md
│   └── EXPORT_INSTRUCTIONS.md
├── DAILY_SYNC_PROMPT.md     # Prompt for daily knowledge sync
├── DAILY_SYNC_CHECKLIST.md  # Checklist for daily sync process
├── daily-sync.sh            # Automation script for daily sync
├── PROJECT_IDENTITY.md      # High-level project overview
├── PROJECT_CONTEXT.md       # Assumptions, rules, and patterns
├── PROJECT_DECISIONS.yaml   # Decision log in YAML format
├── PROJECT_ARTIFACT_INDEX.md # Index of all project artifacts
└── README.md                # This file
```

## Quick Start

### For New Agents or Team Members

1. **Start with Project Identity**
   - Read `PROJECT_IDENTITY.md` for a high-level overview
   - Review `project/SUMMARY.md` for current status

2. **Understand the Context**
   - Read `PROJECT_CONTEXT.md` for assumptions and patterns
   - Review `knowledge/DOMAIN_MODEL.md` for key concepts

3. **Review Technical Details**
   - Read `project/SYSTEM_ARCHITECTURE.md` for technical overview
   - Check `project/ROADMAP.md` for future plans

4. **Understand Decision-Making**
   - Review `PROJECT_DECISIONS.yaml` for past decisions
   - Read `knowledge/DECISION_LOGIC_AND_TRADEOFFS.md` for decision patterns

5. **Check Current Status**
   - Review `knowledge/PROJECT_STATE_RECONSTRUCTED.md` for current state
   - Check `project/TODOS.md` for immediate priorities

### For Ongoing Work

1. **Before Starting a Task**
   - Review relevant sections of the knowledge repository
   - Check `project/OPEN_QUESTIONS.md` for related questions
   - Review `project/TODOS.md` for context

2. **After Completing a Task**
   - Update relevant knowledge files
   - Add new decisions to `PROJECT_DECISIONS.yaml`
   - Update `PROJECT_ARTIFACT_INDEX.md` with new artifacts
   - Commit changes to Git

## Key Documents

### Essential Reading

- **PROJECT_IDENTITY.md** - What is TenantGuard and why does it exist?
- **project/SUMMARY.md** - Current project status and overview
- **project/SYSTEM_ARCHITECTURE.md** - How the platform is built
- **knowledge/PROJECT_STATE_RECONSTRUCTED.md** - Complete current state

### For Decision-Making

- **PROJECT_DECISIONS.yaml** - Log of all major decisions
- **knowledge/DECISION_LOGIC_AND_TRADEOFFS.md** - How to make decisions
- **project/OPEN_QUESTIONS.md** - Unresolved questions

### For Development

- **project/ROADMAP.md** - What's being built and when
- **project/TODOS.md** - Immediate priorities
- **knowledge/WORKFLOW_MODEL.md** - How to do the work

### For Maintenance

- **meta/HOW_TO_UPDATE_THIS_STRUCTURE.md** - How to keep this repository current
- **meta/MANUS_BEHAVIOR_PROFILE.md** - How Manus should behave on this project
- **meta/EXPORT_INSTRUCTIONS.md** - How to perform knowledge exports

## Principles

This knowledge repository follows these principles:

1. **Completeness** - All knowledge is documented, nothing is implicit
2. **Clarity** - Information is clear and easy to understand
3. **Organization** - Knowledge is well-structured and easy to find
4. **Currency** - Documentation is kept up to date
5. **Accessibility** - Written for humans new to the project

## Daily Sync Process

This repository uses a **daily sync workflow** to keep knowledge current and ensure continuity.

### Quick Daily Sync

1. **Run the daily sync prompt** (see `DAILY_SYNC_PROMPT.md`)
2. **Review generated checkpoint** and updates
3. **Run the sync script:**
   ```bash
   cd knowledge-repo
   ./daily-sync.sh
   ```
4. **Verify on GitHub**

### When to Sync

- **Daily (Recommended):** At the end of each work session
- **Weekly (Minimum):** If daily syncs aren't feasible
- **After Major Events:** Deployments, decisions, milestones

### What Gets Synced

- Daily checkpoint files in `knowledge/CHECKPOINTS/`
- Updates to core knowledge files
- Project status updates
- New artifacts and documentation

See `DAILY_SYNC_CHECKLIST.md` for the complete process.

## Maintenance

This repository should be updated:

- **Daily or weekly** using the sync process (see above)
- **After every major task or milestone**
- **When important decisions are made**
- **When new patterns or preferences emerge**

See `meta/HOW_TO_UPDATE_THIS_STRUCTURE.md` for detailed instructions.

## Version History

| Date | Version | Description |
| :--- | :--- | :--- |
| 2025-12-13 | 1.0 | Initial knowledge export and repository creation |

## Related Repositories

- **TenantGuard Main Repository:** [Orangemangocat/tenantguard](https://github.com/Orangemangocat/tenantguard)
- **TenantGuard Website:** [www.tenantguard.net](https://www.tenantguard.net)

## License

This knowledge repository is proprietary and confidential. It is intended for use by the TenantGuard project team only.

## Contact

For questions about this knowledge repository or the TenantGuard project, contact the project owner.

---

**Last Updated:** December 13, 2025  
**Export Version:** 1.0  
**Status:** Active
