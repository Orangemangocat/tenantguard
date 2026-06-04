import React, { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Calendar, CheckCircle2, Circle, Clock,
  Loader2, ListTodo,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Navbar from '@/components/Navbar'
import {
  getIntakeSubmission,
  listActionItems,
  toggleActionItem,
  CaseActionItem,
} from '@/lib/api'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function priorityStyles(priority: string): string {
  if (priority === 'critical' || priority === 'high') return 'border-l-red-urgent'
  if (priority === 'medium') return 'border-l-amber-warn'
  return 'border-l-gray-300'
}

function priorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  }
  return labels[priority] || priority
}

function priorityBadgeColor(priority: string): string {
  if (priority === 'critical' || priority === 'high') return 'bg-red-50 text-red-700 border-red-200'
  if (priority === 'medium') return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-gray-50 text-gray-600 border-gray-200'
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ActionsPage() {
  const { data: session, status: authStatus } = useSession({ required: true })
  const router = useRouter()
  const { id } = router.query
  const submissionId = Number(id)

  const [loading, setLoading] = useState(true)
  const [actions, setActions] = useState<CaseActionItem[]>([])
  const [caseName, setCaseName] = useState('')
  const [toggling, setToggling] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    if (!session?.access_token || !submissionId) return
    try {
      const token = session.access_token as string
      const [submissionData, actionsData] = await Promise.all([
        getIntakeSubmission(submissionId, token),
        listActionItems(submissionId, token),
      ])
      setCaseName(submissionData.full_name || `Case #${submissionData.id}`)
      setActions(actionsData)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [session, submissionId])

  useEffect(() => {
    if (authStatus === 'authenticated') fetchData()
  }, [authStatus, fetchData])

  const handleToggle = async (actionId: number, currentCompleted: boolean) => {
    if (!session?.access_token) return
    setToggling(actionId)
    try {
      const token = session.access_token as string
      const updated = await toggleActionItem(submissionId, actionId, !currentCompleted, token)
      setActions((prev) => prev.map((a) => (a.id === actionId ? updated : a)))
    } catch {
      // silent
    } finally {
      setToggling(null)
    }
  }

  const pendingActions = actions.filter((a) => !a.completed)
  const completedActions = actions.filter((a) => a.completed)
  const completionPct = actions.length > 0 ? Math.round((completedActions.length / actions.length) * 100) : 0

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
        <title>Action Items — {caseName} — TenantGuard</title>
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
              Action Items
            </h1>
            <p className="text-white/70 text-sm mt-1">{caseName}</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Progress */}
          {actions.length > 0 && (
            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-text">
                    {completedActions.length} of {actions.length} completed
                  </p>
                  <p className="text-sm font-bold text-teal">{completionPct}%</p>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-teal rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Actions */}
          {pendingActions.length > 0 && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-teal" />
                  To Do ({pendingActions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingActions.map((action) => (
                  <div
                    key={action.id}
                    className={`flex items-start gap-3 p-3 border border-border rounded-sm border-l-4 ${priorityStyles(action.priority)} hover:bg-background-secondary transition-colors`}
                  >
                    <button
                      onClick={() => handleToggle(action.id, action.completed)}
                      disabled={toggling === action.id}
                      className="mt-0.5 shrink-0"
                    >
                      {toggling === action.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-teal" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400 hover:text-teal transition-colors" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-text">{action.title}</p>
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold border rounded-sm ${priorityBadgeColor(action.priority)}`}>
                          {priorityLabel(action.priority)}
                        </span>
                      </div>
                      {action.description && (
                        <p className="text-xs text-text-secondary mt-1">{action.description}</p>
                      )}
                      {action.due_date && (
                        <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Due: {new Date(action.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Completed Actions */}
          {completedActions.length > 0 && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Completed ({completedActions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {completedActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-start gap-3 p-3 border border-border rounded-sm bg-green-50/50 opacity-75"
                  >
                    <button
                      onClick={() => handleToggle(action.id, action.completed)}
                      disabled={toggling === action.id}
                      className="mt-0.5 shrink-0"
                    >
                      {toggling === action.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-teal" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-green-safe" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text line-through">{action.title}</p>
                      {action.completed_at && (
                        <p className="text-xs text-text-secondary mt-0.5">
                          Completed {new Date(action.completed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {actions.length === 0 && (
            <Card className="border-border">
              <CardContent className="text-center py-12">
                <ListTodo className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  No Action Items Yet
                </h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  Action items will appear here once your case has been analyzed. They help you track what to do next.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  )
}
