import Head from 'next/head'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function PrivacyPolicy() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tenantguard.net'

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Privacy Policy - TenantGuard</title>
        <meta name="description" content="TenantGuard's Privacy Policy — how we collect, use, and protect your personal information." />
        <link rel="canonical" href={`${siteUrl}/privacy`} />
      </Head>

      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8 md:p-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-10">Effective Date: January 1, 2026 &nbsp;·&nbsp; Last Updated: March 1, 2026</p>

          <div className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700">

            <p>
              TenantGuard, LLC ("TenantGuard," "we," "our," or "us") is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
              you visit our website at <strong>tenantguard.net</strong> and use our services (collectively, the "Service").
              Please read this policy carefully. If you disagree with its terms, please discontinue use of the Service.
            </p>

            <h2>1. Information We Collect</h2>

            <h3>Information You Provide Directly</h3>
            <ul>
              <li><strong>Account Information:</strong> When you register, we collect your name, email address, and authentication credentials (via Google or GitHub OAuth).</li>
              <li><strong>Intake Forms:</strong> If you submit a tenant or attorney intake form, we collect information about your legal situation, contact details, and any documents you upload.</li>
              <li><strong>Communications:</strong> Messages you send through our legal assistant chat, comments on blog posts, and any correspondence with us.</li>
            </ul>

            <h3>Information Collected Automatically</h3>
            <ul>
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the Service, and referring URLs.</li>
              <li><strong>Device Information:</strong> Browser type, operating system, IP address, and device identifiers.</li>
              <li><strong>Cookies &amp; Similar Technologies:</strong> Session cookies required for authentication and preference cookies to improve your experience. We do not use third-party advertising cookies.</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, operate, and maintain the Service;</li>
              <li>Match tenants with qualified attorneys based on intake information;</li>
              <li>Process and respond to your inquiries and legal assistance requests;</li>
              <li>Send transactional communications (e.g., confirmation emails, account notices);</li>
              <li>Improve, personalize, and expand our Service;</li>
              <li>Monitor and analyze usage patterns and trends;</li>
              <li>Comply with legal obligations and enforce our Terms of Service.</li>
            </ul>
            <p>
              We do <strong>not</strong> sell your personal information to third parties. We do not use your
              information for automated individual decision-making with legal or significant effects without
              human review.
            </p>

            <h2>3. Disclosure of Your Information</h2>
            <p>We may share your information in the following circumstances:</p>
            <ul>
              <li><strong>With Attorneys:</strong> Intake information you submit may be shared with attorneys on our platform for the purpose of legal representation.</li>
              <li><strong>Service Providers:</strong> We engage trusted third-party vendors (e.g., cloud hosting, database providers) who process data on our behalf under confidentiality agreements.</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law, subpoena, or other legal process, or to protect the rights, property, or safety of TenantGuard, our users, or the public.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
            </ul>

            <h2>4. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide
              the Service. You may request deletion of your account and associated data at any time by contacting
              us at <a href="mailto:privacy@tenantguard.net">privacy@tenantguard.net</a>. We may retain certain
              information as required by law or for legitimate business purposes (e.g., resolving disputes,
              preventing fraud).
            </p>

            <h2>5. Security</h2>
            <p>
              We implement industry-standard security measures including encryption in transit (TLS), hashed
              password storage, and access controls. However, no method of transmission over the internet or
              electronic storage is 100% secure. We cannot guarantee absolute security of your information.
            </p>

            <h2>6. Third-Party Authentication</h2>
            <p>
              We use Google and GitHub OAuth for account creation and login. When you authenticate through these
              providers, you are subject to their respective privacy policies. We only receive the profile
              information necessary to create your TenantGuard account (name, email address).
            </p>

            <h2>7. Children's Privacy</h2>
            <p>
              The Service is not directed to individuals under the age of 18. We do not knowingly collect
              personal information from children. If you believe we have inadvertently collected such information,
              please contact us and we will promptly delete it.
            </p>

            <h2>8. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul>
              <li>Access the personal information we hold about you;</li>
              <li>Correct inaccurate or incomplete information;</li>
              <li>Request deletion of your personal information;</li>
              <li>Object to or restrict certain processing of your data;</li>
              <li>Withdraw consent at any time where processing is based on consent.</li>
            </ul>
            <p>To exercise these rights, contact us at <a href="mailto:privacy@tenantguard.net">privacy@tenantguard.net</a>.</p>

            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will revise the "Last Updated"
              date at the top of this page and, where appropriate, notify you by email or prominent notice on the
              Service. Continued use of the Service after changes become effective constitutes your acceptance of
              the revised policy.
            </p>

            <h2>10. Contact Us</h2>
            <p>If you have questions or concerns about this Privacy Policy, please contact us:</p>
            <ul>
              <li>Email: <a href="mailto:privacy@tenantguard.net">privacy@tenantguard.net</a></li>
              <li>Mailing Address: TenantGuard, LLC, Tennessee, United States</li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-3">© 2026 TenantGuard. All rights reserved.</p>
          <div className="flex justify-center gap-6 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
