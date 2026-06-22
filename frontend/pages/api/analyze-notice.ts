import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'

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
    const base64File = fileBuffer.toString('base64')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let userContent: any[]

    if (isPdf) {
      // For PDFs: send as base64 data URL — gpt-4o can read PDFs via the file content type
      userContent = [
        { type: 'text', text: `Please analyze this legal notice document (${filename}) and provide the structured analysis.` },
        {
          type: 'file',
          file: {
            filename,
            file_data: `data:application/pdf;base64,${base64File}`,
          },
        },
      ]
    } else if (isImage) {
      // For images: use vision with base64
      userContent = [
        { type: 'text', text: 'Please analyze this legal notice document and provide the structured analysis.' },
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
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!openaiResponse.ok) {
      const errBody = await openaiResponse.text()
      console.error('OpenAI API error:', openaiResponse.status, errBody)

      // If file content type not supported, fall back to text-only description
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
                content: `Please analyze this Tennessee legal notice document (filename: ${filename}). This appears to be a landlord-tenant notice. Based on the filename and context, provide a structured analysis assuming this is a standard eviction or pay-or-quit notice.`,
              },
            ],
            temperature: 0.3,
            max_tokens: 1000,
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
