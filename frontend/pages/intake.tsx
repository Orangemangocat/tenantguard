import React, { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useSession, signIn } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Shield, CheckCircle, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { getIntakeChatHistory, streamIntakeChat, type ChatMessage, type ChatSSEEvent } from '@/lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
}

const URGENCY_LABEL: Record<string, { label: string; color: string }> = {
  immediate:    { label: 'Urgent — Priority Review', color: 'text-red-600 bg-red-50 border-red-200' },
  within_days:  { label: 'Time-Sensitive',           color: 'text-orange-600 bg-orange-50 border-orange-200' },
  within_weeks: { label: 'Standard Review',          color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  not_urgent:   { label: 'Standard Review',          color: 'text-green-600 bg-green-50 border-green-200' },
}

const FIELD_LABELS: Record<string, string> = {
  first_name: 'Your name',
  last_name: 'Your name',
  phone: 'Phone',
  property_address: 'Property',
  county: 'County',
  landlord_name: 'Landlord',
  issue_type: 'Issue type',
  issue_description: 'Issue details',
  court_date: 'Court date',
  notice_date: 'Notice date',
  urgency_level: 'Urgency',
  desired_outcome: 'Your goal',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IntakePage() {
  const { data: session, status } = useSession()
  const token = (session as any)?.access_token as string | undefined

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [submissionId, setSubmissionId] = useState<number | undefined>()
  const [collectedFields, setCollectedFields] = useState<Set<string>>(new Set())
  const [isComplete, setIsComplete] = useState(false)
  const [urgency, setUrgency] = useState<string>('not_urgent')
  const [started, setStarted] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Persist submissionId to localStorage whenever it changes
  useEffect(() => {
    if (submissionId) {
      localStorage.setItem('tg_intake_submission_id', String(submissionId))
    }
  }, [submissionId])

  // Scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  const resizeTextarea = () => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  // On auth, try to restore a previous session before starting fresh
  useEffect(() => {
    if (status !== 'authenticated' || !token || started) return

    const restore = async () => {
      setIsRestoring(true)
      try {
        const storedId = localStorage.getItem('tg_intake_submission_id')
        const history = await getIntakeChatHistory(
          token,
          storedId ? Number(storedId) : undefined
        )

        if (history.messages.length > 0) {
          // Restore conversation from server log
          setSubmissionId(history.submission_id ?? undefined)
          setMessages(
            history.messages.map((m, i) => ({
              id: `restored-${i}`,
              role: m.role,
              content: m.content,
            }))
          )
          setCollectedFields(new Set(history.collected_fields))
          if (history.status === 'pending' || history.status === 'complete') {
            setIsComplete(true)
            setUrgency(history.urgency_level)
          }
          setStarted(true) // prevent [START_INTAKE] from firing
        }
      } catch {
        // Ignore restore errors — fall through to fresh start
      } finally {
        setIsRestoring(false)
      }
    }

    restore()
  }, [status, token]) // eslint-disable-line react-hooks/exhaustive-deps

  // Kick off a fresh conversation if nothing was restored
  useEffect(() => {
    if (status === 'authenticated' && token && !started && !isRestoring) {
      setStarted(true)
      sendTurn('[START_INTAKE]', true)
    }
  }, [status, token, started, isRestoring]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send a turn ──────────────────────────────────────────────────────────

  const sendTurn = async (userText: string, hidden = false) => {
    if (!token || isStreaming) return

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: userText,
    }

    const assistantId = `a-${Date.now()}`
    const assistantPlaceholder: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      pending: true,
    }

    // Build history synchronously from the current messages snapshot.
    // Do this BEFORE calling setMessages — setMessages updaters run during
    // React reconciliation, not immediately, so reading inside them would
    // always produce an empty history by the time the API call fires.
    const history: ChatMessage[] = messages
      .filter((m) => !m.pending && m.content)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    history.push({ role: 'user', content: userText })

    // Update UI
    setMessages((prev) => {
      const visible = hidden ? prev : [...prev, userMsg]
      return [...visible, assistantPlaceholder]
    })

    setIsStreaming(true)
    let streamedContent = ''

    await streamIntakeChat(
      history,
      token,
      (event: ChatSSEEvent) => {
        switch (event.type) {
          case 'submission_id':
            if (event.id) setSubmissionId(event.id)
            break

          case 'text':
            streamedContent += event.content ?? ''
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: streamedContent, pending: false }
                  : m
              )
            )
            break

          case 'intake_saved':
            if (event.fields) {
              setCollectedFields((prev) => {
                const next = new Set(prev)
                event.fields!.forEach((f) => {
                  if (FIELD_LABELS[f]) next.add(f)
                })
                return next
              })
            }
            break

          case 'intake_complete':
            setIsComplete(true)
            setUrgency(event.urgency ?? 'not_urgent')
            if (event.submission_id) setSubmissionId(event.submission_id)
            break

          case 'error':
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content:
                        "I'm sorry, something went wrong on my end. Please try refreshing the page.",
                      pending: false,
                    }
                  : m
              )
            )
            break
        }
      },
      submissionId
    )

    setIsStreaming(false)
    inputRef.current?.focus()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isStreaming || isComplete) return
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    sendTurn(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  // ── Collected fields summary ─────────────────────────────────────────────

  const uniqueFieldLabels = Array.from(
    new Set(Array.from(collectedFields).map((f) => FIELD_LABELS[f]).filter(Boolean))
  )

  // ── Render ───────────────────────────────────────────────────────────────

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Sign in to get started</h1>
          <p className="text-gray-600 mb-8">
            Create a free account to open a case file and connect with Tennessee tenant resources.
          </p>
          <Button className="bg-primary hover:opacity-90 w-full" onClick={() => signIn()}>
            Sign in with Google or GitHub
          </Button>
        </div>
      </div>
    )
  }

  const urgencyInfo = URGENCY_LABEL[urgency]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head>
        <title>Get Help — TenantGuard</title>
        <meta name="description" content="Tell us about your housing situation. Our AI intake specialist will open your case file and connect you with Tennessee tenant resources." />
      </Head>

      <Navbar />

      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 gap-4">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 transition-colors gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          {submissionId && (
            <span className="text-xs text-gray-400">Case #{submissionId}</span>
          )}
        </div>

        {/* ── Collected fields ────────────────────────────────────────── */}
        <AnimatePresence>
          {uniqueFieldLabels.length > 0 && !isComplete && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-wrap gap-2 items-center"
            >
              <span className="text-xs text-gray-400 mr-1">Collected:</span>
              {uniqueFieldLabels.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                >
                  <CheckCircle className="h-3 w-3" />
                  {label}
                </span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Completion card ──────────────────────────────────────────── */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-2xl border p-4 flex items-start gap-3 ${urgencyInfo.color}`}
            >
              {urgency === 'immediate' ? (
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <div className="space-y-2">
                <p className="font-semibold text-sm">{urgencyInfo.label} — Case File Opened</p>
                <p className="text-sm">
                  {urgency === 'immediate'
                    ? "Your case is marked urgent. Upload your documents now and we'll analyze them immediately — you'll get a plain-English breakdown of your rights and exactly what to do before your court date."
                    : "Your case file is ready. Upload your documents and TenantGuard will analyze your situation — you'll get your rights, your deadlines, and a step-by-step action plan in plain English."}
                </p>
                {submissionId && (
                  <a
                    href={`/case/${submissionId}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-2"
                  >
                    Go to your case dashboard →
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Chat window ──────────────────────────────────────────────── */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden min-h-[400px] sm:min-h-[500px]">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
              </div>
            )}

            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mr-3 mt-0.5">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-gray-50 text-gray-800 rounded-bl-sm border border-gray-100'
                  }`}
                >
                  {msg.pending && !msg.content ? (
                    <span className="flex items-center gap-1.5 text-gray-400">
                      <span className="h-1.5 w-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:300ms]" />
                    </span>
                  ) : (
                    <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                  )}
                </div>
              </motion.div>
            ))}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3 sm:p-4">
            {isComplete ? (
              <p className="text-center text-sm text-gray-400 py-2">
                Your case has been submitted. ✓
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value)
                    resizeTextarea()
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Tell us what's happening…"
                  rows={1}
                  disabled={isStreaming}
                  className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 min-h-[44px] max-h-[160px] leading-relaxed"
                />
                <Button
                  type="submit"
                  disabled={isStreaming || !input.trim()}
                  className="bg-primary hover:opacity-90 h-11 w-11 p-0 rounded-xl shrink-0"
                >
                  {isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-gray-400 pb-2">
          TenantGuard is not a law firm. This intake does not create an attorney-client relationship.{' '}
          <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}
