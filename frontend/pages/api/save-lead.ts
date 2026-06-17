import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, email, phone, address, landlordName, analysisResult, source } = req.body

  try {
    // Try to save to the Django backend
    const backendUrl = process.env.NEXTAUTH_BACKEND_URL || 'http://backend:8000/api/'

    const response = await fetch(`${backendUrl}intake/lead/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        phone: phone || '',
        address: address || '',
        landlord_name: landlordName || '',
        document_type: analysisResult?.documentType || '',
        urgency_level: analysisResult?.urgencyLevel || '',
        deadline: analysisResult?.deadline || '',
        summary: analysisResult?.summary || '',
        rights: analysisResult?.rights || [],
        recommended_actions: analysisResult?.recommendedActions || [],
        source: source || 'get-help-page',
      }),
    })

    if (response.ok) {
      const data = await response.json()
      return res.status(200).json({ success: true, id: data.id })
    }

    // If backend endpoint doesn't exist yet, log and return success
    // The data was captured in the chat flow regardless
    console.log('Lead captured (backend endpoint pending):', { name, email, source })
    return res.status(200).json({ success: true, pending: true })
  } catch (error: any) {
    // Don't fail the user experience if lead save fails
    console.error('Lead save error:', error.message)
    return res.status(200).json({ success: true, pending: true })
  }
}
