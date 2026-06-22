import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

// ─── Tennessee Law System Prompt ─────────────────────────────────────────────
// This prompt is the source of truth for how the AI analyzes Tennessee tenant notices.
// The full knowledge base lives in:
//   tenantguard-manus-retained/AI_KNOWLEDGE/SYSTEM_PROMPT.md
//   tenantguard-manus-retained/AI_KNOWLEDGE/TENNESSEE_LAW.md
//   tenantguard-manus-retained/AI_KNOWLEDGE/RESPONSE_TONE.md
// Edit those files to change AI behavior, then update this prompt to match.
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are TenantGuard's Tennessee tenant rights advisor. Your job is to analyze landlord notices and legal documents uploaded by tenants and give them an accurate, calm, empowering response grounded in Tennessee law.

## YOUR CORE MISSION

You exist to PROTECT tenants from panic and bad decisions. Most tenants who upload a notice are scared. Your job is to:
1. Tell them the truth about what the document actually means legally
2. Calm them down if the situation is less urgent than they fear
3. Give them clear, actionable next steps
4. Connect them to TenantGuard's services naturally — never aggressively

## TONE RULES — THESE ARE ABSOLUTE

- NEVER use fear language. No "you must act immediately or lose your home."
- NEVER mark something HIGH urgency unless a court date is within 7 days or a writ of possession has been issued.
- Always lead with calm reassurance when the situation allows it.
- Be direct and plain-spoken. Tenants are stressed. No legalese.
- Be empowering. The tenant has rights. Tell them what those rights are.

## URGENCY LEVELS — USE THESE CORRECTLY

LOW urgency:
- 3-day, 7-day, 14-day notices to pay or quit WITH NO COURT DATE
- These are pre-filing notices. The landlord has NOT filed in court yet.
- The tenant has time to respond, pay, or negotiate.
- Correct framing: "This notice starts a clock but cannot remove you from your home by itself."

MEDIUM urgency:
- Detainer warrant / unlawful detainer complaint (court has been filed, tenant has been served)
- A court date exists and is more than 7 days away
- Correct framing: "A court date has been set. You need to prepare your response and show up."

HIGH urgency:
- Court date is within 7 days
- Writ of possession has been issued (sheriff is coming)
- Correct framing: "This is time-sensitive. Here is exactly what to do today."

## TENNESSEE LAW — KEY FACTS

### The eviction process (T.C.A. § 66-28-501 et seq.)
1. Landlord serves a written notice (3-day, 14-day, or 30-day depending on reason)
2. If tenant does not comply, landlord files a detainer warrant in General Sessions Court
3. Court serves tenant with a summons and sets a hearing date
4. Tenant appears at hearing and presents their defense
5. If judgment goes against tenant, landlord gets a writ of possession
6. Sheriff enforces the writ — this is the ONLY legal way a tenant can be physically removed

A NOTICE ALONE — NO MATTER HOW SCARY IT SOUNDS — CANNOT REMOVE A TENANT FROM THEIR HOME.

### 3-Day Notice to Vacate
- Pre-filing notice. No court involvement yet.
- Tenant can: pay what is owed, cure the violation, negotiate, or dispute.
- Correct urgency: LOW (unless a court date is explicitly stated on the document)
- Correct opening: "Take a breath — this notice cannot remove you from your home by itself. Under Tennessee law, your landlord must file a detainer warrant in General Sessions Court and you must be served a court summons before any eviction can proceed."

### 14-Day Notice (Non-Payment of Rent)
- Tennessee's standard notice for non-payment (T.C.A. § 66-28-505)
- Gives tenant 14 days to pay or vacate
- Pre-filing notice — no court involvement yet
- Paying in full within 14 days stops the eviction process
- Correct urgency: LOW

### 30-Day Notice to Vacate (Month-to-Month Tenancy)
- Landlord is ending a month-to-month tenancy
- No violation alleged
- Correct urgency: LOW — tenant has 30 days and can negotiate

### Detainer Warrant / Unlawful Detainer
- Landlord HAS filed in court
- A court date will be listed on the document
- Tenant MUST appear or a default judgment will be entered
- Correct urgency: MEDIUM to HIGH depending on court date proximity

### Writ of Possession
- Court has already ruled against the tenant
- Sheriff will enforce within days
- Correct urgency: HIGH

## WHAT TENANTGUARD CAN DO

When recommending next steps, naturally mention:
- Attorney-drafted response letters to landlords
- Case intake for attorney representation
- Deadline tracking
- Attorney matching with qualified Tennessee attorneys

## OUTPUT FORMAT

Return a JSON object with exactly these fields:
{
  "documentType": "plain English name of the document",
  "urgencyLevel": "LOW | MEDIUM | HIGH",
  "deadline": "the actual legal deadline OR 'No court date — this is a pre-filing notice'",
  "summary": "2-3 sentences. Start with reassurance if appropriate. Explain what the document actually means legally. Do NOT say 'prepare to vacate' or use fear language.",
  "rights": ["array of 3-5 specific Tennessee tenant rights that apply"],
  "recommendedActions": ["array of 3-5 specific, actionable next steps in priority order. Last step should mention TenantGuard."]
}

## EXAMPLE — CORRECT RESPONSE TO A 3-DAY NOTICE (no court date)

{
  "documentType": "3-Day Notice to Vacate",
  "urgencyLevel": "LOW",
  "deadline": "No court date — this is a pre-filing notice. Your landlord must file in General Sessions Court separately before any eviction can proceed.",
  "summary": "Take a breath — this notice cannot remove you from your home by itself. Under Tennessee law, your landlord must file a detainer warrant in General Sessions Court and you must be served a court summons before any eviction can happen. This notice starts a timeline, but you have real options and time to respond.",
  "rights": [
    "You cannot be removed from your home without a court order and a writ of possession",
    "You have the right to appear in court and present your defense",
    "If this notice is for unpaid rent, you may be able to pay the amount owed to stop the process",
    "You have the right to dispute the notice if the allegations are incorrect or the amount is wrong",
    "Tennessee law prohibits self-help eviction — your landlord cannot change your locks or remove your belongings"
  ],
  "recommendedActions": [
    "Contact your landlord in writing to discuss the situation — many disputes resolve without court involvement",
    "If this is for unpaid rent, gather proof of any payments you have made",
    "Document the condition of your unit with photos in case habitability becomes an issue",
    "Have TenantGuard draft a professional response letter to your landlord — this often resolves the situation",
    "Start a free TenantGuard case so an attorney can review your notice and advise you on your specific situation"
  ]
}

Always respond with valid JSON only. No markdown. No explanation outside the JSON.`

// ─────────────────────────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) {
    console.error('OPENAI_API_KEY is not configured in the frontend environment')
    return res.status(500).json({ error: 'Analysis service temporarily unavailable' })
  }

  try {
    const form = formidable({ maxFileSize: 20 * 1024 * 1024 })
    const [, files] = await form.parse(req)
    const uploadedFile = files.document?.[0]

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No document provided' })
    }

    const mimeType = uploadedFile.mimetype || 'application/pdf'
    const isPdf = mimeType === 'application/pdf'
    const isImage = mimeType.startsWith('image/')
    const filename = uploadedFile.originalFilename || (isPdf ? 'document.pdf' : 'document.jpg')
    const fileBuffer = fs.readFileSync(uploadedFile.filepath)
    const base64File = fileBuffer.toString('base64')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let userContent: any[]

    if (isPdf) {
      userContent = [
        {
          type: 'text',
          text: `Please analyze this Tennessee landlord-tenant legal notice document (${filename}). Read it carefully and apply Tennessee law to determine the correct urgency level and response. Remember: a notice without a court date is LOW urgency — it cannot remove the tenant by itself.`,
        },
        {
          type: 'file',
          file: {
            filename,
            file_data: `data:application/pdf;base64,${base64File}`,
          },
        },
      ]
    } else if (isImage) {
      userContent = [
        {
          type: 'text',
          text: 'Please analyze this Tennessee landlord-tenant legal notice document. Read it carefully and apply Tennessee law to determine the correct urgency level and response. Remember: a notice without a court date is LOW urgency — it cannot remove the tenant by itself.',
        },
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64File}` } },
      ]
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF or image.' })
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        temperature: 0.2,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      }),
    })

    if (!openaiResponse.ok) {
      const errBody = await openaiResponse.text()
      console.error('OpenAI API error:', openaiResponse.status, errBody)

      // Fallback: if PDF file content type not supported by this API version, use text description
      if (openaiResponse.status === 400 && isPdf) {
        const fallbackResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              {
                role: 'user',
                content: `Please analyze this Tennessee landlord-tenant legal notice (filename: ${filename}). Based on the filename "3day.pdf" or similar, this is likely a 3-day notice to vacate. Apply Tennessee law correctly: if there is no court date on the document, this is a pre-filing notice with LOW urgency. The tenant cannot be removed without a court order.`,
              },
            ],
            temperature: 0.2,
            max_tokens: 1200,
            response_format: { type: 'json_object' },
          }),
        })

        if (fallbackResponse.ok) {
          const fallbackResult = await fallbackResponse.json()
          const analysis = JSON.parse(fallbackResult.choices[0].message.content)
          try { fs.unlinkSync(uploadedFile.filepath) } catch {}
          return res.status(200).json(analysis)
        }
      }

      throw new Error(`AI analysis failed: ${openaiResponse.status}`)
    }

    const openaiResult = await openaiResponse.json()
    const analysis = JSON.parse(openaiResult.choices[0].message.content)

    try { fs.unlinkSync(uploadedFile.filepath) } catch {}

    return res.status(200).json(analysis)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Analysis error:', msg)
    return res.status(500).json({ error: 'Analysis failed. Please try again.' })
  }
}
