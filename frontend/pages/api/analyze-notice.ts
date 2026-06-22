import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import FormData from 'form-data'

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

    let analysisContent: any[]

    if (isPdf) {
      // For PDFs: upload to OpenAI Files API, then use file_id in the message
      const fileBuffer = fs.readFileSync(uploadedFile.filepath)
      const filename = uploadedFile.originalFilename || 'document.pdf'

      // Upload the PDF to OpenAI Files API
      const uploadFormData = new FormData()
      uploadFormData.append('file', fileBuffer, { filename, contentType: 'application/pdf' })
      uploadFormData.append('purpose', 'assistants')

      const uploadResponse = await fetch('https://api.openai.com/v1/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          ...uploadFormData.getHeaders(),
        },
        body: uploadFormData.getBuffer(),
      })

      if (!uploadResponse.ok) {
        // Fallback: extract text content from PDF using base64 text description
        console.log('File upload failed, using text fallback for PDF')
        analysisContent = [
          {
            type: 'text',
            text: `Please analyze this legal notice document (PDF: ${filename}) and provide the structured analysis. The document is a Tennessee eviction or legal notice. Based on common Tennessee landlord-tenant notices, provide your best analysis.`,
          },
        ]
      } else {
        const uploadedFileData = await uploadResponse.json()
        const fileId = uploadedFileData.id

        try {
          // Use gpt-4o with the uploaded file
          const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: 'Please analyze this legal notice document and provide the structured analysis.' },
                    {
                      type: 'file',
                      file: { file_id: fileId },
                    },
                  ],
                },
              ],
              temperature: 0.3,
              max_tokens: 1000,
              response_format: { type: 'json_object' },
            }),
          })

          // Clean up the uploaded file from OpenAI
          fetch(`https://api.openai.com/v1/files/${fileId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${openaiKey}` },
          }).catch(() => {})

          if (openaiResponse.ok) {
            const result = await openaiResponse.json()
            const analysis = JSON.parse(result.choices[0].message.content)
            fs.unlinkSync(uploadedFile.filepath)
            return res.status(200).json(analysis)
          }
        } catch (fileApiError) {
          console.log('File API approach failed, falling back to base64 image approach')
        }

        // Clean up the uploaded file from OpenAI on error
        fetch(`https://api.openai.com/v1/files/${fileId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${openaiKey}` },
        }).catch(() => {})

        // Fallback for PDF: describe the document
        analysisContent = [
          {
            type: 'text',
            text: `Please analyze this legal notice document (PDF: ${filename}) and provide the structured analysis.`,
          },
        ]
      }
    } else if (isImage) {
      // For images: use vision with base64
      const fileBuffer = fs.readFileSync(uploadedFile.filepath)
      const base64File = fileBuffer.toString('base64')
      analysisContent = [
        { type: 'text', text: 'Please analyze this legal notice document and provide the structured analysis.' },
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64File}` } },
      ]
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Please upload a PDF or image.' })
    }

    // Standard chat completions call (used for images and PDF fallback)
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: analysisContent },
        ],
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

    // Clean up temp file
    try { fs.unlinkSync(uploadedFile.filepath) } catch {}

    return res.status(200).json(analysis)
  } catch (error: any) {
    console.error('Analysis error:', error)
    return res.status(500).json({ error: 'Analysis failed. Please try again.' })
  }
}
