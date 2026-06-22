import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useSession, signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
  AlertTriangle, Bell, CheckCircle2, ChevronRight,
  FileText, Loader2, LogOut, Mail, MapPin, Phone,
  Save, Shield, Trash2, User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Navbar from '@/components/Navbar'
import api from '@/lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface UserProfile {
  phone: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  zip_code: string
  notification_preference: string
  email_court_reminders: boolean
  email_deadline_alerts: boolean
  email_case_updates: boolean
  sms_court_reminders: boolean
  sms_deadline_alerts: boolean
  onboarding_complete: boolean
  avatar_url: string
}

interface UserData {
  pk: number
  username: string
  email: string | null
  first_name: string
  last_name: string
  is_staff: boolean
  profile: UserProfile
}

interface ProfileSummary {
  total_cases: number
  open_cases: number
  upcoming_court_dates: number
  total_documents: number
  recent_cases: Array<{
    id: number
    status: string
    issue_type: string
    county: string
    court_date: string | null
    urgency_level: string
    created_at: string
  }>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ISSUE_LABELS: Record<string, string> = {
  eviction: 'Eviction / Detainer',
  habitability: 'Habitability / Repairs',
  deposit: 'Security Deposit',
  harassment: 'Landlord Harassment',
  lease_dispute: 'Lease Dispute',
  other: 'Other Housing Issue',
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600 border-gray-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    analyzing: 'bg-blue-50 text-blue-700 border-blue-200',
    complete: 'bg-green-50 text-green-700 border-green-200',
  }
  const labels: Record<string, string> = {
    draft: 'Draft', pending: 'Pending', analyzing: 'Analyzing', complete: 'Complete',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded-sm ${styles[status] || styles.draft}`}>
      {labels[status] || status}
    </span>
  )
}

function initials(first: string, last: string, username: string): string {
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase()
  if (first) return first[0].toUpperCase()
  if (username) return username[0].toUpperCase()
  return '?'
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-4 w-4 text-teal" />
      <h2 className="text-xs font-semibold text-navy uppercase tracking-wider" style={{ fontFamily: 'var(--font-heading)' }}>
        {title}
      </h2>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ProfilePage() {
  const { data: session, status } = useSession({ required: true })
  const router = useRouter()

  const [userData, setUserData] = useState<UserData | null>(null)
  const [summary, setSummary] = useState<ProfileSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'security'>('account')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: 'Tennessee',
    zip_code: '',
    notification_preference: 'email',
    email_court_reminders: true,
    email_deadline_alerts: true,
    email_case_updates: true,
    sms_court_reminders: false,
    sms_deadline_alerts: false,
  })

  useEffect(() => {
    if (status !== 'authenticated') return
    const token = session.access_token
    Promise.all([
      api.get('auth/profile/', { headers: { Authorization: `Bearer ${token}` } }),
      api.get('auth/profile/summary/', { headers: { Authorization: `Bearer ${token}` } }),
    ])
      .then(([userRes, summaryRes]) => {
        const u: UserData = userRes.data
        setUserData(u)
        setSummary(summaryRes.data)
        const p: UserProfile = u.profile || ({} as UserProfile)
        setForm({
          first_name: u.first_name || '',
          last_name: u.last_name || '',
          email: u.email || '',
          phone: p.phone || '',
          address_line1: p.address_line1 || '',
          address_line2: p.address_line2 || '',
          city: p.city || '',
          state: p.state || 'Tennessee',
          zip_code: p.zip_code || '',
          notification_preference: p.notification_preference || 'email',
          email_court_reminders: p.email_court_reminders ?? true,
          email_deadline_alerts: p.email_deadline_alerts ?? true,
          email_case_updates: p.email_case_updates ?? true,
          sms_court_reminders: p.sms_court_reminders ?? false,
          sms_deadline_alerts: p.sms_deadline_alerts ?? false,
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [status, session])

  const handleSave = async () => {
    if (!session) return
    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        profile: {
          phone: form.phone,
          address_line1: form.address_line1,
          address_line2: form.address_line2,
          city: form.city,
          state: form.state,
          zip_code: form.zip_code,
          notification_preference: form.notification_preference,
          email_court_reminders: form.email_court_reminders,
          email_deadline_alerts: form.email_deadline_alerts,
          email_case_updates: form.email_case_updates,
          sms_court_reminders: form.sms_court_reminders,
          sms_deadline_alerts: form.sms_deadline_alerts,
        },
      }
      const res = await api.patch('auth/profile/', payload, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      setUserData(res.data)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch {
      setSaveError('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!session) return
    setDeleting(true)
    try {
      await api.post('auth/profile/delete/', {}, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      await signOut({ callbackUrl: '/' })
    } catch {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-white">
        <Loader2 className="h-8 w-8 animate-spin text-teal" />
      </div>
    )
  }

  const displayName = form.first_name
    ? `${form.first_name} ${form.last_name}`.trim()
    : userData?.username || 'Your Account'

  return (
    <>
      <Head>
        <title>My Profile — TenantGuard</title>
        <meta name="robots" content="noindex" />
      </Head>
      <Navbar />

      <main className="min-h-screen bg-warm-white pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8"
          >
            <div className="h-16 w-16 rounded-full bg-navy flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden"
              style={{ fontFamily: 'var(--font-heading)' }}>
              {userData?.profile?.avatar_url
                ? <img src={userData.profile.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                : initials(form.first_name, form.last_name, userData?.username || '')}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-navy" style={{ fontFamily: 'var(--font-heading)' }}>
                {displayName}
              </h1>
              <p className="text-sm text-text-secondary">{form.email || userData?.username}</p>
              {userData?.is_staff && (
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-medium bg-navy/10 text-navy border border-navy/20 rounded-sm">
                  <Shield className="h-3 w-3" /> Staff
                </span>
              )}
            </div>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="shrink-0 border-border text-text-secondary hover:text-navy rounded-sm"
            >
              <ChevronRight className="h-4 w-4 mr-1" />
              My Dashboard
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left: Stats + Recent Cases */}
            <div className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <Card className="border-border">
                  <CardContent className="pt-4 pb-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Total Cases', value: summary?.total_cases ?? 0, color: 'text-navy' },
                        { label: 'Open Cases', value: summary?.open_cases ?? 0, color: 'text-amber-warn' },
                        { label: 'Court (30d)', value: summary?.upcoming_court_dates ?? 0, color: 'text-red-urgent' },
                        { label: 'Documents', value: summary?.total_documents ?? 0, color: 'text-teal' },
                      ].map((stat) => (
                        <div key={stat.label} className="text-center p-3 bg-background-secondary rounded-sm">
                          <p className={`text-2xl font-bold ${stat.color}`} style={{ fontFamily: 'var(--font-heading)' }}>
                            {stat.value}
                          </p>
                          <p className="text-xs text-text-secondary mt-0.5">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-teal" />
                      Recent Cases
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {!summary || summary.recent_cases.length === 0 ? (
                      <p className="text-xs text-text-secondary py-2">No cases yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {summary.recent_cases.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => router.push(`/case/${c.id}`)}
                            className="w-full text-left p-2 rounded-sm hover:bg-background-secondary transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium text-text truncate">
                                {ISSUE_LABELS[c.issue_type] || 'Housing Issue'}
                              </span>
                              {statusBadge(c.status)}
                            </div>
                            <p className="text-xs text-text-secondary mt-0.5">
                              {c.county && `${c.county} · `}
                              {new Date(c.created_at).toLocaleDateString()}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-teal hover:text-teal/80 text-xs"
                      onClick={() => router.push('/dashboard')}
                    >
                      View all cases →
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right: Edit Tabs */}
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="border-border">
                {/* Tab bar */}
                <div className="flex border-b border-border">
                  {([
                    { id: 'account', label: 'Account', icon: User },
                    { id: 'notifications', label: 'Notifications', icon: Bell },
                    { id: 'security', label: 'Security', icon: Shield },
                  ] as const).map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === id
                          ? 'border-teal text-teal'
                          : 'border-transparent text-text-secondary hover:text-text'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>

                <CardContent className="pt-6">

                  {/* Account Tab */}
                  {activeTab === 'account' && (
                    <div className="space-y-5">
                      <SectionHeader icon={User} title="Personal Information" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">First Name</label>
                          <input
                            type="text"
                            value={form.first_name}
                            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                            placeholder="First name"
                            className="w-full px-3 py-2 text-sm border border-border rounded-sm bg-background focus:outline-none focus:ring-1 focus:ring-teal"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">Last Name</label>
                          <input
                            type="text"
                            value={form.last_name}
                            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                            placeholder="Last name"
                            className="w-full px-3 py-2 text-sm border border-border rounded-sm bg-background focus:outline-none focus:ring-1 focus:ring-teal"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">Email Address</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
                            <input
                              type="email"
                              value={form.email}
                              onChange={(e) => setForm({ ...form, email: e.target.value })}
                              placeholder="you@example.com"
                              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-sm bg-background focus:outline-none focus:ring-1 focus:ring-teal"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-1">Phone Number</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
                            <input
                              type="tel"
                              value={form.phone}
                              onChange={(e) => setForm({ ...form, phone: e.target.value })}
                              placeholder="(615) 555-0100"
                              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-sm bg-background focus:outline-none focus:ring-1 focus:ring-teal"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <SectionHeader icon={MapPin} title="Address" />
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={form.address_line1}
                            onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                            placeholder="Street address"
                            className="w-full px-3 py-2 text-sm border border-border rounded-sm bg-background focus:outline-none focus:ring-1 focus:ring-teal"
                          />
                          <input
                            type="text"
                            value={form.address_line2}
                            onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
                            placeholder="Apt, unit, suite (optional)"
                            className="w-full px-3 py-2 text-sm border border-border rounded-sm bg-background focus:outline-none focus:ring-1 focus:ring-teal"
                          />
                          <div className="grid grid-cols-3 gap-3">
                            <input
                              type="text"
                              value={form.city}
                              onChange={(e) => setForm({ ...form, city: e.target.value })}
                              placeholder="City"
                              className="w-full px-3 py-2 text-sm border border-border rounded-sm bg-background focus:outline-none focus:ring-1 focus:ring-teal"
                            />
                            <input
                              type="text"
                              value={form.state}
                              onChange={(e) => setForm({ ...form, state: e.target.value })}
                              placeholder="State"
                              className="w-full px-3 py-2 text-sm border border-border rounded-sm bg-background focus:outline-none focus:ring-1 focus:ring-teal"
                            />
                            <input
                              type="text"
                              value={form.zip_code}
                              onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
                              placeholder="ZIP"
                              className="w-full px-3 py-2 text-sm border border-border rounded-sm bg-background focus:outline-none focus:ring-1 focus:ring-teal"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notifications Tab */}
                  {activeTab === 'notifications' && (
                    <div className="space-y-5">
                      <SectionHeader icon={Bell} title="Notification Preferences" />

                      <div>
                        <label className="block text-xs font-medium text-text-secondary mb-2">Preferred Contact Method</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { value: 'email', label: 'Email' },
                            { value: 'sms', label: 'SMS' },
                            { value: 'both', label: 'Both' },
                            { value: 'none', label: 'None' },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setForm({ ...form, notification_preference: opt.value })}
                              className={`py-2 px-3 text-sm font-medium rounded-sm border transition-colors ${
                                form.notification_preference === opt.value
                                  ? 'bg-teal text-white border-teal'
                                  : 'bg-background text-text-secondary border-border hover:border-teal/50'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Email Alerts</p>
                        {[
                          { key: 'email_court_reminders', label: 'Court date reminders', desc: '48h and 24h before your hearing' },
                          { key: 'email_deadline_alerts', label: 'Filing deadline alerts', desc: 'When a response deadline is approaching' },
                          { key: 'email_case_updates', label: 'Case status updates', desc: 'When your case status changes' },
                        ].map(({ key, label, desc }) => (
                          <label key={key} className="flex items-start gap-3 cursor-pointer group">
                            <div
                              onClick={() => setForm({ ...form, [key]: !form[key as keyof typeof form] })}
                              className={`mt-0.5 h-4 w-4 rounded-sm border-2 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                form[key as keyof typeof form]
                                  ? 'bg-teal border-teal'
                                  : 'bg-background border-border group-hover:border-teal/50'
                              }`}
                            >
                              {form[key as keyof typeof form] && (
                                <CheckCircle2 className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text">{label}</p>
                              <p className="text-xs text-text-secondary">{desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">SMS Alerts</p>
                        {[
                          { key: 'sms_court_reminders', label: 'Court date reminders via text', desc: 'Text message 24h before your hearing' },
                          { key: 'sms_deadline_alerts', label: 'Deadline alerts via text', desc: 'Text message for urgent filing deadlines' },
                        ].map(({ key, label, desc }) => (
                          <label key={key} className="flex items-start gap-3 cursor-pointer group">
                            <div
                              onClick={() => setForm({ ...form, [key]: !form[key as keyof typeof form] })}
                              className={`mt-0.5 h-4 w-4 rounded-sm border-2 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                form[key as keyof typeof form]
                                  ? 'bg-teal border-teal'
                                  : 'bg-background border-border group-hover:border-teal/50'
                              }`}
                            >
                              {form[key as keyof typeof form] && (
                                <CheckCircle2 className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-text">{label}</p>
                              <p className="text-xs text-text-secondary">{desc}</p>
                            </div>
                          </label>
                        ))}
                        {!form.phone && (
                          <p className="text-xs text-amber-warn flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Add a phone number in Account to enable SMS alerts.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Security Tab */}
                  {activeTab === 'security' && (
                    <div className="space-y-5">
                      <SectionHeader icon={Shield} title="Account Security" />

                      <div className="p-4 bg-background-secondary rounded-sm border border-border space-y-2">
                        <p className="text-sm font-medium text-text">Login Method</p>
                        <p className="text-sm text-text-secondary">
                          You are signed in as <strong>{userData?.username}</strong>.
                          Password changes are handled through the login page.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 rounded-sm border-border"
                          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                        >
                          <LogOut className="h-3.5 w-3.5 mr-2" />
                          Sign Out
                        </Button>
                      </div>

                      <div className="pt-4 border-t border-border">
                        <p className="text-sm font-semibold text-red-urgent mb-1">Danger Zone</p>
                        <p className="text-xs text-text-secondary mb-3">
                          Deleting your account will deactivate your login and remove access to all your cases.
                          Your case data is retained for 30 days before permanent deletion.
                        </p>
                        {!showDeleteConfirm ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-urgent/30 text-red-urgent hover:bg-red-urgent/5 rounded-sm"
                            onClick={() => setShowDeleteConfirm(true)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete My Account
                          </Button>
                        ) : (
                          <div className="p-4 bg-red-urgent/5 border border-red-urgent/20 rounded-sm space-y-3">
                            <p className="text-sm font-medium text-red-urgent flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              Are you sure? This cannot be undone.
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-red-urgent hover:bg-red-urgent/90 text-white rounded-sm"
                                onClick={handleDelete}
                                disabled={deleting}
                              >
                                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                                Yes, Delete My Account
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-sm"
                                onClick={() => setShowDeleteConfirm(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Save button */}
                  {activeTab !== 'security' && (
                    <div className="mt-6 pt-4 border-t border-border flex items-center gap-3">
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-teal hover:bg-teal/90 text-white rounded-sm"
                      >
                        {saving
                          ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          : <Save className="h-4 w-4 mr-2" />}
                        {saving ? 'Saving…' : 'Save Changes'}
                      </Button>
                      {saveSuccess && (
                        <motion.span
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-sm text-green-safe flex items-center gap-1"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Saved successfully
                        </motion.span>
                      )}
                      {saveError && (
                        <span className="text-sm text-red-urgent flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          {saveError}
                        </span>
                      )}
                    </div>
                  )}

                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </>
  )
}
