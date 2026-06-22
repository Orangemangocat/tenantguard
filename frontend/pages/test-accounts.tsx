import Head from 'next/head';
import Link from 'next/link';

const accounts = [
  {
    username: 'admin',
    password: 'TGadmin2026!',
    email: 'admin@dev.tenantguard.net',
    role: 'Superuser / Admin',
    roleColor: 'bg-red-100 text-red-800 border border-red-200',
    description: 'Full Django admin access. Can manage all users, blog posts, cases, and site settings.',
    links: [
      { label: 'Django Admin', href: '/admin/' },
      { label: 'Blog AI Generator', href: '/admin/ai-generator/' },
    ],
  },
  {
    username: 'john',
    password: 'JohnTG2026!',
    email: 'j.bransford@gmail.com',
    role: 'Staff / Owner',
    roleColor: 'bg-orange-100 text-orange-800 border border-orange-200',
    description: "John Bransford's personal test account. Staff access. Use this to test the owner experience.",
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Profile', href: '/profile' },
    ],
  },
  {
    username: 'testuser',
    password: 'Tenant2026!',
    email: 'testuser@dev.tenantguard.net',
    role: 'Regular Tenant',
    roleColor: 'bg-blue-100 text-blue-800 border border-blue-200',
    description: 'Standard tenant user. Use this to test the core tenant experience: intake, workspace, profile, analysis.',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Profile', href: '/profile' },
      { label: 'Upload Notice', href: '/' },
    ],
  },
  {
    username: 'demouser',
    password: 'Demo2026!',
    email: 'demo@dev.tenantguard.net',
    role: 'Demo User',
    roleColor: 'bg-green-100 text-green-800 border border-green-200',
    description: 'Second tenant account for multi-user testing, session isolation checks, or demo walkthroughs.',
    links: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Profile', href: '/profile' },
    ],
  },
];

export default function TestAccounts() {
  return (
    <>
      <Head>
        <title>Test Accounts — dev.tenantguard.net</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header banner */}
        <div className="bg-yellow-400 border-b-4 border-yellow-600 px-4 py-3 text-center">
          <p className="text-yellow-900 font-bold text-sm">
            ⚠️ STAGING ENVIRONMENT — dev.tenantguard.net — FOR TESTING ONLY — NOT PRODUCTION DATA
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Accounts</h1>
            <p className="text-gray-600">
              All test credentials for the staging environment. This page is{' '}
              <span className="font-semibold text-red-700">not indexed by search engines</span> and only
              exists on <code className="bg-gray-100 px-1 rounded text-sm">dev.tenantguard.net</code>.
            </p>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-900 transition-colors"
            >
              → Sign In Page
            </Link>
            <Link
              href="/admin/"
              className="inline-flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors"
            >
              → Django Admin
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              → Homepage
            </Link>
            <Link
              href="/features/profile"
              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              → Profile Ad Landing Page
            </Link>
          </div>

          {/* Account cards */}
          <div className="grid gap-5">
            {accounts.map((acct) => (
              <div
                key={acct.username}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Card header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-800 flex items-center justify-center text-white font-bold text-lg">
                      {acct.username[0].toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{acct.username}</h2>
                      <p className="text-sm text-gray-500">{acct.email}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${acct.roleColor}`}>
                    {acct.role}
                  </span>
                </div>

                {/* Card body */}
                <div className="px-6 py-4">
                  <p className="text-sm text-gray-600 mb-4">{acct.description}</p>

                  {/* Credentials */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Username</p>
                      <code className="text-sm font-mono font-bold text-gray-900">{acct.username}</code>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Password</p>
                      <code className="text-sm font-mono font-bold text-gray-900">{acct.password}</code>
                    </div>
                  </div>

                  {/* Quick links */}
                  <div className="flex flex-wrap gap-2">
                    {acct.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="text-xs text-red-700 hover:text-red-900 underline underline-offset-2"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="font-semibold text-blue-900 mb-2">Notes</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>These accounts exist only in the staging database (<code className="bg-blue-100 px-1 rounded">tenantguard_staging</code>). Production is completely separate.</li>
              <li>The <strong>admin</strong> account can access the Django admin panel at <code className="bg-blue-100 px-1 rounded">/admin/</code> and the AI blog generator at <code className="bg-blue-100 px-1 rounded">/admin/ai-generator/</code>.</li>
              <li>To reset passwords or create new test users, ask the agent or use the Django admin panel.</li>
              <li>This page is <code className="bg-blue-100 px-1 rounded">noindex</code> and will never appear in Google.</li>
            </ul>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            dev.tenantguard.net — staging environment — {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </>
  );
}
