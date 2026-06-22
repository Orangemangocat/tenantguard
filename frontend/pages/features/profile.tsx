/**
 * TenantGuard — Profile Feature Ad Landing Page
 * /features/profile
 *
 * Conversion-optimized landing page for click-through ad traffic.
 * Showcases the new user profile feature: case history, notification
 * preferences, and account management — all in one place.
 *
 * Designed to convert visitors from ads into registered users.
 */
import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import {
  Bell, Calendar, CheckCircle2, ChevronRight, Clock,
  FileText, Gavel, Lock, MessageSquare, Settings,
  Shield, Star, User, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Navbar from '@/components/Navbar'

// ---------------------------------------------------------------------------
// Feature Highlights
// ---------------------------------------------------------------------------
const FEATURES = [
  {
    icon: User,
    color: 'text-teal',
    bg: 'bg-teal/10',
    title: 'Your Case, Your Profile',
    body: 'Every document you upload, every deadline, every court date — organized in one private profile. No more searching through emails or losing track of what you filed.',
  },
  {
    icon: Bell,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    title: 'Never Miss a Deadline',
    body: 'Set SMS and email alerts for court dates, response deadlines, and filing windows. Tennessee law moves fast — TenantGuard keeps you a step ahead.',
  },
  {
    icon: Gavel,
    color: 'text-navy',
    bg: 'bg-navy/10',
    title: 'AI-Generated Motions',
    body: 'From your profile, generate a Motion to Dismiss, Answer to Complaint, or Fee Waiver in seconds — drafted for Tennessee General Sessions Court.',
  },
  {
    icon: Shield,
    color: 'text-green-600',
    bg: 'bg-green-50',
    title: 'Your Rights, Explained',
    body: 'TenantGuard analyzes your documents and shows you exactly what rights you have under Tennessee law — in plain English, not legalese.',
  },
  {
    icon: Lock,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    title: '256-Bit Encrypted',
    body: 'Your documents and personal information are encrypted at rest and in transit. We never share your data with landlords, courts, or third parties.',
  },
  {
    icon: Clock,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    title: 'Case Timeline',
    body: 'See the full history of your case — from the first notice to the latest court date — in a clear, chronological timeline you can share with an attorney.',
  },
]

// ---------------------------------------------------------------------------
// Social Proof
// ---------------------------------------------------------------------------
const TESTIMONIALS = [
  {
    quote: "I had no idea I had 14 days to respond. TenantGuard told me in 30 seconds and set up a reminder for my court date. I showed up prepared.",
    name: "Marcus T.",
    location: "Nashville, TN",
    stars: 5,
  },
  {
    quote: "My landlord tried to evict me for 'unauthorized occupants' — my own kids. TenantGuard found three procedural defects in the notice before I even talked to a lawyer.",
    name: "Deja W.",
    location: "Memphis, TN",
    stars: 5,
  },
  {
    quote: "The profile page keeps everything in one place. I can see my court date, my documents, and what I need to do next without having to dig through emails.",
    name: "Roberto M.",
    location: "Knoxville, TN",
    stars: 5,
  },
]

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------
const STATS = [
  { value: '14', label: 'days — Tennessee eviction response window' },
  { value: '73%', label: 'of tenants don\'t know their rights' },
  { value: '$0', label: 'to get started — no credit card required' },
  { value: '30s', label: 'to analyze your first document' },
]

// ---------------------------------------------------------------------------
// Profile UI Mock
// ---------------------------------------------------------------------------
function ProfileMock() {
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'security'>('account')

  return (
    <div className="bg-white rounded-lg shadow-2xl border border-gray-100 overflow-hidden max-w-md w-full">
      {/* Header */}
      <div className="bg-navy px-5 py-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-teal flex items-center justify-center text-white font-bold text-sm">JD</div>
        <div>
          <p className="text-white font-semibold text-sm">Jane Doe</p>
          <p className="text-white/60 text-xs">jane.doe@email.com</p>
        </div>
        <div className="ml-auto">
          <span className="text-xs bg-teal/20 text-teal px-2 py-0.5 rounded-sm font-medium">Active Case</span>
        </div>
      </div>

      {/* Case Summary */}
      <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
        {[
          { n: '1', l: 'Cases' },
          { n: '1', l: 'Open' },
          { n: '1', l: 'Court Date' },
          { n: '3', l: 'Docs' },
        ].map(s => (
          <div key={s.l} className="py-3 text-center">
            <p className="text-lg font-bold text-navy">{s.n}</p>
            <p className="text-[10px] text-gray-400">{s.l}</p>
          </div>
        ))}
      </div>

      {/* Recent Case */}
      <div className="px-5 py-3 border-b border-gray-100">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 font-semibold">Recent Case</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-sm bg-red-50 flex items-center justify-center">
              <Gavel className="h-3.5 w-3.5 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-navy">Eviction Notice</p>
              <p className="text-[10px] text-gray-400">Davidson County</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded-sm font-semibold">Urgent</span>
            <p className="text-[10px] text-gray-400 mt-0.5">Court: Jul 15</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {(['account', 'notifications', 'security'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-[11px] font-medium capitalize transition-colors ${activeTab === tab ? 'text-teal border-b-2 border-teal' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-5 space-y-3">
        {activeTab === 'account' && (
          <>
            {[
              { label: 'First Name', value: 'Jane' },
              { label: 'Last Name', value: 'Doe' },
              { label: 'Phone', value: '(615) 555-0142' },
              { label: 'City', value: 'Nashville' },
            ].map(f => (
              <div key={f.label}>
                <p className="text-[10px] text-gray-400 mb-1">{f.label}</p>
                <div className="border border-gray-200 rounded-sm px-3 py-1.5 text-xs text-gray-700 bg-gray-50">{f.value}</div>
              </div>
            ))}
            <button className="w-full mt-2 bg-teal text-white text-xs py-2 rounded-sm font-semibold hover:bg-teal/90 transition-colors">
              Save Changes
            </button>
          </>
        )}
        {activeTab === 'notifications' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">Choose how TenantGuard contacts you about deadlines and court dates.</p>
            {[
              { label: 'Email Alerts', sub: 'Court dates, deadlines, new analysis', on: true },
              { label: 'SMS Alerts', sub: 'Urgent reminders 24h before deadlines', on: true },
              { label: 'Weekly Summary', sub: 'Case status digest every Monday', on: false },
            ].map(n => (
              <div key={n.label} className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-navy">{n.label}</p>
                  <p className="text-[10px] text-gray-400">{n.sub}</p>
                </div>
                <div className={`h-5 w-9 rounded-full transition-colors ${n.on ? 'bg-teal' : 'bg-gray-200'} relative`}>
                  <div className={`h-4 w-4 rounded-full bg-white shadow absolute top-0.5 transition-transform ${n.on ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'security' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-gray-600 bg-green-50 border border-green-100 rounded-sm p-3">
              <Lock className="h-3.5 w-3.5 text-green-600 shrink-0" />
              <span>Your account is secured with 256-bit encryption.</span>
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <p><span className="font-medium text-navy">Last login:</span> Today, 9:14 AM</p>
              <p><span className="font-medium text-navy">Account created:</span> Jun 20, 2026</p>
            </div>
            <button className="w-full border border-gray-200 text-gray-600 text-xs py-2 rounded-sm hover:bg-gray-50 transition-colors">
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ProfileFeatureLandingPage() {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>Your Tenant Rights Profile — TenantGuard</title>
        <meta name="description" content="TenantGuard gives Tennessee tenants a private, encrypted profile to track their case, manage deadlines, and generate legal motions — free to start." />
        <meta property="og:title" content="Your Tenant Rights Profile — TenantGuard" />
        <meta property="og:description" content="Track your eviction case, set deadline alerts, and generate court motions — all from your private TenantGuard profile." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <Navbar />

      <main>
        {/* ── Hero ── */}
        <section className="bg-navy text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy to-teal/20 pointer-events-none" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Copy */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 bg-teal/20 text-teal text-xs font-semibold px-3 py-1.5 rounded-sm mb-6">
                  <Zap className="h-3.5 w-3.5" />
                  NEW FEATURE — Now Live
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
                  Your Tenant Rights,<br />
                  <span className="text-teal">All in One Place</span>
                </h1>
                <p className="text-white/80 text-lg leading-relaxed mb-8">
                  TenantGuard now gives every Tennessee tenant a private, encrypted profile — track your case history, set deadline alerts, and generate court motions in seconds.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => router.push('/auth/signup')}
                    className="bg-teal hover:bg-teal/90 text-white text-base px-8 py-3 h-auto rounded-sm font-semibold"
                  >
                    Create Your Free Profile
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button
                    onClick={() => router.push('/')}
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 text-base px-6 py-3 h-auto rounded-sm"
                  >
                    Upload a Notice First
                  </Button>
                </div>
                <p className="text-white/50 text-xs mt-4">
                  Free to start · No credit card · Tennessee tenants only
                </p>
              </motion.div>

              {/* Right: Profile Mock */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="flex justify-center lg:justify-end"
              >
                <ProfileMock />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Stats Bar ── */}
        <section className="bg-teal text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {STATS.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="text-center"
                >
                  <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
                  <p className="text-white/80 text-xs mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="bg-white py-16 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                Everything You Need to Fight Back
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Your TenantGuard profile is more than a dashboard — it is your command center for navigating an eviction, rent dispute, or habitability issue.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f, i) => {
                const Icon = f.icon
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                    className="p-6 border border-gray-100 rounded-sm hover:shadow-md transition-shadow"
                  >
                    <div className={`h-10 w-10 rounded-sm ${f.bg} flex items-center justify-center mb-4`}>
                      <Icon className={`h-5 w-5 ${f.color}`} />
                    </div>
                    <h3 className="font-semibold text-navy mb-2">{f.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.body}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="bg-gray-50 py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                Up and Running in 3 Steps
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { step: '01', title: 'Upload Your Notice', body: 'Drag and drop your eviction notice, lease, or court summons. TenantGuard reads it instantly.' },
                { step: '02', title: 'Get Your Analysis', body: 'Our AI identifies your rights, deadlines, and any defects in the eviction — in under 30 seconds.' },
                { step: '03', title: 'Manage from Your Profile', body: 'Create a free account to save your analysis, set alerts, generate motions, and track your case.' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="h-12 w-12 rounded-full bg-teal text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
                    {s.step}
                  </div>
                  <h3 className="font-semibold text-navy mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="bg-white py-16 lg:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                Tennessee Tenants Are Fighting Back
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 border border-gray-100 rounded-sm"
                >
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed mb-4 italic">"{t.quote}"</p>
                  <div>
                    <p className="text-sm font-semibold text-navy">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.location}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-navy text-white py-16 lg:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Shield className="h-12 w-12 text-teal mx-auto mb-6" />
              <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                You Have Rights. Know Them.
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
                Tennessee law gives you specific protections — but only if you act in time. Create your free TenantGuard profile and know exactly where you stand.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => router.push('/auth/signup')}
                  className="bg-teal hover:bg-teal/90 text-white text-base px-10 py-3 h-auto rounded-sm font-semibold"
                >
                  Create Free Profile
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 text-base px-8 py-3 h-auto rounded-sm"
                >
                  Analyze a Document First
                </Button>
              </div>
              <div className="flex items-center justify-center gap-6 mt-8 text-white/50 text-xs">
                <span className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> 256-bit encrypted</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> No account required to analyze</span>
                <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" /> Tennessee tenants only</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Footer Note ── */}
        <div className="bg-gray-50 border-t border-gray-100 py-6 text-center">
          <p className="text-xs text-gray-400 max-w-xl mx-auto">
            TenantGuard is not a law firm and does not provide legal advice. This service is for informational purposes only.{' '}
            <Link href="/privacy"><span className="underline hover:text-gray-600 cursor-pointer">Privacy Policy</span></Link>
            {' · '}
            <Link href="/terms"><span className="underline hover:text-gray-600 cursor-pointer">Terms of Service</span></Link>
          </p>
        </div>
      </main>
    </>
  )
}
