# TenantGuard Client Admin Dashboard - Mockup

This is a visual HTML/CSS mockup of the TenantGuard client administration area designed for tenants dealing with landlord-tenant disputes and eviction cases.

## Overview

The admin dashboard provides clients with a comprehensive view of their case, including all documents, court schedules, AI-generated legal motions, action checklists, and access to legal representation.

## Key Features

### 1. Case Summary Banner
The top banner displays critical case information at a glance, including the case title, case number, court jurisdiction, notice type (e.g., 14-Day Notice to Vacate), days remaining on the notice period, and the next court date. This creates urgency awareness for the client.

### 2. Case Documents (Categorized)
Documents are organized into four distinct categories for easy navigation:

| Category | Description | Source |
|----------|-------------|--------|
| **Notices from Landlord** | Photos and scans of eviction notices received | Client uploads |
| **Court Filings** | Official court documents (warrants, summons, complaints) | CaseLink integration |
| **Your Uploaded Documents** | Lease agreements, payment receipts, communications | Client uploads |
| **CaseLink Records** | Historical case records and landlord history | CaseLink integration |

Each document displays the file type, name, upload date, file size, and source. Action buttons allow viewing and downloading.

### 3. Court Schedule & Deadlines (Timeline View)
A vertical timeline displays all important dates in chronological order. Past events show green checkmarks, the current date is highlighted with a pulsing red indicator, and upcoming deadlines are clearly marked. Each deadline includes a "Set Reminder" button that allows clients to receive notifications via phone and email.

### 4. AI-Prepared Motions (With Status Workflow)
The AI motions section shows legal documents prepared by TenantGuard's AI system. Each motion displays a three-stage workflow indicating its current status:

| Status | Description |
|--------|-------------|
| **Draft** | Initial AI-generated document |
| **In Review** | Document being reviewed for accuracy |
| **Finalized** | Ready for download and filing |

Clients can preview documents, request changes, or download finalized versions.

### 5. Client Action Checklist
A progress-tracked checklist guides clients through required actions. Completed items show green checkmarks with completion dates. Pending items display due dates, with urgent items highlighted in red. The progress badge shows overall completion status (e.g., "4 of 8 Complete").

### 6. TenantGuard Attorneys
A list of available attorneys with profiles showing their specialty areas, ratings, reviews, location, and starting rates. Each attorney has a "View Profile" button. A prominent "Request Legal Representation" call-to-action button allows clients to request to be matched with an attorney.

## Design Specifications

### Colors
The design matches the TenantGuard brand identity with primary red (#DC2626) used for accents, buttons, and highlights. The color palette includes success green (#10B981) for completed items, warning yellow (#F59E0B) for items in review, and a clean white/gray background scheme.

### Typography
The Inter font family is used throughout for a clean, modern, professional appearance. Font weights range from 400 (regular) to 700 (bold) for hierarchy.

### Responsive Design
The mockup includes responsive breakpoints for desktop (1400px max-width), tablet (1200px), and mobile (768px and 480px) viewports.

## Files

| File | Description |
|------|-------------|
| `index.html` | Main HTML structure |
| `styles.css` | Complete CSS styling |

## Live Preview

The mockup can be viewed by opening `index.html` in any modern web browser or by serving the directory with a local HTTP server.

## Notes

This is a static mockup (HTML/CSS only) without functional JavaScript. It demonstrates the visual design and information architecture for the client admin area. The actual implementation would require backend integration for document management, CaseLink API integration, reminder systems, and attorney matching functionality.
