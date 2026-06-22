import { useSession, signIn } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';

// ─── data ────────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    title: '🎯 Presentations & Demo Pages',
    color: 'border-red-800',
    headerBg: 'bg-red-800',
    items: [
      {
        label: 'Full Case Dashboard — Live Demo',
        url: '/workspace-demo',
        badge: 'DEMO',
        badgeColor: 'bg-red-100 text-red-800',
        desc: 'The nearly-perfect 7-tab case workspace demo. Shows the full tenant experience: court records, evidence locker, diary, comms, action plan, timeline.',
        password: null,
      },
      {
        label: 'Profile Feature — Ad Landing Page',
        url: '/features/profile',
        badge: 'AD LANDING',
        badgeColor: 'bg-orange-100 text-orange-800',
        desc: 'Conversion-optimized page for click-through ads. Interactive 3-tab profile UI mock, feature highlights, testimonials, dual CTAs. Use this URL in ad campaigns.',
        password: null,
      },
    ],
  },
  {
    title: '🔧 Admin & Staff Panels',
    color: 'border-gray-700',
    headerBg: 'bg-gray-800',
    items: [
      {
        label: 'Django Admin Panel',
        url: '/admin/',
        badge: 'ADMIN',
        badgeColor: 'bg-gray-100 text-gray-800',
        desc: 'Full Django admin: manage users, blog posts, intake submissions, UserProfiles, and all site data.',
        password: 'superadmin / SuperAdmin123!',
      },
      {
        label: 'AI Blog Generator',
        url: '/admin/ai-generator/',
        badge: 'AI TOOL',
        badgeColor: 'bg-purple-100 text-purple-800',
        desc: 'One-click AI blog post generation. Pick a topic, theme, and author — GPT-4o writes, SEO-optimizes, and generates a featured image automatically.',
        password: 'superadmin / SuperAdmin123!',
      },
    ],
  },
  {
    title: '👤 Test Accounts & Credentials',
    color: 'border-yellow-600',
    headerBg: 'bg-yellow-600',
    items: [
      {
        label: 'Test Accounts Page (staging only)',
        url: '/test-accounts',
        badge: 'STAGING',
        badgeColor: 'bg-yellow-100 text-yellow-800',
        desc: 'All test credentials listed with one-click links. Only on dev.tenantguard.net — noindex.',
        password: null,
      },
      {
        label: 'Super Admin Login',
        url: '/auth/signin',
        badge: 'CREDENTIAL',
        badgeColor: 'bg-red-100 text-red-800',
        desc: 'Full site control. Access Django admin, AI blog generator, all staff tools.',
        password: 'superadmin / SuperAdmin123!',
      },
      {
        label: 'Test Attorney Login',
        url: '/auth/signin',
        badge: 'CREDENTIAL',
        badgeColor: 'bg-blue-100 text-blue-800',
        desc: 'Staff-level access. Attorney portal experience.',
        password: 'testattorney / TestAttorney123!',
      },
      {
        label: 'Test Tenant Login',
        url: '/auth/signin',
        badge: 'CREDENTIAL',
        badgeColor: 'bg-green-100 text-green-800',
        desc: 'Regular user. Full tenant experience: intake, workspace, profile, document analysis. Will be loaded with CaseLink demo data.',
        password: 'testtenant / TestTenant123!',
      },
      {
        label: 'John — Personal Account',
        url: '/auth/signin',
        badge: 'OWNER',
        badgeColor: 'bg-indigo-100 text-indigo-800',
        desc: 'john@tenantguard.net — superuser on production. j.bransford@gmail.com — staff on staging.',
        password: '(use your own password)',
      },
    ],
  },
  {
    title: '🌐 Live Site Pages',
    color: 'border-blue-600',
    headerBg: 'bg-blue-700',
    items: [
      { label: 'Homepage', url: '/', badge: 'LIVE', badgeColor: 'bg-blue-100 text-blue-800', desc: 'Main landing page. Document upload hero, features section, demo button, how-it-works, blog strip, CTA.', password: null },
      { label: 'Blog', url: '/blog', badge: 'LIVE', badgeColor: 'bg-blue-100 text-blue-800', desc: '14 published AI-generated posts on production. Staging DB is empty (by design).', password: null },
      { label: 'Get Help', url: '/get-help', badge: 'LIVE', badgeColor: 'bg-blue-100 text-blue-800', desc: 'AI-assisted intake onboarding page.', password: null },
      { label: 'Dashboard', url: '/dashboard', badge: 'AUTH', badgeColor: 'bg-gray-100 text-gray-700', desc: 'Authenticated user dashboard. Shows all cases, deadlines, quick actions.', password: 'Login required' },
      { label: 'User Profile', url: '/profile', badge: 'AUTH', badgeColor: 'bg-gray-100 text-gray-700', desc: 'Account settings, notification preferences, case summary sidebar, security/sign-out.', password: 'Login required' },
      { label: 'Workspace (real data)', url: '/workspace/1', badge: 'AUTH', badgeColor: 'bg-gray-100 text-gray-700', desc: 'Live authenticated workspace for case ID 1. Replace "1" with any case ID.', password: 'Login required' },
      { label: 'Tenant Intake', url: '/tenant-intake', badge: 'LIVE', badgeColor: 'bg-blue-100 text-blue-800', desc: 'Tenant case intake form.', password: null },
      { label: 'Attorney Intake', url: '/attorney-intake', badge: 'LIVE', badgeColor: 'bg-blue-100 text-blue-800', desc: 'Attorney onboarding intake form.', password: null },
    ],
  },
  {
    title: '🔌 API Endpoints',
    color: 'border-green-600',
    headerBg: 'bg-green-700',
    items: [
      { label: 'Blog Posts API', url: '/api/blog/posts/', badge: 'PUBLIC', badgeColor: 'bg-green-100 text-green-800', desc: 'Returns all published blog posts as JSON.', password: null },
      { label: 'Analyze Notice (Next.js)', url: '/api/analyze-notice', badge: 'POST', badgeColor: 'bg-yellow-100 text-yellow-800', desc: 'Upload a PDF/image notice for instant GPT-4o analysis. Returns documentType, urgencyLevel, deadline, rights, recommendedActions.', password: null },
      { label: 'User Profile API', url: '/api/auth/profile/', badge: 'AUTH', badgeColor: 'bg-gray-100 text-gray-700', desc: 'GET or PATCH the authenticated user\'s profile + nested UserProfile fields.', password: 'JWT token required' },
      { label: 'Profile Summary API', url: '/api/auth/profile/summary/', badge: 'AUTH', badgeColor: 'bg-gray-100 text-gray-700', desc: 'Returns case stats (total, open, court dates, docs) + last 5 cases.', password: 'JWT token required' },
      { label: 'Seed Test Users', url: '/api/seed-test-users/', badge: 'UTIL', badgeColor: 'bg-purple-100 text-purple-800', desc: 'GET this URL to create/reset all test accounts (superadmin, testattorney, testtenant) to known passwords. Safe to hit repeatedly.', password: null },
      { label: 'NextAuth Session', url: '/api/auth/session', badge: 'PUBLIC', badgeColor: 'bg-green-100 text-green-800', desc: 'Returns current session JSON (null if not logged in).', password: null },
    ],
  },
  {
    title: '🏗️ Infrastructure',
    color: 'border-gray-500',
    headerBg: 'bg-gray-600',
    items: [
      { label: 'Production VM', url: 'https://console.cloud.google.com/compute/instances?project=tenantguard-480405', badge: 'GCP', badgeColor: 'bg-gray-100 text-gray-700', desc: 'web-production @ 34.75.162.207 — runs tenantguard.net', password: 'GCP console login' },
      { label: 'Staging VM', url: 'https://console.cloud.google.com/compute/instances?project=tenantguard-480405', badge: 'GCP', badgeColor: 'bg-gray-100 text-gray-700', desc: 'web-staging @ 34.23.105.126 — runs dev.tenantguard.net', password: 'GCP console login' },
      { label: 'Artifact Registry', url: 'https://console.cloud.google.com/artifacts?project=tenantguard-480405', badge: 'GCP', badgeColor: 'bg-gray-100 text-gray-700', desc: 'Docker images: tenantguard-frontend:production/staging, tenantguard-backend:production/staging', password: 'GCP console login' },
      { label: 'GitHub — Main Repo', url: 'https://github.com/Orangemangocat/tenantguard', badge: 'GITHUB', badgeColor: 'bg-gray-100 text-gray-700', desc: 'All app code. Branch: main.', password: 'GitHub login (Orangemangocat)' },
      { label: 'GitHub — Knowledge Repo', url: 'https://github.com/Orangemangocat/tenantguard-manus-retained', badge: 'GITHUB', badgeColor: 'bg-gray-100 text-gray-700', desc: 'STATE.md, CREDENTIALS.md, ACCESS.md, STANDING_ORDERS.md — agent memory.', password: 'GitHub login (Orangemangocat)' },
    ],
  },
];

// ─── component ───────────────────────────────────────────────────────────────

export default function AdminHub() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      signIn();
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">Loading…</div>
      </div>
    );
  }

  if (!session) return null;

  const isStaff = (session.user as any)?.is_staff || (session.user as any)?.is_superuser;

  return (
    <>
      <Head>
        <title>Admin Hub — TenantGuard</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Top bar */}
        <div className="bg-red-800 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">TenantGuard Admin Hub</h1>
            <p className="text-red-200 text-sm mt-0.5">
              Every URL, credential, and demo link in one place
            </p>
          </div>
          <div className="text-right text-sm text-red-200">
            <p className="font-medium text-white">{(session.user as any)?.username || session.user?.email}</p>
            <p>{session.user?.email}</p>
            {isStaff && (
              <span className="inline-block mt-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded">
                STAFF
              </span>
            )}
          </div>
        </div>

        {/* Quick-jump bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap gap-3 text-sm">
          {SECTIONS.map((s) => (
            <a
              key={s.title}
              href={`#${s.title}`}
              className="text-red-800 hover:underline font-medium"
            >
              {s.title}
            </a>
          ))}
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
          {SECTIONS.map((section) => (
            <div key={section.title} id={section.title} className={`rounded-xl border-2 ${section.color} overflow-hidden shadow-sm`}>
              {/* Section header */}
              <div className={`${section.headerBg} text-white px-6 py-3`}>
                <h2 className="text-base font-bold">{section.title}</h2>
              </div>

              {/* Items */}
              <div className="divide-y divide-gray-100 bg-white">
                {section.items.map((item) => (
                  <div key={item.label} className="px-6 py-4 flex flex-col sm:flex-row sm:items-start gap-3">
                    {/* Left: label + URL */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                        <span className="font-semibold text-gray-900">{item.label}</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{item.desc}</p>
                      {item.password && (
                        <div className="inline-flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 text-xs font-mono text-yellow-900">
                          🔑 {item.password}
                        </div>
                      )}
                    </div>

                    {/* Right: link button */}
                    <div className="shrink-0">
                      {item.url.startsWith('http') ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-gray-800 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap"
                        >
                          Open ↗
                        </a>
                      ) : (
                        <Link
                          href={item.url}
                          className="inline-flex items-center gap-1.5 bg-red-800 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-red-900 transition-colors whitespace-nowrap"
                        >
                          Open →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <p className="text-center text-xs text-gray-400 pb-6">
            TenantGuard Admin Hub — noindex — {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </>
  );
}
