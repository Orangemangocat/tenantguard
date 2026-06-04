import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import {
  AlertTriangle, Bell, Calendar, CheckCircle2, Clock,
  FileText, Gavel, Loader2, Plus, Shield, Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Navbar from '@/components/Navbar'
import {
  getDashboardSummary,
  listIntakeSubmissions,
  DashboardSummary,
} from '@/lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Submission {
  id: number
  status: string
  issue_type: string
  full_name: string
  county: string
  court_date: string | null
  urgency_level: string
  created_at: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

function urgencyBadge(level: string) {
  const styles: Record<string, string> = {
    immediate: 'bg-red-urgent/10 text-red-urgent border-red-urgent/30',
    within_days: 'bg-amber-warn/10 text-amber-warn border-amber-warn/30',
    within_weeks: 'bg-teal/10 text-teal border-teal/30',
    not_urgent: 'bg-green-safe/10 text-green-safe border-green-safe/30',
  }
  const labels: Record<string, string> = {
    immediate: 'Urgent',
    within_days: 'Soon',
    within_weeks: 'Upcoming',
    not_urgent: 'No Rush',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold border rounded-sm ${styles[level] || styles.not_urgent}`}>
      {labels[level] || level}
    </span>
  )
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600 border-gray-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    analyzing: 'bg-blue-50 text-blue-700 border-blue-200',
    complete: 'bg-green-50 text-green-700 border-green-200',
  }
  const labels: Record<string, string> = {
    draft: 'Draft',
    pending: 'Pending Review',
    analyzing: 'Analyzing',
    complete: 'Complete',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded-sm ${styles[status] || styles.draft}`}>
      {labels[status] || status}
    </span>
  )
}

const ISSUE_LABELS: Record<string, string> = {
  eviction: 'Eviction',
  rent_increase: 'Rent Increase',
  habitability: 'Habitability',
  security_deposit: 'Security Deposit',
  lease_violation: 'Lease Violation',
  harassment: 'Harassment',
  utility: 'Utility Issues',
  entry_privacy: 'Privacy Violation',
  other: 'Other',
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { data: session, status: authStatus } = useSession({ required: true })
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (authStatus !== 'authenticated' || !session?.access_token) return

    const fetchData = async () => {
      try {
        const token = session.access_token as string
        const [summaryData, submissionsData] = await Promise.all([
          getDashboardSummary(token),
          listIntakeSubmissions(token),
        ])
        setSummary(summaryData)
        setSubmissions(submissionsData)
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [authStatus, session])

  if (authStatus === 'loading' || loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal mx-auto mb-4" />
            <p className="text-text-secondary text-sm">Loading your dashboard...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>My Dashboard — TenantGuard</title>
        <meta name="description" content="Manage your tenant rights cases, documents, and deadlines." />
      </Head>

      <Navbar />

      <main className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-navy text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                  My Dashboard
                </h1>
                <p className="text-white/70 text-sm mt-1">
                  Manage your cases, documents, and deadlines
                </p>
              </div>
              <Button
                onClick={() => router.push('/intake')}
                className="bg-teal hover:bg-teal/90 text-white rounded-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Case
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-sm p-4 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Stats Cards */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                <Card className="border-border">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-sm bg-teal/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-teal" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-text">{summary.cases}</p>
                        <p className="text-xs text-text-secondary">Total Cases</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <Card className="border-border">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-sm bg-amber-warn/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-amber-warn" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-text">{summary.active_cases}</p>
                        <p className="text-xs text-text-secondary">Active Cases</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-border">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-sm bg-red-urgent/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-red-urgent" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-text">{summary.upcoming_deadlines.length}</p>
                        <p className="text-xs text-text-secondary">Upcoming Deadlines</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className="border-border">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-sm bg-green-safe/10 flex items-center justify-center">
                        <Bell className="h-5 w-5 text-green-safe" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-text">{summary.pending_alerts}</p>
                        <p className="text-xs text-text-secondary">Pending Alerts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {/* Upcoming Deadlines */}
          {summary && summary.upcoming_deadlines.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-red-200 bg-red-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Upcoming Deadlines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {summary.upcoming_deadlines.map((deadline, i) => (
                    <div
                      key={`${deadline.case_id}-${deadline.type}-${i}`}
                      className="flex items-center justify-between p-3 bg-white border border-red-100 rounded-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-sm flex items-center justify-center ${
                          deadline.days_remaining <= 3 ? 'bg-red-100' : deadline.days_remaining <= 7 ? 'bg-amber-100' : 'bg-teal/10'
                        }`}>
                          {deadline.type === 'court_date' ? (
                            <Gavel className={`h-4 w-4 ${deadline.days_remaining <= 3 ? 'text-red-600' : 'text-amber-600'}`} />
                          ) : (
                            <Clock className={`h-4 w-4 ${deadline.days_remaining <= 3 ? 'text-red-600' : 'text-amber-600'}`} />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{deadline.label}</p>
                          <p className="text-xs text-gray-500">{deadline.case_name} — {new Date(deadline.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${
                          deadline.days_remaining <= 3 ? 'text-red-600' : deadline.days_remaining <= 7 ? 'text-amber-600' : 'text-teal'
                        }`}>
                          {deadline.days_remaining} day{deadline.days_remaining !== 1 ? 's' : ''}
                        </p>
                        <Link href={`/case/${deadline.case_id}`} className="text-xs text-teal hover:underline">
                          View Case
                        </Link>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Cases List */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-teal" />
                    My Cases
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-sm text-xs"
                    onClick={() => router.push('/intake')}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New Case
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                      No Cases Yet
                    </h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                      Start your first case to get AI-powered analysis of your tenant rights situation.
                    </p>
                    <Button
                      onClick={() => router.push('/intake')}
                      className="bg-teal hover:bg-teal/90 text-white rounded-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Start Your First Case
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissions.map((sub) => (
                      <Link key={sub.id} href={`/case/${sub.id}`}>
                        <div className="flex items-center justify-between p-4 border border-border rounded-sm hover:bg-background-secondary transition-colors cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-sm bg-navy/5 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-navy" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-text">
                                  {sub.full_name || `Case #${sub.id}`}
                                </p>
                                {statusBadge(sub.status)}
                                {sub.urgency_level && urgencyBadge(sub.urgency_level)}
                              </div>
                              <p className="text-xs text-text-secondary mt-0.5">
                                {ISSUE_LABELS[sub.issue_type] || 'Housing Issue'}
                                {sub.county && ` — ${sub.county}`}
                                {' — '}
                                {new Date(sub.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {sub.court_date && (
                              <div>
                                <p className="text-xs text-text-secondary">Court Date</p>
                                <p className={`text-sm font-semibold ${
                                  daysUntil(sub.court_date) <= 7 ? 'text-red-urgent' : 'text-text'
                                }`}>
                                  {new Date(sub.court_date).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Document Analyses */}
          {summary && summary.recent_analyses.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-safe" />
                    Recent Document Analyses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {summary.recent_analyses.map((analysis) => (
                      <div key={analysis.id} className="flex items-start gap-3 p-3 bg-background-secondary border border-border rounded-sm">
                        <Upload className="h-4 w-4 text-teal mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text truncate">{analysis.document_name}</p>
                          <p className="text-xs text-teal mb-1">{analysis.category}</p>
                          <p className="text-xs text-text-secondary line-clamp-2">{analysis.summary}</p>
                        </div>
                        <p className="text-xs text-text-secondary shrink-0">
                          {new Date(analysis.analyzed_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </>
  )
}
