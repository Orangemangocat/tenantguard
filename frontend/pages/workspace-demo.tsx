import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, ArrowLeft, Bell, BookOpen, Calendar, Camera,
  CheckCircle, CheckCircle2, ChevronRight, Clock, CreditCard,
  Download, Eye, FileText, Gavel, Globe, Lightbulb, Lock,
  Mail, Menu, MessageSquare, Mic, NotebookPen, PenLine, Phone,
  Plus, Scale, Search, Send, Shield, Upload, X, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// ---------------------------------------------------------------------------
// Demo Data — Redacted CaseLink records from real Davidson County case
// ---------------------------------------------------------------------------
const DEMO_CASE = {
  id: 1042,
  caseNumber: '24GT10013',
  status: 'complete',
  paymentStatus: 'paid',
  paymentTier: 'standard',
  issueType: 'Eviction Notice Received',
  county: 'Davidson',
  propertyAddress: '1234 Elm Street, Apt 4B, Nashville, TN 37209',
  landlordName: 'Metro Property Partners, LLC',
  courtDate: '2026-07-15',
  noticeDate: '2024-09-17',
  createdAt: '2024-09-20',
  firstName: 'Jane',
  lastName: 'D.',
}

const DEMO_CASELINK_PLEADINGS = [
  { id: 1, date: '09/17/2024', description: 'COMPLAINT FILED', hasImage: true },
  { id: 2, date: '09/17/2024', description: 'SUMMONS PERSONAL-D1', hasImage: true },
  { id: 3, date: '09/21/2024', description: 'RETURN D1-SERVED 10/01/2024', hasImage: true },
  { id: 4, date: '09/21/2024', description: 'RETURN D2-SERVED 10/01/2024', hasImage: true },
  { id: 5, date: '09/27/2024', description: 'MOTION TO QUASH 10/01/2024 - OF D1', hasImage: true },
  { id: 6, date: '10/01/2024', description: 'COURT DATE CONTINUANCE 10.08.24', hasImage: false },
  { id: 7, date: '10/08/2024', description: 'ORDER(G) SUBMITTED', hasImage: true },
  { id: 8, date: '10/15/2024', description: 'COURT DATE CONTINUANCE 11.05.24', hasImage: false },
  { id: 9, date: '11/05/2024', description: 'JUDGMENT FOR PLAINTIFF - POSSESSION', hasImage: true },
]

const DEMO_CASELINK_COURT_DATES = [
  { id: 1, description: 'SUMMONS PERSONAL-D1', continuances: 2, date: '10/15/2024', time: '10:00', room: '1B' },
  { id: 2, description: 'MOTION TO QUASH', continuances: 0, date: '10/01/2024', time: '10:00', room: '1B' },
  { id: 3, description: 'MOTION', continuances: 1, date: '10/15/2024', time: '10:00', room: '1B' },
  { id: 4, description: 'MOTION', continuances: 0, date: '10/08/2024', time: '10:00', room: '1B' },
  { id: 5, description: 'SUMMONS PERSONAL-D2', continuances: 0, date: '10/01/2024', time: '10:00', room: '1B' },
]

const DEMO_EVIDENCE = [
  { id: 1, type: 'photo', name: 'Kitchen mold - sink area.jpg', date: '2024-09-18', annotation: 'Black mold visible under kitchen sink, reported to landlord 3 times' },
  { id: 2, type: 'photo', name: 'Broken lock - front door.jpg', date: '2024-09-18', annotation: 'Front door lock broken since August, maintenance request ignored' },
  { id: 3, type: 'recording', name: 'Landlord phone call 09-15.m4a', date: '2024-09-15', annotation: 'Landlord threatened eviction if I reported code violations', duration: '3:42' },
  { id: 4, type: 'photo', name: 'Water damage - ceiling.jpg', date: '2024-09-20', annotation: 'Ceiling water damage in bedroom from upstairs leak' },
  { id: 5, type: 'recording', name: 'Maintenance denial voicemail.m4a', date: '2024-09-22', annotation: 'Voicemail from property manager refusing repair request', duration: '1:15' },
]

const DEMO_DIARY = [
  { id: 1, date: '2024-09-15', entry: 'Landlord called and said I need to pay $200 more or leave. I told him the lease says $1,100. He got angry and hung up.' },
  { id: 2, date: '2024-09-17', entry: 'Found eviction notice taped to my door when I got home from work. It says I have 14 days. Called Legal Aid but they said they\'re full.' },
  { id: 3, date: '2024-09-18', entry: 'Took photos of all the problems in the apartment — mold, broken lock, water damage. Want to make sure I have evidence.' },
  { id: 4, date: '2024-09-20', entry: 'Signed up for TenantGuard. Uploaded my notice and lease. Feeling a little better knowing someone is looking at this.' },
  { id: 5, date: '2024-10-01', entry: 'Court date today for the motion to quash. Judge continued it to 10/08. Attorney for landlord seemed surprised I showed up.' },
]

const DEMO_COMMS = [
  { id: 1, date: '2024-09-17', direction: 'received', from: 'Metro Property Partners', type: 'letter', subject: '14-Day Notice to Vacate', summary: 'Formal eviction notice citing lease violation (unauthorized occupant)' },
  { id: 2, date: '2024-09-19', direction: 'sent', to: 'Metro Property Partners', type: 'letter', subject: 'Response to Notice — Dispute', summary: 'Certified letter disputing unauthorized occupant claim, requesting maintenance repairs' },
  { id: 3, date: '2024-09-25', direction: 'received', from: 'Davidson County Court', type: 'court_notice', subject: 'Summons — General Sessions', summary: 'Court summons for detainer warrant hearing 10/01/2024' },
  { id: 4, date: '2024-10-02', direction: 'sent', to: 'Metro Property Partners', type: 'email', subject: 'Maintenance Request Follow-up #4', summary: 'Fourth written request for mold remediation and lock repair' },
]

const DEMO_NOTEBOOK = {
  summary: 'You are facing an eviction action filed by Metro Property Partners, LLC (d/b/a Slate Apartment Homes) in Davidson County General Sessions Court. The landlord claims a lease violation (unauthorized occupant), but you have strong defenses: (1) the notice may have been improperly served, (2) the landlord has failed to maintain habitable conditions (mold, broken lock, water damage), and (3) Tennessee law prohibits retaliatory eviction when a tenant has reported code violations. A Motion to Quash was filed on your behalf and the case has been continued multiple times, which is favorable — it means the court is taking your defenses seriously.',
  timeline: [
    { date: '09/15/2024', event: 'Landlord phone call demanding $200 increase', source: 'Tenant diary', significance: 'Evidence of rent increase pressure before eviction' },
    { date: '09/17/2024', event: 'Eviction notice posted on door', source: 'Uploaded document', significance: 'Start of 14-day notice period' },
    { date: '09/17/2024', event: 'Complaint filed with court (24GT10013)', source: 'CaseLink', significance: 'Official case filing' },
    { date: '10/01/2024', event: 'First court date — Motion to Quash heard', source: 'CaseLink', significance: 'Defense strategy initiated' },
    { date: '10/08/2024', event: 'Court continued — Order submitted', source: 'CaseLink', significance: 'Judge reviewing motion' },
    { date: '10/15/2024', event: 'Second continuance granted', source: 'CaseLink', significance: 'Additional time for defense preparation' },
  ],
  urgentDeadlines: [
    { date: 'Jul 15, 2026', action: 'Next court hearing — Room 1B, 10:00 AM' },
    { date: 'Jul 8, 2026', action: 'File response to landlord\'s latest motion (7 days before hearing)' },
  ],
  nextSteps: [
    'Gather all maintenance request records (emails, texts, voicemails) showing you reported problems before the eviction notice.',
    'File a complaint with Metro Nashville Codes Department about the mold and broken lock — this strengthens your retaliation defense.',
    'Prepare a written timeline of all interactions with the landlord for your attorney or for court.',
    'Attend the July 15 hearing. Bring all photos, recordings, and communication records.',
    'Consider filing a counterclaim for failure to maintain habitable premises (T.C.A. § 66-28-304).',
  ],
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type WorkspaceTab = 'overview' | 'court-records' | 'evidence' | 'diary' | 'communications' | 'action-plan' | 'timeline'

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------
function DeadlineBar({ daysLeft, total = 30 }: { daysLeft: number; total?: number }) {
  const pct = Math.max(0, Math.min(100, ((total - daysLeft) / total) * 100))
  const color = daysLeft <= 7 ? 'var(--color-red-urgent)' : daysLeft <= 14 ? 'var(--color-amber-warn)' : 'var(--color-teal)'
  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ background: color, width: `${pct}%` }} />
    </div>
  )
}

function StatusTimeline() {
  const steps = [
    { label: 'Intake Complete', done: true, date: 'Sep 20' },
    { label: 'Documents Uploaded', done: true, date: 'Sep 20' },
    { label: 'AI Analysis', done: true, date: 'Sep 20' },
    { label: 'Motion Filed', done: true, date: 'Sep 27' },
    { label: 'Court Hearing', done: false, date: 'Jul 15' },
    { label: 'Resolution', done: false, date: 'Pending' },
  ]
  return (
    <div className="flex items-center gap-1 w-full overflow-x-auto pb-2">
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center min-w-[70px]">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold
              ${step.done ? 'bg-teal text-white' : 'border-2 border-gray-300 text-gray-400'}`}>
              {step.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <p className={`text-[9px] mt-1 text-center leading-tight ${step.done ? 'text-teal font-medium' : 'text-gray-400'}`}>
              {step.label}
            </p>
            <p className="text-[8px] text-gray-400 font-mono">{step.date}</p>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 min-w-[12px] ${step.done ? 'bg-teal' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

function PaymentTierBadge({ tier }: { tier: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    basic: { label: 'Basic — $50', color: 'text-gray-700', bg: 'bg-gray-100' },
    standard: { label: 'Standard — $250', color: 'text-teal', bg: 'bg-teal/10' },
    premium: { label: 'Premium — $500', color: 'text-amber-600', bg: 'bg-amber-50' },
  }
  const c = config[tier] || config.basic
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-semibold ${c.color} ${c.bg}`}>
      <CreditCard className="h-3 w-3" />
      {c.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Tab Content: Overview
// ---------------------------------------------------------------------------
function OverviewTab() {
  return (
    <div className="space-y-5">
      {/* Case Status Timeline */}
      <div className="bg-white border border-gray-100 rounded-sm p-5 shadow-sm">
        <h3 className="font-semibold text-navy mb-4 flex items-center gap-2 text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
          <Clock className="h-4 w-4 text-teal" /> Case Progress
        </h3>
        <StatusTimeline />
      </div>

      {/* Summary */}
      <div className="bg-white border border-gray-100 rounded-sm p-5 shadow-sm">
        <h3 className="font-semibold text-navy mb-3 flex items-center gap-2 text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
          <Shield className="h-4 w-4 text-teal" /> Plain English Summary
        </h3>
        <p className="text-gray-700 text-sm leading-relaxed">{DEMO_NOTEBOOK.summary}</p>
      </div>

      {/* Urgent Deadlines */}
      <div className="bg-red-50 border border-red-200 rounded-sm p-5">
        <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" /> Upcoming Deadlines
        </h3>
        <ul className="space-y-3">
          {DEMO_NOTEBOOK.urgentDeadlines.map((d, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="font-mono font-bold text-red-700 shrink-0 pt-0.5 min-w-[100px]">{d.date}</span>
              <span className="text-gray-800">{d.action}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab Content: Court Records (CaseLink)
// ---------------------------------------------------------------------------
function CourtRecordsTab() {
  const [subTab, setSubTab] = useState<'pleadings' | 'dates'>('pleadings')
  return (
    <div className="space-y-4">
      {/* CaseLink header */}
      <div className="bg-white border border-gray-100 rounded-sm p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-teal" />
            <h3 className="font-semibold text-navy text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
              Court Records
            </h3>
          </div>
          <Badge className="bg-green-safe/10 text-green-safe border-green-safe/20 text-[10px]">
            Live from CaseLink
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Case: <strong className="text-navy">{DEMO_CASE.caseNumber}</strong></span>
          <span>Court: <strong className="text-navy">Davidson County General Sessions</strong></span>
          <span>Last synced: <strong className="text-navy">2 hours ago</strong></span>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-sm">
        <button
          onClick={() => setSubTab('pleadings')}
          className={`flex-1 py-2 px-3 rounded-sm text-xs font-medium transition-colors
            ${subTab === 'pleadings' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Pleadings ({DEMO_CASELINK_PLEADINGS.length})
        </button>
        <button
          onClick={() => setSubTab('dates')}
          className={`flex-1 py-2 px-3 rounded-sm text-xs font-medium transition-colors
            ${subTab === 'dates' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Court Dates ({DEMO_CASELINK_COURT_DATES.length})
        </button>
      </div>

      {/* Pleadings table */}
      {subTab === 'pleadings' && (
        <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy text-white text-xs">
                <th className="py-2.5 px-3 text-left font-semibold">#</th>
                <th className="py-2.5 px-3 text-left font-semibold">Date</th>
                <th className="py-2.5 px-3 text-left font-semibold">Description</th>
                <th className="py-2.5 px-3 text-center font-semibold">Document</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_CASELINK_PLEADINGS.map((p, i) => (
                <tr key={p.id} className={`border-t border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="py-2.5 px-3 text-gray-400 font-mono text-xs">{p.id}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-gray-600">{p.date}</td>
                  <td className="py-2.5 px-3 font-medium text-gray-800">{p.description}</td>
                  <td className="py-2.5 px-3 text-center">
                    {p.hasImage ? (
                      <button className="inline-flex items-center gap-1 px-2 py-1 bg-teal/10 text-teal rounded text-[10px] font-medium hover:bg-teal/20 transition-colors">
                        <Eye className="h-3 w-3" /> View
                      </button>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Court Dates table */}
      {subTab === 'dates' && (
        <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy text-white text-xs">
                <th className="py-2.5 px-3 text-left font-semibold">#</th>
                <th className="py-2.5 px-3 text-left font-semibold">Description</th>
                <th className="py-2.5 px-3 text-center font-semibold">Continuances</th>
                <th className="py-2.5 px-3 text-left font-semibold">Date</th>
                <th className="py-2.5 px-3 text-center font-semibold">Time</th>
                <th className="py-2.5 px-3 text-center font-semibold">Room</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_CASELINK_COURT_DATES.map((d, i) => (
                <tr key={d.id} className={`border-t border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="py-2.5 px-3 text-gray-400 font-mono text-xs">{d.id}</td>
                  <td className="py-2.5 px-3 font-medium text-gray-800">{d.description}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-gray-600">{d.continuances}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-gray-600">{d.date}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-xs text-gray-600">{d.time}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-navy">{d.room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[10px] text-gray-400 text-center">
        Data pulled automatically from Davidson County CaseLink. Updated every 4 hours.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab Content: Evidence Locker
// ---------------------------------------------------------------------------
function EvidenceTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-navy text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
          Evidence Locker
        </h3>
        <Button size="sm" className="bg-teal hover:bg-teal/90 text-white rounded-sm h-8 text-xs">
          <Plus className="h-3 w-3 mr-1" /> Add Evidence
        </Button>
      </div>

      <div className="space-y-3">
        {DEMO_EVIDENCE.map((item) => (
          <div key={item.id} className="bg-white border border-gray-100 rounded-sm p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className={`h-9 w-9 rounded-sm flex items-center justify-center shrink-0
                ${item.type === 'photo' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                {item.type === 'photo' ? <Camera className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  {(item as any).duration && (
                    <span className="text-[10px] font-mono text-gray-400 shrink-0">{(item as any).duration}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-2">{item.annotation}</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span className="font-mono">{item.date}</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-safe" /> Timestamped
                  </span>
                </div>
              </div>
              <button className="text-gray-400 hover:text-teal transition-colors">
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab Content: Diary / Notes
// ---------------------------------------------------------------------------
function DiaryTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-navy text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
          My Case Diary
        </h3>
        <Button size="sm" className="bg-teal hover:bg-teal/90 text-white rounded-sm h-8 text-xs">
          <PenLine className="h-3 w-3 mr-1" /> New Entry
        </Button>
      </div>

      <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-sm p-3">
        <strong>Tip:</strong> Keep a daily record of anything related to your case — conversations with your landlord, maintenance issues, or how the situation is affecting you. Courts value detailed, dated records.
      </p>

      <div className="space-y-3">
        {DEMO_DIARY.map((entry) => (
          <div key={entry.id} className="bg-white border border-gray-100 rounded-sm p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <NotebookPen className="h-3.5 w-3.5 text-teal" />
              <span className="text-xs font-mono font-semibold text-navy">{entry.date}</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{entry.entry}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab Content: Communication Log
// ---------------------------------------------------------------------------
function CommunicationsTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-navy text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
          Communication Log
        </h3>
        <Button size="sm" className="bg-teal hover:bg-teal/90 text-white rounded-sm h-8 text-xs">
          <Plus className="h-3 w-3 mr-1" /> Log Communication
        </Button>
      </div>

      <div className="space-y-3">
        {DEMO_COMMS.map((comm) => (
          <div key={comm.id} className="bg-white border border-gray-100 rounded-sm p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0
                ${comm.direction === 'sent' ? 'bg-teal/10 text-teal' : 'bg-amber-50 text-amber-600'}`}>
                {comm.direction === 'sent' ? <Send className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded
                    ${comm.direction === 'sent' ? 'bg-teal/10 text-teal' : 'bg-amber-50 text-amber-600'}`}>
                    {comm.direction === 'sent' ? 'SENT' : 'RECEIVED'}
                  </span>
                  <span className="text-xs font-mono text-gray-400">{comm.date}</span>
                  <span className="text-[10px] text-gray-400 capitalize bg-gray-100 px-1.5 py-0.5 rounded">{comm.type.replace('_', ' ')}</span>
                </div>
                <p className="text-sm font-medium text-gray-800 mb-0.5">{comm.subject}</p>
                <p className="text-xs text-gray-500">{comm.summary}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {comm.direction === 'sent' ? `To: ${comm.to}` : `From: ${comm.from}`}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab Content: Action Plan
// ---------------------------------------------------------------------------
function ActionPlanTab() {
  return (
    <div className="space-y-4">
      {/* Deadlines */}
      <div className="bg-red-50 border border-red-200 rounded-sm p-5">
        <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" /> Deadlines — Act By These Dates
        </h3>
        <ul className="space-y-3">
          {DEMO_NOTEBOOK.urgentDeadlines.map((d, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="font-mono font-bold text-red-700 shrink-0 pt-0.5 min-w-[100px]">{d.date}</span>
              <span className="text-gray-800">{d.action}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Steps */}
      <div className="bg-white border border-gray-100 rounded-sm p-5 shadow-sm">
        <h3 className="font-semibold text-navy mb-4 flex items-center gap-2 text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
          <Lightbulb className="h-4 w-4 text-teal" /> What You Should Do — Step by Step
        </h3>
        <ol className="space-y-4">
          {DEMO_NOTEBOOK.nextSteps.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
              <span className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white" style={{ background: 'var(--color-teal)' }}>
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab Content: Timeline
// ---------------------------------------------------------------------------
function TimelineTab() {
  return (
    <div className="space-y-1">
      <h3 className="font-semibold text-navy mb-4 flex items-center gap-2 text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
        <Clock className="h-4 w-4 text-teal" /> Full Case Timeline
      </h3>
      <div className="relative pl-6 border-l-2 border-teal/20 space-y-4">
        {DEMO_NOTEBOOK.timeline.map((t, i) => (
          <div key={i} className="relative">
            <div className="absolute -left-[25px] top-1 h-3 w-3 rounded-full bg-teal border-2 border-white" />
            <div className="bg-white border border-gray-100 rounded-sm p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-navy">{t.date}</span>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{t.source}</span>
              </div>
              <p className="text-sm text-gray-800 font-medium">{t.event}</p>
              <p className="text-xs text-gray-500 mt-1">{t.significance}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Demo Page
// ---------------------------------------------------------------------------
export default function WorkspaceDemo() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const courtDays = Math.ceil((new Date('2026-07-15').getTime() - Date.now()) / 86400000)

  const NAV_SECTIONS: Array<{ id: WorkspaceTab; icon: any; label: string; count: number | null }> = [
    { id: 'overview', icon: Shield, label: 'Overview', count: null },
    { id: 'court-records', icon: Gavel, label: 'Court Records', count: DEMO_CASELINK_PLEADINGS.length },
    { id: 'evidence', icon: Camera, label: 'Evidence Locker', count: DEMO_EVIDENCE.length },
    { id: 'diary', icon: NotebookPen, label: 'Diary / Notes', count: DEMO_DIARY.length },
    { id: 'communications', icon: Mail, label: 'Communications', count: DEMO_COMMS.length },
    { id: 'action-plan', icon: Zap, label: 'Action Plan', count: DEMO_NOTEBOOK.nextSteps.length },
    { id: 'timeline', icon: Clock, label: 'Timeline', count: DEMO_NOTEBOOK.timeline.length },
  ]

  const tabTitles: Record<WorkspaceTab, string> = {
    'overview': 'Your Case Overview',
    'court-records': 'Court Records',
    'evidence': 'Evidence Locker',
    'diary': 'My Case Diary',
    'communications': 'Communication Log',
    'action-plan': 'Action Plan',
    'timeline': 'Case Timeline',
  }

  const tabDescriptions: Record<WorkspaceTab, string> = {
    'overview': 'Plain-English breakdown of your situation and next steps',
    'court-records': 'Live court filings and hearing dates from Davidson County CaseLink',
    'evidence': 'Photos, recordings, and annotated evidence for your case',
    'diary': 'Your personal dated record of events and interactions',
    'communications': 'Letters, emails, and notices sent and received',
    'action-plan': 'Deadlines and recommended steps based on your case',
    'timeline': 'Chronological record of all case events from all sources',
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-warm-white)', fontFamily: 'var(--font-body)' }}>
      <Head>
        <title>Workspace Demo — TenantGuard</title>
        <meta name="robots" content="noindex" />
      </Head>

      {/* ── Top navigation ── */}
      <nav className="sticky top-0 z-40 border-b border-white/10" style={{ background: 'var(--color-navy)' }}>
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-white/70 hover:text-white" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/">
              <span className="flex items-center gap-2 cursor-pointer">
                <Shield className="h-5 w-5 text-teal" />
                <span className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  TenantGuard
                </span>
              </span>
            </Link>
            <div className="hidden lg:block h-5 w-px bg-white/20" />
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-sm text-sm">
              <span className="text-white/50">Demo Case</span>
              <span className="text-white font-medium">#{DEMO_CASE.id}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-amber-warn/20 text-amber-warn border-amber-warn/30 text-[10px] hidden sm:flex">
              DEMO MODE
            </Badge>
            <div className="h-8 w-8 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold">
              JD
            </div>
          </div>
        </div>
      </nav>

      {/* ── Layout ── */}
      <div className="max-w-screen-xl mx-auto flex">
        {/* ── Left Sidebar ── */}
        <aside className={`
          fixed lg:sticky top-14 left-0 z-30 w-64 h-[calc(100vh-3.5rem)]
          overflow-y-auto border-r border-white/10
          transform transition-transform duration-200 ease-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `} style={{ background: 'var(--color-navy)' }}>
          {/* Case info */}
          <div className="p-4 border-b border-white/10">
            <p className="text-[10px] text-white/30 font-mono mb-1">CASE #{DEMO_CASE.id} · {DEMO_CASE.caseNumber}</p>
            <p className="text-sm font-semibold text-white leading-tight mb-2">
              {DEMO_CASE.issueType}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-white/50 mb-2">
              <Scale className="h-3 w-3" />
              {DEMO_CASE.county} County
            </div>
            <PaymentTierBadge tier={DEMO_CASE.paymentTier} />
          </div>

          {/* Court date widget */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-white/30 uppercase tracking-widest">Court Date</span>
              <span className={`text-xs font-mono font-bold ${courtDays <= 7 ? 'text-red-urgent' : courtDays <= 14 ? 'text-amber-warn' : 'text-white/60'}`}>
                {courtDays}d
              </span>
            </div>
            <p className="text-sm font-medium text-white mb-2">July 15, 2026</p>
            <DeadlineBar daysLeft={courtDays} total={60} />
            <p className="text-[10px] text-white/30 mt-1">Room 1B · 10:00 AM</p>
          </div>

          {/* Navigation */}
          <nav className="p-3">
            <p className="text-[10px] text-white/30 uppercase tracking-widest px-3 mb-2 mt-2">Workspace</p>
            {NAV_SECTIONS.map(({ id, icon: Icon, label, count }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setSidebarOpen(false) }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-sm transition-colors mb-0.5
                  ${activeTab === id ? 'text-teal' : 'text-white/60 hover:text-white'}`}
                style={activeTab === id ? { background: 'rgba(14,165,233,0.15)' } : undefined}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </div>
                {count !== null && (
                  <span className={`text-xs font-mono ${activeTab === id ? 'text-teal' : 'text-white/30'}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Tools links */}
          <nav className="p-3 border-t border-white/10">
            <p className="text-[10px] text-white/30 uppercase tracking-widest px-3 mb-2">Tools</p>
            {[
              { icon: Upload, label: 'Documents' },
              { icon: Gavel, label: 'Motions' },
              { icon: Lightbulb, label: 'Action Items' },
              { icon: Bell, label: 'Alerts' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm text-white/40 mb-0.5 cursor-not-allowed">
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </span>
            ))}
          </nav>

          {/* Back link */}
          <div className="p-4 border-t border-white/10 mt-auto">
            <Link href="/dashboard">
              <span className="flex items-center gap-2 text-sm text-white/50 hover:text-white cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
                My Dashboard
              </span>
            </Link>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0 p-4 lg:p-8">
          {/* Page header */}
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div>
              <h1 className="text-2xl font-bold text-navy" style={{ fontFamily: 'var(--font-heading)' }}>
                {tabTitles[activeTab]}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {tabDescriptions[activeTab]}
              </p>
            </div>
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'overview' && <OverviewTab />}
              {activeTab === 'court-records' && <CourtRecordsTab />}
              {activeTab === 'evidence' && <EvidenceTab />}
              {activeTab === 'diary' && <DiaryTab />}
              {activeTab === 'communications' && <CommunicationsTab />}
              {activeTab === 'action-plan' && <ActionPlanTab />}
              {activeTab === 'timeline' && <TimelineTab />}
            </motion.div>
          </AnimatePresence>

          {/* Disclaimer */}
          <p className="text-center text-xs text-gray-400 mt-10 pb-4">
            TenantGuard is not a law firm and does not provide legal advice. This analysis is for informational purposes only.{' '}
            <Link href="/privacy"><span className="underline hover:text-gray-600 cursor-pointer">Privacy Policy</span></Link>
          </p>
        </main>

        {/* ── Right Rail (desktop) ── */}
        <aside className="hidden xl:block w-64 shrink-0 border-l border-gray-100 bg-white p-4 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          {/* Payment tier */}
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3 font-semibold">Your Plan</p>
          <div className="bg-teal/5 border border-teal/20 rounded-sm p-3 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-teal" />
              <span className="text-sm font-semibold text-navy">Standard Plan</span>
            </div>
            <ul className="space-y-1 text-[11px] text-gray-600">
              <li className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-green-safe" /> AI Case Analysis</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-green-safe" /> Court Record Sync</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-green-safe" /> Evidence Locker</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-green-safe" /> Motion Templates</li>
              <li className="flex items-center gap-1.5 text-gray-400"><Lock className="h-3 w-3" /> Attorney Match (Premium)</li>
            </ul>
          </div>

          {/* Court countdown */}
          <div className={`p-3 rounded-sm border mb-4 ${courtDays <= 7 ? 'bg-red-50 border-red-100' : courtDays <= 14 ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
            <p className={`text-xs font-bold uppercase tracking-wide ${courtDays <= 7 ? 'text-red-600' : courtDays <= 14 ? 'text-amber-600' : 'text-blue-600'}`}>
              {courtDays} DAYS LEFT
            </p>
            <p className="text-sm text-navy font-medium mt-1">Court Hearing</p>
            <p className="text-xs text-gray-500 font-mono mt-0.5">July 15, 2026 · 10:00 AM</p>
          </div>

          <div className="h-px bg-gray-100 my-4" />

          {/* Quick stats */}
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3 font-semibold">Case Stats</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Documents</span>
              <span className="font-mono font-semibold text-navy">7</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Evidence Items</span>
              <span className="font-mono font-semibold text-navy">{DEMO_EVIDENCE.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Court Filings</span>
              <span className="font-mono font-semibold text-navy">{DEMO_CASELINK_PLEADINGS.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Diary Entries</span>
              <span className="font-mono font-semibold text-navy">{DEMO_DIARY.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Communications</span>
              <span className="font-mono font-semibold text-navy">{DEMO_COMMS.length}</span>
            </div>
          </div>

          <div className="h-px bg-gray-100 my-4" />

          {/* CaseLink status */}
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3 font-semibold">CaseLink Sync</p>
          <div className="flex items-center gap-2 text-xs">
            <div className="h-2 w-2 rounded-full bg-green-safe animate-pulse" />
            <span className="text-gray-600">Connected · Last sync 2h ago</span>
          </div>
        </aside>
      </div>
    </div>
  )
}
