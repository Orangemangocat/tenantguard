import React, { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Upload, FileText, Clock, Shield, CheckCircle, ArrowRight,
  MessageCircle, Send, X, AlertTriangle, Loader2, ChevronRight
} from 'lucide-react'

// ─── Types ─────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: number
  role: 'assistant' | 'user'
  content: string
}

interface AnalysisResult {
  documentType: string
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low'
  deadline: string
  summary: string
  rights: string[]
  recommendedActions: string[]
}

interface UserProfile {
  name: string
  email: string
  phone: string
  address: string
  landlordName: string
  situation: string
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function GetHelpPage() {
  // Upload state
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [uploadError, setUploadError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      content: "Hi! I'm here to help you understand your situation. Did you receive a notice from your landlord? Tell me what's going on, or upload the document above and I'll analyze it for you."
    }
  ])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<Partial<UserProfile>>({})
  const [onboardingStep, setOnboardingStep] = useState(0)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages])

  // ─── File Upload Handlers ──────────────────────────────────────────────
  const handleFileSelect = (selectedFile: File) => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence']
    // Also allow HEIC/HEIF by extension when browser reports a generic MIME type
    const isHeicByExt = /\.(heic|heif)$/i.test(selectedFile.name)

    if (!allowedTypes.includes(selectedFile.type) && !isHeicByExt) {
      setUploadError('Please upload a PDF, JPG, PNG, or HEIC (iPhone photo) file.')
      return
    }
    if (selectedFile.size > maxSize) {
      setUploadError('File must be under 10MB.')
      return
    }

    setFile(selectedFile)
    setUploadError('')
    handleAnalyze(selectedFile)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFileSelect(droppedFile)
  }

  const handleAnalyze = async (fileToAnalyze: File) => {
    setAnalyzing(true)
    setUploadError('')

    try {
      const formData = new FormData()
      formData.append('document', fileToAnalyze)

      const response = await fetch('/api/analyze-notice', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Analysis failed')

      const raw = await response.json()
      // Normalize API response — defensively map all known field name variants
      const result: AnalysisResult = {
        documentType: raw.documentType || 'Legal Document',
        urgencyLevel: (raw.urgencyLevel || 'low').toLowerCase() as AnalysisResult['urgencyLevel'],
        deadline: raw.deadline || 'Review your notice for any stated deadlines',
        summary: raw.summary || '',
        rights: raw.rights || raw.tenantRights || [],
        recommendedActions: raw.recommendedActions || [],
      }
      setAnalysisResult(result)

      // Auto-open chat after analysis
      setTimeout(() => {
        setChatOpen(true)
        const followUp: ChatMessage = {
          id: chatMessages.length + 1,
          role: 'assistant',
          content: `I've analyzed your document. It appears to be a **${result.documentType}**. ${result.summary}\n\nTo help you further, I need a few details. What's your full name?`
        }
        setChatMessages(prev => [...prev, followUp])
        setOnboardingStep(1)
      }, 500)
    } catch (err) {
      setUploadError('Analysis failed. Please try again or use the chat for help.')
    } finally {
      setAnalyzing(false)
    }
  }

  // ─── Chat Handlers ─────────────────────────────────────────────────────
  const handleChatSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!chatInput.trim() || chatLoading) return

    const userMsg: ChatMessage = {
      id: chatMessages.length + 1,
      role: 'user',
      content: chatInput
    }
    setChatMessages(prev => [...prev, userMsg])
    const currentInput = chatInput
    setChatInput('')
    setChatLoading(true)

    // Onboarding flow - collect user info step by step
    let nextMessage = ''
    const updatedProfile = { ...userProfile }

    switch (onboardingStep) {
      case 1: // Collecting name
        updatedProfile.name = currentInput
        nextMessage = `Nice to meet you, ${currentInput}! What's the best email address to reach you at? We'll send your analysis results and any updates there.`
        setOnboardingStep(2)
        break
      case 2: // Collecting email
        updatedProfile.email = currentInput
        nextMessage = `Got it. And a phone number where we can text you deadline reminders? (You can skip this by typing "skip")`
        setOnboardingStep(3)
        break
      case 3: // Collecting phone
        updatedProfile.phone = currentInput.toLowerCase() === 'skip' ? '' : currentInput
        nextMessage = `What's the address of the rental property this notice is about?`
        setOnboardingStep(4)
        break
      case 4: // Collecting address
        updatedProfile.address = currentInput
        nextMessage = `And who is your landlord or property management company?`
        setOnboardingStep(5)
        break
      case 5: // Collecting landlord name
        updatedProfile.landlordName = currentInput
        nextMessage = `Thank you! I have everything I need to start building your case file.\n\n**Here's your situation summary:**\n- Document: ${analysisResult?.documentType || 'Pending analysis'}\n- Deadline: ${analysisResult?.deadline || 'To be determined'}\n- Property: ${updatedProfile.address}\n- Landlord: ${currentInput}\n\nI'm creating your case file now. You'll receive a confirmation at ${updatedProfile.email}.\n\nWould you like me to:\n1. Draft a response letter\n2. Connect you with a Tennessee attorney (free through Right to Counsel)\n3. Explain your rights in more detail`
        setOnboardingStep(6)
        break
      default:
        // General AI conversation after onboarding
        try {
          const response = await fetch('/api/chat-help', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: currentInput,
              history: chatMessages.map(m => ({ role: m.role, content: m.content })),
              userProfile: updatedProfile,
              analysisResult
            })
          })
          if (response.ok) {
            const data = await response.json()
            nextMessage = data.reply
          } else {
            nextMessage = "I'm having trouble connecting right now. Please try again in a moment, or call Legal Aid of Middle Tennessee at (615) 244-6610 for immediate help."
          }
        } catch {
          nextMessage = "I'm having trouble connecting right now. Please try again in a moment, or call Legal Aid of Middle Tennessee at (615) 244-6610 for immediate help."
        }
        break
    }

    setUserProfile(updatedProfile)

    // Save profile to backend when we have enough info
    if (onboardingStep >= 5 && updatedProfile.name && updatedProfile.email) {
      try {
        await fetch('/api/save-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...updatedProfile,
            analysisResult,
            source: 'get-help-page'
          })
        })
      } catch {
        // Silent fail - don't block UX
      }
    }

    if (nextMessage) {
      setTimeout(() => {
        const assistantMsg: ChatMessage = {
          id: chatMessages.length + 2,
          role: 'assistant',
          content: nextMessage
        }
        setChatMessages(prev => [...prev, assistantMsg])
        setChatLoading(false)
      }, 800)
    } else {
      setChatLoading(false)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setAnalysisResult(null)
    setUploadError('')
    setAnalyzing(false)
  }

  const urgencyColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  }

  return (
    <>
      <Head>
        <title>Get Help Now — TenantGuard | Upload Your Notice</title>
        <meta name="description" content="Upload your landlord's notice and get instant AI analysis of your rights, deadlines, and next steps. Free for Tennessee tenants." />
      </Head>

      <div className="min-h-screen bg-white">
        {/* ─── HEADER ─── */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-red-700 to-red-900 rounded-lg flex items-center justify-center shadow-md">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight">
                <span className="text-red-700">Tenant</span>
                <span className="text-gray-900">Guard</span>
              </span>
            </Link>
            <Button
              className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white font-bold shadow-md"
              onClick={() => setChatOpen(true)}
            >
              Get Help Now
            </Button>
          </div>
        </header>

        {/* ─── HERO SECTION ─── */}
        <section className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-red-50/50 to-white" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-100/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

          <div className="relative max-w-6xl mx-auto px-4 pt-12 pb-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Copy */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Urgency badge */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-full px-4 py-2 text-sm font-semibold text-amber-900 mb-6 shadow-sm">
                  <span className="text-base">⚡</span>
                  Tennessee tenants have 14 days to respond
                </div>

                <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-5 tracking-tight">
                  Understand Your{' '}
                  <span className="bg-gradient-to-r from-red-700 to-orange-600 bg-clip-text text-transparent">
                    Notice
                  </span>{' '}
                  in Seconds
                </h1>

                <p className="text-lg text-gray-600 leading-relaxed mb-4 max-w-lg">
                  Upload the letter from your landlord. Our AI instantly tells you what it means, your rights, and exactly what to do next.
                </p>

                <p className="text-base font-bold text-red-700 mb-8">
                  Free — No Account Required{' '}
                  <span className="text-gray-400 font-normal">| Results in under 60 seconds</span>
                </p>

                {/* Stats */}
                <div className="flex gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-black text-red-700">60s</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Avg. Analysis</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-red-700">Free</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Always</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-red-700">24/7</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Available</div>
                  </div>
                </div>
              </motion.div>

              {/* Right: Phone Mockup */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative flex justify-center"
              >
                {/* Floating badges */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute top-8 -left-4 bg-white rounded-xl px-4 py-2 shadow-lg border border-gray-100 text-sm font-semibold text-red-700 z-10"
                >
                  📄 14-Day Notice Detected
                </motion.div>
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  className="absolute top-32 -right-4 bg-red-700 rounded-xl px-4 py-2 shadow-lg text-sm font-semibold text-white z-10"
                >
                  ✓ Rights Identified
                </motion.div>
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 2 }}
                  className="absolute bottom-24 -left-4 bg-white rounded-xl px-4 py-2 shadow-lg border border-gray-100 text-sm font-semibold text-orange-600 z-10"
                >
                  ⚡ Deadline: Jun 28
                </motion.div>

                {/* Phone frame */}
                <div className="w-64 h-[520px] bg-gray-900 rounded-[40px] p-3 shadow-2xl" style={{ transform: 'perspective(1000px) rotateY(-3deg) rotateX(2deg)' }}>
                  <div className="w-full h-full bg-white rounded-[30px] overflow-hidden relative">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-900 rounded-b-2xl z-10" />
                    {/* Screen content */}
                    <div className="pt-10 px-4 pb-4 h-full overflow-hidden">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-black text-red-700">TenantGuard</span>
                        <span className="text-[9px] bg-orange-500 text-white px-2 py-0.5 rounded font-bold">FREE</span>
                      </div>
                      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 text-center mb-3">
                        <div className="w-8 h-8 mx-auto mb-2 bg-gradient-to-br from-red-700 to-red-800 rounded-full flex items-center justify-center">
                          <Upload className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-800">Upload Your Notice</p>
                        <p className="text-[8px] text-gray-400">PDF, photo, or screenshot</p>
                      </div>
                      <div className="bg-orange-500 text-white text-[10px] font-bold text-center py-2 rounded-lg mb-3">
                        Analyze — Free
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-[9px] font-bold text-red-700 mb-1">✓ Analysis Complete</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-700" />
                            <span className="text-[8px] text-gray-700">Type: 14-Day Pay or Quit</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-700" />
                            <span className="text-[8px] text-gray-700">Deadline: June 28, 2026</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-700" />
                            <span className="text-[8px] text-gray-700">Issue: Improper service</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-700" />
                            <span className="text-[8px] text-gray-700">Action: File response</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ─── UPLOAD SECTION ─── */}
        <section className="py-12 px-4">
          <div className="max-w-lg mx-auto">
            <AnimatePresence mode="wait">
              {!analysisResult ? (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card
                    className={`border-2 border-dashed transition-all cursor-pointer ${
                      dragOver ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-red-400 hover:bg-red-50/30'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <CardContent className="py-12 text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.heic,.heif"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      />

                      {analyzing ? (
                        <div className="space-y-4">
                          <Loader2 className="w-12 h-12 mx-auto text-red-700 animate-spin" />
                          <p className="text-lg font-bold text-gray-900">Analyzing your document...</p>
                          <p className="text-sm text-gray-500">Our AI is reading your notice and identifying your rights</p>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 mx-auto mb-5 bg-gradient-to-br from-red-700 to-red-800 rounded-full flex items-center justify-center shadow-lg">
                            <Upload className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Your Notice</h3>
                          <p className="text-gray-500 mb-6">Drag & drop your file here, or tap to select from your phone</p>
                          <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 py-6 text-base shadow-lg">
                            Analyze My Notice — Free
                          </Button>
                          <p className="text-xs text-gray-400 mt-4">PDF, JPG, PNG, HEIC (iPhone) • Max 10MB</p>
                          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-500">
                            <Shield className="w-3.5 h-3.5 text-green-600" />
                            Encrypted & confidential — we never share your documents
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border border-gray-200 shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-red-700 to-red-800 px-6 py-4 flex items-center justify-between">
                      <h3 className="text-white font-bold text-lg">Analysis Complete</h3>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${urgencyColors[analysisResult.urgencyLevel]}`}>
                        {analysisResult.urgencyLevel.toUpperCase()}
                      </span>
                    </div>
                    <CardContent className="p-6 space-y-5">
                      {/* Document info */}
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Document Type</p>
                          <p className="text-lg font-bold text-gray-900">{analysisResult.documentType}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Response Deadline</p>
                          <p className="text-lg font-bold text-red-800">{analysisResult.deadline}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Summary</p>
                          <p className="text-sm text-gray-700">{analysisResult.summary}</p>
                        </div>
                      </div>

                      {/* Rights */}
                      <div>
                        <p className="text-sm font-bold text-gray-900 mb-2">Your Rights</p>
                        <ul className="space-y-2">
                          {analysisResult.rights.map((right, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <Shield className="h-4 w-4 text-red-700 mt-0.5 shrink-0" />
                              <span>{right}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Actions */}
                      <div>
                        <p className="text-sm font-bold text-gray-900 mb-2">Recommended Next Steps</p>
                        <ul className="space-y-2">
                          {analysisResult.recommendedActions.map((action, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* CTAs */}
                      <div className="flex flex-col gap-3 pt-2">
                        <Button
                          className="w-full bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white py-6 font-bold text-base shadow-lg"
                          onClick={() => setChatOpen(true)}
                        >
                          Continue — Build My Case <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full border-gray-300 text-gray-600"
                          onClick={resetUpload}
                        >
                          Upload Another Document
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {uploadError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{uploadError}</span>
              </motion.div>
            )}
          </div>
        </section>

        {/* ─── WHAT YOU GET ─── */}
        <section className="py-16 px-4 bg-gray-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-black mb-3">What You'll Get in Seconds</h2>
            <p className="text-gray-400 mb-10">Our AI analyzes your document and returns:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: FileText, title: 'Document Type', desc: 'What this notice actually is' },
                { icon: Clock, title: 'Your Deadline', desc: 'Exactly how long you have' },
                { icon: Shield, title: 'Your Rights', desc: 'Tennessee protections that apply' },
                { icon: CheckCircle, title: 'Next Steps', desc: 'Exactly what to do right now' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 text-center hover:-translate-y-1 transition-transform"
                >
                  <div className="w-12 h-12 mx-auto mb-3 bg-red-900/30 border border-red-700/30 rounded-xl flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-red-400" />
                  </div>
                  <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section className="py-16 px-4">
          <div className="max-w-lg mx-auto">
            <h2 className="text-3xl font-black text-center mb-10">How It Works</h2>
            <div className="space-y-8">
              {[
                { num: 1, title: 'Upload Your Notice', desc: 'Take a photo or upload the PDF of whatever your landlord sent you. No account needed.' },
                { num: 2, title: 'Get Instant Analysis', desc: 'Our AI reads the document, identifies the type, and explains your rights in plain English — in under 60 seconds.' },
                { num: 3, title: 'Take Action', desc: 'Follow your personalized action plan, or connect with a Tennessee attorney for free through Nashville\'s Right to Counsel program.' },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  viewport={{ once: true }}
                  className="flex gap-5"
                >
                  <div className="w-10 h-10 min-w-[40px] bg-gradient-to-br from-red-700 to-red-800 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                    {step.num}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{step.title}</h4>
                    <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── TESTIMONIALS ─── */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-lg mx-auto">
            <h2 className="text-3xl font-black text-center mb-10">Tenants We've Helped</h2>
            {[
              { quote: "I got a 14-day notice and had no idea what to do. TenantGuard told me it was improperly served and connected me with Legal Aid. My eviction was dismissed.", name: "Marcus T.", location: "Nashville, TN — Eviction Dismissed", initial: "M" },
              { quote: "My landlord tried to raise my rent 40% with 10 days notice. TenantGuard showed me that Tennessee requires 30 days. I had time to find a new place on my terms.", name: "Sarah K.", location: "Nashville, TN — Illegal Rent Increase Stopped", initial: "S" },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 mb-5"
              >
                <div className="text-amber-400 text-lg mb-3">★★★★★</div>
                <p className="text-gray-700 leading-relaxed mb-4">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-700 to-red-800 flex items-center justify-center text-white font-bold">
                    {t.initial}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.location}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="py-16 px-4 bg-gradient-to-br from-red-800 to-red-900 text-white text-center">
          <div className="max-w-md mx-auto">
            <h2 className="text-3xl font-black mb-4">Don't Wait — Your Deadline Is Counting Down</h2>
            <p className="text-red-100 mb-8 leading-relaxed">
              Every day you wait is a day closer to losing your rights. Upload your notice now and know exactly where you stand.
            </p>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-10 py-6 shadow-xl"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Analyze My Notice Now
            </Button>
            <p className="text-red-200 text-sm mt-4">Free • No account • Results in under 60 seconds</p>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="py-8 px-4 bg-gray-900 text-gray-400 text-center">
          <p className="text-sm mb-2">&copy; 2026 TenantGuard. Protecting Tennessee tenants' rights.</p>
          <p className="text-sm">
            <Link href="/privacy" className="text-red-400 hover:underline">Privacy Policy</Link>
            {' • '}
            <Link href="/terms" className="text-red-400 hover:underline">Terms of Service</Link>
            {' • '}
            <Link href="/attorney-intake" className="text-red-400 hover:underline">Attorney Portal</Link>
          </p>
          <p className="text-xs text-gray-500 mt-4 max-w-md mx-auto">
            TenantGuard provides legal information, not legal advice. For legal representation, we connect you with licensed Tennessee attorneys through Nashville's Right to Counsel program.
          </p>
        </footer>

        {/* ─── CHAT BUBBLE ─── */}
        <AnimatePresence>
          {!chatOpen && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="fixed bottom-6 right-6 z-50"
            >
              <button
                onClick={() => setChatOpen(true)}
                className="w-14 h-14 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
              >
                <MessageCircle className="w-6 h-6 text-white" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-white">
                  1
                </span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── CHAT PANEL ─── */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-6 right-6 z-50 w-[calc(100%-48px)] max-w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
              style={{ maxHeight: 'min(580px, calc(100vh - 100px))' }}
            >
              {/* Chat header */}
              <div className="bg-gradient-to-r from-red-700 to-red-800 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">TenantGuard Assistant</h4>
                    <p className="text-red-200 text-xs">Here to help — replies instantly</p>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-white/70 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat messages */}
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: '200px' }}>
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-red-700 to-red-800 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}>
                      {msg.content.split('\n').map((line, i) => (
                        <p key={i} className={i > 0 ? 'mt-2' : ''}>
                          {line.split('**').map((part, j) =>
                            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat input */}
              <form onSubmit={handleChatSend} className="border-t border-gray-100 p-3 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-red-400 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading}
                  className="bg-gradient-to-r from-red-700 to-red-800 text-white rounded-xl px-4 py-3 disabled:opacity-50 hover:from-red-800 hover:to-red-900 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
