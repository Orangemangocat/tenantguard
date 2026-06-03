import React, { useCallback, useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, ArrowLeft, CheckCircle, CheckCircle2, Clock,
  Download, Eye, FileText, Filter, Gavel, Lightbulb, Loader2,
  Lock, Mail, Menu, MessageSquare, Plus, Scale, Search,
  Send, Shield, Upload, X, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  getIntakeSubmission,
  uploadIntakeDocument,
  createCheckoutSession,
} from '@/lib/api'
import { authOptions } from '@/pages/api/auth/[...nextauth]'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Document {
  id: number
  doc_type: string
  original_filename: string
  uploaded_at: string
}

interface Notebook {
  summary: string
  facts: Array<{ fact: string; source: string; confidence: string }>
  timeline: Array<{ date: string; event: string; source: string; significance: string }>
  key_terms: Array<{ term: string; definition: string }>
  disputed_points: Array<{ issue: string; tenant_position: string; landlord_position: string }>
  open_questions: string[]
  urgent_deadlines: Array<{ date: string; action: string }>
  recommended_next_steps: string[]
}

interface Submission {
  id: number
  status: string
  payment_status: string
  urgency_level: string
  issue_type: string
  first_name: string
  last_name: string
  full_name: string
  county: string
  property_address: string
  landlord_name: string
  court_date: string | null
  notice_date: string | null
  created_at: string
  documents: Document[]
  notebook: Notebook | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DOC_LABELS: Record<string, string> = {
  lease: 'Lease Agreement',
  eviction_notice: 'Eviction Notice',
  correspondence: 'Correspondence / Letters',
  photo: 'Photo / Visual Evidence',
  court_filing: 'Court Filing',
  payment_record: 'Payment Record',
  other: 'Other',
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

function urgencyColor(level: string): string {
  if (level === 'immediate') return 'text-red-urgent'
  if (level === 'within_days') return 'text-amber-warn'
  return 'text-green-safe'
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function DeadlineBar({ daysLeft, total = 30 }: { daysLeft: number; total?: number }) {
  const pct = Math.max(0, Math.min(100, (daysLeft / total) * 100))
  const color = daysLeft <= 3 ? 'bg-red-urgent' : daysLeft <= 10 ? 'bg-amber-warn' : 'bg-teal'
  return (
    <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function ConfidenceBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    high: 'border-green-500/40 text-green-700 bg-green-50',
    medium: 'border-amber-400/40 text-amber-700 bg-amber-50',
    low: 'border-gray-200 text-gray-500 bg-gray-50',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold border rounded-sm uppercase tracking-wide shrink-0 ${styles[level] ?? styles.low}`}>
      {level}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Pre-complete: Document Upload
// ---------------------------------------------------------------------------

function DocumentUploadPanel({
  submissionId, token, existingDocs, onUploaded,
}: {
  submissionId: number
  token: string
  existingDocs: Document[]
  onUploaded: () => void
}) {
  const [docType, setDocType] = useState('eviction_notice')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      await uploadIntakeDocument(submissionId, docType, file, token)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      onUploaded()
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/70">
        Upload documents related to your case — the more you provide, the more detailed your analysis. All files are encrypted and securely stored.
      </p>

      {existingDocs.length > 0 && (
        <div className="space-y-2">
          {existingDocs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-sm text-sm">
              <FileText className="h-4 w-4 text-teal shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{doc.original_filename}</p>
                <p className="text-xs text-white/50">{DOC_LABELS[doc.doc_type] ?? doc.doc_type}</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-green-safe shrink-0" />
            </div>
          ))}
        </div>
      )}

      <div className="border-2 border-dashed border-white/20 rounded-sm p-4 space-y-3">
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="w-full rounded-sm border border-white/20 bg-white/5 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/50"
        >
          {Object.entries(DOC_LABELS).map(([val, label]) => (
            <option key={val} value={val} className="bg-navy text-white">{label}</option>
          ))}
        </select>

        <div className="flex items-center gap-3">
          <div
            className="flex-1 h-10 rounded-sm border border-white/20 bg-white/5 flex items-center px-3 text-sm text-white/50 truncate cursor-pointer"
            onClick={() => inputRef.current?.click()}
          >
            {file ? file.name : 'Choose a file…'}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 border-white/30 text-white hover:bg-white/10 rounded-sm"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-1.5" />
            Browse
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.png,.jpg,.jpeg,.doc,.docx"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        {error && <p className="text-xs text-red-urgent">{error}</p>}

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-teal hover:bg-teal/90 text-white rounded-sm h-9"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          {uploading ? 'Uploading…' : 'Upload Document'}
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Pre-complete: Payment CTA
// ---------------------------------------------------------------------------

function PaymentCTA({
  submissionId, token, priceDisplay, onCheckout,
}: {
  submissionId: number
  token: string
  priceDisplay: string
  onCheckout: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePay = async () => {
    setLoading(true)
    setError('')
    try {
      const { checkout_url } = await createCheckoutSession(submissionId, token)
      window.location.href = checkout_url
    } catch {
      setError('Could not start checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="border border-teal/30 bg-teal/10 rounded-sm p-5">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-sm bg-teal/20 flex items-center justify-center shrink-0">
          <Zap className="h-5 w-5 text-teal" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Unlock Your Case Analysis</h3>
          <p className="text-sm text-white/70 mb-4">
            Get a complete plain-English breakdown of your case for just <strong className="text-white">{priceDisplay}</strong> — a fraction of a single attorney consultation.
          </p>
          <ul className="space-y-1.5 mb-4">
            {[
              'Your rights under Tennessee landlord-tenant law',
              'Every deadline you need to know — clearly explained',
              'A step-by-step action plan you can follow yourself',
              'Key legal terms translated into plain English',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-white/80">
                <CheckCircle className="h-4 w-4 text-teal shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
          {error && <p className="text-xs text-red-urgent mb-2">{error}</p>}
          <Button
            onClick={handlePay}
            disabled={loading}
            className="w-full bg-teal hover:bg-teal/90 text-white rounded-sm py-5 font-semibold"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
            {loading ? 'Redirecting to checkout…' : `Analyze My Case — ${priceDisplay}`}
          </Button>
          <p className="text-center text-xs text-white/40 mt-2">
            Secure payment via Stripe. One-time fee. No subscription.
          </p>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Analyzing state
// ---------------------------------------------------------------------------

function AnalyzingState() {
  const steps = [
    'Reading your uploaded documents…',
    'Extracting key dates and facts…',
    'Researching Tennessee tenant law…',
    'Building your timeline…',
    'Writing your rights summary…',
  ]
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setCurrentStep((s) => (s + 1) % steps.length), 2200)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center py-24 gap-8 text-center"
    >
      <div className="relative">
        <div className="h-20 w-20 rounded-full border-4 border-teal/20 border-t-teal animate-spin" />
        <Shield className="h-8 w-8 text-teal absolute inset-0 m-auto" />
      </div>
      <div>
        <h3 className="font-bold text-navy text-xl mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Analyzing Your Case</h3>
        <p className="text-gray-500 text-sm max-w-xs">
          Our AI is reviewing your documents and preparing your personalized rights summary.
        </p>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={currentStep}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="text-sm font-medium" style={{ color: 'var(--color-teal)' }}
        >
          {steps[currentStep]}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Notebook section: Summary
// ---------------------------------------------------------------------------

function SummarySection({ submission, notebook }: { submission: Submission; notebook: Notebook }) {
  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-100 rounded-sm p-5 shadow-sm">
        <h3 className="font-semibold text-navy mb-3 flex items-center gap-2 text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
          <Shield className="h-4 w-4 text-teal" /> Plain English Summary
        </h3>
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{notebook.summary}</p>
      </div>

      {submission.documents.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-sm p-5 shadow-sm">
          <h3 className="font-semibold text-navy mb-3 text-sm">Documents on File</h3>
          <div className="space-y-2">
            {submission.documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-100 rounded-sm text-sm">
                <FileText className="h-4 w-4 text-teal shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 font-medium truncate">{doc.original_filename}</p>
                  <p className="text-xs text-gray-500">{DOC_LABELS[doc.doc_type] ?? doc.doc_type}</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-safe shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notebook section: Action Plan
// ---------------------------------------------------------------------------

function ActionPlanSection({ notebook }: { notebook: Notebook }) {
  return (
    <div className="space-y-4">
      {notebook.urgent_deadlines.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-sm p-5">
          <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4" /> Deadlines — Act By These Dates
          </h3>
          <ul className="space-y-3">
            {notebook.urgent_deadlines.map((d, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="font-mono font-bold text-red-700 shrink-0 pt-0.5 min-w-[100px]">{d.date}</span>
                <span className="text-gray-800">{d.action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {notebook.recommended_next_steps.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-sm p-5 shadow-sm">
          <h3 className="font-semibold text-navy mb-4 flex items-center gap-2 text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
            <Lightbulb className="h-4 w-4 text-teal" /> What You Should Do — Step by Step
          </h3>
          <ol className="space-y-4">
            {notebook.recommended_next_steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white" style={{ background: 'var(--color-teal)' }}>
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notebook section: Timeline
// ---------------------------------------------------------------------------

function TimelineSection({ notebook }: { notebook: Notebook }) {
  if (notebook.timeline.length === 0) {
    return <p className="text-gray-400 text-sm py-8 text-center">No timeline events extracted.</p>
  }

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />
      <div className="space-y-0">
        {notebook.timeline.map((e, i) => (
          <div key={i} className="relative flex items-start gap-4 pb-6">
            <div className="relative z-10 w-10 h-10 rounded-sm bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
              <Clock className="h-4 w-4 text-teal" />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-sm font-medium text-navy">{e.event}</p>
              <p className="text-xs font-mono text-gray-400 mt-0.5">{e.date}</p>
              {e.significance && (
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{e.significance}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notebook section: Your Rights (Key Terms)
// ---------------------------------------------------------------------------

function RightsSection({ notebook }: { notebook: Notebook }) {
  if (notebook.key_terms.length === 0) {
    return <p className="text-gray-400 text-sm py-8 text-center">No key terms identified.</p>
  }

  return (
    <div className="space-y-3">
      {notebook.key_terms.map((t, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-sm p-4 shadow-sm">
          <dt className="font-semibold text-navy text-sm">{t.term}</dt>
          <dd className="text-sm text-gray-600 mt-1 leading-relaxed">{t.definition}</dd>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notebook section: Case Facts
// ---------------------------------------------------------------------------

function FactsSection({ notebook }: { notebook: Notebook }) {
  if (notebook.facts.length === 0) {
    return <p className="text-gray-400 text-sm py-8 text-center">No facts extracted.</p>
  }

  return (
    <div className="space-y-2">
      {notebook.facts.map((f, i) => (
        <div key={i} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-sm shadow-sm text-sm">
          <ConfidenceBadge level={f.confidence} />
          <span className="text-gray-700 leading-relaxed">{f.fact}</span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notebook section: Disputed Points
// ---------------------------------------------------------------------------

function DisputesSection({ notebook }: { notebook: Notebook }) {
  if (notebook.disputed_points.length === 0) {
    return <p className="text-gray-400 text-sm py-8 text-center">No disputed points identified.</p>
  }

  return (
    <div className="space-y-4">
      {notebook.disputed_points.map((d, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-sm p-4 shadow-sm">
          <p className="font-semibold text-navy text-sm mb-3">{d.issue}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-sky-50 border border-sky-200 rounded-sm p-3">
              <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wider mb-1.5">Your Position</p>
              <p className="text-sm text-sky-900">{d.tenant_position}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-sm p-3">
              <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1.5">Landlord's Claim</p>
              <p className="text-sm text-red-900">{d.landlord_position}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Notebook section: Open Questions
// ---------------------------------------------------------------------------

function QuestionsSection({ notebook }: { notebook: Notebook }) {
  if (notebook.open_questions.length === 0) {
    return <p className="text-gray-400 text-sm py-8 text-center">No open questions identified.</p>
  }

  return (
    <div className="space-y-2">
      {notebook.open_questions.map((q, i) => (
        <div key={i} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-sm shadow-sm text-sm">
          <span className="font-bold shrink-0 mt-0.5" style={{ color: 'var(--color-teal)' }}>?</span>
          <span className="text-gray-700">{q}</span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

type NotebookTab = 'summary' | 'action-plan' | 'timeline' | 'rights' | 'facts' | 'disputes' | 'questions'

interface Props {
  initialSubmission: Submission
  priceDisplay: string
}

export default function CasePage({ initialSubmission, priceDisplay }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const token = (session as any)?.access_token as string | undefined

  const [submission, setSubmission] = useState<Submission>(initialSubmission)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<NotebookTab>('summary')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notificationDismissed, setNotificationDismissed] = useState(false)
  const paymentSuccess = router.query.payment === 'success'

  const refresh = useCallback(async () => {
    if (!token) return
    setRefreshing(true)
    try {
      const updated = await getIntakeSubmission(submission.id, token)
      setSubmission(updated)
    } finally {
      setRefreshing(false)
    }
  }, [token, submission.id])

  // Poll while analyzing
  useEffect(() => {
    if (submission.status !== 'analyzing') return
    const id = setInterval(refresh, 5000)
    return () => clearInterval(id)
  }, [submission.status, refresh])

  const isAnalyzing = submission.status === 'analyzing'
  const isComplete = submission.status === 'complete'
  const isPaid = submission.payment_status === 'paid'
  const hasDocs = submission.documents.length > 0
  const courtDays = daysUntil(submission.court_date)
  const isUrgent = submission.urgency_level === 'immediate' || submission.urgency_level === 'within_days'
  const showNotificationBanner = isUrgent && !notificationDismissed && (courtDays !== null && courtDays >= 0 && courtDays <= 14)

  const notebook = submission.notebook

  // Sidebar nav definition (only relevant when complete)
  const NAV_SECTIONS = notebook ? [
    { id: 'summary' as NotebookTab, icon: Shield, label: 'Overview', count: null },
    { id: 'action-plan' as NotebookTab, icon: Zap, label: 'Action Plan', count: notebook.recommended_next_steps.length + notebook.urgent_deadlines.length },
    { id: 'timeline' as NotebookTab, icon: Clock, label: 'Timeline', count: notebook.timeline.length },
    { id: 'rights' as NotebookTab, icon: Scale, label: 'Your Rights', count: notebook.key_terms.length },
    { id: 'facts' as NotebookTab, icon: FileText, label: 'Case Facts', count: notebook.facts.length },
    { id: 'disputes' as NotebookTab, icon: AlertTriangle, label: 'Disputed Points', count: notebook.disputed_points.length },
    { id: 'questions' as NotebookTab, icon: MessageSquare, label: 'Open Questions', count: notebook.open_questions.length },
  ] : []

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-warm-white)', fontFamily: 'var(--font-body)' }}>
      <Head>
        <title>Your Case — TenantGuard</title>
        <meta name="robots" content="noindex" />
      </Head>

      {/* ── Urgent notification banner ── */}
      {showNotificationBanner && (
        <div className="bg-amber-warn text-navy relative z-50">
          <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between py-2.5 gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="text-sm font-medium">
                {courtDays === 0 ? 'Your court date is today.' :
                 courtDays === 1 ? 'Court date is tomorrow — review your case now.' :
                 `Court date in ${courtDays} days — make sure your documents are ready.`}
              </p>
            </div>
            <button onClick={() => setNotificationDismissed(true)} className="text-navy/60 hover:text-navy shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Top navigation ── */}
      <nav className="sticky top-0 z-40 border-b border-white/10" style={{ background: 'var(--color-navy)' }}>
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-white/70 hover:text-white" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/">
              <span className="flex items-center gap-2 cursor-pointer">
                <Shield className="h-5 w-5 text-teal" />
                <span className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  TenantGuard
                </span>
              </span>
            </Link>
            <div className="hidden lg:block h-5 w-px bg-white/20" />
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-sm text-sm">
              <span className="text-white/50">My Case</span>
              <span className="text-white font-medium">#{submission.id}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {refreshing && <Loader2 className="h-4 w-4 animate-spin text-white/40" />}
            <Link href="/blog">
              <span className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-white/60 hover:text-white text-sm cursor-pointer">
                Blog
              </span>
            </Link>
            <div className="h-8 w-8 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold">
              {submission.first_name?.[0] ?? '?'}{submission.last_name?.[0] ?? ''}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Payment success toast ── */}
      <AnimatePresence>
        {paymentSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative z-30"
          >
            <div className="max-w-screen-xl mx-auto px-4 pt-3">
              <div className="flex items-center gap-3 bg-green-safe/10 border border-green-safe/30 text-green-safe rounded-sm p-3 text-sm">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span>Payment confirmed — your case analysis has started.</span>
                <button
                  onClick={() => router.replace(`/case/${submission.id}`, undefined, { shallow: true })}
                  className="ml-auto text-green-safe/60 hover:text-green-safe"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex max-w-screen-xl mx-auto">

        {/* ── Left Sidebar ── */}
        <aside className={`
          fixed lg:sticky top-14 left-0 z-30 w-64 h-[calc(100vh-3.5rem)]
          overflow-y-auto border-r border-white/10
          transform transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `} style={{ background: 'var(--color-navy)' }}>

          {/* Case info */}
          <div className="p-4 border-b border-white/10">
            <p className="text-[10px] text-white/30 font-mono mb-1">CASE #{submission.id}</p>
            <p className="text-sm font-semibold text-white leading-tight mb-2">
              {submission.issue_type
                ? submission.issue_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                : 'Eviction Defense'}
            </p>
            {submission.county && (
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <Scale className="h-3 w-3" />
                {submission.county} County
              </div>
            )}
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wide"
              style={{
                background: isComplete ? 'rgba(16,185,129,0.15)' :
                             isAnalyzing ? 'rgba(14,165,233,0.15)' :
                             'rgba(245,158,11,0.15)',
                color: isComplete ? 'var(--color-green-safe)' :
                       isAnalyzing ? 'var(--color-teal)' :
                       'var(--color-amber-warn)',
              }}>
              {isComplete ? 'Analysis Ready' : isAnalyzing ? 'Analyzing…' : isPaid ? 'Processing' : 'Pending Payment'}
            </div>
          </div>

          {/* Court date / deadline widget */}
          {submission.court_date && (
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-white/30 uppercase tracking-widest">Court Date</span>
                {courtDays !== null && courtDays >= 0 && (
                  <span className={`text-xs font-mono font-bold ${courtDays <= 7 ? 'text-red-urgent' : courtDays <= 14 ? 'text-amber-warn' : 'text-white/60'}`}>
                    {courtDays}d
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-white mb-2">{formatDate(submission.court_date)}</p>
              {courtDays !== null && courtDays >= 0 && (
                <DeadlineBar daysLeft={courtDays} total={30} />
              )}
            </div>
          )}

          {/* Notebook section nav (complete only) */}
          {isComplete && NAV_SECTIONS.length > 0 && (
            <nav className="p-3">
              <p className="text-[10px] text-white/30 uppercase tracking-widest px-3 mb-2 mt-2">Analysis</p>
              {NAV_SECTIONS.map(({ id, icon: Icon, label, count }) => (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); setSidebarOpen(false) }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-sm transition-colors mb-0.5
                    ${activeTab === id
                      ? 'text-teal'
                      : 'text-white/60 hover:text-white'
                    }`}
                  style={activeTab === id ? { background: 'rgba(14,165,233,0.15)' } : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </div>
                  {count !== null && (
                    <span className={`text-xs font-mono ${activeTab === id ? 'text-teal' : 'text-white/30'}`}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          )}

          {/* Pre-complete: upload docs link */}
          {!isComplete && !isAnalyzing && token && (
            <div className="p-4">
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Steps to Analysis</p>
              {[
                { n: 1, label: 'Complete intake chat', done: true },
                { n: 2, label: 'Upload your documents', done: hasDocs },
                { n: 3, label: 'Unlock analysis', done: isPaid },
                { n: 4, label: 'Receive results', done: isComplete },
              ].map(({ n, label, done }) => (
                <div key={n} className="flex items-center gap-2.5 py-2 text-sm">
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold
                    ${done ? 'bg-teal text-white' : 'border border-white/20 text-white/30'}`}>
                    {done ? <CheckCircle2 className="h-3 w-3" /> : n}
                  </div>
                  <span className={done ? 'text-white/60 line-through' : 'text-white/80'}>{label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Back link */}
          <div className="p-4 border-t border-white/10 mt-auto">
            <Link href="/intake">
              <span className="flex items-center gap-2 text-sm text-white/50 hover:text-white cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
                Back to chat
              </span>
            </Link>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0 p-4 lg:p-8">

          {/* Page header */}
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div>
              <h1 className="text-2xl font-bold text-navy" style={{ fontFamily: 'var(--font-heading)' }}>
                {isComplete
                  ? {
                      'summary': 'Your Case Overview',
                      'action-plan': 'Action Plan',
                      'timeline': 'Case Timeline',
                      'rights': 'Your Rights',
                      'facts': 'Case Facts',
                      'disputes': 'Disputed Points',
                      'questions': 'Open Questions',
                    }[activeTab]
                  : isAnalyzing
                    ? 'Analyzing Your Case'
                    : 'Your Case Dashboard'
                }
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {isComplete
                  ? {
                      'summary': 'Plain-English breakdown of your situation',
                      'action-plan': 'Deadlines and recommended steps based on your case',
                      'timeline': 'Chronological record of your case events',
                      'rights': 'Key legal terms and what they mean for you',
                      'facts': 'Established facts extracted from your documents',
                      'disputes': 'Points of disagreement between you and your landlord',
                      'questions': 'Questions you should be ready to answer in court',
                    }[activeTab]
                  : isAnalyzing
                    ? 'Our AI is reviewing your documents'
                    : `Case #${submission.id} · Opened ${formatDate(submission.created_at)}`
                }
              </p>
            </div>
          </div>

          {/* ── Content by state ── */}

          {isAnalyzing && <AnalyzingState />}

          {isComplete && notebook && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'summary'     && <SummarySection submission={submission} notebook={notebook} />}
                {activeTab === 'action-plan' && <ActionPlanSection notebook={notebook} />}
                {activeTab === 'timeline'    && <TimelineSection notebook={notebook} />}
                {activeTab === 'rights'      && <RightsSection notebook={notebook} />}
                {activeTab === 'facts'       && <FactsSection notebook={notebook} />}
                {activeTab === 'disputes'    && <DisputesSection notebook={notebook} />}
                {activeTab === 'questions'   && <QuestionsSection notebook={notebook} />}
              </motion.div>
            </AnimatePresence>
          )}

          {isComplete && !notebook && (
            <div className="text-center py-16 text-gray-400">
              <p>Analysis complete — results are being prepared.</p>
              <Button variant="outline" className="mt-4" onClick={refresh}>Refresh</Button>
            </div>
          )}

          {!isAnalyzing && !isComplete && (
            <div className="space-y-5">
              {/* Case summary card */}
              <div className="bg-white rounded-sm border border-gray-100 p-5 shadow-sm">
                <h2 className="font-semibold text-navy mb-3 text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Case Details</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  {submission.issue_type && (
                    <>
                      <dt className="text-gray-500">Issue</dt>
                      <dd className="text-gray-900 font-medium capitalize">{submission.issue_type.replace(/_/g, ' ')}</dd>
                    </>
                  )}
                  {submission.property_address && (
                    <>
                      <dt className="text-gray-500">Property</dt>
                      <dd className="text-gray-900 truncate">{submission.property_address}</dd>
                    </>
                  )}
                  {submission.landlord_name && (
                    <>
                      <dt className="text-gray-500">Landlord</dt>
                      <dd className="text-gray-900">{submission.landlord_name}</dd>
                    </>
                  )}
                  {submission.court_date && (
                    <>
                      <dt className="text-gray-500">Court Date</dt>
                      <dd className="font-semibold" style={{ color: 'var(--color-red-urgent)' }}>{formatDate(submission.court_date)}</dd>
                    </>
                  )}
                </dl>
              </div>

              {/* Document upload */}
              {token && (
                <div className="rounded-sm p-5" style={{ background: 'var(--color-navy)' }}>
                  <h2 className="font-semibold text-white mb-3 text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
                    Upload Documents
                  </h2>
                  <DocumentUploadPanel
                    submissionId={submission.id}
                    token={token}
                    existingDocs={submission.documents}
                    onUploaded={refresh}
                  />
                </div>
              )}

              {/* Payment CTA */}
              {!isPaid && hasDocs && token && (
                <div className="rounded-sm p-1" style={{ background: 'var(--color-navy)' }}>
                  <PaymentCTA
                    submissionId={submission.id}
                    token={token}
                    priceDisplay={priceDisplay}
                    onCheckout={refresh}
                  />
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-center text-xs text-gray-400 mt-10 pb-4">
            TenantGuard is not a law firm and does not provide legal advice. This analysis is for informational purposes only.{' '}
            <Link href="/privacy"><span className="underline hover:text-gray-600 cursor-pointer">Privacy Policy</span></Link>
          </p>
        </main>

        {/* ── Right Rail (desktop, complete only) ── */}
        {isComplete && (
          <aside className="hidden xl:block w-64 shrink-0 border-l border-gray-100 bg-white p-4 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3 font-semibold">Quick Actions</p>
            <div className="space-y-2 mb-5">
              {token && (
                <Button
                  className="w-full justify-start rounded-sm h-9 text-sm text-white"
                  style={{ background: 'var(--color-teal)' }}
                  onClick={() => {/* TODO: open upload modal */}}
                >
                  <Plus className="h-4 w-4 mr-2" /> Upload Document
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start rounded-sm h-9 text-sm" onClick={() => router.push('/intake')}>
                <MessageSquare className="h-4 w-4 mr-2" /> Back to Chat
              </Button>
            </div>

            <div className="h-px bg-gray-100 my-4" />

            {/* Upcoming deadlines from notebook */}
            {notebook && notebook.urgent_deadlines.length > 0 && (
              <>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3 font-semibold">Deadlines</p>
                <div className="space-y-2 mb-5">
                  {notebook.urgent_deadlines.slice(0, 3).map((d, i) => (
                    <div key={i} className="p-3 bg-red-50 border border-red-100 rounded-sm">
                      <p className="text-xs font-mono font-bold text-red-700">{d.date}</p>
                      <p className="text-xs text-gray-700 mt-1 leading-relaxed">{d.action}</p>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-gray-100 my-4" />
              </>
            )}

            {/* Court date */}
            {submission.court_date && courtDays !== null && courtDays >= 0 && (
              <>
                <div className={`p-3 rounded-sm border mb-4 ${courtDays <= 7 ? 'bg-red-50 border-red-100' : courtDays <= 14 ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
                  <p className={`text-xs font-bold uppercase tracking-wide ${courtDays <= 7 ? 'text-red-600' : courtDays <= 14 ? 'text-amber-600' : 'text-blue-600'}`}>
                    {courtDays} DAYS LEFT
                  </p>
                  <p className="text-sm text-navy font-medium mt-1">Court Hearing</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{formatDate(submission.court_date)}</p>
                </div>
                <div className="h-px bg-gray-100 my-4" />
              </>
            )}

            {/* Documents */}
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3 font-semibold">Documents</p>
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-gray-500">Uploaded</span>
                <span className="font-mono font-semibold text-navy">{submission.documents.length}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    background: 'var(--color-teal)',
                    width: `${Math.min(100, (submission.documents.length / 5) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">5+ recommended for best results</p>
            </div>
          </aside>
        )}
      </div>

      {/* ── Mobile FAB (complete state only) ── */}
      {isComplete && (
        <div className="fixed bottom-0 left-0 right-0 lg:hidden border-t border-white/10 p-3 z-40" style={{ background: 'var(--color-navy)' }}>
          <div className="flex items-center justify-around max-w-sm mx-auto">
            {NAV_SECTIONS.slice(0, 2).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                className={`flex flex-col items-center gap-1 ${activeTab === id ? 'text-teal' : 'text-white/50 hover:text-white'}`}
                onClick={() => setActiveTab(id)}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px]">{label}</span>
              </button>
            ))}
            <button
              className="flex flex-col items-center gap-1"
              onClick={() => setActiveTab('action-plan')}
            >
              <div className="w-12 h-12 rounded-full flex items-center justify-center -mt-6 shadow-lg" style={{ background: 'var(--color-teal)' }}>
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px] text-teal">Actions</span>
            </button>
            {NAV_SECTIONS.slice(2, 4).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                className={`flex flex-col items-center gap-1 ${activeTab === id ? 'text-teal' : 'text-white/50 hover:text-white'}`}
                onClick={() => setActiveTab(id)}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px]">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Data fetching (unchanged)
// ---------------------------------------------------------------------------

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return {
      redirect: { destination: '/api/auth/signin', permanent: false },
    }
  }

  const token = (session as any).access_token
  const id = parseInt(context.params?.id as string)

  if (!id || isNaN(id)) {
    return { notFound: true }
  }

  if (!token) {
    console.error(`[case/${id}] No access_token in session — redirecting to sign-in`)
    return { redirect: { destination: '/api/auth/signin', permanent: false } }
  }

  try {
    const submission = await getIntakeSubmission(id, token)
    const priceDisplay = process.env.INTAKE_ANALYSIS_PRICE_DISPLAY ?? '$49'
    return { props: { initialSubmission: submission, priceDisplay } }
  } catch (err: any) {
    const status = err?.response?.status
    const data = err?.response?.data
    console.error(`[case/${id}] Backend error ${status}:`, data ?? err?.message)

    if (status === 401 || status === 403) {
      return { redirect: { destination: '/api/auth/signin', permanent: false } }
    }
    return { notFound: true }
  }
}
