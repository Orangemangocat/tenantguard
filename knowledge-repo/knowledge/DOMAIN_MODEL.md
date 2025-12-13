# Domain Model

This document externalizes the domain model and mental frameworks I use when reasoning about the TenantGuard project.

## Core Entities

### Entity: Tenant

**Definition:** A person who rents a property and is seeking legal assistance with a landlord dispute.

**Attributes:**
- Name (first, last)
- Contact information (email, phone)
- Address (current residence)
- Case details (nature of dispute, desired outcome)

**Relationships:**
- Has one or more **Cases**
- May be matched with one or more **Attorneys**

**User Journey:**
1. Discovers TenantGuard
2. Completes the case intake form
3. Receives a case number
4. Waits to be matched with an attorney
5. Communicates with attorney through the platform
6. Tracks case progress
7. Receives legal assistance and resolution

---

### Entity: Attorney

**Definition:** A licensed legal professional who provides representation to tenants in landlord-tenant disputes.

**Attributes:**
- Name
- Contact information (email, phone)
- Bar number and licensing information
- Areas of expertise
- Budget preferences (lead generation budget)
- Availability and caseload

**Relationships:**
- Has one or more **Cases** (as the assigned attorney)
- May have multiple **Tenants** as clients

**User Journey:**
1. Applies to join the platform
2. Completes the attorney intake form
3. Sets budget and preferences
4. Receives case matches
5. Reviews and accepts cases
6. Communicates with clients through the platform
7. Manages cases and tracks progress
8. Provides legal services and closes cases

---

### Entity: Case

**Definition:** A legal matter initiated by a tenant seeking assistance with a landlord dispute.

**Attributes:**
- Case number (unique identifier, format: TD2025XXXXXX)
- Status (intake_submitted, in_review, matched, in_progress, resolved, closed)
- Tenant information
- Property information (address, landlord details)
- Dispute details (type, description, timeline)
- Documents (lease, photos, correspondence)
- Assigned attorney (if matched)
- Created date, updated date

**Relationships:**
- Belongs to one **Tenant**
- May be assigned to one **Attorney**
- Contains multiple **Documents**

**Lifecycle:**
1. Created (tenant submits intake form)
2. In Review (platform reviews case details)
3. Matched (assigned to an attorney)
4. In Progress (attorney working on the case)
5. Resolved (case outcome achieved)
6. Closed (case archived)

---

### Entity: Document

**Definition:** A file uploaded by a tenant or attorney as evidence or support for a case.

**Attributes:**
- File name
- File type (PDF, image, etc.)
- Upload date
- Uploaded by (tenant or attorney)
- Associated case

**Relationships:**
- Belongs to one **Case**

---

## Domain Concepts

### Concept: Case Intake

**Definition:** The process by which a tenant submits their information and case details to the platform.

**Components:**
- Multi-step form (8 steps)
- Data validation
- Document upload
- Case number generation
- Confirmation and next steps

**Goal:** Collect comprehensive information to enable effective attorney matching and case management.

---

### Concept: Attorney Matching

**Definition:** The process of connecting tenants with suitable attorneys based on expertise, availability, and budget.

**Factors:**
- Attorney expertise (landlord-tenant law, eviction defense, etc.)
- Attorney availability (current caseload)
- Attorney budget preferences (lead generation budget)
- Case complexity and requirements
- Geographic location (Davidson County)

**Goal:** Ensure tenants are matched with attorneys who can effectively represent them.

---

### Concept: Case Management

**Definition:** The tools and workflows that attorneys use to manage their cases.

**Components:**
- Dashboard (overview of active cases)
- Task list (deadlines, to-dos)
- Communication tools (messaging with clients)
- Document management (view and upload documents)
- Reporting (case outcomes, performance metrics)

**Goal:** Enable attorneys to efficiently manage multiple cases and provide high-quality legal services.

---

### Concept: User Workspace

**Definition:** The personalized dashboard and interface that tenants and attorneys use to interact with the platform.

**Tenant Workspace:**
- Case overview (status, progress)
- Document upload and management
- Communication with attorney
- Educational resources

**Attorney Workspace:**
- Case list (active, pending, closed)
- Task management
- Client communication
- Performance metrics (KPIs)

**Goal:** Provide a user-friendly, efficient interface tailored to each user type's needs.

---

## Mental Models

### Model: The Tenant is the Hero

**Framework:** The platform exists to empower tenants and help them achieve justice.

**Implications:**
- Design decisions should prioritize the tenant experience
- The platform should be accessible, easy to use, and reassuring
- Attorneys are partners in helping tenants, not the primary focus

**Example:** The tenant dashboard is designed to be simple and encouraging, while the attorney dashboard is more data-rich and functional.

---

### Model: The Platform is a Marketplace

**Framework:** TenantGuard connects supply (attorneys) with demand (tenants) in a two-sided marketplace.

**Implications:**
- The platform must provide value to both tenants and attorneys
- Matching algorithms are critical to success
- Pricing and budget models must balance tenant affordability with attorney compensation

**Example:** Attorneys set lead generation budgets, and the platform matches them with cases that fit their budget and expertise.

---

### Model: Legal Services as a Product

**Framework:** Legal representation is a service that can be standardized, packaged, and delivered efficiently.

**Implications:**
- The platform can reduce costs by streamlining workflows
- Automation and technology can improve efficiency without sacrificing quality
- The platform should measure and optimize key metrics (time to match, case outcomes, etc.)

**Example:** The case intake form standardizes the information collection process, reducing the time attorneys spend on initial consultations.

---

### Model: Trust is Paramount

**Framework:** Users must trust the platform with sensitive personal and legal information.

**Implications:**
- Security and privacy are non-negotiable
- The platform should communicate clearly and transparently
- User data should be protected and used only for its intended purpose

**Example:** All form submissions are validated and securely stored, and the platform uses HTTPS for all communications.

---

## Domain Rules

### Rule: One Case, One Tenant

**Statement:** Each case is initiated by and belongs to a single tenant.

**Rationale:** Simplifies case management and ensures clear ownership.

**Exception:** In the future, the platform may support joint cases (e.g., multiple tenants in the same building).

---

### Rule: One Attorney Per Case

**Statement:** Each case is assigned to a single attorney.

**Rationale:** Ensures clear responsibility and avoids confusion.

**Exception:** In the future, the platform may support team-based representation.

---

### Rule: Case Numbers are Unique and Sequential

**Statement:** Each case is assigned a unique case number in the format TD2025XXXXXX.

**Rationale:** Provides a clear, unambiguous identifier for each case.

**Implementation:** Case numbers are generated using a sequential counter.

---

### Rule: Attorneys Must Be Licensed

**Statement:** Only licensed attorneys can join the platform and represent tenants.

**Rationale:** Ensures legal compliance and protects tenants.

**Implementation:** Attorney applications include bar number verification (to be implemented).

---

### Rule: Geographic Scope is Davidson County

**Statement:** The platform currently serves only Davidson County, Tennessee.

**Rationale:** Focuses the platform on a specific jurisdiction to ensure legal accuracy and relevance.

**Future:** The platform may expand to other jurisdictions.

---

## Domain Workflows

### Workflow: Tenant Submits a Case

1. Tenant visits the TenantGuard website
2. Tenant clicks "Get Started as Tenant"
3. Tenant completes the 8-step case intake form
4. Tenant uploads supporting documents
5. Tenant submits the form
6. Platform generates a unique case number
7. Platform stores the case in the database
8. Platform sends a confirmation to the tenant (to be implemented)
9. Platform notifies attorneys of the new case (to be implemented)

---

### Workflow: Attorney Joins the Platform

1. Attorney visits the TenantGuard website
2. Attorney clicks "Join as Attorney"
3. Attorney completes the 7-step attorney intake form
4. Attorney sets budget and preferences
5. Attorney submits the form
6. Platform generates a unique application ID
7. Platform stores the application in the database
8. Platform reviews the application (manual or automated)
9. Platform approves or rejects the application
10. Platform sends a notification to the attorney (to be implemented)

---

### Workflow: Case is Matched to an Attorney

1. Platform identifies a new case in "intake_submitted" status
2. Platform runs the matching algorithm
3. Platform identifies suitable attorneys based on expertise, availability, and budget
4. Platform assigns the case to the best-match attorney
5. Platform updates the case status to "matched"
6. Platform notifies the attorney of the new case (to be implemented)
7. Platform notifies the tenant of the match (to be implemented)

---

### Workflow: Attorney Works on a Case

1. Attorney logs into the platform
2. Attorney views the case details on their dashboard
3. Attorney reviews the tenant's information and documents
4. Attorney communicates with the tenant through the platform
5. Attorney performs legal work (research, drafting, court appearances)
6. Attorney updates the case status as work progresses
7. Attorney uploads documents and notes
8. Attorney closes the case when resolved

---

## Domain Constraints

### Constraint: Data Privacy

**Requirement:** All user data must be kept confidential and used only for its intended purpose.

**Implementation:** Secure storage, HTTPS, access controls.

---

### Constraint: Legal Compliance

**Requirement:** The platform must comply with all applicable laws and regulations, including attorney licensing, data protection, and consumer protection laws.

**Implementation:** Attorney verification, terms of service, privacy policy.

---

### Constraint: Scalability

**Requirement:** The platform must be able to handle growth in users and cases.

**Current State:** SQLite is sufficient for the current scale but may need to be replaced with a more robust database in the future.

---

### Constraint: Accessibility

**Requirement:** The platform must be accessible to users with disabilities.

**Implementation:** Semantic HTML, ARIA labels, keyboard navigation, screen reader compatibility.

---

## Domain Metrics

### Metric: Time to Match

**Definition:** The time between when a tenant submits a case and when they are matched with an attorney.

**Goal:** Minimize this time to improve tenant satisfaction.

**Current State:** Not yet measured (matching is not yet automated).

---

### Metric: Case Resolution Rate

**Definition:** The percentage of cases that are successfully resolved.

**Goal:** Maximize this rate to demonstrate the platform's effectiveness.

**Current State:** Not yet measured (platform is in early stages).

---

### Metric: Attorney Satisfaction

**Definition:** How satisfied attorneys are with the platform and the cases they receive.

**Goal:** High attorney satisfaction leads to better retention and service quality.

**Current State:** Not yet measured.

---

### Metric: Tenant Satisfaction

**Definition:** How satisfied tenants are with the platform and the legal services they receive.

**Goal:** High tenant satisfaction is the ultimate measure of success.

**Current State:** Not yet measured.
