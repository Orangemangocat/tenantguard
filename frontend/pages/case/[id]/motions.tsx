import React, { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Calendar, ChevronDown, ChevronUp, Copy,
  Download, FileText, Gavel, Loader2, Plus, Scale,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Navbar from '@/components/Navbar'
import {
  getIntakeSubmission,
  listMotions,
  generateMotion,
  CaseMotion,
} from '@/lib/api'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MOTION_TYPES = [
  { value: 'dismiss', label: 'Motion to Dismiss', description: 'Challenge the legal basis of the eviction' },
  { value: 'continuance', label: 'Motion for Continuance', description: 'Request more time to prepare your defense' },
  { value: 'stay', label: 'Motion to Stay', description: 'Pause the eviction proceedings' },
  { value: 'quash', label: 'Motion to Quash Service', description: 'Challenge improper notice delivery' },
  { value: 'discovery', label: 'Motion for Discovery', description: 'Request documents from the landlord' },
  { value: 'default_set_aside', label: 'Motion to Set Aside Default', description: 'Reverse a default judgment' },
]

// ---------------------------------------------------------------------------
// Motion Detail Component
// ---------------------------------------------------------------------------

function MotionCard({ motion: m }: { motion: CaseMotion }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(m.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-sm bg-navy/5 flex items-center justify-center">
              <Gavel className="h-4 w-4 text-navy" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">{m.title}</p>
              <p className="text-xs text-text-secondary">{m.motion_type_display}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded-sm ${
              m.status === 'draft' ? 'bg-gray-50 text-gray-600 border-gray-200' :
              m.status === 'filed' ? 'bg-green-50 text-green-700 border-green-200' :
              'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {m.status_display}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-7 w-7 p-0"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
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
            <CardContent className="space-y-4 pt-2">
              {/* Filing Info */}
              <div className="flex flex-wrap gap-4 text-xs text-text-secondary">
                {m.filing_deadline && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Filing Deadline: {new Date(m.filing_deadline).toLocaleDateString()}
                  </span>
                )}
                {m.court_name && (
                  <span className="flex items-center gap-1">
                    <Scale className="h-3.5 w-3.5" />
                    {m.court_name}
                  </span>
                )}
                {m.filing_fee && (
                  <span>Fee: {m.filing_fee}</span>
                )}
              </div>

              {/* Motion Content */}
              <div className="relative">
                <div className="bg-background-secondary border border-border rounded-sm p-4 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-text whitespace-pre-wrap font-body leading-relaxed">
                    {m.content}
                  </pre>
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="h-7 text-xs rounded-sm"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              {m.instructions && (
                <div className="bg-teal/5 border border-teal/20 rounded-sm p-4">
                  <h4 className="text-xs font-semibold text-navy uppercase tracking-wide mb-2">Filing Instructions</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{m.instructions}</p>
                </div>
              )}

              <p className="text-xs text-text-secondary">
                Generated {new Date(m.generated_at).toLocaleString()}
              </p>
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

export default function MotionsPage() {
  const { data: session, status: authStatus } = useSession({ required: true })
  const router = useRouter()
  const { id } = router.query
  const submissionId = Number(id)

  const [loading, setLoading] = useState(true)
  const [motions, setMotions] = useState<CaseMotion[]>([])
  const [caseName, setCaseName] = useState('')
  const [generating, setGenerating] = useState(false)
  const [selectedType, setSelectedType] = useState('dismiss')
  const [showGenerator, setShowGenerator] = useState(false)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    if (!session?.access_token || !submissionId) return
    try {
      const token = session.access_token as string
      const [submissionData, motionsData] = await Promise.all([
        getIntakeSubmission(submissionId, token),
        listMotions(submissionId, token),
      ])
      setCaseName(submissionData.full_name || `Case #${submissionData.id}`)
      setMotions(motionsData)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [session, submissionId])

  useEffect(() => {
    if (authStatus === 'authenticated') fetchData()
  }, [authStatus, fetchData])

  const handleGenerate = async () => {
    if (!session?.access_token) return
    setGenerating(true)
    setError('')
    try {
      const token = session.access_token as string
      const newMotion = await generateMotion(submissionId, selectedType, token)
      setMotions((prev) => [newMotion, ...prev])
      setShowGenerator(false)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to generate motion. Please try again.')
    } finally {
      setGenerating(false)
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
        <title>Motions — {caseName} — TenantGuard</title>
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
                  Legal Motions
                </h1>
                <p className="text-white/70 text-sm mt-1">{caseName}</p>
              </div>
              <Button
                onClick={() => setShowGenerator(!showGenerator)}
                className="bg-teal hover:bg-teal/90 text-white rounded-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Generate Motion
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Motion Generator */}
          <AnimatePresence>
            {showGenerator && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <Card className="border-teal/30 bg-teal/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Gavel className="h-4 w-4 text-teal" />
                      Generate a Legal Motion
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-text-secondary">
                      Select the type of motion to generate. Our AI will draft it based on your case details and Tennessee law.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {MOTION_TYPES.map((type) => (
                        <div
                          key={type.value}
                          onClick={() => setSelectedType(type.value)}
                          className={`p-3 rounded-sm border cursor-pointer transition-all ${
                            selectedType === type.value
                              ? 'border-teal bg-teal/10 ring-1 ring-teal/30'
                              : 'border-border hover:border-teal/50'
                          }`}
                        >
                          <p className="text-sm font-medium text-text">{type.label}</p>
                          <p className="text-xs text-text-secondary mt-0.5">{type.description}</p>
                        </div>
                      ))}
                    </div>

                    {error && <p className="text-xs text-red-urgent">{error}</p>}

                    <div className="flex gap-3">
                      <Button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="bg-teal hover:bg-teal/90 text-white rounded-sm"
                      >
                        {generating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Generating…
                          </>
                        ) : (
                          <>
                            <Gavel className="h-4 w-4 mr-2" />
                            Generate Motion
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowGenerator(false)}
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

          {/* Motions List */}
          {motions.length === 0 ? (
            <Card className="border-border">
              <CardContent className="text-center py-12">
                <Gavel className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  No Motions Yet
                </h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                  Generate your first legal motion to get a court-ready document drafted based on your case.
                </p>
                <Button
                  onClick={() => setShowGenerator(true)}
                  className="bg-teal hover:bg-teal/90 text-white rounded-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Your First Motion
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {motions.map((m) => (
                <MotionCard key={m.id} motion={m} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
