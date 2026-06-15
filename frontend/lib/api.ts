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

// --- Dashboard API ---

export interface DashboardSummary {
  cases: number
  active_cases: number
  upcoming_deadlines: Array<{
    case_id: number
    case_name: string
    type: string
    date: string
    days_remaining: number
    label: string
  }>
  pending_alerts: number
  recent_analyses: Array<{
    id: number
    document_name: string
    category: string
    summary: string
    analyzed_at: string
  }>
}

export const getDashboardSummary = async (token: string): Promise<DashboardSummary> => {
  const response = await api.get('intake/dashboard/', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

export interface DocumentAnalysisResult {
  id: number
  document_name: string
  category: string
  category_display: string
  extracted_text: string
  summary: string
  key_dates: Array<{ label: string; date: string; is_deadline: boolean }>
  legal_issues: Array<{ issue: string; severity: string; explanation: string }>
  procedural_defects: Array<{ defect: string; explanation: string; actionable: boolean }>
  tenant_rights: Array<{ right: string; statute: string; explanation: string }>
  analyzed_at: string
}

export interface UploadAnalyzeResponse {
  document: {
    id: number
    doc_type: string
    original_filename: string
    uploaded_at: string
  }
  analysis: DocumentAnalysisResult
}

export const uploadAndAnalyzeDocument = async (
  submissionId: number,
  file: File,
  docType: string,
  token: string,
  options?: { received_date?: string; deadline_date?: string; notes?: string }
): Promise<UploadAnalyzeResponse> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('doc_type', docType)
  if (options?.received_date) formData.append('received_date', options.received_date)
  if (options?.deadline_date) formData.append('deadline_date', options.deadline_date)
  if (options?.notes) formData.append('notes', options.notes)

  const response = await api.post(`intake/${submissionId}/upload-analyze/`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

export interface CaseMotion {
  id: number
  motion_type: string
  motion_type_display: string
  title: string
  content: string
  instructions: string
  filing_deadline: string | null
  court_name: string
  filing_fee: string
  status: string
  status_display: string
  generated_at: string
  updated_at: string
}

export const listMotions = async (submissionId: number, token: string): Promise<CaseMotion[]> => {
  const response = await api.get(`intake/${submissionId}/motions/`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

export const generateMotion = async (
  submissionId: number,
  motionType: string,
  token: string
): Promise<CaseMotion> => {
  const response = await api.post(
    `intake/${submissionId}/motions/generate/`,
    { motion_type: motionType },
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return response.data
}

export const updateMotion = async (
  submissionId: number,
  motionId: number,
  data: Partial<CaseMotion>,
  token: string
): Promise<CaseMotion> => {
  const response = await api.patch(
    `intake/${submissionId}/motions/${motionId}/`,
    data,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return response.data
}

export interface CaseActionItem {
  id: number
  title: string
  description: string
  priority: string
  priority_display: string
  due_date: string | null
  completed: boolean
  completed_at: string | null
  order: number
  created_at: string
}

export const listActionItems = async (submissionId: number, token: string): Promise<CaseActionItem[]> => {
  const response = await api.get(`intake/${submissionId}/actions/`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

export const toggleActionItem = async (
  submissionId: number,
  actionId: number,
  completed: boolean,
  token: string
): Promise<CaseActionItem> => {
  const response = await api.patch(
    `intake/${submissionId}/actions/${actionId}/`,
    { completed },
    { headers: { Authorization: `Bearer ${token}` } }
  )
  return response.data
}

export interface CaseAlert {
  id: number
  alert_type: string
  alert_type_display: string
  delivery_method: string
  scheduled_for: string
  message: string
  status: string
  status_display: string
  is_overdue: boolean
  sent_at: string | null
  created_at: string
}

export const listAlerts = async (submissionId: number, token: string): Promise<CaseAlert[]> => {
  const response = await api.get(`intake/${submissionId}/alerts/`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

export const createAlert = async (
  submissionId: number,
  data: {
    alert_type: string
    delivery_method: string
    scheduled_for: string
    message: string
  },
  token: string
): Promise<CaseAlert> => {
  const response = await api.post(`intake/${submissionId}/alerts/create/`, data, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}

// --- Quick Analyze (unauthenticated) ---

export interface QuickAnalyzeResponse {
  token: string
  document_type: string
  summary: string
  urgency: string
  key_dates: Array<{ label: string; date: string; is_deadline: boolean }>
  next_steps: string[]
  analysis_error?: string
}

export const quickAnalyzeDocument = async (file: File): Promise<QuickAnalyzeResponse> => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('intake/quick-analyze/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export interface ClaimUploadResponse {
  submission_id: number
  document_id: number
  doc_type: string
  message: string
}

export const claimUpload = async (
  token: string,
  submissionId: number | null,
  authToken: string
): Promise<ClaimUploadResponse> => {
  const response = await api.post(
    'intake/claim-upload/',
    { token, submission_id: submissionId },
    { headers: { Authorization: `Bearer ${authToken}` } }
  )
  return response.data
}

export default api;
