import axios from 'axios';

// Media URLs in the DB were saved with the internal Docker hostname.
// Strip the origin so nginx serves them via its /media/ location block.
export function fixMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'backend') return parsed.pathname + parsed.search;
  } catch {
    // already a relative path
  }
  return url;
}

const baseURL =
  typeof window === 'undefined'
    ? process.env.INTERNAL_API_URL || 'http://backend:8000/api/'
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/';

const api = axios.create({ baseURL });

export const getPosts = async (search = '') => {
  const response = await api.get(`blog/posts/?search=${search}`);
  return response.data;
};

export const getPost = async (slug: string) => {
  const response = await api.get(`blog/posts/${slug}/`);
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get('blog/categories/');
  return response.data;
};

export const createComment = async (slug: string, content: string, token: string) => {
  const response = await api.post(`blog/posts/${slug}/comments/`, { content }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// --- Intake API ---

export const submitIntake = async (data: Record<string, unknown>, token: string) => {
  const response = await api.post('intake/submit/', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const uploadIntakeDocument = async (
  submissionId: number,
  docType: string,
  file: File,
  token: string
) => {
  const formData = new FormData();
  formData.append('doc_type', docType);
  formData.append('file', file);
  const response = await api.post(`intake/${submissionId}/documents/`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const analyzeIntake = async (submissionId: number, token: string) => {
  const response = await api.post(`intake/${submissionId}/analyze/`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getIntakeSubmission = async (submissionId: number, token: string) => {
  const response = await api.get(`intake/${submissionId}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const listIntakeSubmissions = async (token: string) => {
  const response = await api.get('intake/', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createCheckoutSession = async (submissionId: number, token: string) => {
  const response = await api.post(`intake/${submissionId}/checkout/`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data as { checkout_url: string; price_display: string };
};

export const getIntakePrice = async (token: string) => {
  const response = await api.get('intake/price/', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data as { price_cents: number; price_display: string };
};

export interface IntakeChatHistory {
  submission_id: number | null
  status: string
  urgency_level: string
  collected_fields: string[]
  messages: { role: 'user' | 'assistant'; content: string }[]
}

export const getIntakeChatHistory = async (
  token: string,
  submissionId?: number
): Promise<IntakeChatHistory> => {
  const params = submissionId ? `?submission_id=${submissionId}` : ''
  const response = await api.get(`intake/chat/history/${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data as IntakeChatHistory
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatSSEEvent {
  type: 'submission_id' | 'text' | 'intake_saved' | 'intake_complete' | 'done' | 'error'
  id?: number
  content?: string
  fields?: string[]
  submission_id?: number
  urgency?: string
  message?: string
}

/**
 * Streams an intake chat turn from the Django backend.
 * Calls onEvent for each SSE event received.
 */
export async function streamIntakeChat(
  messages: ChatMessage[],
  token: string,
  onEvent: (event: ChatSSEEvent) => void,
  submissionId?: number
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? ''
  const response = await fetch(`${baseUrl}/intake/chat/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages, submission_id: submissionId ?? null }),
  })

  if (!response.ok || !response.body) {
    onEvent({ type: 'error', message: `Request failed: ${response.status}` })
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const event: ChatSSEEvent = JSON.parse(line.slice(6))
        onEvent(event)
      } catch {
        // skip malformed events
      }
    }
  }
}

export default api;
