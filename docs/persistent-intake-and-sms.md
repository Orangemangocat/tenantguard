# Persistent Intake & SMS Setup

## Overview

Two major capabilities were added to the TenantGuard intake system:

1. **Persistent chat sessions** — conversations survive browser closes, device restarts, and app crashes. When a user returns, their conversation is fully restored from the server.
2. **SMS / text message intake** — users can complete the entire intake process by texting a phone number, with no account or browser required.

Both channels write to the same audit log, giving you a complete, tamper-proof record of every communication for your legal position.

---

## What Changed

### New Database Models

#### `IntakeChatLog`
Stores every single message exchanged during an intake conversation.

| Field | Description |
|---|---|
| `submission` | Foreign key to the IntakeSubmission this message belongs to |
| `role` | `user` or `assistant` |
| `content` | Full message text |
| `source` | `web` or `sms` |
| `created_at` | Exact timestamp (auto-set, never editable) |

This table is your legal communication log. It is **read-only in the admin panel** — records cannot be added, edited, or deleted by staff. Every web and SMS message is written here automatically.

#### `SMSSession`
Maps an inbound phone number to an active intake submission.

| Field | Description |
|---|---|
| `phone` | Inbound phone number in E.164 format (e.g. `+16155550100`) |
| `submission` | The linked IntakeSubmission |
| `created_at` / `updated_at` | Timestamps |

One row per phone number. When a text arrives from a known number, the existing session is resumed. When a new number texts in, a new session and submission are created automatically.

#### `IntakeSubmission.user` — now nullable
The `user` field on `IntakeSubmission` was changed from required to optional (`null=True`). This allows SMS submissions to exist without a linked user account. Web submissions still always have a user.

---

### New API Endpoints

#### `GET /api/intake/chat/history/`
Returns the full persisted conversation for a submission.

**Auth:** Bearer token required (authenticated users only)

**Query params:**
- `submission_id` (optional) — if omitted, returns the user's most recent draft

**Response:**
```json
{
  "submission_id": 42,
  "status": "draft",
  "urgency_level": "not_urgent",
  "collected_fields": ["first_name", "phone", "county"],
  "messages": [
    { "role": "assistant", "content": "Hi! I'm Maya..." },
    { "role": "user", "content": "My landlord is trying to evict me." }
  ]
}
```

#### `POST /api/intake/sms/`
Twilio webhook endpoint. Receives inbound SMS and replies with TwiML.

**Auth:** Twilio HMAC signature validation (no user auth — identity is the phone number)

**Expected POST body** (sent by Twilio automatically):
- `From` — sender's phone number
- `Body` — message text

This endpoint is public (no login required) but validates the Twilio signature to prevent spoofing.

---

### Frontend Changes (`frontend/pages/intake.tsx`)

On page load, the intake page now:

1. Checks `localStorage` for a saved `tg_intake_submission_id`
2. Calls `GET /api/intake/chat/history/` with that ID
3. If messages exist in the server log, restores them to the UI — the user sees their full prior conversation exactly as they left it
4. Restores the "collected fields" progress indicators
5. If the intake was already completed, shows the completion card immediately
6. Only starts a fresh conversation if no prior session was found

The `submissionId` is saved to `localStorage` each time it is received from the server, so it persists across browser restarts.

---

## Environment Variables

Add the following to `backend/.env`:

```env
# Twilio (required for SMS intake)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+16155550100

# Your public domain (used to build the sign-up link sent at intake completion)
SITE_URL=https://tenantguard.com
```

**Note:** If `TWILIO_AUTH_TOKEN` is not set, signature validation is skipped. This is fine for local development but **must be set in production**.

---

## Twilio Setup

### 1. Create a Twilio account
Go to [twilio.com](https://www.twilio.com) and sign up. You'll need a paid account to get a real phone number (trial accounts can only text verified numbers).

### 2. Buy a phone number
- In the Twilio Console, go to **Phone Numbers → Manage → Buy a number**
- Search for a Tennessee area code (615, 901, 865, 423, etc.) if you want a local feel
- Purchase the number and copy it into your `.env` as `TWILIO_PHONE_NUMBER`

### 3. Configure the webhook
- In the Twilio Console, go to **Phone Numbers → Manage → Active numbers**
- Click your number
- Under **Messaging Configuration**, set:
  - **A message comes in:** `Webhook`
  - **URL:** `https://yourdomain.com/api/intake/sms/`
  - **HTTP Method:** `POST`
- Save

### 4. Copy your credentials
- `TWILIO_ACCOUNT_SID` — found on the Twilio Console dashboard
- `TWILIO_AUTH_TOKEN` — found on the Twilio Console dashboard (click to reveal)

### 5. Install the Python package
The `twilio` package is already added to `requirements.txt`. Install it:

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

---

## Running the Migration

The migration was already generated and applied. If you're setting up a fresh environment or deploying to a new server:

```bash
cd backend
source venv/bin/activate
python manage.py migrate
```

This applies migration `0004_add_chat_log_sms_session` which:
- Makes `IntakeSubmission.user` nullable
- Creates the `IntakeChatLog` table
- Creates the `SMSSession` table

---

## Admin Panel

Three new admin sections are available under the **Intake** group:

### Intake Chat Logs
- Lists every message from every conversation (web and SMS)
- Filterable by role, source (web/SMS), and date
- Searchable by message content, tenant name, and phone number
- **Read-only** — records cannot be modified or deleted
- Use this for legal review, dispute resolution, and audit trails

### SMS Sessions
- Lists every phone number that has texted in
- Shows the linked submission for each number
- Phone field is read-only

### Intake Submissions
- Unchanged, but SMS-originated submissions will show `user: —` (no linked account) until the tenant creates an account

---

## SMS User Flow

When a tenant texts your TenantGuard number:

1. **First text** — A new case file is created automatically. The AI introduces itself and asks what's going on.
2. **Conversation** — The AI gathers name, contact info, property details, landlord info, issue type, and relevant dates through natural back-and-forth. Each reply is under ~300 characters.
3. **Completion** — When enough information is collected, the AI confirms the case is open and sends a link to `SITE_URL/intake` where the tenant can create a free account, upload documents, and get their full case analysis.
4. **Resume** — If the tenant texts again later (same number), the conversation resumes where it left off.

All messages — inbound and outbound — are logged to `IntakeChatLog` with `source=sms`.

---

## Web Session Resume Flow

When a returning web user visits `/intake`:

1. The page checks `localStorage` for `tg_intake_submission_id`
2. It calls the history endpoint with that ID
3. If history is found, the full conversation is rendered immediately — no loading spinner, no re-greeting
4. The "Collected:" field indicators are restored based on what was already saved to the submission
5. If the intake was already marked complete, the completion card is shown and the input is locked
6. If no history is found (new user or cleared localStorage), the AI greeting fires as normal

---

## Files Modified

| File | Change |
|---|---|
| `backend/intake/models.py` | Added `IntakeChatLog`, `SMSSession`; made `user` nullable |
| `backend/intake/chat_views.py` | Save every message to `IntakeChatLog`; added `IntakeChatHistoryView` |
| `backend/intake/sms_views.py` | **New** — Twilio webhook handler for SMS intake |
| `backend/intake/urls.py` | Added `chat/history/` and `sms/` routes |
| `backend/intake/admin.py` | Registered `IntakeChatLog` and `SMSSession` in admin |
| `backend/requirements.txt` | Added `twilio==9.3.6` |
| `backend/intake/migrations/0004_add_chat_log_sms_session.py` | **New** — migration for the above model changes |
| `frontend/lib/api.ts` | Added `getIntakeChatHistory()` and `IntakeChatHistory` type |
| `frontend/pages/intake.tsx` | Session restore on load; persist `submissionId` to localStorage |
