import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, ArrowLeft, Bell, BookOpen, Briefcase, Calendar,
  CheckCircle, CheckCircle2, ChevronRight, Clock, CreditCard,
  Download, Eye, FileText, Gavel, Globe, Lightbulb, Mail,
  MessageSquare, Phone, Plus, Scale, Search, Send, Shield,
  Upload, Users, X, Zap, PenLine, Star, TrendingUp, DollarSign,
  BarChart2, Filter, ChevronDown, Inbox,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// ---------------------------------------------------------------------------
// Demo Data — Attorney view of multiple tenant cases
// ---------------------------------------------------------------------------
const DEMO_ATTORNEY = {
  name: 'Sarah M. Chen',
  barNumber: 'TN-034821',
  firm: 'Chen & Associates, PLLC',
  initials: 'SC',
  specialty: 'Tenant Defense',
  activeCases: 12,
  hearingsThisWeek: 3,
  pendingMotions: 4,
  newDocuments: 7,
}

const DEMO_CLIENTS = [
  {
    id: 1042, caseNum: '24GT10013', name: 'Jane D.', status: 'active',
    issue: 'Eviction — Lease Violation', courtDate: '2026-07-15', daysLeft: 18,
    landlord: 'Metro Property Partners, LLC', county: 'Davidson',
    urgency: 'high', lastActivity: '2h ago', motionsPending: 1,
    summary: 'Strong retaliation defense. Motion to Quash filed. Multiple continuances granted.',
  },
  {
    id: 1038, caseNum: '24GT09847', name: 'Marcus T.', status: 'active',
    issue: 'Eviction — Non-Payment', courtDate: '2026-07-08', daysLeft: 11,
    landlord: 'Greenfield Properties', county: 'Davidson',
    urgency: 'critical', lastActivity: '1d ago', motionsPending: 2,
    summary: 'Client disputes $340 in fees not in lease. Habitability counterclaim viable.',
  },
  {
    id: 1031, caseNum: '24GT08901', name: 'Rosa L.', status: 'active',
    issue: 'Eviction — Unauthorized Occupant', courtDate: '2026-07-22', daysLeft: 25,
    landlord: 'Polo Park Apartments', county: 'Davidson',
    urgency: 'medium', lastActivity: '3d ago', motionsPending: 0,
    summary: 'Occupant is a minor child. Tennessee law protects against this eviction basis.',
  },
  {
    id: 1019, caseNum: '24GT07234', name: 'David K.', status: 'resolved',
    issue: 'Eviction — Dismissed', courtDate: '2026-06-10', daysLeft: 0,
    landlord: 'Riverside Rentals', county: 'Davidson',
    urgency: 'none', lastActivity: '17d ago', motionsPending: 0,
    summary: 'Case dismissed with prejudice. Client retained housing. Landlord ordered to make repairs.',
  },
]

const DEMO_ACTIVE_CASE = DEMO_CLIENTS[0]

const DEMO_COURT_CALENDAR = [
  { id: 1, date: '2026-07-08', time: '9:00 AM', room: '1A', client: 'Marcus T.', caseNum: '24GT09847', type: 'Hearing', urgency: 'critical' },
  { id: 2, date: '2026-07-10', time: '10:00 AM', room: '1B', client: 'Jane D.', caseNum: '24GT10013', type: 'Status Conference', urgency: 'high' },
  { id: 3, date: '2026-07-15', time: '10:00 AM', room: '1B', client: 'Jane D.', caseNum: '24GT10013', type: 'Trial', urgency: 'high' },
  { id: 4, date: '2026-07-22', time: '2:00 PM', room: '2C', client: 'Rosa L.', caseNum: '24GT08901', type: 'Hearing', urgency: 'medium' },
]

const DEMO_MOTIONS_QUEUE = [
  { id: 1, client: 'Marcus T.', caseNum: '24GT09847', type: 'Motion to Continue', dueDate: '2026-07-05', status: 'draft', urgency: 'critical' },
  { id: 2, client: 'Marcus T.', caseNum: '24GT09847', type: 'Answer & Counterclaim', dueDate: '2026-07-06', status: 'review', urgency: 'critical' },
  { id: 3, client: 'Jane D.', caseNum: '24GT10013', type: 'Motion in Limine', dueDate: '2026-07-08', status: 'draft', urgency: 'high' },
  { id: 4, client: 'Rosa L.', caseNum: '24GT08901', type: 'Motion to Dismiss', dueDate: '2026-07-15', status: 'not_started', urgency: 'medium' },
]

const DEMO_RECENT_DOCS = [
  { id: 1, client: 'Jane D.', caseNum: '24GT10013', name: 'Detainer Warrant — Amended', date: '2026-06-27', source: 'CaseLink', type: 'court_filing' },
  { id: 2, client: 'Marcus T.', caseNum: '24GT09847', name: 'Lease Agreement (2023)', date: '2026-06-26', source: 'Client Upload', type: 'lease' },
  { id: 3, client: 'Rosa L.', caseNum: '24GT08901', name: 'Complaint Filed', date: '2026-06-25', source: 'CaseLink', type: 'court_filing' },
  { id: 4, client: 'Marcus T.', caseNum: '24GT09847', name: 'Rent Payment History', date: '2026-06-24', source: 'Client Upload', type: 'payment_record' },
  { id: 5, client: 'Jane D.', caseNum: '24GT10013', name: 'Code Violation Report', date: '2026-06-23', source: 'Client Upload', type: 'evidence' },
]

const DEMO_CASE_NOTES = [
  { id: 1, date: '2026-06-27', author: 'SC', note: 'Spoke with Jane D. — landlord\'s attorney offered settlement: 30-day move-out in exchange for dismissal. Client declined. Proceeding to trial.' },
  { id: 2, date: '2026-06-25', author: 'SC', note: 'Reviewed amended detainer warrant. Landlord added new allegation of property damage. Need photos from client to rebut.' },
  { id: 3, date: '2026-06-22', author: 'SC', note: 'Filed Motion to Quash improper service. Judge continued to 7/10 for status conference.' },
  { id: 4, date: '2026-06-18', author: 'SC', note: 'Initial intake complete. Strong retaliation defense — client reported mold to codes department 2 weeks before eviction notice.' },
]

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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type AttorneyTab = 'dashboard' | 'clients' | 'calendar' | 'motions' | 'documents' | 'case-detail' | 'notes'

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------
function UrgencyBadge({ urgency }: { urgency: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    critical: { label: 'CRITICAL', cls: 'bg-red-100 text-red-700 border border-red-200' },
    high:     { label: 'HIGH',     cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    medium:   { label: 'MEDIUM',   cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
    none:     { label: 'RESOLVED', cls: 'bg-green-50 text-green-700 border border-green-200' },
  }
  const c = map[urgency] || map.medium
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide ${c.cls}`}>
      {c.label}
    </span>
  )
}

function MotionStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    draft:       { label: 'Draft',       cls: 'bg-gray-100 text-gray-600' },
    review:      { label: 'In Review',   cls: 'bg-amber-50 text-amber-700' },
    not_started: { label: 'Not Started', cls: 'bg-red-50 text-red-600' },
    filed:       { label: 'Filed',       cls: 'bg-green-50 text-green-700' },
  }
  const c = map[status] || map.draft
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${c.cls}`}>
      {c.label}
    </span>
  )
}

function StatCard({ icon: Icon, label, value, sub, color = 'teal' }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string
}) {
  const colorMap: Record<string, string> = {
    teal: 'text-teal bg-teal/10',
    red: 'text-red-500 bg-red-50',
    amber: 'text-amber-600 bg-amber-50',
    green: 'text-green-600 bg-green-50',
  }
  return (
    <div className="bg-white border border-gray-100 rounded-sm p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`h-9 w-9 rounded-sm flex items-center justify-center shrink-0 ${colorMap[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-2xl font-bold text-navy" style={{ fontFamily: 'var(--font-heading)' }}>{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
          {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab: Dashboard
// ---------------------------------------------------------------------------
function DashboardTab({ onSelectClient }: { onSelectClient: (id: number) => void }) {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Briefcase} label="Active Cases" value={DEMO_ATTORNEY.activeCases} color="teal" />
        <StatCard icon={Gavel} label="Hearings This Week" value={DEMO_ATTORNEY.hearingsThisWeek} color="amber" />
        <StatCard icon={FileText} label="Pending Motions" value={DEMO_ATTORNEY.pendingMotions} color="red" />
        <StatCard icon={Inbox} label="New Documents" value={DEMO_ATTORNEY.newDocuments} color="green" />
      </div>

      {/* Critical alerts */}
      <div className="bg-red-50 border border-red-200 rounded-sm p-4">
        <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4" /> Requires Immediate Attention
        </h3>
        <div className="space-y-2">
          {DEMO_MOTIONS_QUEUE.filter(m => m.urgency === 'critical').map(m => (
            <div key={m.id} className="flex items-center justify-between bg-white border border-red-100 rounded-sm px-3 py-2.5">
              <div className="flex items-center gap-3">
                <FileText className="h-3.5 w-3.5 text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{m.type}</p>
                  <p className="text-[11px] text-gray-500">{m.client} · {m.caseNum}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono text-red-600 font-bold">Due {m.dueDate}</span>
                <MotionStatusBadge status={m.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active cases */}
      <div>
        <h3 className="font-semibold text-navy mb-3 flex items-center gap-2 text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
          <Users className="h-4 w-4 text-teal" /> Active Client Cases
        </h3>
        <div className="space-y-2">
          {DEMO_CLIENTS.filter(c => c.status === 'active').map(client => (
            <button
              key={client.id}
              onClick={() => onSelectClient(client.id)}
              className="w-full text-left bg-white border border-gray-100 rounded-sm p-4 shadow-sm hover:border-teal/40 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {client.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-semibold text-navy">{client.name}</p>
                      <span className="text-[10px] font-mono text-gray-400">{client.caseNum}</span>
                      <UrgencyBadge urgency={client.urgency} />
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{client.issue}</p>
                    <p className="text-[11px] text-gray-400 line-clamp-1">{client.summary}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold font-mono ${client.daysLeft <= 7 ? 'text-red-500' : client.daysLeft <= 14 ? 'text-amber-600' : 'text-navy'}`}>
                    {client.daysLeft}d
                  </p>
                  <p className="text-[10px] text-gray-400">to hearing</p>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-teal ml-auto mt-1 transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent CaseLink activity */}
      <div>
        <h3 className="font-semibold text-navy mb-3 flex items-center gap-2 text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
          <Globe className="h-4 w-4 text-teal" /> Recent CaseLink Activity
        </h3>
        <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
          {DEMO_RECENT_DOCS.slice(0, 4).map((doc, i) => (
            <div key={doc.id} className={`flex items-center gap-3 px-4 py-3 ${i < 3 ? 'border-b border-gray-50' : ''}`}>
              <div className="h-7 w-7 rounded-sm bg-teal/10 flex items-center justify-center shrink-0">
                <FileText className="h-3.5 w-3.5 text-teal" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                <p className="text-[11px] text-gray-400">{doc.client} · {doc.caseNum}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-mono text-gray-400">{doc.date}</p>
                <span className="text-[10px] text-teal bg-teal/10 px-1.5 py-0.5 rounded">{doc.source}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab: Client Roster
// ---------------------------------------------------------------------------
function ClientsTab({ onSelectClient }: { onSelectClient: (id: number) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-navy text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
          All Clients ({DEMO_CLIENTS.length})
        </h3>
        <Button size="sm" className="bg-teal hover:bg-teal/90 text-white rounded-sm h-8 text-xs">
          <Plus className="h-3 w-3 mr-1" /> New Client
        </Button>
      </div>

      <div className="space-y-2">
        {DEMO_CLIENTS.map(client => (
          <button
            key={client.id}
            onClick={() => client.status === 'active' ? onSelectClient(client.id) : undefined}
            className={`w-full text-left bg-white border border-gray-100 rounded-sm p-4 shadow-sm transition-all group
              ${client.status === 'active' ? 'hover:border-teal/40 hover:shadow-md cursor-pointer' : 'opacity-70 cursor-default'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0
                  ${client.status === 'resolved' ? 'bg-green-500' : 'bg-navy'}`}>
                  {client.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-semibold text-navy">{client.name}</p>
                    <span className="text-[10px] font-mono text-gray-400">{client.caseNum}</span>
                    <UrgencyBadge urgency={client.urgency} />
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{client.issue}</p>
                  <p className="text-[11px] text-gray-400">{client.county} County · Last activity {client.lastActivity}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                {client.status === 'active' ? (
                  <>
                    <p className={`text-sm font-bold font-mono ${client.daysLeft <= 7 ? 'text-red-500' : client.daysLeft <= 14 ? 'text-amber-600' : 'text-navy'}`}>
                      {client.daysLeft}d
                    </p>
                    <p className="text-[10px] text-gray-400">to hearing</p>
                  </>
                ) : (
                  <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">Resolved</span>
                )}
                {client.motionsPending > 0 && (
                  <p className="text-[10px] text-red-500 font-semibold mt-1">{client.motionsPending} motion{client.motionsPending > 1 ? 's' : ''} pending</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab: Court Calendar
// ---------------------------------------------------------------------------
function CalendarTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-navy text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
          Upcoming Court Dates
        </h3>
        <Badge className="bg-teal/10 text-teal border-teal/20 text-[10px]">
          Davidson County General Sessions
        </Badge>
      </div>

      <div className="space-y-3">
        {DEMO_COURT_CALENDAR.map(event => (
          <div key={event.id} className={`bg-white border rounded-sm p-4 shadow-sm
            ${event.urgency === 'critical' ? 'border-red-200' : event.urgency === 'high' ? 'border-amber-200' : 'border-gray-100'}`}>
            <div className="flex items-start gap-4">
              <div className={`text-center shrink-0 w-14 rounded-sm py-2 px-1
                ${event.urgency === 'critical' ? 'bg-red-50' : event.urgency === 'high' ? 'bg-amber-50' : 'bg-teal/5'}`}>
                <p className={`text-xs font-bold uppercase ${event.urgency === 'critical' ? 'text-red-600' : event.urgency === 'high' ? 'text-amber-600' : 'text-teal'}`}>
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                </p>
                <p className={`text-2xl font-bold leading-none ${event.urgency === 'critical' ? 'text-red-700' : event.urgency === 'high' ? 'text-amber-700' : 'text-navy'}`}
                  style={{ fontFamily: 'var(--font-heading)' }}>
                  {new Date(event.date).getDate()}
                </p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="text-sm font-semibold text-navy">{event.type}</p>
                  <UrgencyBadge urgency={event.urgency} />
                </div>
                <p className="text-sm text-gray-700 font-medium">{event.client}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="font-mono">{event.caseNum}</span>
                  <span>·</span>
                  <span>{event.time}</span>
                  <span>·</span>
                  <span>Room {event.room}</span>
                </div>
              </div>
              <Button size="sm" variant="outline" className="rounded-sm h-8 text-xs shrink-0">
                Prepare
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab: Motions Queue
// ---------------------------------------------------------------------------
function MotionsTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-navy text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
          Motions Queue ({DEMO_MOTIONS_QUEUE.length})
        </h3>
        <Button size="sm" className="bg-teal hover:bg-teal/90 text-white rounded-sm h-8 text-xs">
          <Plus className="h-3 w-3 mr-1" /> Draft Motion
        </Button>
      </div>

      <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-sm p-3">
        <strong>AI-Assisted Drafting:</strong> TenantGuard can generate a first draft of any motion using the client's case facts, uploaded documents, and Tennessee eviction law. Click "Draft" on any motion below to begin.
      </p>

      <div className="space-y-3">
        {DEMO_MOTIONS_QUEUE.map(motion => (
          <div key={motion.id} className={`bg-white border rounded-sm p-4 shadow-sm
            ${motion.urgency === 'critical' ? 'border-red-200' : 'border-gray-100'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className={`h-8 w-8 rounded-sm flex items-center justify-center shrink-0
                  ${motion.urgency === 'critical' ? 'bg-red-50 text-red-500' : 'bg-teal/10 text-teal'}`}>
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-semibold text-navy">{motion.type}</p>
                    <MotionStatusBadge status={motion.status} />
                  </div>
                  <p className="text-xs text-gray-500">{motion.client} · {motion.caseNum}</p>
                  <p className={`text-xs font-mono font-bold mt-1 ${motion.urgency === 'critical' ? 'text-red-600' : 'text-gray-500'}`}>
                    Due: {motion.dueDate}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" className="rounded-sm h-7 text-xs">
                  Draft
                </Button>
                <Button size="sm" className="bg-navy hover:bg-navy/90 text-white rounded-sm h-7 text-xs">
                  File
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab: Documents
// ---------------------------------------------------------------------------
function DocumentsTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-navy text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
          Recent Documents ({DEMO_RECENT_DOCS.length})
        </h3>
        <Badge className="bg-green-safe/10 text-green-safe border-green-safe/20 text-[10px]">
          Auto-synced from CaseLink
        </Badge>
      </div>

      <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-navy text-white text-xs">
              <th className="py-2.5 px-3 text-left font-semibold">Document</th>
              <th className="py-2.5 px-3 text-left font-semibold">Client</th>
              <th className="py-2.5 px-3 text-left font-semibold">Source</th>
              <th className="py-2.5 px-3 text-left font-semibold">Date</th>
              <th className="py-2.5 px-3 text-center font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_RECENT_DOCS.map((doc, i) => (
              <tr key={doc.id} className={`border-t border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-teal shrink-0" />
                    <span className="font-medium text-gray-800 text-xs">{doc.name}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-xs text-gray-600">{doc.client}</td>
                <td className="py-2.5 px-3">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium
                    ${doc.source === 'CaseLink' ? 'bg-teal/10 text-teal' : 'bg-gray-100 text-gray-600'}`}>
                    {doc.source}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-mono text-xs text-gray-500">{doc.date}</td>
                <td className="py-2.5 px-3 text-center">
                  <button className="inline-flex items-center gap-1 px-2 py-1 bg-teal/10 text-teal rounded text-[10px] font-medium hover:bg-teal/20 transition-colors">
                    <Eye className="h-3 w-3" /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab: Case Detail (drill-down into one client)
// ---------------------------------------------------------------------------
function CaseDetailTab({ clientId, onBack }: { clientId: number; onBack: () => void }) {
  const client = DEMO_CLIENTS.find(c => c.id === clientId) || DEMO_CLIENTS[0]
  const [subTab, setSubTab] = useState<'overview' | 'caselink' | 'notes'>('overview')

  return (
    <div className="space-y-4">
      {/* Back + header */}
      <div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-teal mb-3 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to clients
        </button>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-navy flex items-center justify-center text-white text-sm font-bold">
              {client.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-navy" style={{ fontFamily: 'var(--font-heading)' }}>{client.name}</h2>
                <UrgencyBadge urgency={client.urgency} />
              </div>
              <p className="text-xs text-gray-500 font-mono">{client.caseNum} · {client.county} County</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="rounded-sm h-8 text-xs">
              <Phone className="h-3 w-3 mr-1" /> Contact
            </Button>
            <Button size="sm" className="bg-teal hover:bg-teal/90 text-white rounded-sm h-8 text-xs">
              <FileText className="h-3 w-3 mr-1" /> Draft Motion
            </Button>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-sm">
        {(['overview', 'caselink', 'notes'] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)}
            className={`flex-1 py-2 px-3 rounded-sm text-xs font-medium transition-colors capitalize
              ${subTab === t ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'caselink' ? 'Court Records' : t === 'notes' ? 'Case Notes' : 'Overview'}
          </button>
        ))}
      </div>

      {/* Overview sub-tab */}
      {subTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-sm p-4 shadow-sm">
            <h3 className="font-semibold text-navy mb-2 flex items-center gap-2 text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
              <Shield className="h-4 w-4 text-teal" /> Case Summary
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">{client.summary}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-100 rounded-sm p-3 shadow-sm">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Landlord</p>
              <p className="text-sm font-medium text-navy">{client.landlord}</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-sm p-3 shadow-sm">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Issue Type</p>
              <p className="text-sm font-medium text-navy">{client.issue}</p>
            </div>
            <div className={`border rounded-sm p-3 shadow-sm ${client.daysLeft <= 7 ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Court Date</p>
              <p className={`text-sm font-bold ${client.daysLeft <= 7 ? 'text-red-700' : 'text-amber-700'}`}>
                {client.courtDate} <span className="font-mono">({client.daysLeft}d)</span>
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-sm p-3 shadow-sm">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Motions Pending</p>
              <p className="text-sm font-bold text-navy">{client.motionsPending}</p>
            </div>
          </div>
        </div>
      )}

      {/* CaseLink sub-tab */}
      {subTab === 'caselink' && (
        <div className="space-y-3">
          <div className="bg-white border border-gray-100 rounded-sm p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-teal" />
                <span className="text-sm font-semibold text-navy">Davidson County CaseLink</span>
              </div>
              <Badge className="bg-green-safe/10 text-green-safe border-green-safe/20 text-[10px]">
                Live · Synced 2h ago
              </Badge>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-sm shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy text-white text-xs">
                  <th className="py-2.5 px-3 text-left font-semibold">#</th>
                  <th className="py-2.5 px-3 text-left font-semibold">Date</th>
                  <th className="py-2.5 px-3 text-left font-semibold">Filing</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Document</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_CASELINK_PLEADINGS.map((p, i) => (
                  <tr key={p.id} className={`border-t border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="py-2.5 px-3 text-gray-400 font-mono text-xs">{p.id}</td>
                    <td className="py-2.5 px-3 font-mono text-xs text-gray-600">{p.date}</td>
                    <td className="py-2.5 px-3 font-medium text-gray-800 text-xs">{p.description}</td>
                    <td className="py-2.5 px-3 text-center">
                      {p.hasImage ? (
                        <button className="inline-flex items-center gap-1 px-2 py-1 bg-teal/10 text-teal rounded text-[10px] font-medium hover:bg-teal/20 transition-colors">
                          <Eye className="h-3 w-3" /> View
                        </button>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notes sub-tab */}
      {subTab === 'notes' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-navy text-sm" style={{ fontFamily: 'var(--font-heading)' }}>Case Notes</h3>
            <Button size="sm" className="bg-teal hover:bg-teal/90 text-white rounded-sm h-8 text-xs">
              <PenLine className="h-3 w-3 mr-1" /> Add Note
            </Button>
          </div>
          {DEMO_CASE_NOTES.map(note => (
            <div key={note.id} className="bg-white border border-gray-100 rounded-sm p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-5 w-5 rounded-full bg-navy flex items-center justify-center text-white text-[9px] font-bold">{note.author}</div>
                <span className="text-xs font-mono font-semibold text-navy">{note.date}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{note.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Attorney Workspace Demo Page
// ---------------------------------------------------------------------------
export default function AttorneyWorkspaceDemo() {
  const [activeTab, setActiveTab] = useState<AttorneyTab>('dashboard')
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleSelectClient = (id: number) => {
    setSelectedClientId(id)
    setActiveTab('case-detail')
    setSidebarOpen(false)
  }

  const handleBackToClients = () => {
    setActiveTab('clients')
    setSelectedClientId(null)
  }

  const NAV_SECTIONS: Array<{ id: AttorneyTab; icon: any; label: string; count: number | null }> = [
    { id: 'dashboard', icon: BarChart2, label: 'Dashboard', count: null },
    { id: 'clients', icon: Users, label: 'Client Roster', count: DEMO_CLIENTS.filter(c => c.status === 'active').length },
    { id: 'calendar', icon: Calendar, label: 'Court Calendar', count: DEMO_COURT_CALENDAR.length },
    { id: 'motions', icon: FileText, label: 'Motions Queue', count: DEMO_MOTIONS_QUEUE.length },
    { id: 'documents', icon: BookOpen, label: 'Documents', count: DEMO_RECENT_DOCS.length },
  ]

  const tabTitles: Record<AttorneyTab, string> = {
    dashboard: 'Attorney Dashboard',
    clients: 'Client Roster',
    calendar: 'Court Calendar',
    motions: 'Motions Queue',
    documents: 'Documents',
    'case-detail': selectedClientId ? `Case: ${DEMO_CLIENTS.find(c => c.id === selectedClientId)?.name || ''}` : 'Case Detail',
    notes: 'Case Notes',
  }

  const tabDescriptions: Record<AttorneyTab, string> = {
    dashboard: 'Overview of your active cases, urgent deadlines, and recent activity',
    clients: 'All clients and their case status at a glance',
    calendar: 'Upcoming hearings and court dates across all cases',
    motions: 'Pending motions to draft, review, and file',
    documents: 'All case documents, auto-synced from Davidson County CaseLink',
    'case-detail': 'Full case file, court records, and notes for this client',
    notes: 'Attorney notes and case log',
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-warm-white)', fontFamily: 'var(--font-body)' }}>
      <Head>
        <title>Attorney Workspace Demo — TenantGuard</title>
        <meta name="robots" content="noindex" />
      </Head>

      {/* ── Top navigation ── */}
      <nav className="sticky top-0 z-40 border-b border-white/10" style={{ background: 'var(--color-navy)' }}>
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-white/70 hover:text-white" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/">
              <span className="flex items-center gap-2 cursor-pointer">
                <Scale className="h-5 w-5 text-teal" />
                <span className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  TenantGuard
                </span>
              </span>
            </Link>
            <div className="hidden lg:block h-5 w-px bg-white/20" />
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-sm text-sm">
              <span className="text-white/50">Attorney Portal</span>
              <span className="text-white font-medium">Demo</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-amber-warn/20 text-amber-warn border-amber-warn/30 text-[10px] hidden sm:flex">
              DEMO MODE
            </Badge>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-white text-xs font-semibold">{DEMO_ATTORNEY.name}</span>
              <span className="text-white/40 text-[10px]">{DEMO_ATTORNEY.barNumber}</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold">
              {DEMO_ATTORNEY.initials}
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

          {/* Attorney info */}
          <div className="p-4 border-b border-white/10">
            <p className="text-[10px] text-white/30 font-mono mb-1 uppercase tracking-widest">Attorney</p>
            <p className="text-sm font-semibold text-white leading-tight mb-0.5">{DEMO_ATTORNEY.name}</p>
            <p className="text-[11px] text-white/40 mb-2">{DEMO_ATTORNEY.firm}</p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-semibold text-teal bg-teal/10">
              <Scale className="h-3 w-3" />
              {DEMO_ATTORNEY.specialty}
            </span>
          </div>

          {/* Quick stats */}
          <div className="p-4 border-b border-white/10 grid grid-cols-2 gap-2">
            <div className="text-center">
              <p className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>{DEMO_ATTORNEY.activeCases}</p>
              <p className="text-[10px] text-white/30">Active Cases</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-amber-warn" style={{ fontFamily: 'var(--font-heading)' }}>{DEMO_ATTORNEY.hearingsThisWeek}</p>
              <p className="text-[10px] text-white/30">This Week</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-3">
            <p className="text-[10px] text-white/30 uppercase tracking-widest px-3 mb-2 mt-2">Workspace</p>
            {NAV_SECTIONS.map(({ id, icon: Icon, label, count }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setSidebarOpen(false) }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-sm transition-colors mb-0.5
                  ${activeTab === id || (activeTab === 'case-detail' && id === 'clients') ? 'text-teal' : 'text-white/60 hover:text-white'}`}
                style={(activeTab === id || (activeTab === 'case-detail' && id === 'clients')) ? { background: 'rgba(14,165,233,0.15)' } : undefined}
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

          {/* CaseLink status */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs mb-1">
              <div className="h-2 w-2 rounded-full bg-green-safe animate-pulse" />
              <span className="text-white/50">CaseLink Connected</span>
            </div>
            <p className="text-[10px] text-white/30">All {DEMO_CLIENTS.filter(c => c.status === 'active').length} active cases synced · 2h ago</p>
          </div>

          {/* Back link */}
          <div className="p-4 border-t border-white/10">
            <Link href="/workspace-demo">
              <span className="flex items-center gap-2 text-sm text-white/50 hover:text-white cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
                Tenant Workspace Demo
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

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (selectedClientId || '')}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'dashboard' && <DashboardTab onSelectClient={handleSelectClient} />}
              {activeTab === 'clients' && <ClientsTab onSelectClient={handleSelectClient} />}
              {activeTab === 'calendar' && <CalendarTab />}
              {activeTab === 'motions' && <MotionsTab />}
              {activeTab === 'documents' && <DocumentsTab />}
              {activeTab === 'case-detail' && selectedClientId && (
                <CaseDetailTab clientId={selectedClientId} onBack={handleBackToClients} />
              )}
            </motion.div>
          </AnimatePresence>

          <p className="text-center text-xs text-gray-400 mt-10 pb-4">
            TenantGuard Attorney Portal — Demo Mode. Not a law firm. Court data from Davidson County CaseLink.{' '}
            <Link href="/privacy"><span className="underline hover:text-gray-600 cursor-pointer">Privacy Policy</span></Link>
          </p>
        </main>

        {/* ── Right Rail ── */}
        <aside className="hidden xl:block w-64 shrink-0 border-l border-gray-100 bg-white p-4 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3 font-semibold">Urgent Actions</p>
          <div className="space-y-2 mb-5">
            {DEMO_MOTIONS_QUEUE.filter(m => m.urgency === 'critical').map(m => (
              <div key={m.id} className="bg-red-50 border border-red-100 rounded-sm p-2.5">
                <p className="text-xs font-semibold text-red-700 leading-tight">{m.type}</p>
                <p className="text-[10px] text-red-500 font-mono mt-0.5">Due {m.dueDate}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{m.client}</p>
              </div>
            ))}
          </div>

          <div className="h-px bg-gray-100 my-4" />

          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3 font-semibold">This Week</p>
          <div className="space-y-2 mb-5">
            {DEMO_COURT_CALENDAR.slice(0, 3).map(event => (
              <div key={event.id} className="flex items-start gap-2">
                <div className={`text-center w-10 shrink-0 rounded-sm py-1
                  ${event.urgency === 'critical' ? 'bg-red-50' : 'bg-teal/5'}`}>
                  <p className={`text-[9px] font-bold uppercase ${event.urgency === 'critical' ? 'text-red-500' : 'text-teal'}`}>
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                  </p>
                  <p className={`text-sm font-bold leading-none ${event.urgency === 'critical' ? 'text-red-700' : 'text-navy'}`}
                    style={{ fontFamily: 'var(--font-heading)' }}>
                    {new Date(event.date).getDate()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-navy leading-tight">{event.type}</p>
                  <p className="text-[10px] text-gray-500">{event.client}</p>
                  <p className="text-[10px] text-gray-400 font-mono">{event.time} · Rm {event.room}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="h-px bg-gray-100 my-4" />

          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3 font-semibold">CaseLink Sync</p>
          <div className="flex items-center gap-2 text-xs mb-1">
            <div className="h-2 w-2 rounded-full bg-green-safe animate-pulse" />
            <span className="text-gray-600">Connected · Last sync 2h ago</span>
          </div>
          <p className="text-[10px] text-gray-400">{DEMO_CLIENTS.filter(c => c.status === 'active').length} cases monitored</p>
        </aside>
      </div>
    </div>
  )
}
