# Daily Sync Checklist

Use this checklist to ensure all steps of the daily knowledge sync are completed.

---

## Pre-Sync Preparation

- [ ] All code changes committed to main TenantGuard repository
- [ ] All deployments completed and verified
- [ ] Notes or documentation from work session available

---

## Step 1: Run the Daily Sync Prompt

- [ ] Open Manus in a new session
- [ ] Copy the DAILY_SYNC_PROMPT from `DAILY_SYNC_PROMPT.md`
- [ ] Paste into Manus and execute
- [ ] Wait for Manus to generate checkpoint and updates

---

## Step 2: Review Generated Content

### Checkpoint File

- [ ] Checkpoint file created in `knowledge/CHECKPOINTS/`
- [ ] Checkpoint filename follows format: `CHECKPOINT_YYYY-MM-DD.md`
- [ ] Checkpoint includes all required sections
- [ ] Work summary is accurate and complete
- [ ] Decisions are documented with rationale
- [ ] Next steps are clear

### Knowledge File Updates

- [ ] Review proposed changes to `PROJECT_CONTEXT.md`
- [ ] Review proposed changes to `PROJECT_DECISIONS.yaml`
- [ ] Review proposed changes to `knowledge/PREFERENCES_AND_PATTERNS.md`
- [ ] Review proposed changes to `knowledge/RISKS_AND_UNCERTAINTY_MODEL.md`
- [ ] Review proposed changes to `knowledge/WORKFLOW_MODEL.md`

### Project Status Updates

- [ ] Review updates to `knowledge/PROJECT_STATE_RECONSTRUCTED.md`
- [ ] Review updates to `project/TODOS.md`
- [ ] Review updates to `project/ROADMAP.md`
- [ ] Review updates to `project/OPEN_QUESTIONS.md`

### Artifact Index

- [ ] New artifacts added to `PROJECT_ARTIFACT_INDEX.md`
- [ ] All file paths are correct
- [ ] Descriptions are clear and accurate

---

## Step 3: Apply Updates

- [ ] Save checkpoint file to `knowledge/CHECKPOINTS/`
- [ ] Apply approved changes to `PROJECT_CONTEXT.md`
- [ ] Apply approved changes to `PROJECT_DECISIONS.yaml`
- [ ] Apply other approved knowledge file updates
- [ ] Apply project status updates
- [ ] Update artifact index

---

## Step 4: Verify Changes

- [ ] All updated files are saved
- [ ] No syntax errors in YAML files
- [ ] No broken links in Markdown files
- [ ] File structure is intact

---

## Step 5: Commit to Git

### Check Status

```bash
cd /home/ubuntu/tenantguard/knowledge-repo
git status
```

- [ ] All modified files are shown
- [ ] No unexpected changes

### Review Diff

```bash
git diff
```

- [ ] Changes look correct
- [ ] No sensitive information exposed

### Stage Changes

```bash
git add .
```

- [ ] All files staged for commit

### Commit

```bash
git commit -m "Daily Manus knowledge sync - $(date +%Y-%m-%d)"
```

- [ ] Commit successful
- [ ] Commit message is descriptive

---

## Step 6: Push to GitHub

```bash
git push origin main
```

- [ ] Push successful
- [ ] No merge conflicts

### If Merge Conflicts Occur

```bash
# Pull latest changes
git pull origin main

# Resolve conflicts in affected files
# (Edit files manually)

# Stage resolved files
git add .

# Complete merge
git commit -m "Resolve merge conflicts - $(date +%Y-%m-%d)"

# Push again
git push origin main
```

- [ ] Conflicts resolved
- [ ] Changes pushed successfully

---

## Step 7: Verify on GitHub

- [ ] Visit https://github.com/Orangemangocat/tenantguard
- [ ] Navigate to `knowledge-repo/` directory
- [ ] Verify latest commit is visible
- [ ] Spot-check a few updated files

---

## Step 8: Update Main Repository (if needed)

If changes affect the main TenantGuard codebase:

```bash
cd /home/ubuntu/tenantguard
git pull origin main
```

- [ ] Main repository updated with latest knowledge

---

## Post-Sync Tasks

### Optional: Regenerate Full Export

If there were major changes:

```bash
# Run full knowledge export (see EXPORT_INSTRUCTIONS.md)
```

- [ ] Full export completed (if needed)
- [ ] Export committed to repository

### Optional: Notify Team

If significant updates were made:

- [ ] Send notification to team (email, Slack, etc.)
- [ ] Highlight important changes or decisions
- [ ] Note any action items for team members

---

## Troubleshooting

### Manus Doesn't Generate Checkpoint

**Problem:** Manus fails to create checkpoint or updates

**Solutions:**
- [ ] Manually create checkpoint using template
- [ ] Review recent git commits for context
- [ ] Check deployment logs for details
- [ ] Fill in checkpoint based on available information

### Git Push Fails

**Problem:** Unable to push to GitHub

**Solutions:**
- [ ] Check internet connection
- [ ] Verify GitHub credentials
- [ ] Pull latest changes and retry
- [ ] Check for merge conflicts

### Files Missing or Corrupted

**Problem:** Knowledge files are missing or have errors

**Solutions:**
- [ ] Restore from Git history
- [ ] Check backups
- [ ] Manually recreate from notes
- [ ] Run full knowledge export to regenerate

---

## Automation Option

### Using the Sync Script

Instead of manual steps, use the provided script:

```bash
cd /home/ubuntu/tenantguard/knowledge-repo
./daily-sync.sh
```

The script will:
- Check for uncommitted changes
- Prompt for commit message
- Stage all changes
- Commit with timestamp
- Push to GitHub
- Report status

---

## Frequency Recommendations

### Daily (Recommended)

Run this checklist:
- At the end of each work day
- After completing significant features
- After making important decisions

### Weekly (Minimum)

If daily syncs aren't feasible:
- Run at least once per week
- Include summary of entire week's work
- Update all relevant knowledge files

### After Major Events

Always run after:
- Completing a project phase
- Deploying to production
- Major architecture changes
- Important meetings or decisions

---

## Checklist Completion Log

Keep a log of completed syncs:

| Date | Checkpoint Created | Files Updated | Committed | Pushed | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 2025-12-18 | ✅ | ✅ | ✅ | ✅ | Initial sync setup |
| | | | | | |
| | | | | | |

---

## Tips for Success

1. **Be Consistent:** Run the sync at the same time each day
2. **Be Thorough:** Don't skip steps, even if they seem minor
3. **Be Honest:** Document failures and challenges, not just successes
4. **Be Clear:** Write for someone who wasn't there
5. **Be Timely:** Don't wait too long between syncs

---

## Questions or Issues

If you encounter problems with the daily sync process:

1. Review `meta/HOW_TO_UPDATE_THIS_STRUCTURE.md`
2. Check `meta/EXPORT_INSTRUCTIONS.md`
3. Consult Git documentation
4. Ask for help from team members

---

**Last Updated:** December 18, 2025  
**Version:** 1.0
