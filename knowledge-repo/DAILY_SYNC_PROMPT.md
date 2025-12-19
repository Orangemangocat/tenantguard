# Daily Manus Knowledge Sync Prompt

Copy and paste this prompt into Manus at the end of each work session or daily to keep the knowledge repository up to date.

---

## DAILY KNOWLEDGE SYNC COMMAND

```
You are performing a daily knowledge sync for the TenantGuard project.

Review all work completed since the last checkpoint and generate a comprehensive update.

## Tasks to Complete:

1. **Create Today's Checkpoint**
   - Generate a checkpoint file named: `CHECKPOINT_YYYY-MM-DD.md`
   - Include:
     - Date and time
     - Summary of work completed today
     - New features added
     - Bugs fixed
     - Decisions made
     - Lessons learned
     - Open questions or blockers
     - Next steps

2. **Review and Update Core Knowledge Files**
   - Check if any assumptions changed → Update `PROJECT_CONTEXT.md`
   - Check if new decisions were made → Update `PROJECT_DECISIONS.yaml`
   - Check if preferences or patterns emerged → Update `knowledge/PREFERENCES_AND_PATTERNS.md`
   - Check if new risks identified → Update `knowledge/RISKS_AND_UNCERTAINTY_MODEL.md`
   - Check if workflows changed → Update `knowledge/WORKFLOW_MODEL.md`

3. **Update Project Status**
   - Update `knowledge/PROJECT_STATE_RECONSTRUCTED.md` with current state
   - Update `project/TODOS.md` (mark completed, add new tasks)
   - Update `project/ROADMAP.md` if milestones changed
   - Update `project/OPEN_QUESTIONS.md` (resolve answered, add new)

4. **Update Artifact Index**
   - Add any new files, scripts, or documents to `PROJECT_ARTIFACT_INDEX.md`

5. **Generate Summary Report**
   - Create a brief summary of what changed
   - Highlight any critical updates
   - Note any action items

## Output Format:

Save the checkpoint to: `knowledge-repo/knowledge/CHECKPOINTS/CHECKPOINT_YYYY-MM-DD.md`

Then provide a summary of:
- What was updated
- What files need to be committed
- Any important notes or action items

After generating the checkpoint and updates, I will:
1. Review the changes
2. Commit to Git
3. Push to GitHub
```

---

## Usage Instructions

### Daily Workflow

**At the End of Each Work Session:**

1. Copy the "DAILY KNOWLEDGE SYNC COMMAND" above
2. Paste it into Manus
3. Review the generated checkpoint and updates
4. Run the sync script (see below) or manually commit

### Manual Sync Process

```bash
# Navigate to the repository
cd /home/ubuntu/tenantguard/knowledge-repo

# Review changes
git status
git diff

# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Daily Manus knowledge sync - YYYY-MM-DD"

# Push to GitHub
git push origin main
```

### Automated Sync Script

Use the provided `daily-sync.sh` script:

```bash
cd /home/ubuntu/tenantguard/knowledge-repo
./daily-sync.sh
```

---

## Checkpoint File Format

Each checkpoint should follow this format:

```markdown
# TenantGuard Daily Checkpoint - YYYY-MM-DD

**Date:** December 18, 2025  
**Time:** 8:00 PM CST  
**Agent:** Manus  

## Work Completed Today

[Summary of what was accomplished]

### Features Added

- Feature 1
- Feature 2

### Bugs Fixed

- Bug 1
- Bug 2

### Decisions Made

- Decision 1 (rationale)
- Decision 2 (rationale)

## Lessons Learned

[What was learned during today's work]

## Open Questions / Blockers

[Any unresolved issues or blockers]

## Next Steps

[What should be done next]

## Files Modified

- file1.js
- file2.py
- etc.

## Knowledge Updates Required

- [ ] Update PROJECT_CONTEXT.md
- [ ] Update PROJECT_DECISIONS.yaml
- [ ] Update WORKFLOW_MODEL.md
- [ ] Update PROJECT_STATE_RECONSTRUCTED.md
```

---

## Frequency Guidelines

### Daily Sync (Recommended)

Run at the end of each work day or session when significant work was completed.

**When to Run:**
- After completing a major feature
- After fixing important bugs
- After making key decisions
- At the end of a work session with multiple changes

### Weekly Sync (Minimum)

If daily syncs aren't feasible, run at least weekly to keep knowledge current.

### After Major Milestones

Always run a sync after:
- Completing a project phase
- Deploying to production
- Major architecture changes
- Important meetings or decisions

---

## Benefits of Daily Syncing

1. **Continuity:** Ensures no knowledge is lost between sessions
2. **Clarity:** Creates a clear record of progress and decisions
3. **Onboarding:** Makes it easy for new team members to catch up
4. **Debugging:** Provides a timeline for troubleshooting issues
5. **Accountability:** Documents what was accomplished

---

## Troubleshooting

### Checkpoint Generation Fails

If Manus fails to generate a checkpoint:
- Manually create the checkpoint file using the template above
- Fill in the details based on recent work
- Save to `knowledge/CHECKPOINTS/`

### Git Conflicts

If you encounter merge conflicts:
```bash
# Pull latest changes
git pull origin main

# Resolve conflicts manually
# Edit conflicting files

# Stage resolved files
git add .

# Complete the merge
git commit -m "Resolve merge conflicts"

# Push changes
git push origin main
```

### Missing Context

If Manus doesn't have enough context:
- Review recent git commits
- Check deployment logs
- Review browser history or notes
- Manually fill in missing information

---

## Integration with Existing Workflow

The daily sync integrates with the existing knowledge repository workflow:

1. **During Development:** Work normally, make changes
2. **End of Session:** Run daily sync prompt
3. **Review Generated Updates:** Check checkpoint and file updates
4. **Commit and Push:** Use sync script or manual commands
5. **Next Session:** Manus can read latest checkpoint to resume

---

## Customization

You can customize the sync prompt for specific needs:

**Focus on Specific Areas:**
```
Today's sync should focus particularly on [deployment process / user authentication / etc.]
```

**Include Additional Context:**
```
Also include information about [recent user feedback / performance issues / etc.]
```

**Change Output Format:**
```
Generate the checkpoint in [different format / with additional sections]
```

---

## Maintenance

### Checkpoint Retention

- Keep all checkpoints for at least 3 months
- Archive older checkpoints to a separate directory if needed
- Never delete checkpoints without backing them up first

### Repository Cleanup

Periodically review and clean up:
- Outdated information in core knowledge files
- Resolved questions in OPEN_QUESTIONS.md
- Completed tasks in TODOS.md
- Old checkpoints (archive, don't delete)

---

## See Also

- `meta/HOW_TO_UPDATE_THIS_STRUCTURE.md` - General update guidelines
- `meta/EXPORT_INSTRUCTIONS.md` - Full knowledge export process
- `PROJECT_ARTIFACT_INDEX.md` - Index of all project artifacts
