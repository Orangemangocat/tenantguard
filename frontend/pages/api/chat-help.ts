import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { message, history, userProfile, analysisResult } = req.body

  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) {
    return res.status(500).json({ error: 'AI service temporarily unavailable' })
  }

  try {
    const systemPrompt = `You are a TenantGuard AI assistant helping Tennessee tenants who have received notices from their landlords. You are knowledgeable about Tennessee tenant law, eviction procedures, and tenant rights.

CONTEXT:
${userProfile?.name ? `- Tenant name: ${userProfile.name}` : ''}
${userProfile?.email ? `- Email: ${userProfile.email}` : ''}
${userProfile?.address ? `- Property address: ${userProfile.address}` : ''}
${userProfile?.landlordName ? `- Landlord: ${userProfile.landlordName}` : ''}
${analysisResult ? `- Document analyzed: ${analysisResult.documentType}
- Urgency: ${analysisResult.urgencyLevel}
- Deadline: ${analysisResult.deadline}
- Summary: ${analysisResult.summary}` : ''}

RULES:
1. Be empathetic, clear, and direct. These tenants are often scared and confused.
2. Always reference Tennessee-specific law when applicable.
3. If they need legal representation, mention Nashville's Right to Counsel program and Legal Aid of Middle Tennessee at (615) 244-6610.
4. Never give legal advice — provide legal information and recommend they speak with an attorney for specific legal advice.
5. Keep responses concise and actionable — 2-3 paragraphs max.
6. If they ask about filing a response or motion, explain the process and offer to help them prepare one.
7. If you don't know something specific, say so and recommend they contact Legal Aid.`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      throw new Error('AI service error')
    }

    const result = await response.json()
    const reply = result.choices[0].message.content

    return res.status(200).json({ reply })
  } catch (error: any) {
    console.error('Chat error:', error)
    return res.status(500).json({
      reply: "I'm having trouble connecting right now. Please try again in a moment, or call Legal Aid of Middle Tennessee at (615) 244-6610 for immediate help."
    })
  }
}
