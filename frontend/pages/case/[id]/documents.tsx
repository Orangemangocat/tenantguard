import React, { useCallback, useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, ArrowLeft, Calendar, CheckCircle2, ChevronDown,
  ChevronUp, Clock, FileText, Loader2, Scale, Shield, Upload, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Navbar from '@/components/Navbar'
import {
  getIntakeSubmission,
  uploadAndAnalyzeDocument,
  DocumentAnalysisResult,
  UploadAnalyzeResponse,
} from '@/lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Document {
  id: number
  doc_type: string
  original_filename: string
  uploaded_at: string
  analysis?: DocumentAnalysisResult
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

function severityColor(severity: string): string {
  if (severity === 'high' || severity === 'critical') return 'text-red-urgent bg-red-50 border-red-200'
  if (severity === 'medium') return 'text-amber-700 bg-amber-50 border-amber-200'
  return 'text-gray-600 bg-gray-50 border-gray-200'
}

// ---------------------------------------------------------------------------
// Analysis Card Component
// ---------------------------------------------------------------------------

function AnalysisCard({ analysis }: { analysis: DocumentAnalysisResult }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <Card className="border-teal/30 bg-teal/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
            <Shield className="h-4 w-4 text-teal" />
            AI Analysis Results
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-7 w-7 p-0"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="space-y-5 pt-2">
              {/* Summary */}
              {analysis.summary && (
                <div>
                  <h4 className="text-xs font-semibold text-navy uppercase tracking-wide mb-2">Summary</h4>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{analysis.summary}</p>
                </div>
              )}

              {/* Key Dates */}
              {analysis.key_dates.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-navy uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Key Dates
                  </h4>
                  <div className="space-y-2">
                    {analysis.key_dates.map((d, i) => (
                      <div key={i} className={`flex items-center gap-3 p-2.5 rounded-sm border ${
                        d.is_deadline ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <Clock className={`h-4 w-4 shrink-0 ${d.is_deadline ? 'text-red-urgent' : 'text-gray-500'}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{d.label}</p>
                        </div>
                        <p className={`text-sm font-semibold ${d.is_deadline ? 'text-red-urgent' : 'text-gray-700'}`}>
                          {new Date(d.date).toLocaleDateString()}
                        </p>
                        {d.is_deadline && (
                          <span className="text-[10px] font-bold text-red-urgent uppercase">DEADLINE</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Legal Issues */}
              {analysis.legal_issues.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-navy uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Scale className="h-3.5 w-3.5" /> Legal Issues Identified
                  </h4>
                  <div className="space-y-2">
                    {analysis.legal_issues.map((issue, i) => (
                      <div key={i} className={`p-3 rounded-sm border ${severityColor(issue.severity)}`}>
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">{issue.issue}</p>
                            <p className="text-xs mt-1 opacity-80">{issue.explanation}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Procedural Defects */}
              {analysis.procedural_defects.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-navy uppercase tracking-wide mb-2">
                    Procedural Defects (Potential Defenses)
                  </h4>
                  <div className="space-y-2">
                    {analysis.procedural_defects.map((defect, i) => (
                      <div key={i} className="p-3 rounded-sm border border-green-200 bg-green-50">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-green-800">{defect.defect}</p>
                            <p className="text-xs text-green-700 mt-1">{defect.explanation}</p>
                            {defect.actionable && (
                              <span className="inline-block mt-1.5 text-[10px] font-bold text-green-700 bg-green-100 border border-green-300 px-1.5 py-0.5 rounded-sm uppercase">
                                Actionable
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tenant Rights */}
              {analysis.tenant_rights.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-navy uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" /> Your Rights
                  </h4>
                  <div className="space-y-2">
                    {analysis.tenant_rights.map((right, i) => (
                      <div key={i} className="p-3 rounded-sm border border-teal/30 bg-teal/5">
                        <p className="text-sm font-medium text-navy">{right.right}</p>
                        <p className="text-xs text-gray-600 mt-1">{right.explanation}</p>
                        {right.statute && (
                          <p className="text-[10px] text-teal font-mono mt-1.5">{right.statute}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DocumentsPage() {
  const { data: session, status: authStatus } = useSession({ required: true })
  const router = useRouter()
  const { id } = router.query
  const submissionId = Number(id)

  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<Document[]>([])
  const [caseName, setCaseName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [docType, setDocType] = useState('eviction_notice')
  const [file, setFile] = useState<File | null>(null)
  const [latestAnalysis, setLatestAnalysis] = useState<DocumentAnalysisResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchData = useCallback(async () => {
    if (!session?.access_token || !submissionId) return
    try {
      const token = session.access_token as string
      const data = await getIntakeSubmission(submissionId, token)
      setDocuments(data.documents || [])
      setCaseName(data.full_name || `Case #${data.id}`)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [session, submissionId])

  useEffect(() => {
    if (authStatus === 'authenticated') fetchData()
  }, [authStatus, fetchData])

  const handleUploadAndAnalyze = async () => {
    if (!file || !session?.access_token) return
    const token = session.access_token as string
    setUploading(true)
    setAnalyzing(false)
    setUploadError('')
    setLatestAnalysis(null)

    try {
      setAnalyzing(true)
      const result = await uploadAndAnalyzeDocument(submissionId, file, docType, token)
      setLatestAnalysis(result.analysis)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      await fetchData()
    } catch (err: any) {
      setUploadError(err?.response?.data?.error || 'Upload or analysis failed. Please try again.')
    } finally {
      setUploading(false)
      setAnalyzing(false)
    }
  }

  if (authStatus === 'loading' || loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal" />
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Documents — {caseName} — TenantGuard</title>
      </Head>

      <Navbar />

      <main className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-navy text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            <Link href={`/case/${submissionId}`} className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-3">
              <ArrowLeft className="h-4 w-4" /> Back to Case
            </Link>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
              Document Analysis
            </h1>
            <p className="text-white/70 text-sm mt-1">{caseName}</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* Upload Section */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Upload className="h-4 w-4 text-teal" />
                Upload &amp; Analyze Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-text-secondary">
                Upload a document and our AI will analyze it for key dates, legal issues, procedural defects, and your rights under Tennessee law.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">Document Type</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/50"
                  >
                    {Object.entries(DOC_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-text-secondary mb-1 block">File</label>
                  <div
                    className="h-[38px] rounded-sm border border-border bg-background flex items-center px-3 text-sm text-text-secondary truncate cursor-pointer hover:border-teal/50 transition-colors"
                    onClick={() => inputRef.current?.click()}
                  >
                    {file ? file.name : 'Choose a file…'}
                  </div>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.txt,.png,.jpg,.jpeg,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>

              {uploadError && (
                <p className="text-xs text-red-urgent">{uploadError}</p>
              )}

              <Button
                onClick={handleUploadAndAnalyze}
                disabled={!file || uploading || analyzing}
                className="bg-teal hover:bg-teal/90 text-white rounded-sm"
              >
                {uploading || analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {analyzing ? 'Analyzing…' : 'Uploading…'}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload &amp; Analyze
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Latest Analysis Result */}
          {latestAnalysis && <AnalysisCard analysis={latestAnalysis} />}

          {/* Existing Documents */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-navy" />
                Documents on File ({documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-8">
                  No documents uploaded yet. Upload your first document above.
                </p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 border border-border rounded-sm hover:bg-background-secondary transition-colors">
                      <FileText className="h-4 w-4 text-teal shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">{doc.original_filename}</p>
                        <p className="text-xs text-text-secondary">{DOC_LABELS[doc.doc_type] ?? doc.doc_type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-safe shrink-0" />
                        <span className="text-xs text-text-secondary">
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
