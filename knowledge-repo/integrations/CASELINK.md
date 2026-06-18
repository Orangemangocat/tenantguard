# CaseLink Integration — Davidson County General Sessions Civil

## Overview

CaseLink is the official electronic court records system for **Davidson County General Sessions Civil Court** (Nashville, Tennessee). It provides access to case filings, pleadings, court dates, judgments, and scanned document images for all civil cases in the county.

**This is a critical integration for TenantGuard** — it allows us to automatically pull case data, court dates, filed motions, and served documents for any tenant's case in Davidson County.

## Access Credentials

| Field | Value |
|-------|-------|
| URL | https://caselink.nashville.gov (or caselink.nashville..... — exact domain TBD) |
| Login Email | bransfordbacktwo@gmail.com |
| Password | Orangemango+4034044 |
| Subscription # | 72228 |
| Subscription Name | John Bransford |
| Monthly Cost | $25.00 + $0.56 LexisNexis fee = $25.56/month |
| Payment Method | Visa ending in 6069 |
| Payment Processor | LexisNexis Payment Solutions (paymentsolutions.lexisnexis.com) |
| Billing Address | 7051 Highway 70 S. 147, Nashville, TN 37221 |
| Renewal Date | ~18th of each month (first payment: June 18, 2026) |
| Support Email | CircuitSupport@Nashville.Gov |

## Case Number Format

Case numbers follow the pattern: **`24GT10013`**

- `24` — Year (2024)
- `GT` — Case type code (General Sessions, Tenant? — needs confirmation)
- `10013` — Sequential case number

**Example case:** `24GT10013 CR NASHVILLE PARTNERS, LLC D/B/A SLATE APARTMENT HOMES vs NELL BRANSFORD OR ALL OCCUPANTS`

## Available Data Per Case (Tabs)

Each case in CaseLink has the following tabs:

| Tab | Data Available | TenantGuard Use |
|-----|---------------|-----------------|
| **Pleadings** | Filed documents with dates, descriptions, and "VIEW IMAGE" links to scanned PDFs | Auto-populate document vault, extract served dates |
| **General** | Case overview, parties, addresses | Auto-fill case details, identify landlord/property |
| **Payments** | Court costs paid/owed | Track financial obligations |
| **Unpaid.Costs** | Outstanding court fees | Alert tenant to required payments |
| **Services** | Service of process records | Verify proper service, identify defense opportunities |
| **Court.Dates** | Hearing dates, times, rooms, continuance counts | Auto-populate calendar, send reminders |
| **Judgments** | Final orders, judgment amounts | Track case outcome |
| **Executions** | Writs of possession, execution status | URGENT alerts for move-out deadlines |
| **Witnesses** | Listed witnesses | Case preparation |
| **Bankruptcy** | Bankruptcy stay information | Identify automatic stays |

## Pleadings Tab Structure

The Pleadings tab is the most valuable for TenantGuard. It shows:

| Column | Description | Example |
|--------|-------------|---------|
| # | Sequential filing number | 3, 4, 5, 6, 7... |
| Date | Filing date (truncated, shows as "09/17...") | 09/17/2024 |
| Description | Document type and details | SUMMONS PERSONAL-D1, RETURN D1-SERVED 10/01/2024, MOTION TO QUASH 10/01/2024 - OF D1 |
| VIEW IMAGE | Link to scanned PDF of the actual document | Click to view/download |

**Common Pleading Types Observed:**
- `SUMMONS PERSONAL-D1` / `SUMMONS PERSONAL-D2` — Personal service summons for defendants
- `RETURN D1-SERVED [date]` — Proof of service (critical for defense — was service proper?)
- `MOTION TO QUASH [date] - OF D1` — Motion to invalidate service
- `COURT DATE CONTINUANCE [date]` — Hearing postponement
- `ORDER(G)SUBMITTED` — Order submitted by court

**Costs/Judgment Summary (top of Pleadings tab):**
- Costs: $183.75
- Judgment: $0.00
- Interest: $0.00
- Total: $183.75

## Court.Dates Tab Structure

| Column | Description | Example |
|--------|-------------|---------|
| # | Sequential hearing number | 1, 2, 3... |
| Description | Type of hearing/event | SUMMONS PERSONAL-D1, MOTION TO QUASH, MOTION |
| Continuance(s) | Number of times continued | 0, 1, 2 |
| Date | Hearing date | 10/15/2024 |
| Time | Hearing time | 10:00 |
| Room | Courtroom | 1B |

## Integration Strategy for TenantGuard

### Phase 1: Manual Lookup (Current)
- Staff/AI can log in and look up cases manually
- Copy relevant data into tenant's case file

### Phase 2: Automated Scraping (Target)
- Build a scraper that logs into CaseLink
- Given a case number, pull all tabs automatically
- Parse pleadings, court dates, judgments
- Download scanned document images via "VIEW IMAGE" links
- Auto-populate the tenant's TenantGuard case file

### Phase 3: Real-Time Monitoring
- Periodically check cases for new filings
- Alert tenants when new documents are filed
- Alert when court dates are set or continued
- Alert on judgment entries or execution orders (URGENT)

## Technical Notes for Scraping

- CaseLink appears to be a traditional server-rendered web application (not a SPA)
- Navigation is tab-based with standard HTML links
- "VIEW IMAGE" links likely serve PDF or TIFF scans
- Session management via cookies after login
- Has a "Type to Speak..." accessibility feature (speech-to-text search)
- Has "NEW SEARCH", "RETURN TO LIST", "PREV. CASE", "NEXT CASE" navigation
- "PRINT PLEADINGS LIST" suggests a printable/exportable format exists

## Case Type Codes (Observed/Inferred)

| Code | Meaning | Notes |
|------|---------|-------|
| GT | General Sessions (Tenant/Eviction?) | Confirmed from case 24GT10013 |
| CR | (Part of party name, not case type) | "CR NASHVILLE PARTNERS" = company name |

*Need to confirm: What other case type codes exist? (e.g., GC for General Civil, etc.)*

## Important Legal Context

The case `24GT10013` shows:
- **Plaintiff:** Nashville Partners, LLC d/b/a Slate Apartment Homes
- **Defendant:** Nell Bransford or All Occupants
- **Filed:** September 2024
- **A Motion to Quash was filed** (challenging service of process)
- **Multiple continuances** (case was continued at least twice)
- **Courtroom 1B** at General Sessions

This is exactly the type of case TenantGuard is designed to help with — a corporate landlord (operating as an LLC with a d/b/a) filing against a tenant.

## Renewal Reminder

A recurring reminder is set for the **15th of each month at 9:00 AM CDT** to alert about the upcoming $25.56 CaseLink renewal (charges around the 18th).
