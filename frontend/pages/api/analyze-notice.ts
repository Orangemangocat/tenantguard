import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Parse the multipart form data
    const form = formidable({
      maxFileSize: 20 * 1024 * 1024, // 20MB
    })

    const [fields, files] = await form.parse(req)
    const uploadedFile = files.document?.[0]

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No document provided' })
    }

    // Read the file
    const fileBuffer = fs.readFileSync(uploadedFile.filepath)
    const base64File = fileBuffer.toString('base64')
    const mimeType = uploadedFile.mimetype || 'application/pdf'

    // Call the Django backend API for analysis
    const backendUrl = process.env.NEXTAUTH_BACKEND_URL || 'http://backend:8000/api/'
    
    // Try calling the backend analyze endpoint
    try {
      const backendResponse = await fetch(`${backendUrl}intake/analyze-notice/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_data: base64File,
          mime_type: mimeType,
          filename: uploadedFile.originalFilename || 'document',
        }),
      })

      if (backendResponse.ok) {
        const result = await backendResponse.json()
        return res.status(200).json(result)
      }
    } catch (backendError) {
      // Backend not available, fall through to OpenAI direct call
      console.log('Backend not available, using direct OpenAI analysis')
    }

    // Fallback: Direct OpenAI analysis if backend is unavailable
    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return res.status(500).json({ error: 'Analysis service temporarily unavailable' })
    }

    const isPdf = mimeType === 'application/pdf'
    
    const messages: any[] = [
      {
        role: 'system',
        content: `You are a Tennessee tenant rights legal document analyzer. Analyze the uploaded document and respond with a JSON object containing:
- documentType: The type of legal notice (e.g., "14-Day Notice to Pay or Quit", "30-Day Notice to Vacate", "Lease Violation Notice", "Eviction Summons", etc.)
- urgencyLevel: One of "critical", "high", "medium", or "low"
- deadline: The response deadline as a human-readable string (e.g., "June 28, 2026 (12 days remaining)")
- summary: A 1-2 sentence plain-language summary of what this document means
- rights: An array of 3-4 tenant rights that apply to this situation under Tennessee law
- recommendedActions: An array of 3-4 specific recommended next steps

Always respond with valid JSON only, no markdown formatting.`
      },
      {
        role: 'user',
        content: isPdf
          ? [
              { type: 'text', text: 'Please analyze this legal notice document and provide the structured analysis.' },
              { type: 'text', text: `[Document content encoded as base64 PDF - filename: ${uploadedFile.originalFilename}]` }
            ]
          : [
              { type: 'text', text: 'Please analyze this legal notice document and provide the structured analysis.' },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64File}` } }
            ]
      }
    ]

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!openaiResponse.ok) {
      throw new Error('AI analysis failed')
    }

    const openaiResult = await openaiResponse.json()
    const analysis = JSON.parse(openaiResult.choices[0].message.content)

    // Clean up temp file
    fs.unlinkSync(uploadedFile.filepath)

    return res.status(200).json(analysis)
  } catch (error: any) {
    console.error('Analysis error:', error)
    return res.status(500).json({ error: 'Analysis failed. Please try again.' })
  }
}
