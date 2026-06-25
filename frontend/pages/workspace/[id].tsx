/**
 * TenantGuard — Real Workspace Page
 * /workspace/[id]
 *
 * Authenticated workspace for a specific IntakeSubmission.
 * Loads real data from the Django backend via the existing API endpoints.
 * Mirrors the design language of workspace-demo.tsx but driven by live data.
 */
import React, { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle, Bell, BookOpen, Calendar, CheckCircle2,
  ChevronRight, Clock, CreditCard, FileText, Gavel, Loader2,
  Lock, MessageSquare, Plus, RefreshCw, Shield, Upload,
  X, CheckCheck, AlertCircle, Zap,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  listIntakeSubmissions,
  getDashboardSummary,
  listMotions,
  generateMotion,
  updateMotion,
  listActionItems,
  toggleActionItem,
  listAlerts,
  uploadAndAnalyzeDocument,
  CaseMotion,
  CaseActionItem,
  CaseAlert,
  DashboardSummary,
} from '@/lib/api'
import api from '@/lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Submission {
  id: number
  status: string
  issue_type: string
  issue_type_display?: string
  full_name: string
  county: string
  court_date: string | null
  response_deadline: string | null
  urgency_level: string
  created_at: string
  street_address?: string
  city?: string
  state?: string
  landlord_name?: string
  ai_summary?: string
  ai_tenant_rights?: string[]
  ai_recommended_actions?: string[]
  ai_procedural_defects?: string[]
}

type WorkspaceTab = 'overview' | 'evidence' | 'motions' | 'action-plan' | 'alerts' | 'timeline'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

function urgencyColor(level: string) {
  const map: Record<string, string> = {
    immediate: 'text-red-600 bg-red-50 border-red-200',
    within_days: 'text-amber-600 bg-amber-50 border-amber-200',
    within_weeks: 'text-blue-600 bg-blue-50 border-blue-200',
    not_urgent: 'text-green-600 bg-green-50 border-green-200',
  }
  return map[level] || map.not_urgent
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    draft: 'text-gray-600 bg-gray-100 border-gray-200',
    pending: 'text-amber-700 bg-amber-50 border-amber-200',
    analyzing: 'text-blue-700 bg-blue-50 border-blue-200',
    complete: 'text-green-700 bg-green-50 border-green-200',
    error: 'text-red-700 bg-red-50 border-red-200',
  }
  return map[status] || map.draft
}

function priorityColor(priority: string) {
  const map: Record<string, string> = {
    critical: 'text-red-600',
    high: 'text-amber-600',
    medium: 'text-blue-600',
    low: 'text-gray-500',
  }
  return map[priority] || map.medium
}

// ---------------------------------------------------------------------------
// Tab Components
// ---------------------------------------------------------------------------
function OverviewTab({ submission, summary }: { submission: Submission; summary: DashboardSummary | null }) {
  const hasAI = submission.ai_summary

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
            <Shield className="h-4 w-4 text-teal" />
            AI Case Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasAI ? (
            <p className="text-sm text-gray-700 leading-relaxed">{submission.ai_summary}</p>
          ) : (
            <div className="flex items-center gap-3 text-sm text-gray-500 py-2">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Upload a document to get an AI analysis of your case.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tenant Rights */}
      {submission.ai_tenant_rights && submission.ai_tenant_rights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-teal" />
              Your Rights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {submission.ai_tenant_rights.map((right, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span>{right}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Procedural Defects */}
      {submission.ai_procedural_defects && submission.ai_procedural_defects.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Potential Defects in the Eviction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {submission.ai_procedural_defects.map((defect, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <span>{defect}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Deadlines from dashboard */}
      {summary && summary.upcoming_deadlines.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
              <Calendar className="h-4 w-4 text-red-500" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.upcoming_deadlines
                .filter(d => d.case_id === submission.id)
                .map((deadline, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${deadline.days_remaining <= 7 ? 'bg-red-500' : deadline.days_remaining <= 14 ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      <span className="text-gray-700">{deadline.label}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs text-gray-500">{deadline.date}</p>
                      <p className={`text-xs font-semibold ${deadline.days_remaining <= 7 ? 'text-red-600' : deadline.days_remaining <= 14 ? 'text-amber-600' : 'text-blue-600'}`}>
                        {deadline.days_remaining} days
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Case Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
            <FileText className="h-4 w-4 text-teal" />
            Case Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide">Issue Type</dt>
              <dd className="text-gray-800 font-medium mt-0.5">{submission.issue_type_display || submission.issue_type}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide">County</dt>
              <dd className="text-gray-800 font-medium mt-0.5 capitalize">{submission.county}</dd>
            </div>
            {submission.landlord_name && (
              <div>
                <dt className="text-gray-400 text-xs uppercase tracking-wide">Landlord</dt>
                <dd className="text-gray-800 font-medium mt-0.5">{submission.landlord_name}</dd>
              </div>
            )}
            {submission.court_date && (
              <div>
                <dt className="text-gray-400 text-xs uppercase tracking-wide">Court Date</dt>
                <dd className="text-gray-800 font-medium mt-0.5 font-mono">{submission.court_date}</dd>
              </div>
            )}
            {submission.response_deadline && (
              <div>
                <dt className="text-gray-400 text-xs uppercase tracking-wide">Response Deadline</dt>
                <dd className="text-gray-800 font-medium mt-0.5 font-mono">{submission.response_deadline}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide">Submitted</dt>
              <dd className="text-gray-800 font-medium mt-0.5">{new Date(submission.created_at).toLocaleDateString()}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

function EvidenceTab({ submissionId, token }: { submissionId: number; token: string }) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [docType, setDocType] = useState('eviction_notice')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    setUploadSuccess('')
    try {
      const result = await uploadAndAnalyzeDocument(submissionId, file, docType, token)
      setUploadSuccess(`"${result.document.original_filename}" uploaded and analyzed successfully.`)
    } catch {
      setUploadError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
            <Upload className="h-4 w-4 text-teal" />
            Upload Document for Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Document Type</label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal"
            >
              <option value="eviction_notice">Eviction Notice</option>
              <option value="lease">Lease Agreement</option>
              <option value="court_summons">Court Summons</option>
              <option value="letter">Letter from Landlord</option>
              <option value="other">Other Document</option>
            </select>
          </div>
          <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-sm p-8 cursor-pointer transition-colors ${uploading ? 'border-gray-200 bg-gray-50' : 'border-teal/30 hover:border-teal/60 hover:bg-teal/5'}`}>
            {uploading ? (
              <Loader2 className="h-6 w-6 text-teal animate-spin mb-2" />
            ) : (
              <Upload className="h-6 w-6 text-teal mb-2" />
            )}
            <span className="text-sm text-gray-600">{uploading ? 'Analyzing...' : 'Click to upload PDF or image'}</span>
            <span className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, HEIC up to 20MB</span>
            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.heic,.heif" onChange={handleUpload} disabled={uploading} />
          </label>
          {uploadSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-sm p-3">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {uploadSuccess}
            </div>
          )}
          {uploadError && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-sm p-3">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {uploadError}
            </div>
          )}
        </CardContent>
      </Card>
      <div className="text-center py-8 text-sm text-gray-400">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
        Upload documents above to see your evidence library here.
      </div>
    </div>
  )
}

function MotionsTab({ submissionId, token }: { submissionId: number; token: string }) {
  const [motions, setMotions] = useState<CaseMotion[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedType, setSelectedType] = useState('answer')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    listMotions(submissionId, token).then(setMotions).catch(() => {}).finally(() => setLoading(false))
  }, [submissionId, token])

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const motion = await generateMotion(submissionId, selectedType, token)
      setMotions(prev => [motion, ...prev])
    } catch {
      setError('Failed to generate motion. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const MOTION_TYPES = [
    { value: 'answer', label: 'Answer to Complaint' },
    { value: 'continuance', label: 'Motion for Continuance' },
    { value: 'dismiss', label: 'Motion to Dismiss' },
    { value: 'discovery', label: 'Discovery Request' },
    { value: 'stay', label: 'Motion to Stay' },
    { value: 'repair_escrow', label: 'Rent Escrow Petition' },
    { value: 'fee_waiver', label: 'Fee Waiver Application' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
            <Gavel className="h-4 w-4 text-teal" />
            Generate a Motion
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="flex-1 text-sm border border-gray-200 rounded-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal"
            >
              {MOTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-teal hover:bg-teal/90 text-white text-sm px-4"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span className="ml-1.5">{generating ? 'Generating…' : 'Generate'}</span>
            </Button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
      ) : motions.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-400">
          <Gavel className="h-8 w-8 mx-auto mb-2 opacity-30" />
          No motions generated yet. Use the form above to create one.
        </div>
      ) : (
        <div className="space-y-3">
          {motions.map(motion => (
            <Card key={motion.id} className="overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === motion.id ? null : motion.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-navy">{motion.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{motion.motion_type_display} · {new Date(motion.generated_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-sm border ${statusColor(motion.status)}`}>{motion.status_display}</span>
                  <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${expanded === motion.id ? 'rotate-90' : ''}`} />
                </div>
              </button>
              {expanded === motion.id && (
                <div className="border-t border-gray-100 p-4 space-y-4">
                  <div className="bg-gray-50 rounded-sm p-4 text-xs font-mono text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {motion.content}
                  </div>
                  {motion.instructions && (
                    <div>
                      <p className="text-xs font-semibold text-navy mb-1.5">Filing Instructions</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{motion.instructions}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        const blob = new Blob([motion.content], { type: 'text/plain' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${motion.title.replace(/\s+/g, '_')}.txt`
                        a.click()
                      }}
                    >
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function ActionPlanTab({ submissionId, token }: { submissionId: number; token: string }) {
  const [items, setItems] = useState<CaseActionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listActionItems(submissionId, token).then(setItems).catch(() => {}).finally(() => setLoading(false))
  }, [submissionId, token])

  const handleToggle = async (item: CaseActionItem) => {
    try {
      const updated = await toggleActionItem(submissionId, item.id, !item.completed, token)
      setItems(prev => prev.map(i => i.id === updated.id ? updated : i))
    } catch {
      // silent
    }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>

  if (items.length === 0) return (
    <div className="text-center py-8 text-sm text-gray-400">
      <CheckCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
      No action items yet. They will be generated after your case is analyzed.
    </div>
  )

  const pending = items.filter(i => !i.completed)
  const done = items.filter(i => i.completed)

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3 font-semibold">To Do ({pending.length})</p>
          <div className="space-y-2">
            {pending.map(item => (
              <div key={item.id} className="flex items-start gap-3 p-3 border border-gray-100 rounded-sm hover:bg-gray-50 transition-colors">
                <button onClick={() => handleToggle(item)} className="mt-0.5 h-4 w-4 rounded border border-gray-300 flex items-center justify-center shrink-0 hover:border-teal transition-colors" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-navy font-medium">{item.title}</p>
                  {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                  {item.due_date && (
                    <p className={`text-xs mt-1 font-medium ${priorityColor(item.priority)}`}>
                      Due {item.due_date}
                    </p>
                  )}
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded-sm font-medium ${priorityColor(item.priority)}`}>
                  {item.priority_display}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {done.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3 font-semibold">Completed ({done.length})</p>
          <div className="space-y-2">
            {done.map(item => (
              <div key={item.id} className="flex items-start gap-3 p-3 border border-gray-100 rounded-sm opacity-60">
                <button onClick={() => handleToggle(item)} className="mt-0.5 h-4 w-4 rounded border border-green-400 bg-green-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </button>
                <p className="text-sm text-gray-500 line-through">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AlertsTab({ submissionId, token }: { submissionId: number; token: string }) {
  const [alerts, setAlerts] = useState<CaseAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAlerts(submissionId, token).then(setAlerts).catch(() => {}).finally(() => setLoading(false))
  }, [submissionId, token])

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>

  if (alerts.length === 0) return (
    <div className="text-center py-8 text-sm text-gray-400">
      <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
      No alerts set. Alerts are automatically created when deadlines are detected.
    </div>
  )

  return (
    <div className="space-y-3">
      {alerts.map(alert => (
        <div key={alert.id} className={`flex items-start gap-3 p-4 border rounded-sm ${alert.is_overdue ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
          <Bell className={`h-4 w-4 mt-0.5 shrink-0 ${alert.is_overdue ? 'text-red-500' : 'text-teal'}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-navy">{alert.alert_type_display}</p>
            <p className="text-xs text-gray-500 mt-0.5">{alert.message}</p>
            <p className="text-xs text-gray-400 mt-1 font-mono">
              {new Date(alert.scheduled_for).toLocaleString()} · {alert.delivery_method.toUpperCase()}
            </p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-sm border ${statusColor(alert.status)}`}>
            {alert.status_display}
          </span>
        </div>
      ))}
    </div>
  )
}

function TimelineTab({ submission }: { submission: Submission }) {
  const events = []
  if (submission.created_at) events.push({ date: submission.created_at.split('T')[0], label: 'Case Submitted to TenantGuard', icon: Shield, color: 'text-teal' })
  if (submission.court_date) events.push({ date: submission.court_date, label: 'Court Hearing', icon: Gavel, color: 'text-red-500' })
  if (submission.response_deadline) events.push({ date: submission.response_deadline, label: 'Response Deadline', icon: Clock, color: 'text-amber-500' })

  events.sort((a, b) => a.date.localeCompare(b.date))

  if (events.length === 0) return (
    <div className="text-center py-8 text-sm text-gray-400">
      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
      No timeline events yet.
    </div>
  )

  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-200" />
      <div className="space-y-6">
        {events.map((event, i) => {
          const Icon = event.icon
          const isPast = new Date(event.date) < new Date()
          return (
            <div key={i} className="relative flex items-start gap-4">
              <div className={`absolute -left-4 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center ${isPast ? 'bg-gray-300' : 'bg-white border-teal'}`}>
                <div className={`h-2 w-2 rounded-full ${isPast ? 'bg-gray-400' : 'bg-teal'}`} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-mono">{event.date}</p>
                <p className={`text-sm font-medium mt-0.5 ${event.color}`}>{event.label}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function WorkspacePage() {
  const router = useRouter()
  const { id } = router.query
  const { data: session, status: sessionStatus } = useSession()
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview')

  const token = (session as any)?.accessToken as string

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.replace('/auth/signin?callbackUrl=' + encodeURIComponent(router.asPath))
    }
  }, [sessionStatus, router])

  useEffect(() => {
    if (!id || !token) return
    const submissionId = parseInt(id as string, 10)
    if (isNaN(submissionId)) { setError('Invalid case ID'); setLoading(false); return }

    Promise.all([
      api.get(`intake/${submissionId}/`, { headers: { Authorization: `Bearer ${token}` } }),
      getDashboardSummary(token),
    ]).then(([subRes, sumRes]) => {
      setSubmission(subRes.data)
      setSummary(sumRes)
    }).catch(() => {
      setError('Could not load case data. Please try again.')
    }).finally(() => setLoading(false))
  }, [id, token])

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-teal" />
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
        <p className="text-sm text-gray-600">{error || 'Case not found.'}</p>
        <Link href="/dashboard"><Button variant="outline" size="sm">Back to Dashboard</Button></Link>
      </div>
    )
  }

  const TABS: { id: WorkspaceTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'evidence', label: 'Evidence', icon: Upload },
    { id: 'motions', label: 'Motions', icon: Gavel },
    { id: 'action-plan', label: 'Action Plan', icon: CheckCheck },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
  ]

  const courtDays = submission.court_date ? daysUntil(submission.court_date) : null

  return (
    <>
      <Head>
        <title>{submission.full_name || `Case #${submission.id}`} — TenantGuard Workspace</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Navbar />

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* ── Header Bar ── */}
        <div className="bg-navy text-white px-4 py-3 flex items-center gap-3 sticky top-14 z-30">
          <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
            <ChevronRight className="h-4 w-4 rotate-180" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold truncate">{submission.full_name || `Case #${submission.id}`}</h1>
            <p className="text-xs text-white/60 capitalize">{submission.issue_type_display || submission.issue_type} · {submission.county} County</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-sm border font-medium ${statusColor(submission.status)}`}>
            {submission.status}
          </span>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* ── Main Content ── */}
          <main className="flex-1 overflow-y-auto">
            {/* Tab Bar */}
            <div className="bg-white border-b border-gray-100 sticky top-[calc(3.5rem+2.75rem)] z-20">
              <div className="flex overflow-x-auto scrollbar-hide">
                {TABS.map(tab => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-teal text-teal'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-3xl mx-auto p-4 lg:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {activeTab === 'overview' && <OverviewTab submission={submission} summary={summary} />}
                  {activeTab === 'evidence' && <EvidenceTab submissionId={submission.id} token={token} />}
                  {activeTab === 'motions' && <MotionsTab submissionId={submission.id} token={token} />}
                  {activeTab === 'action-plan' && <ActionPlanTab submissionId={submission.id} token={token} />}
                  {activeTab === 'alerts' && <AlertsTab submissionId={submission.id} token={token} />}
                  {activeTab === 'timeline' && <TimelineTab submission={submission} />}
                </motion.div>
              </AnimatePresence>

              <p className="text-center text-xs text-gray-400 mt-10 pb-4">
                TenantGuard is not a law firm and does not provide legal advice. This analysis is for informational purposes only.{' '}
                <Link href="/privacy"><span className="underline hover:text-gray-600 cursor-pointer">Privacy Policy</span></Link>
              </p>
            </div>
          </main>

          {/* ── Right Rail (desktop) ── */}
          <aside className="hidden xl:block w-64 shrink-0 border-l border-gray-100 bg-white p-4 sticky top-[calc(3.5rem+2.75rem)] h-[calc(100vh-6.25rem)] overflow-y-auto">
            {/* Court countdown */}
            {courtDays !== null && (
              <div className={`p-3 rounded-sm border mb-4 ${courtDays <= 7 ? 'bg-red-50 border-red-100' : courtDays <= 14 ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                <p className={`text-xs font-bold uppercase tracking-wide ${courtDays <= 7 ? 'text-red-600' : courtDays <= 14 ? 'text-amber-600' : 'text-blue-600'}`}>
                  {courtDays} DAYS LEFT
                </p>
                <p className="text-sm text-navy font-medium mt-1">Court Hearing</p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{submission.court_date}</p>
              </div>
            )}

            <div className="h-px bg-gray-100 my-4" />

            {/* Quick stats */}
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3 font-semibold">Case Info</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Status</span>
                <span className={`font-medium capitalize ${statusColor(submission.status).split(' ')[0]}`}>{submission.status}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">County</span>
                <span className="font-mono font-semibold text-navy capitalize">{submission.county}</span>
              </div>
              {submission.landlord_name && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Landlord</span>
                  <span className="font-semibold text-navy text-right max-w-[120px] truncate">{submission.landlord_name}</span>
                </div>
              )}
            </div>

            <div className="h-px bg-gray-100 my-4" />

            {/* Navigation */}
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3 font-semibold">Navigate</p>
            <div className="space-y-1">
              {TABS.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-xs transition-colors ${
                      activeTab === tab.id ? 'bg-teal/10 text-teal font-medium' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <div className="h-px bg-gray-100 my-4" />
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="w-full text-xs">
                ← All Cases
              </Button>
            </Link>
          </aside>
        </div>
      </div>
    </>
  )
}
