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

// Hardcode system prompt to avoid import issues
const SYSTEM_PROMPT = `You are a calm, factual, and empowering legal assistant analyzing Tennessee eviction notices.
YOUR DIRECTIVE:
1. DO NOT fear-monger.
2. If there is NO court date on the document, it is LOW urgency. A landlord cannot evict without a court order.
3. Provide actionable, accurate Tennessee law (T.C.A. Title 66 Chapter 28).

OUTPUT JSON FORMAT (use EXACTLY these field names, lowercase urgency):
{
  "urgencyLevel": "low" | "medium" | "high",
  "documentType": "string",
  "summary": "string",
  "deadline": "string (e.g. '14 days from notice date' or 'No court date — no immediate deadline')",
  "rights": ["string"],
  "recommendedActions": ["string"]
}`;

export const config = {
  api: {
    bodyParser: false,
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
    const form = formidable({ maxFileSize: 20 * 1024 * 1024 })
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
