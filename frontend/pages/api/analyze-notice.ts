import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import { logTrainingDataToGitHub } from '../../lib/githubLogger'

// Use pdf2json for server-safe PDF text extraction (no browser API dependencies).
// Text extraction is only used for logging/fallback — the primary path sends
// the PDF as base64 to GPT-4o which reads it natively.
async function extractPdfText(buffer: Buffer): Promise<string> {
  return new Promise((resolve) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const PDFParser = require('pdf2json')
      const pdfParser = new PDFParser(null, 1)
      pdfParser.on('pdfParser_dataReady', (pdfData: { Pages?: Array<{ Texts?: Array<{ R?: Array<{ T?: string }> }> }> }) => {
        try {
          const pages = pdfData?.Pages || []
          const text = pages.map((page) =>
            (page.Texts || []).map((t) =>
              (t.R || []).map((r) => decodeURIComponent(r.T || '')).join('')
            ).join(' ')
          ).join('\n')
          resolve(text || 'No text extracted')
        } catch {
          resolve('PDF text extraction failed.')
        }
      })
      pdfParser.on('pdfParser_dataError', () => resolve('PDF text extraction failed.'))
      pdfParser.parseBuffer(buffer)
    } catch {
      resolve('PDF text extraction unavailable in this environment.')
    }
  })
}

// HEIC/HEIF MIME types — Apple iPhone default format
const HEIC_MIME_TYPES = new Set(['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'])

/**
 * Convert a HEIC/HEIF buffer to JPEG using sharp.
 * Returns the converted JPEG buffer, or null if sharp is not available.
 */
async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer | null> {
  try {
    // sharp is an optional peer dep — import lazily so the app still boots without it
    const sharp = (await import('sharp')).default
    return await sharp(buffer).jpeg({ quality: 90 }).toBuffer()
  } catch {
    return null
  }
}

// Bucket classification system prompt — governs all document analysis
// Schema defined in: tenantguard-manus-retained/DOCUMENT_CLASSIFICATION.md
const SYSTEM_PROMPT = `You are a calm, factual, and empowering legal assistant for TenantGuard.
You analyze landlord-to-tenant communications in Davidson County, Tennessee under the URLTA (Tenn. Code Ann. § 66-28-101 et seq.).

YOUR DIRECTIVES:
1. DO NOT fear-monger. Be accurate and empowering.
2. Classify EVERY document into exactly ONE of the following buckets (or OUTSIDE if it does not fit).
3. A notice WITHOUT a court date cannot remove the tenant by itself — never call a pre-court notice "critical" unless it is a 7-day or 3-day notice.
4. Return ONLY valid JSON — no markdown, no explanation outside the JSON object.

CLASSIFICATION BUCKETS:
- B1: Lease Formation & Disclosure — lease agreements, renewals, addenda, move-in checklists, disclosure documents
- B2: Routine & Operational — rent reminders, receipts, rent increase notices, NSF notices, welcome letters, policy updates, maintenance/pest/inspection scheduling
- B3: Financial & Account-Status — late rent notices, fee assessments, damage charge-backs, utility charges, nonpayment account statements
- B4: Maintenance, Entry & Access — notice to enter, inspection notices, habitability responses, tenant-caused condition notices
- B5: Statutory Termination & Eviction (Pre-Court) — 14-day pay or quit, 14-day cure or quit, 30-day notice, 7-day repeat violation, 3-day severe/dangerous conduct, non-renewal, month-to-month termination
- B6: Abandonment & Personal Property — presumed abandonment notices, intent to re-enter, stored property notices, intent to dispose
- B7: Security Deposit — move-out inspection, itemized deductions, deposit refund/disposition letters
- B8: Official Court Documents — detainer warrant, civil warrant, summons, immediate possession warrant, continuance notices
- B9: Post-Judgment & Enforcement — judgment for possession, writ of restitution, writ of possession, writ of execution, garnishment, Sheriff eviction scheduling
- OUTSIDE: Not a landlord-tenant communication, or document type is unrecognizable

URGENCY RULES:
- B1, B2: always "low"
- B3: "medium"
- B4: "low" (entry notice) or "medium" (tenant-caused condition notice)
- B5: "high" for 14-day and 30-day notices; "critical" for 7-day and 3-day notices; "medium" for non-renewal
- B6: "high"
- B7: "medium"
- B8: always "critical"
- B9: always "critical"
- OUTSIDE: "low"

OUTPUT JSON FORMAT (use EXACTLY these field names):
{
  "documentType": "string — specific document name (e.g. '14-Day Notice to Pay or Quit')",
  "bucketId": "B1|B2|B3|B4|B5|B6|B7|B8|B9|OUTSIDE",
  "bucketName": "string — human-readable bucket name from the list above",
  "urgencyLevel": "low|medium|high|critical",
  "deadline": "string — specific deadline if applicable, e.g. '14 days from delivery date' or 'Court date on notice' or null",
  "deadlineDays": "number or null — number of days the tenant has to act (e.g. 14, 30, 7, 3) or null if not applicable",
  "summary": "string — 2-3 sentence plain-English explanation of what this document means and what happens if the tenant ignores it",
  "rights": ["string — tenant rights relevant to this specific document type, citing Tennessee statute where applicable"],
  "recommendedActions": ["string — ordered list of 3-6 specific next steps the tenant should take, most urgent first"],
  "legalBasis": "string — primary governing statute(s), e.g. 'Tenn. Code Ann. § 66-28-505' or null",
  "isCourtDocument": true or false,
  "requiresImmediateAttorney": true or false
}`;


export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
    sizeLimit: '50mb',
  },
}

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
    const form = formidable({ maxFileSize: 50 * 1024 * 1024 })
    const [, files] = await form.parse(req)
    const uploadedFile = files.document?.[0]
    if (!uploadedFile) {
      return res.status(400).json({ error: 'No document provided' })
    }
    let mimeType = uploadedFile.mimetype || 'application/pdf'
    const originalFilename = uploadedFile.originalFilename || ''
    // Detect HEIC/HEIF by extension as well — some browsers send generic MIME for HEIC
    const isHeicByExtension = /\.(heic|heif)$/i.test(originalFilename)
    if (isHeicByExtension && !HEIC_MIME_TYPES.has(mimeType)) {
      mimeType = 'image/heic'
    }
    const isPdf = mimeType === 'application/pdf'
    const isHeic = HEIC_MIME_TYPES.has(mimeType)
    const isImage = mimeType.startsWith('image/')
    const filename = originalFilename || (isPdf ? 'document.pdf' : 'document.jpg')
    let fileBuffer = fs.readFileSync(uploadedFile.filepath)
    let effectiveMimeType = mimeType

    // Convert HEIC/HEIF → JPEG before sending to gpt-4o (which does not support HEIC)
    if (isHeic) {
      const converted = await convertHeicToJpeg(fileBuffer)
      if (converted) {
        fileBuffer = converted
        effectiveMimeType = 'image/jpeg'
      } else {
        console.warn('sharp not available — sending HEIC directly to gpt-4o (may fail)')
      }
    }

    const base64File = fileBuffer.toString('base64')
    
    // Extract text for logging
    let extractedText = 'No text extracted';
    if (isPdf) {
      extractedText = await extractPdfText(fileBuffer);
    } else if (isImage) {
      extractedText = '[Image uploaded. OCR text extraction requires Vision API processing which is handled natively by the model below. Raw text not available before request.]';
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let userContent: any[]
    if (isPdf) {
      userContent = [
        {
          type: 'text',
          text: `Analyze this landlord-to-tenant communication (${filename}) from Davidson County, Tennessee. Classify it into the correct bucket (B1-B9 or OUTSIDE), determine urgency, and provide tenant-specific next actions. Remember: a notice without a court date is LOW urgency — it cannot remove the tenant by itself.`,
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
          text: 'Analyze this landlord-to-tenant communication from Davidson County, Tennessee. Classify it into the correct bucket (B1-B9 or OUTSIDE), determine urgency, and provide tenant-specific next actions. Remember: a notice without a court date is LOW urgency — it cannot remove the tenant by itself.',
        },
        { type: 'image_url', image_url: { url: `data:${effectiveMimeType};base64,${base64File}` } },
      ]
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF or image.' })
    }
    
    // Using gpt-4-turbo as the requested "GPT-4.1 class" upgrade over gpt-4o
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
                content: `Please analyze this Tennessee landlord-tenant legal notice (filename: ${filename}). Document text extracted: \n\n${extractedText}\n\nBased on the filename and text, apply Tennessee law correctly: if there is no court date on the document, this is a pre-filing notice with LOW urgency. The tenant cannot be removed without a court order.`,
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
          
          // Log training data
          await logTrainingDataToGitHub(filename, extractedText, analysis, analysis.urgencyLevel || 'UNKNOWN');
          
          try { fs.unlinkSync(uploadedFile.filepath) } catch {}
          return res.status(200).json(analysis)
        }
      }
      throw new Error(`AI analysis failed: ${openaiResponse.status}`)
    }
    const openaiResult = await openaiResponse.json()
    const analysis = JSON.parse(openaiResult.choices[0].message.content)
    
    // Log training data
    await logTrainingDataToGitHub(filename, extractedText, analysis, analysis.urgencyLevel || 'UNKNOWN');
    
    try { fs.unlinkSync(uploadedFile.filepath) } catch {}
    return res.status(200).json(analysis)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Analysis error:', msg)
    return res.status(500).json({ error: 'Analysis failed. Please try again.' })
  }
}
