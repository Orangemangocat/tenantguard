# TenantGuard User Space — Design Document

## Overview

This document describes the design for the TenantGuard **User Space** — the authenticated
area where tenants manage their eviction defense case. The user space encompasses:

1. **Document Upload Flow** — Photograph/scan eviction notices and upload them
2. **AI-Powered Analysis** — Automatic classification, extraction, and legal analysis
3. **User Dashboard** — Central hub showing all cases, deadlines, and alerts
4. **Case Detail View** — Deep dive into a specific case with motions, advice, timeline
5. **Alerts & Notifications** — SMS and email reminders for court dates and deadlines

## User Journey

```
[Landing Page] → [Sign In (Google/GitHub)] → [Dashboard]
                                                   │
                                    ┌──────────────┼──────────────┐
                                    │              │              │
                              [New Case]    [Existing Case]  [Alerts]
                                    │              │
                              [Upload Docs]  [Case Detail]
                                    │              │
                              [AI Analysis]  ┌─────┼─────┐
                                    │        │     │     │
                              [Results]   [Docs] [Plan] [Motions]
                                    │
                              [Payment] → [Full Access]
```

## Page Structure

### 1. `/dashboard` — User Dashboard (NEW)

The central hub after login. Shows:

| Section | Content |
|---------|---------|
| **Active Cases** | Cards for each case with status badge, urgency indicator, next deadline |
| **Upcoming Deadlines** | Timeline of court dates, filing deadlines, response due dates |
| **Recent Activity** | Latest AI analysis results, new documents uploaded, advice generated |
| **Quick Actions** | "Upload New Document" button, "Start New Case" button |
| **Alerts Summary** | Unread notifications count, upcoming SMS/email reminders |

### 2. `/dashboard/upload` — Document Upload (NEW)

A focused upload experience for tenants who just received a notice:

**Step 1: Capture**
- Camera capture (mobile) or file upload (desktop)
- Drag-and-drop zone
- Accepts: JPG, PNG, PDF, HEIC
- Multiple documents at once

**Step 2: Classify**
- AI auto-detects document type (eviction notice, lease, court summons, etc.)
- User confirms or corrects classification
- Document types:
  - `eviction_notice` — Notice to vacate / pay or quit
  - `court_summons` — Detainer warrant / court filing
  - `lease_agreement` — Rental agreement
  - `correspondence` — Letters from landlord
  - `payment_record` — Rent receipts, payment history
  - `photo_evidence` — Property condition photos
  - `other` — Miscellaneous

**Step 3: Quick Context**
- "When did you receive this?" (date picker)
- "Is there a deadline on this document?" (date picker, optional)
- "Anything else we should know?" (free text, optional)

**Step 4: Analysis**
- Progress indicator while AI processes
- Results appear in real-time (streaming)

### 3. `/dashboard/case/[id]` — Case Detail (ENHANCED)

Enhances the existing `/case/[id]` page with:

**Tabs:**

| Tab | Content |
|-----|---------|
| **Overview** | Case summary, status, key facts, urgency level |
| **Documents** | All uploaded documents with AI extraction results |
| **Action Plan** | Step-by-step what to do next, with checkboxes |
| **Motions & Filings** | AI-generated motion templates, filing instructions |
| **Timeline** | Chronological view of events, deadlines, court dates |
| **Messages** | Chat history with AI advisor, follow-up questions |

**Sidebar (Desktop):**
- Court date countdown
- Case status badge
- Document count / progress
- Quick links to key actions

### 4. `/dashboard/alerts` — Notifications & Reminders (NEW)

| Alert Type | Delivery | Trigger |
|------------|----------|---------|
| Court date reminder | SMS + Email | 7 days, 3 days, 1 day before |
| Filing deadline | SMS + Email | 5 days, 1 day before |
| New advice available | Email | After AI analysis completes |
| Document request | Email | When AI needs more info |

## Backend Architecture

### New Django Models

```python
# intake/models.py additions

class CaseAlert(models.Model):
    """Scheduled alerts for court dates and deadlines."""
    ALERT_TYPES = [
        ('court_date', 'Court Date Reminder'),
        ('filing_deadline', 'Filing Deadline'),
        ('response_due', 'Response Due Date'),
        ('advice_ready', 'New Advice Available'),
        ('document_request', 'Document Requested'),
    ]
    DELIVERY_METHODS = [
        ('sms', 'SMS'),
        ('email', 'Email'),
        ('both', 'SMS + Email'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    submission = ForeignKey(IntakeSubmission)
    alert_type = CharField(choices=ALERT_TYPES)
    delivery_method = CharField(choices=DELIVERY_METHODS, default='both')
    scheduled_for = DateTimeField()
    message = TextField()
    status = CharField(choices=STATUS_CHOICES, default='pending')
    sent_at = DateTimeField(null=True)
    created_at = DateTimeField(auto_now_add=True)


class CaseMotion(models.Model):
    """AI-generated motion templates for the tenant's case."""
    MOTION_TYPES = [
        ('answer', 'Answer to Complaint'),
        ('continuance', 'Motion for Continuance'),
        ('dismiss', 'Motion to Dismiss'),
        ('discovery', 'Discovery Request'),
        ('stay', 'Motion to Stay Execution'),
        ('repair_escrow', 'Rent Escrow / Repair Request'),
    ]
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('ready', 'Ready to File'),
        ('filed', 'Filed'),
    ]
    
    submission = ForeignKey(IntakeSubmission)
    motion_type = CharField(choices=MOTION_TYPES)
    title = CharField(max_length=255)
    content = TextField()  # The actual motion text
    instructions = TextField()  # How to file this motion
    filing_deadline = DateField(null=True)
    status = CharField(choices=STATUS_CHOICES, default='draft')
    generated_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)


class CaseActionItem(models.Model):
    """Checklist items for the tenant's action plan."""
    PRIORITY_CHOICES = [
        ('critical', 'Critical — Do Today'),
        ('high', 'High — This Week'),
        ('medium', 'Medium — Before Court Date'),
        ('low', 'Low — When Possible'),
    ]
    
    submission = ForeignKey(IntakeSubmission)
    title = CharField(max_length=255)
    description = TextField()
    priority = CharField(choices=PRIORITY_CHOICES)
    due_date = DateField(null=True)
    completed = BooleanField(default=False)
    completed_at = DateTimeField(null=True)
    order = IntegerField(default=0)
    created_at = DateTimeField(auto_now_add=True)
```

### New API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/intake/dashboard/` | Dashboard summary (cases, deadlines, alerts) |
| POST | `/api/intake/{id}/upload-analyze/` | Upload doc + trigger immediate AI analysis |
| GET | `/api/intake/{id}/motions/` | List motions for a case |
| POST | `/api/intake/{id}/motions/generate/` | Generate motion based on case |
| PATCH | `/api/intake/{id}/motions/{mid}/` | Update motion status |
| GET | `/api/intake/{id}/actions/` | List action items |
| PATCH | `/api/intake/{id}/actions/{aid}/` | Toggle action item complete |
| GET | `/api/intake/{id}/alerts/` | List alerts for a case |
| POST | `/api/intake/{id}/alerts/` | Create custom alert |

### AI Analysis Pipeline (Enhanced)

When a document is uploaded:

1. **OCR/Extraction** — Extract text from image/PDF using GPT-4o vision
2. **Classification** — Identify document type and key dates
3. **Legal Analysis** — Analyze under Tennessee landlord-tenant law
4. **Action Generation** — Create specific action items with deadlines
5. **Motion Drafting** — If applicable, draft relevant motions
6. **Alert Scheduling** — Auto-create reminders for any deadlines found

### AI Prompt Strategy

The analysis uses a specialized prompt that:
- Identifies the type of eviction action (non-payment, lease violation, etc.)
- Extracts all dates and deadlines
- Checks for procedural defects (improper notice period, wrong form, etc.)
- Generates Tennessee-specific legal advice
- Creates actionable next steps with priorities
- Drafts applicable motions using Tennessee court forms

## Frontend Components

### New Pages
- `pages/dashboard/index.tsx` — Main dashboard
- `pages/dashboard/upload.tsx` — Document upload flow
- `pages/dashboard/case/[id].tsx` — Enhanced case detail
- `pages/dashboard/alerts.tsx` — Alerts management

### New Components
- `components/Dashboard/CaseCard.tsx` — Case summary card
- `components/Dashboard/DeadlineTimeline.tsx` — Visual deadline timeline
- `components/Dashboard/QuickActions.tsx` — Action buttons
- `components/Upload/DocumentCapture.tsx` — Camera/file upload
- `components/Upload/DocumentClassifier.tsx` — AI classification UI
- `components/Upload/AnalysisProgress.tsx` — Streaming analysis results
- `components/Case/MotionViewer.tsx` — Motion template display
- `components/Case/ActionChecklist.tsx` — Interactive action items
- `components/Case/AlertManager.tsx` — Alert configuration

## Design Principles

1. **Mobile-First** — Most tenants will use their phone to photograph documents
2. **Empathetic Tone** — Warm, supportive language throughout
3. **Urgency-Aware** — Critical deadlines are always visible and prominent
4. **Progressive Disclosure** — Don't overwhelm; show what's needed now
5. **Accessible** — WCAG 2.1 AA, large touch targets, clear contrast

## Implementation Priority

| Phase | Feature | Rationale |
|-------|---------|-----------|
| 1 | Dashboard + Document Upload | Core value prop — get help immediately |
| 2 | AI Analysis + Action Plan | Deliver the promise — actionable advice |
| 3 | Motion Generation | High value — saves money on attorney fees |
| 4 | Alerts & Notifications | Retention — keep them engaged and on track |
