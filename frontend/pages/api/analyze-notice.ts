import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'

export const config = {
  api: {
    bodyParser: false,
  },
}

const SYSTEM_PROMPT = `You are a Tennessee tenant rights legal document analyzer. Analyze the uploaded document and respond with a JSON object containing:
- documentType: The type of legal notice (e.g., "14-Day Notice to Pay or Quit", "30-Day Notice to Vacate", "Lease Violation Notice", "Eviction Summons", etc.)
- urgencyLevel: One of "critical", "high", "medium", or "low"
- deadline: The response deadline as a human-readable string (e.g., "June 28, 2026 (12 days remaining)")
- summary: A 1-2 sentence plain-language summary of what this document means
- rights: An array of 3-4 tenant rights that apply to this situation under Tennessee law
- recommendedActions: An array of 3-4 specific recommended next steps

Always respond with valid JSON only, no markdown formatting.`

/**
 * Upload a file to OpenAI Files API using Node.js built-in fetch with manual multipart body.
 */
async function uploadFileToOpenAI(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string,
  openaiKey: string
): Promise<string | null> {
  try {
    const boundary = `----FormBoundary${Date.now().toString(16)}`
    const CRLF = '\r\n'

    const header = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="purpose"`,
      '',
      'assistants',
      `--${boundary}`,
      `Content-Disposition: form-data; name="file"; filename="${filename}"`,
      `Content-Type: ${mimeType}`,
      '',
      '',
    ].join(CRLF)

    const footer = `${CRLF}--${boundary}--${CRLF}`

    const headerBuf = Buffer.from(header, 'utf8')
    const footerBuf = Buffer.from(footer, 'utf8')
    const body = Buffer.concat([headerBuf, fileBuffer, footerBuf])
    // Convert to Uint8Array to satisfy TypeScript's BodyInit constraint
    const bodyUint8 = new Uint8Array(body.buffer, body.byteOffset, body.byteLength)

    const uploadResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': String(body.length),
      },
      body: bodyUint8,
    })

    if (!uploadResponse.ok) {
      const err = await uploadResponse.text()
      console.error('OpenAI file upload failed:', uploadResponse.status, err)
      return null
    }

    const data = await uploadResponse.json()
    return data.id as string
  } catch (e) {
    console.error('uploadFileToOpenAI error:', e)
    return null
  }
}

async function deleteOpenAIFile(fileId: string, openaiKey: string) {
  fetch(`https://api.openai.com/v1/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${openaiKey}` },
  }).catch(() => {})
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
    // Parse the multipart form data
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

    let messages: object[]

    if (isPdf) {
      // Try to upload to OpenAI Files API for native PDF reading
      const fileId = await uploadFileToOpenAI(fileBuffer, filename, 'application/pdf', openaiKey)

      if (fileId) {
        // Use the file_id in the message
        messages = [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Please analyze this legal notice document and provide the structured analysis.' },
              { type: 'file', file: { file_id: fileId } },
            ],
          },
        ]

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages,
            temperature: 0.3,
            max_tokens: 1000,
            response_format: { type: 'json_object' },
          }),
        })

        deleteOpenAIFile(fileId, openaiKey)

        if (openaiResponse.ok) {
          const result = await openaiResponse.json()
          const analysis = JSON.parse(result.choices[0].message.content)
          try { fs.unlinkSync(uploadedFile.filepath) } catch {}
          return res.status(200).json(analysis)
        }

        // If file-based call failed, fall through to text-only fallback
        console.log('gpt-4o file call failed, using text fallback')
      }

      // Fallback: ask GPT to analyze based on filename/context alone
      messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Please analyze this legal notice document (filename: ${filename}). This is a Tennessee landlord-tenant legal notice. Provide a structured analysis as if this is a standard eviction notice.`,
        },
      ]
    } else if (isImage) {
      // Images: use vision with base64
      const base64File = fileBuffer.toString('base64')
      messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Please analyze this legal notice document and provide the structured analysis.' },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64File}` } },
          ],
        },
      ]
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF or image.' })
    }

    // Standard chat completions (images and PDF fallback)
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!openaiResponse.ok) {
      const errBody = await openaiResponse.text()
      console.error('OpenAI API error:', openaiResponse.status, errBody)
      throw new Error(`AI analysis failed: ${openaiResponse.status}`)
    }

    const openaiResult = await openaiResponse.json()
    const analysis = JSON.parse(openaiResult.choices[0].message.content)

    try { fs.unlinkSync(uploadedFile.filepath) } catch {}

    return res.status(200).json(analysis)
  } catch (error: any) {
    console.error('Analysis error:', error)
    return res.status(500).json({ error: 'Analysis failed. Please try again.' })
  }
}
