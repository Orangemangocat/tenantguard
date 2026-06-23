import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, Shield, CheckCircle, ArrowRight, ArrowLeft,
  Clock, AlertTriangle, User, LayoutDashboard, Search, ChevronRight,
  Play, ExternalLink
} from 'lucide-react'

// ─── Hardcoded correct analysis result for the demo ──────────────────────────
const DEMO_ANALYSIS = {
  documentType: '3-Day Notice to Pay or Vacate',
  urgencyLevel: 'low' as const,
  deadline: 'No court date — this is a pre-filing notice only (served September 13, 2024)',
  summary:
    'Your landlord has served a 3-Day Notice claiming $1,525.00 in unpaid rent for September 2024. ' +
    'This notice starts a legal clock — but it cannot remove you from your home by itself. ' +
    'Your landlord must separately file a Detainer Warrant in General Sessions Court and you must ' +
    'be personally served before any eviction can proceed.',
  rights: [
    'This notice alone has NO legal force to remove you — a court order is required',
    'You have the right to pay the full amount owed and stop the eviction process entirely',
    'You have the right to contest the amount claimed if it is incorrect',
    'You have the right to raise habitability defenses if your unit has unrepaired conditions',
    'Nashville tenants may qualify for free legal representation through the Right to Counsel program',
  ],
  recommendedActions: [
    'Take a breath — you have time. No court date has been set yet',
    'Verify the amount claimed: check your lease, bank records, and any receipts',
    'If you can pay, contact your landlord in writing (text or email) to arrange payment',
    'Document everything: photograph the notice, save all communications',
    'If you cannot pay in full, TenantGuard can help you understand your options and connect you with an attorney',
  ],
}

// ─── Slide definitions ────────────────────────────────────────────────────────
const SLIDES = [
  { id: 'intro',    label: 'Welcome' },
  { id: 'upload',   label: 'Upload Notice' },
  { id: 'scanning', label: 'Analyzing…' },
  { id: 'result',   label: 'Your Analysis' },
  { id: 'workspace',label: 'Case Dashboard' },
  { id: 'profile',  label: 'Your Profile' },
  { id: 'cta',      label: 'Get Started' },
]

const urgencyConfig = {
  low:      { label: 'LOW URGENCY',      bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300' },
  medium:   { label: 'MEDIUM URGENCY',   bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  high:     { label: 'HIGH URGENCY',     bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  critical: { label: 'CRITICAL URGENCY', bg: 'bg-red-100',    text: 'text-red-800',    border: 'border-red-300' },
}

export default function DemoPage() {
  const [slide, setSlide] = useState(0)
  const [scanStep, setScanStep] = useState(0)

  const total = SLIDES.length
  const current = SLIDES[slide]

  const next = () => {
    if (slide === 1) {
      // Start scan animation
      setScanStep(0)
      setSlide(2)
      let step = 0
      const iv = setInterval(() => {
        step++
        setScanStep(step)
        if (step >= 4) { clearInterval(iv); setTimeout(() => setSlide(3), 600) }
      }, 700)
    } else if (slide < total - 1) {
      setSlide(s => s + 1)
    }
  }
  const prev = () => { if (slide > 0) setSlide(s => s - 1) }

  const urg = urgencyConfig[DEMO_ANALYSIS.urgencyLevel]

  return (
    <>
      <Head>
        <title>TenantGuard — Live Demo</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-gray-950 flex flex-col">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg">
            <Shield className="h-5 w-5 text-red-500" />
            TenantGuard
            <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-800 px-2 py-0.5 rounded">LIVE DEMO</span>
          </Link>
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { if (i !== 2) setSlide(i) }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === slide ? 'w-6 bg-red-500' : i < slide ? 'w-2 bg-gray-500' : 'w-2 bg-gray-700'
                }`}
              />
            ))}
          </div>
          <div className="text-xs text-gray-500">{slide + 1} / {total}</div>
        </div>

        {/* ── Slide area ── */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-3xl"
            >

              {/* ── SLIDE 0: Intro ── */}
              {slide === 0 && (
                <div className="text-center space-y-6 py-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-900/30 border border-red-700 mb-2">
                    <Shield className="h-10 w-10 text-red-400" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
                    TenantGuard<br/>
                    <span className="text-red-400">in 90 seconds</span>
                  </h1>
                  <p className="text-lg text-gray-400 max-w-xl mx-auto">
                    Watch how a Nashville tenant uploads a 3-day notice and gets instant, accurate legal guidance — no lawyer required, no account needed.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <button
                      onClick={next}
                      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all"
                    >
                      <Play className="h-5 w-5" /> Start Demo
                    </button>
                    <Link
                      href="/get-help"
                      target="_blank"
                      className="inline-flex items-center gap-2 border border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white px-8 py-4 rounded-xl text-lg transition-all"
                    >
                      Try It Live <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}

              {/* ── SLIDE 1: Upload ── */}
              {slide === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-3xl font-black text-white mb-2">Step 1 — Upload Your Notice</h2>
                    <p className="text-gray-400">A tenant just received this 3-day notice. They drag it onto TenantGuard.</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Simulated upload UI */}
                    <div className="bg-red-800 px-6 py-4 flex items-center gap-3">
                      <div className="bg-red-700 rounded-lg p-2"><FileText className="h-6 w-6 text-white" /></div>
                      <div>
                        <div className="text-white font-bold text-lg">Upload Your Notice</div>
                        <div className="text-red-200 text-sm">Get instant AI analysis — free, no account needed</div>
                      </div>
                      <div className="ml-auto flex items-center gap-1 text-red-200 text-sm">
                        <Shield className="h-4 w-4" /> Secure &amp; Confidential
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-2 text-amber-800 text-sm font-medium">
                        <Clock className="h-4 w-4 shrink-0" />
                        <span><strong>Tennessee law:</strong> You may have as few as <strong>14 days</strong> to respond. Don't wait.</span>
                      </div>
                      {/* File shown as already uploaded */}
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center gap-4 bg-gray-50">
                        <div className="bg-red-100 rounded-lg p-3"><FileText className="h-7 w-7 text-red-600" /></div>
                        <div>
                          <div className="font-semibold text-gray-900">3day-notice.pdf</div>
                          <div className="text-sm text-gray-500">0.1 MB — Ready to analyze</div>
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                      </div>
                      <button
                        onClick={next}
                        className="w-full bg-red-800 hover:bg-red-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-lg transition-all"
                      >
                        <Shield className="h-5 w-5" /> Analyze My Notice — Free
                      </button>
                      <div className="flex justify-center gap-6 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> 256-bit encrypted</span>
                        <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> No account required</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Results in seconds</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SLIDE 2: Scanning ── */}
              {slide === 2 && (
                <div className="text-center space-y-8 py-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-900/30 border border-red-700">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
                      <Search className="h-10 w-10 text-red-400" />
                    </motion.div>
                  </div>
                  <h2 className="text-3xl font-black text-white">Analyzing your notice…</h2>
                  <div className="max-w-md mx-auto space-y-3">
                    {[
                      'Reading document type and legal language',
                      'Checking Tennessee eviction statutes (T.C.A. § 66-28-505)',
                      'Calculating deadlines and urgency level',
                      'Preparing your rights and recommended actions',
                    ].map((step, i) => (
                      <motion.div
                        key={step}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: scanStep > i ? 1 : 0.25, x: 0 }}
                        transition={{ duration: 0.4 }}
                        className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3 text-left"
                      >
                        {scanStep > i
                          ? <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                          : <div className="h-5 w-5 rounded-full border-2 border-gray-600 shrink-0" />}
                        <span className={scanStep > i ? 'text-white' : 'text-gray-500'}>{step}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── SLIDE 3: Result ── */}
              {slide === 3 && (
                <div className="space-y-4">
                  <div className="text-center mb-2">
                    <h2 className="text-2xl font-black text-white mb-1">Step 2 — Instant Analysis</h2>
                    <p className="text-gray-400 text-sm">This is exactly what the tenant sees — calm, clear, accurate.</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Result header */}
                    <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-bold text-gray-900">Analysis Complete</span>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${urg.bg} ${urg.text} ${urg.border}`}>
                        {urg.label}
                      </span>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Document Type</div>
                        <div className="text-xl font-bold text-gray-900">{DEMO_ANALYSIS.documentType}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Response Deadline</div>
                        <div className="text-base font-semibold text-green-700">{DEMO_ANALYSIS.deadline}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Summary</div>
                        <p className="text-gray-700 text-sm leading-relaxed">{DEMO_ANALYSIS.summary}</p>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 mb-2">Your Rights</div>
                        <ul className="space-y-1.5">
                          {DEMO_ANALYSIS.rights.map((r, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <Shield className="h-4 w-4 text-red-700 mt-0.5 shrink-0" />{r}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 mb-2">Recommended Next Steps</div>
                        <ol className="space-y-1.5">
                          {DEMO_ANALYSIS.recommendedActions.map((a, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-800 text-white text-xs font-bold shrink-0 mt-0.5">{i+1}</span>
                              {a}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                    <div className="px-6 pb-5 flex gap-3">
                      <button
                        onClick={next}
                        className="flex-1 bg-red-800 hover:bg-red-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                      >
                        Start Full Case — Free <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SLIDE 4: Workspace ── */}
              {slide === 4 && (
                <div className="space-y-5">
                  <div className="text-center">
                    <h2 className="text-3xl font-black text-white mb-2">Step 3 — Your Case Dashboard</h2>
                    <p className="text-gray-400">Once a case is started, everything lives in one organized workspace.</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Simulated workspace header */}
                    <div className="bg-gray-900 px-5 py-3 flex items-center gap-3">
                      <LayoutDashboard className="h-5 w-5 text-red-400" />
                      <span className="text-white font-semibold">Case #1042 — 3-Day Notice to Pay or Vacate</span>
                      <span className="ml-auto text-xs bg-yellow-500 text-yellow-900 font-bold px-2 py-0.5 rounded">ACTIVE</span>
                    </div>
                    {/* Tab bar */}
                    <div className="flex border-b border-gray-200 bg-gray-50 text-xs font-semibold overflow-x-auto">
                      {['Overview','Court Records','Evidence','Diary','Communications','Action Plan','Timeline'].map((t, i) => (
                        <div key={t} className={`px-4 py-2.5 whitespace-nowrap ${i === 0 ? 'border-b-2 border-red-700 text-red-700 bg-white' : 'text-gray-500'}`}>{t}</div>
                      ))}
                    </div>
                    {/* Overview content */}
                    <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Days Until Deadline', value: '12', sub: 'No court date set', color: 'text-green-600' },
                        { label: 'Documents Uploaded', value: '3', sub: 'Notice + 2 receipts', color: 'text-blue-600' },
                        { label: 'Action Items', value: '4', sub: '1 completed', color: 'text-orange-600' },
                        { label: 'Attorney Match', value: 'Ready', sub: 'Free consultation', color: 'text-purple-600' },
                      ].map(card => (
                        <div key={card.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <div className={`text-2xl font-black ${card.color}`}>{card.value}</div>
                          <div className="text-xs font-semibold text-gray-700 mt-0.5">{card.label}</div>
                          <div className="text-xs text-gray-400">{card.sub}</div>
                        </div>
                      ))}
                    </div>
                    <div className="px-5 pb-4 text-center">
                      <Link
                        href="/workspace-demo"
                        target="_blank"
                        className="inline-flex items-center gap-2 text-red-700 font-semibold text-sm hover:underline"
                      >
                        Open Full Dashboard Demo <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SLIDE 5: Profile ── */}
              {slide === 5 && (
                <div className="space-y-5">
                  <div className="text-center">
                    <h2 className="text-3xl font-black text-white mb-2">Your Profile — Everything in One Place</h2>
                    <p className="text-gray-400">Case history, notification settings, and account management — all in your profile.</p>
                  </div>
                  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Profile header */}
                    <div className="bg-gradient-to-r from-red-800 to-red-900 px-6 py-5 flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-black">JB</div>
                      <div>
                        <div className="text-white font-bold text-lg">John Bransford</div>
                        <div className="text-red-200 text-sm">j.bransford@gmail.com</div>
                      </div>
                      <Link href="/profile" target="_blank" className="ml-auto text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all">
                        View Profile <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                    {/* Stats */}
                    <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
                      {[
                        { label: 'Total Cases', value: '2' },
                        { label: 'Open Cases', value: '1' },
                        { label: 'Court Dates', value: '0' },
                        { label: 'Documents', value: '5' },
                      ].map(s => (
                        <div key={s.label} className="py-4 text-center">
                          <div className="text-2xl font-black text-gray-900">{s.value}</div>
                          <div className="text-xs text-gray-500">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    {/* Tabs preview */}
                    <div className="flex border-b border-gray-100 text-sm font-semibold">
                      {['Account','Notifications','Security'].map((t, i) => (
                        <div key={t} className={`px-5 py-3 ${i === 0 ? 'border-b-2 border-red-700 text-red-700' : 'text-gray-400'}`}>{t}</div>
                      ))}
                    </div>
                    <div className="p-5 grid grid-cols-2 gap-3">
                      {[
                        { label: 'First Name', value: 'John' },
                        { label: 'Last Name', value: 'Bransford' },
                        { label: 'Phone', value: '(615) 555-0182' },
                        { label: 'City', value: 'Nashville, TN' },
                      ].map(f => (
                        <div key={f.label}>
                          <div className="text-xs text-gray-400 mb-1">{f.label}</div>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">{f.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── SLIDE 6: CTA ── */}
              {slide === 6 && (
                <div className="text-center space-y-6 py-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-900/30 border border-green-700 mb-2">
                    <CheckCircle className="h-10 w-10 text-green-400" />
                  </div>
                  <h2 className="text-4xl font-black text-white">
                    That's TenantGuard.
                  </h2>
                  <p className="text-lg text-gray-400 max-w-lg mx-auto">
                    Upload a notice → get instant Tennessee law analysis → manage your case → connect with an attorney. Free to start. No account required for analysis.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <Link
                      href="/get-help"
                      className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all"
                    >
                      Try It Now — Free <ArrowRight className="h-5 w-5" />
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="inline-flex items-center gap-2 border border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white px-8 py-4 rounded-xl text-lg transition-all"
                    >
                      Create Account <User className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="pt-4 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
                    <Link href="/workspace-demo" target="_blank" className="hover:text-gray-300 flex items-center gap-1">Full Dashboard Demo <ExternalLink className="h-3 w-3" /></Link>
                    <Link href="/features/profile" target="_blank" className="hover:text-gray-300 flex items-center gap-1">Profile Features <ExternalLink className="h-3 w-3" /></Link>
                    <Link href="/blog" target="_blank" className="hover:text-gray-300 flex items-center gap-1">Blog <ExternalLink className="h-3 w-3" /></Link>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Bottom nav ── */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-t border-gray-800">
          <button
            onClick={prev}
            disabled={slide === 0}
            className="flex items-center gap-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-gray-500 text-sm font-medium">{SLIDES[slide].label}</span>
          {slide < total - 1 ? (
            <button
              onClick={next}
              disabled={slide === 2}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-5 py-2 rounded-lg transition-all"
            >
              {slide === 1 ? 'Run Analysis' : 'Next'} <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href="/get-help"
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded-lg transition-all"
            >
              Try It Live <ExternalLink className="h-4 w-4" />
            </Link>
          )}
        </div>

      </div>
    </>
  )
}
