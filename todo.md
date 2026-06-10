# TenantGuard Attorney Portal — TODO

## Design System
- [x] Bizee-inspired theme: white bg, bold typography, orange accent (#f97316), rounded cards
- [x] Google Fonts (Sora display + Inter sans)
- [x] Global CSS tokens in index.css

## Database Schema
- [x] users (extend with role: attorney/client/admin, profile fields)
- [x] attorneyProfiles (firm, bar number, counties served, bio)
- [x] clientCases (tenant case summaries, status)
- [x] caseDocuments (uploaded docs metadata + S3 keys)
- [x] courtRecords (CaseLink prior actions by landlord)
- [x] bids (attorney bids: firstTwoFee, thirdFee, status)
- [x] messages (client <-> attorney follow-up questions)
- [x] consultations (30-min call scheduling, $25 credited)
- [x] payments (Stripe payment records: client onboarding, attorney client purchase, call fee)
- [x] chatIntakes (unmanned chat widget submissions)

## Seed Data
- [x] 6 tenant clients with case summaries
- [x] documents for each client
- [x] prior court records (landlord vs tenant) for each client
- [x] demo attorney profile provisioning

## Backend (tRPC procedures)
- [x] auth role management (role enum widened to attorney/client; bug caught + fixed by tests)
- [x] attorney: availableCases, caseDetail, submitBid, myBids (billing handled via payments router)
- [x] client: myCases, createCase, caseDetail, acceptBid, declineBid, messaging
- [x] messages: send/list thread (both attorney + client sides)
- [x] caseLink: court records for a case (CourtRecordsPanel)
- [x] payments: create checkout sessions (client $250, attorney $100/client min 2, call $25)
- [x] stripe webhook handling (test mode) + shared fulfillment helper
- [x] chat intake: submit endpoint
- [x] demo provisioning (becomeAttorney, becomeClientWithCase, seedBidsForMyCase)

## Frontend Pages
- [x] Home / Attorney Sales Landing (Bizee-inspired) with "Attorney Portal" nav button
- [x] Attorney onboarding/intake with credential verification (single-step form)
- [x] Attorney Dashboard: browse clients, view docs, submit bids, bid status
- [x] Client Dashboard: view bids, accept/decline, message attorneys, schedule call
- [x] Client onboarding/intake (GetStarted creates case; $250 paid from case detail)
- [x] CaseLink court records view (shared)
- [x] Chat intake widget (multi-step, floating)
- [x] Facebook/Instagram ad landing page (standalone /offer, 5-step, Framer Motion)
- [x] Role-based routing + protected routes
- [x] DemoLaunch (/demo) one-click portal exploration

## Payments (Stripe test mode)
- [x] Stripe feature added (keys auto-configured)
- [x] $250 client onboarding
- [x] $100/client attorney (min 2 = $200)
- [x] $25 consultation (credited to fees)

## Testing
- [x] Vitest for bid logic
- [x] Vitest for payment amount calculations
- [x] Vitest for role/credential access control
- [x] Live-DB integration tests (demo provisioning, browsing, bids)
- [x] 15 tests passing across 5 files
- [x] Browser verification pass of key public pages

## Delivery
- [x] Wire all nav buttons (esp. "Attorney Portal"); fixed dead /get-help footer link
- [x] Checkpoint
- [x] Push to GitHub (branch `attorney-portal` on Orangemangocat/tenantguard @ 43f1e89e, 155 files; main untouched)

## Attorney Credential Verification (added per user request)
- [x] Attorney intake form: bar number (required)
- [x] Bar admission state + year admitted
- [x] Jurisdictions/counties licensed to practice (multi-select, includes Davidson County, TN)
- [x] Certification checkbox: good standing + admitted to practice in Davidson County court
- [x] Optional upload: bar card / good-standing (schema supports credentialFileKey; UI capture is a known follow-up)
- [x] Store credentials in attorneyProfiles; verification status field
- [x] Gate bidding so attorney can only bid on cases in certified counties

## Ad Page Copy Tuning (follow-up request)
- [x] Rewrite /offer narrative to lead with cost-saving benefits (no ad markup, flat fees, no retainers, $25 credited)
- [x] Add concrete cost-contrast / savings emphasis to headlines and trust strip
