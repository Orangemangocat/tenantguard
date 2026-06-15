import React, { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, AlertTriangle, CheckCircle, Shield, ArrowRight, Loader2, Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { quickAnalyzeDocument, type QuickAnalyzeResponse } from '@/lib/api'
import { signIn } from 'next-auth/react'

type Stage = 'upload' | 'analyzing' | 'result'

const URGENCY_CONFIG: Record<string, { label: string; color: string; icon: typeof AlertTriangle }> = {
  critical: { label: 'Urgent — Act Now', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
  high: { label: 'Time-Sensitive', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Clock },
  medium: { label: 'Important', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  low: { label: 'Non-Urgent', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
}

export default function NoticeUploadHero() {
  const [stage, setStage] = useState<Stage>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [result, setResult] = useState<QuickAnalyzeResponse | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile)
    setError('')
    setStage('analyzing')

    try {
      const response = await quickAnalyzeDocument(selectedFile)
      setResult(response)
      // Store the token in localStorage so it persists through sign-up
      if (response.token) {
        localStorage.setItem('tg_pending_upload_token', response.token)
      }
      setStage('result')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Upload failed. Please try again.')
      setStage('upload')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFile(droppedFile)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) handleFile(selectedFile)
  }, [handleFile])

  const handleSignUp = () => {
    signIn(undefined, { callbackUrl: '/dashboard' })
  }

  const handleReset = () => {
    setStage('upload')
    setFile(null)
    setResult(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const urgencyInfo = result?.urgency ? URGENCY_CONFIG[result.urgency] || URGENCY_CONFIG.medium : null

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {/* ── UPLOAD STAGE ─────────────────────────────────────────── */}
          {stage === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <Badge variant="outline" className="mb-6 border-red-800 text-red-800">
                Free Instant Analysis
              </Badge>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 text-gray-900">
                Got a Notice from
                <span className="block text-red-800">Your Landlord?</span>
              </h1>
              <p className="text-lg sm:text-xl mb-8 max-w-2xl mx-auto text-gray-600">
                Upload it now. We&apos;ll instantly tell you what it is, what it means, and what to do next.
              </p>

              {/* Drop Zone */}
              <div
                className={`relative max-w-lg mx-auto border-2 border-dashed rounded-xl p-8 sm:p-12 transition-all duration-200 cursor-pointer ${
                  dragOver
                    ? 'border-red-800 bg-red-50 scale-[1.02]'
                    : 'border-gray-300 bg-white hover:border-red-800 hover:bg-red-50/30'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.txt,.png,.jpg,.jpeg,.doc,.docx,.heic"
                  className="hidden"
                  onChange={handleInputChange}
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                    <Upload className="h-8 w-8 text-red-800" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 mb-1">
                      Upload Notice from Landlord
                    </p>
                    <p className="text-sm text-gray-500">
                      Drop your file here or tap to browse
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      PDF, images, Word docs — up to 20MB
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-sm text-red-600"
                >
                  {error}
                </motion.p>
              )}

              <p className="mt-6 text-xs text-gray-400 flex items-center justify-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Your document is encrypted and securely stored. We never share your information.
              </p>
            </motion.div>
          )}

          {/* ── ANALYZING STAGE ──────────────────────────────────────── */}
          {stage === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <div className="max-w-md mx-auto">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="h-8 w-8 text-red-800 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Analyzing Your Document...
                </h2>
                <p className="text-gray-600 mb-2">
                  Reading <span className="font-medium">{file?.name}</span>
                </p>
                <p className="text-sm text-gray-400">
                  Our AI is identifying the document type and key details. This usually takes 5–15 seconds.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── RESULT STAGE ─────────────────────────────────────────── */}
          {stage === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-8">
                <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-7 w-7 text-green-700" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  We Identified Your Document
                </h2>
                <p className="text-gray-500 text-sm">
                  {file?.name}
                </p>
              </div>

              {/* Analysis Card */}
              <Card className="border-2 border-gray-200 shadow-lg max-w-2xl mx-auto mb-8">
                <CardContent className="p-6 sm:p-8">
                  {/* Document Type */}
                  <div className="flex items-start gap-4 mb-6">
                    <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                      <FileText className="h-6 w-6 text-red-800" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {result.document_type}
                      </h3>
                      {urgencyInfo && (
                        <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-semibold border rounded ${urgencyInfo.color}`}>
                          <urgencyInfo.icon className="h-3 w-3" />
                          {urgencyInfo.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-gray-800 leading-relaxed">
                      {result.summary}
                    </p>
                  </div>

                  {/* Key Dates */}
                  {result.key_dates && result.key_dates.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        Key Dates
                      </h4>
                      <div className="space-y-2">
                        {result.key_dates.map((kd, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-white border border-gray-100 rounded">
                            <span className="text-sm text-gray-700">{kd.label}</span>
                            <span className={`text-sm font-medium ${kd.is_deadline ? 'text-red-700' : 'text-gray-600'}`}>
                              {kd.date}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  {result.next_steps && result.next_steps.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        What You Should Do
                      </h4>
                      <ul className="space-y-2">
                        {result.next_steps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="bg-red-800 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CTA: Sign Up */}
              <div className="text-center max-w-lg mx-auto">
                <div className="bg-gradient-to-r from-red-800 to-red-900 rounded-xl p-6 sm:p-8 text-white shadow-lg">
                  <Shield className="h-8 w-8 mx-auto mb-3 opacity-80" />
                  <h3 className="text-xl font-bold mb-2">
                    We Can Help You Respond
                  </h3>
                  <p className="text-white/80 text-sm mb-5">
                    Sign up now and we&apos;ll walk you through the process step by step. Your uploaded document will be automatically attached to your case — no need to re-upload.
                  </p>
                  <Button
                    size="lg"
                    className="bg-white text-red-800 hover:bg-gray-100 font-semibold w-full sm:w-auto"
                    onClick={handleSignUp}
                  >
                    Sign Up &amp; Get Help <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-white/50 text-xs mt-3">
                    Free to sign up. Quick Google or email registration.
                  </p>
                </div>

                <button
                  onClick={handleReset}
                  className="mt-4 text-sm text-gray-400 hover:text-gray-600 underline"
                >
                  Upload a different document
                </button>
              </div>

              {/* Legal Disclaimer */}
              <p className="mt-8 text-xs text-gray-400 text-center max-w-xl mx-auto">
                TenantGuard is not a law firm and does not provide legal advice. This analysis is for informational purposes only and should not be considered a substitute for professional legal counsel.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
