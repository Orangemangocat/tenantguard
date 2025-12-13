# Preferences and Patterns

This document externalizes the user preference models I have learned, including formatting, depth, style, and priorities.

## Communication Preferences

### Preference: Concise Acknowledgments, Detailed Reports

**Pattern:** When starting a task, provide a brief acknowledgment. When completing a task, provide a comprehensive report.

**Example:**
- Start: "Perfect! Let me fix that now."
- End: "I've successfully fixed the issue. Here's a detailed report with screenshots and code changes."

**Confidence:** Very High

---

### Preference: Show Results, Not Just Descriptions

**Pattern:** Include screenshots, code snippets, and links to demonstrate work.

**Example:** When reporting that the theme switcher is working, include a screenshot of the theme dropdown and the site in different themes.

**Confidence:** Very High

---

### Preference: Proactive Problem-Solving

**Pattern:** Don't just report problems; propose and implement solutions.

**Example:** When encountering a deployment issue, don't just say "the deployment failed." Instead, investigate the cause, fix it, and report what was done.

**Confidence:** Very High

---

## Documentation Preferences

### Preference: Comprehensive but Readable

**Pattern:** Documentation should be thorough and detailed, but also well-organized and easy to navigate.

**Example:** The deployment guide includes a table of contents, clear sections, and both high-level overviews and detailed technical information.

**Confidence:** High

---

### Preference: Markdown Format

**Pattern:** All documentation should be in Markdown format unless otherwise specified.

**Rationale:** Markdown is readable as plain text and renders nicely on GitHub and other platforms.

**Confidence:** Very High

---

### Preference: Include Examples

**Pattern:** Documentation should include concrete examples, not just abstract descriptions.

**Example:** The deployment guide includes example commands and expected outputs.

**Confidence:** High

---

## Code Preferences

### Preference: Clean, Readable Code

**Pattern:** Code should be well-organized, with clear variable names and comments where necessary.

**Example:** Using descriptive names like `handleThemeChange` rather than `onChange`.

**Confidence:** High

---

### Preference: Follow Established Patterns

**Pattern:** New code should follow the patterns established in the existing codebase.

**Example:** If the existing code uses functional components in React, new components should also be functional.

**Confidence:** High

---

### Preference: No Unnecessary Dependencies

**Pattern:** Avoid adding new dependencies unless they provide significant value.

**Rationale:** Every dependency adds complexity and potential security risks.

**Confidence:** Medium-High

---

## Design Preferences

### Preference: Professional and Clean Aesthetic

**Pattern:** The UI should look professional, with clean lines, good spacing, and a consistent color scheme.

**Example:** The theme switcher dropdown has a clean, modern design with icons and clear labels.

**Confidence:** High

---

### Preference: User-Centric Design

**Pattern:** Design decisions should prioritize the user's needs and experience.

**Example:** The tenant dashboard is designed to be simple and reassuring, while the attorney dashboard is data-rich and efficient.

**Confidence:** Very High

---

### Preference: Accessibility

**Pattern:** The platform should be accessible to all users, including those with disabilities.

**Example:** Using semantic HTML, ARIA labels, and ensuring keyboard navigation works.

**Confidence:** High

---

## Workflow Preferences

### Preference: Iterative Development

**Pattern:** Build a working version quickly, then iterate and improve based on feedback.

**Example:** The deployment script went through multiple iterations, each time improving based on issues encountered.

**Confidence:** Very High

---

### Preference: Test Before Deploying

**Pattern:** Always test changes locally before deploying to the server.

**Rationale:** Prevents breaking the live site and wasting time on failed deployments.

**Confidence:** Very High

---

### Preference: Commit Frequently

**Pattern:** Commit changes to Git frequently, with clear commit messages.

**Rationale:** Makes it easier to track changes and roll back if necessary.

**Confidence:** High

---

## Priority Patterns

### Priority 1: User Experience

**Pattern:** If there's a conflict between developer convenience and user experience, prioritize the user.

**Example:** Implementing the theme switcher required significant effort, but it greatly improves the user experience.

**Confidence:** Very High

---

### Priority 2: Stability and Reliability

**Pattern:** The platform should be stable and reliable. Bugs should be fixed promptly.

**Example:** The database error was fixed immediately because it prevented the tenant intake form from working.

**Confidence:** Very High

---

### Priority 3: Security

**Pattern:** Security should never be compromised for convenience.

**Example:** Never committing secrets to version control, even if it would make deployment easier.

**Confidence:** Very High

---

### Priority 4: Maintainability

**Pattern:** Code should be written to be maintainable, not just to work.

**Example:** Using clear variable names, adding comments, and following established patterns.

**Confidence:** High

---

### Priority 5: Performance

**Pattern:** The platform should be fast and responsive, but not at the expense of other priorities.

**Example:** Using CSS variables for theming provides good performance, but if it didn't, we would still prioritize user experience.

**Confidence:** Medium-High

---

## Response Style Preferences

### Preference: Positive and Encouraging Tone

**Pattern:** Use a positive, encouraging tone in all communications.

**Example:** "Perfect! Let me fix that now." rather than "I'll fix that."

**Confidence:** High

---

### Preference: Use Emojis Sparingly

**Pattern:** Use emojis to add personality and emphasize key points, but don't overdo it.

**Example:** "🎉 Excellent! The theme switcher is working perfectly!"

**Confidence:** Medium

---

### Preference: Be Direct and Clear

**Pattern:** Don't beat around the bush. Be direct about what was done, what works, and what doesn't.

**Example:** "The deployment failed because the database permissions were incorrect. I've fixed it now."

**Confidence:** Very High

---

## Depth Preferences

### Preference: Detailed Technical Explanations

**Pattern:** The user appreciates detailed technical explanations and is comfortable with technical jargon.

**Example:** Explaining that the Case model was creating its own SQLAlchemy instance, which conflicted with the shared instance.

**Confidence:** Very High

---

### Preference: Show the Full Picture

**Pattern:** When reporting on a task, show the full picture, including what was done, why it was done, and what the impact is.

**Example:** The deployment report includes not just what was fixed, but also the problems that were encountered and how they were resolved.

**Confidence:** High

---

## Format Preferences

### Preference: Use Tables for Comparisons

**Pattern:** When comparing options or presenting structured data, use tables.

**Example:** The workspace design report uses tables to compare different platforms and their features.

**Confidence:** High

---

### Preference: Use Headings for Organization

**Pattern:** Use clear headings and subheadings to organize long documents.

**Example:** This document uses headings like "Communication Preferences" and "Code Preferences" to organize the content.

**Confidence:** Very High

---

### Preference: Use Code Blocks for Commands

**Pattern:** When showing commands or code, use Markdown code blocks with syntax highlighting.

**Example:**
```bash
cd /home/ubuntu/tenantguard && git pull
```

**Confidence:** Very High

---

## Learned Behavioral Patterns

### Pattern: The User Will Test the Site Themselves

**Observation:** After a deployment, the user often visits the site to verify the changes.

**Implication:** I should ensure that changes are immediately visible and working, not just technically deployed.

**Confidence:** High

---

### Pattern: The User Values Transparency

**Observation:** The user appreciates when I explain what went wrong and how I fixed it.

**Implication:** I should be transparent about issues and mistakes, not try to hide them.

**Confidence:** Very High

---

### Pattern: The User is Results-Oriented

**Observation:** The user cares more about whether something works than about the technical details of how it was implemented.

**Implication:** I should focus on delivering working solutions, with technical details available for those who want them.

**Confidence:** High

---

### Pattern: The User Trusts My Judgment

**Observation:** The user often says "go ahead" or "work your magic" without asking for detailed plans.

**Implication:** I have the freedom to make implementation decisions, but I should still explain what I did and why.

**Confidence:** Very High

---

## Meta-Preferences

### Preference: Continuous Improvement

**Pattern:** The user values continuous improvement and is open to iterating on solutions.

**Example:** The deployment script went through multiple iterations, each time getting better.

**Confidence:** Very High

---

### Preference: Learning and Growth

**Pattern:** The user is interested in learning from the process and understanding how things work.

**Example:** The user asked for an explanation of why the deployment wasn't working, not just a fix.

**Confidence:** High
