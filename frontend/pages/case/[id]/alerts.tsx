import React, { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Bell, Calendar, CheckCircle2, Clock,
  Loader2, Mail, MessageSquare, Plus, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Navbar from '@/components/Navbar'
import {
  getIntakeSubmission,
  listAlerts,
  createAlert,
  CaseAlert,
} from '@/lib/api'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALERT_TYPES = [
  { value: 'court_date', label: 'Court Date Reminder' },
  { value: 'filing_deadline', label: 'Filing Deadline' },
  { value: 'document_due', label: 'Document Due' },
  { value: 'payment_due', label: 'Payment Due' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'custom', label: 'Custom Reminder' },
]

const DELIVERY_METHODS = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'sms', label: 'SMS', icon: MessageSquare },
  { value: 'both', label: 'Both', icon: Bell },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AlertsPage() {
  const { data: session, status: authStatus } = useSession({ required: true })
  const router = useRouter()
  const { id } = router.query
  const submissionId = Number(id)

  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<CaseAlert[]>([])
  const [caseName, setCaseName] = useState('')
  const [showCreator, setShowCreator] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [alertType, setAlertType] = useState('court_date')
  const [deliveryMethod, setDeliveryMethod] = useState('both')
  const [scheduledFor, setScheduledFor] = useState('')
  const [message, setMessage] = useState('')

  const fetchData = useCallback(async () => {
    if (!session?.access_token || !submissionId) return
    try {
      const token = session.access_token as string
      const [submissionData, alertsData] = await Promise.all([
        getIntakeSubmission(submissionId, token),
        listAlerts(submissionId, token),
      ])
      setCaseName(submissionData.full_name || `Case #${submissionData.id}`)
      setAlerts(alertsData)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [session, submissionId])

  useEffect(() => {
    if (authStatus === 'authenticated') fetchData()
  }, [authStatus, fetchData])

  const handleCreate = async () => {
    if (!session?.access_token || !scheduledFor || !message) return
    setCreating(true)
    setError('')
    try {
      const token = session.access_token as string
      const newAlert = await createAlert(submissionId, {
        alert_type: alertType,
        delivery_method: deliveryMethod,
        scheduled_for: new Date(scheduledFor).toISOString(),
        message,
      }, token)
      setAlerts((prev) => [newAlert, ...prev])
      setShowCreator(false)
      setMessage('')
      setScheduledFor('')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create alert.')
    } finally {
      setCreating(false)
    }
  }

  const pendingAlerts = alerts.filter((a) => a.status === 'pending')
  const sentAlerts = alerts.filter((a) => a.status === 'sent')

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
        <title>Alerts — {caseName} — TenantGuard</title>
      </Head>

      <Navbar />

      <main className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-navy text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            <Link href={`/case/${submissionId}`} className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-3">
              <ArrowLeft className="h-4 w-4" /> Back to Case
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                  Alerts &amp; Reminders
                </h1>
                <p className="text-white/70 text-sm mt-1">{caseName}</p>
              </div>
              <Button
                onClick={() => setShowCreator(!showCreator)}
                className="bg-teal hover:bg-teal/90 text-white rounded-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Alert
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Alert Creator */}
          <AnimatePresence>
            {showCreator && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <Card className="border-teal/30 bg-teal/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Bell className="h-4 w-4 text-teal" />
                      Create New Alert
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-text-secondary mb-1 block">Alert Type</label>
                        <select
                          value={alertType}
                          onChange={(e) => setAlertType(e.target.value)}
                          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/50"
                        >
                          {ALERT_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-text-secondary mb-1 block">Delivery Method</label>
                        <select
                          value={deliveryMethod}
                          onChange={(e) => setDeliveryMethod(e.target.value)}
                          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/50"
                        >
                          {DELIVERY_METHODS.map((m) => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-text-secondary mb-1 block">When to Send</label>
                      <input
                        type="datetime-local"
                        value={scheduledFor}
                        onChange={(e) => setScheduledFor(e.target.value)}
                        className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/50"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-text-secondary mb-1 block">Message</label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        placeholder="What should this alert remind you about?"
                        className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/50 resize-none"
                      />
                    </div>

                    {error && <p className="text-xs text-red-urgent">{error}</p>}

                    <div className="flex gap-3">
                      <Button
                        onClick={handleCreate}
                        disabled={creating || !scheduledFor || !message}
                        className="bg-teal hover:bg-teal/90 text-white rounded-sm"
                      >
                        {creating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Creating…
                          </>
                        ) : (
                          <>
                            <Bell className="h-4 w-4 mr-2" />
                            Create Alert
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowCreator(false)}
                        className="rounded-sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pending Alerts */}
          {pendingAlerts.length > 0 && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-warn" />
                  Upcoming ({pendingAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 p-3 border rounded-sm ${
                      alert.is_overdue ? 'border-red-200 bg-red-50' : 'border-border'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-sm flex items-center justify-center shrink-0 ${
                      alert.is_overdue ? 'bg-red-100' : 'bg-amber-50'
                    }`}>
                      <Bell className={`h-4 w-4 ${alert.is_overdue ? 'text-red-urgent' : 'text-amber-warn'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-text">{alert.alert_type_display}</p>
                        {alert.is_overdue && (
                          <span className="text-[10px] font-bold text-red-urgent uppercase">Overdue</span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">{alert.message}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(alert.scheduled_for).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          {alert.delivery_method === 'email' && <Mail className="h-3 w-3" />}
                          {alert.delivery_method === 'sms' && <MessageSquare className="h-3 w-3" />}
                          {alert.delivery_method === 'both' && <Bell className="h-3 w-3" />}
                          {alert.delivery_method}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Sent Alerts */}
          {sentAlerts.length > 0 && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Sent ({sentAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 border border-border rounded-sm opacity-70">
                    <CheckCircle2 className="h-5 w-5 text-green-safe shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text">{alert.alert_type_display}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{alert.message}</p>
                      {alert.sent_at && (
                        <p className="text-xs text-text-secondary mt-1">
                          Sent {new Date(alert.sent_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {alerts.length === 0 && (
            <Card className="border-border">
              <CardContent className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  No Alerts Set
                </h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                  Set up reminders for court dates, filing deadlines, and other important events.
                </p>
                <Button
                  onClick={() => setShowCreator(true)}
                  className="bg-teal hover:bg-teal/90 text-white rounded-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Alert
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  )
}
