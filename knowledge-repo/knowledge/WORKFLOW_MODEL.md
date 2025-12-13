# Workflow Model

This document externalizes the latent workflows I follow when working on the TenantGuard project.

## Development Workflow

### Phase 1: Receive and Clarify Request

**Steps:**
1. User provides a request or identifies an issue
2. I acknowledge the request with a brief message
3. If the request is ambiguous, I ask clarifying questions
4. If the request is clear, I proceed to planning

**Decision Point:** Do I have enough information to proceed?
- **Yes:** Move to Phase 2
- **No:** Ask clarifying questions

---

### Phase 2: Plan the Work

**Steps:**
1. Break down the request into specific tasks
2. Identify the files and components that need to be changed
3. Consider potential challenges and edge cases
4. Create a mental (or explicit) plan of action

**Decision Point:** Is this a simple fix or a complex feature?
- **Simple:** Proceed directly to implementation
- **Complex:** Create a more detailed plan and possibly share it with the user

---

### Phase 3: Implement the Changes

**Steps:**
1. Navigate to the appropriate directory in the sandbox
2. Read the relevant files to understand the current state
3. Make the necessary changes (edit, create, or delete files)
4. Follow coding best practices (clear names, comments, etc.)
5. Ensure changes are consistent with the existing codebase

**Decision Point:** Are the changes complete?
- **Yes:** Move to Phase 4
- **No:** Continue implementing

---

### Phase 4: Test Locally

**Steps:**
1. Build the frontend (if frontend changes were made)
2. Check for build errors
3. If backend changes were made, test API endpoints with curl
4. Verify that the changes work as expected

**Decision Point:** Do the changes work correctly?
- **Yes:** Move to Phase 5
- **No:** Debug and fix issues, then retest

---

### Phase 5: Commit to Version Control

**Steps:**
1. Run `git status` to see what has changed
2. Run `git add` to stage the changes
3. Run `git commit` with a descriptive message
4. Run `git push` to push the changes to GitHub

**Decision Point:** Are there any uncommitted changes?
- **Yes:** Commit them
- **No:** Proceed to deployment

---

### Phase 6: Deploy to Server

**Steps:**
1. Run the deployment script (`./deploy_fixed.sh`)
2. Monitor the deployment process
3. Check for errors in the deployment output
4. Verify that the service is running

**Decision Point:** Did the deployment succeed?
- **Yes:** Move to Phase 7
- **No:** Investigate the error, fix it, and redeploy

---

### Phase 7: Verify on Live Site

**Steps:**
1. Open the live site in a browser
2. Test the new functionality or verify the fix
3. Check for any regressions or unexpected issues
4. Ensure the site is working correctly

**Decision Point:** Is the live site working as expected?
- **Yes:** Move to Phase 8
- **No:** Investigate the issue, fix it, and redeploy

---

### Phase 8: Document and Report

**Steps:**
1. Create a summary of the work completed
2. Include screenshots, code snippets, or other evidence
3. Explain what was done, why it was done, and what the impact is
4. Deliver the report to the user

**Decision Point:** Is the documentation complete?
- **Yes:** Task complete
- **No:** Add more details

---

## Debugging Workflow

### Phase 1: Identify the Problem

**Steps:**
1. Observe the symptoms (error message, unexpected behavior, etc.)
2. Reproduce the issue if possible
3. Gather information (logs, error messages, stack traces)

**Decision Point:** Can I reproduce the issue?
- **Yes:** Move to Phase 2
- **No:** Gather more information or ask the user for details

---

### Phase 2: Hypothesize the Cause

**Steps:**
1. Based on the symptoms, form hypotheses about what could be causing the issue
2. Prioritize hypotheses based on likelihood (start with the simplest explanation)
3. Consider recent changes that might have introduced the issue

**Decision Point:** Do I have a strong hypothesis?
- **Yes:** Move to Phase 3
- **No:** Gather more information or try a different approach

---

### Phase 3: Test the Hypothesis

**Steps:**
1. Design a test to confirm or refute the hypothesis
2. Run the test (e.g., check a file, run a command, review logs)
3. Observe the results

**Decision Point:** Does the test confirm the hypothesis?
- **Yes:** Move to Phase 4
- **No:** Form a new hypothesis and repeat Phase 2

---

### Phase 4: Implement the Fix

**Steps:**
1. Make the necessary changes to fix the issue
2. Test the fix locally to ensure it works
3. Commit the fix to version control

**Decision Point:** Does the fix resolve the issue?
- **Yes:** Move to Phase 5
- **No:** Revise the fix and retest

---

### Phase 5: Deploy and Verify

**Steps:**
1. Deploy the fix to the server
2. Verify that the issue is resolved on the live site
3. Check for any side effects or new issues

**Decision Point:** Is the issue fully resolved?
- **Yes:** Document the fix and report to the user
- **No:** Continue debugging

---

## Research Workflow

### Phase 1: Define the Research Question

**Steps:**
1. Clarify what information is needed
2. Define the scope of the research
3. Identify potential sources of information

**Decision Point:** Is the research question clear?
- **Yes:** Move to Phase 2
- **No:** Clarify with the user

---

### Phase 2: Gather Information

**Steps:**
1. Search for relevant information (web search, documentation, examples)
2. Visit relevant websites and read articles
3. Take notes and save key findings
4. Collect visual examples (screenshots, mockups)

**Decision Point:** Have I gathered enough information?
- **Yes:** Move to Phase 3
- **No:** Continue searching

---

### Phase 3: Analyze and Synthesize

**Steps:**
1. Review the information collected
2. Identify patterns, themes, and best practices
3. Draw conclusions and make recommendations
4. Organize the findings into a coherent structure

**Decision Point:** Are the findings clear and actionable?
- **Yes:** Move to Phase 4
- **No:** Gather more information or refine the analysis

---

### Phase 4: Create Deliverables

**Steps:**
1. Write a report or create visual mockups
2. Include examples, screenshots, and references
3. Provide clear recommendations
4. Format the deliverables professionally

**Decision Point:** Are the deliverables complete?
- **Yes:** Deliver to the user
- **No:** Add more details or refine

---

## Deployment Workflow (Detailed)

### Step 1: Pre-Deployment Checks

**Actions:**
- Verify that all changes are committed to GitHub
- Ensure the local repository is up to date
- Check that the deployment script is available and executable

**Checklist:**
- [ ] All changes committed
- [ ] Repository up to date
- [ ] Deployment script ready

---

### Step 2: Connect to Server

**Actions:**
- SSH into the server using passwordless authentication
- Verify that the connection is successful

**Command:**
```bash
ssh manus@35.237.102.136
```

---

### Step 3: Run Deployment Script

**Actions:**
- Navigate to the home directory (if not already there)
- Run the deployment script
- Monitor the output for errors

**Command:**
```bash
./deploy_fixed.sh
```

---

### Step 4: Monitor Deployment

**Actions:**
- Watch the deployment script output
- Look for error messages or warnings
- Verify that each step completes successfully

**Key Steps to Monitor:**
- Git pull
- Frontend build
- File copy
- Service restart

---

### Step 5: Verify Service Status

**Actions:**
- Check that the systemd service is running
- Review recent logs for errors

**Commands:**
```bash
sudo systemctl status tenantguard
sudo journalctl -u tenantguard --no-pager | tail -50
```

---

### Step 6: Test Live Site

**Actions:**
- Open the live site in a browser
- Test the new functionality
- Check for any regressions
- Verify that the site is responsive and working correctly

**URL:**
```
https://www.tenantguard.net
```

---

### Step 7: Post-Deployment Verification

**Actions:**
- Create a summary of the deployment
- Document any issues encountered and how they were resolved
- Report the results to the user

**Checklist:**
- [ ] Service running
- [ ] Site accessible
- [ ] New functionality working
- [ ] No regressions
- [ ] Documentation complete

---

## Code Review Workflow (Self-Review)

### Step 1: Read the Code

**Actions:**
- Read through all the changes I made
- Check for typos, syntax errors, and logical errors
- Ensure the code is clear and understandable

---

### Step 2: Check for Best Practices

**Actions:**
- Verify that the code follows established patterns
- Check for proper naming conventions
- Ensure comments are added where necessary
- Verify that the code is DRY (Don't Repeat Yourself)

---

### Step 3: Test Edge Cases

**Actions:**
- Think about edge cases and potential issues
- Test the code with unusual inputs or scenarios
- Verify that error handling is in place

---

### Step 4: Verify Integration

**Actions:**
- Ensure the new code integrates well with the existing codebase
- Check for any breaking changes
- Verify that all dependencies are met

---

### Step 5: Approve or Revise

**Decision Point:** Is the code ready to commit?
- **Yes:** Commit and proceed
- **No:** Make revisions and repeat the review

---

## Documentation Workflow

### Step 1: Identify What Needs Documentation

**Actions:**
- Determine what was done that needs to be documented
- Consider the audience (user, future developers, etc.)
- Decide on the format (report, guide, reference, etc.)

---

### Step 2: Gather Information

**Actions:**
- Collect all relevant information (code changes, screenshots, test results)
- Review notes and findings
- Organize the information logically

---

### Step 3: Write the Documentation

**Actions:**
- Write clear, concise, and informative content
- Use headings, tables, and lists to organize information
- Include examples and visual aids
- Follow the user's preferred format and style

---

### Step 4: Review and Refine

**Actions:**
- Read through the documentation
- Check for clarity, accuracy, and completeness
- Fix any typos or errors
- Ensure the documentation is easy to understand

---

### Step 5: Deliver the Documentation

**Actions:**
- Save the documentation to a file
- Attach the file to a message to the user
- Provide a brief summary of the documentation

---

## Error Recovery Workflow

### Step 1: Acknowledge the Error

**Actions:**
- Recognize that an error has occurred
- Don't panic or try to hide it
- Inform the user if the error impacts them

---

### Step 2: Assess the Impact

**Actions:**
- Determine how severe the error is
- Identify what is affected (site, data, functionality)
- Decide on the urgency of the fix

---

### Step 3: Implement a Quick Fix (if possible)

**Actions:**
- If there's a simple, immediate fix, implement it
- Restore from a backup if necessary
- Restart services if needed

---

### Step 4: Investigate the Root Cause

**Actions:**
- Determine why the error occurred
- Review logs, code, and recent changes
- Identify the underlying issue

---

### Step 5: Implement a Permanent Fix

**Actions:**
- Make the necessary changes to prevent the error from recurring
- Test the fix thoroughly
- Deploy the fix

---

### Step 6: Document and Learn

**Actions:**
- Document what went wrong and how it was fixed
- Identify lessons learned
- Update processes or documentation to prevent similar errors in the future

---

## Continuous Improvement Workflow

### Step 1: Reflect on Completed Work

**Actions:**
- After completing a task, take a moment to reflect
- Consider what went well and what could be improved
- Identify any patterns or recurring issues

---

### Step 2: Identify Improvements

**Actions:**
- Based on the reflection, identify specific improvements
- Consider process improvements, code quality, documentation, etc.
- Prioritize improvements based on impact

---

### Step 3: Implement Improvements

**Actions:**
- Make the identified improvements
- Update processes, scripts, or documentation
- Test the improvements to ensure they work

---

### Step 4: Monitor Results

**Actions:**
- Observe the impact of the improvements
- Determine if they are effective
- Make further adjustments if needed

---

### Step 5: Share Learnings

**Actions:**
- Document the improvements and their impact
- Share learnings with the user or team
- Build a knowledge base for future reference
