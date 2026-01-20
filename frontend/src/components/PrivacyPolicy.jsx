import logo from '../assets/logo.png'

const PrivacyPolicy = () => {
  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-700"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      <header
        className="border-b bg-white"
        style={{ borderColor: 'var(--color-navBorder)', backgroundColor: 'var(--color-navBg)' }}
      >
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <a href="/" className="flex items-center space-x-3">
            <img src={logo} alt="TenantGuard" className="h-8 w-8" />
            <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
              TenantGuard
            </span>
          </a>
          <a href="/" className="text-sm text-red-800 hover:underline">
            Back to Home
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-sm text-gray-500">Effective Date: [Month Day, Year]</p>
        </div>

        <section className="space-y-3">
          <p>
            This Privacy Policy explains how TenantGuard collects, uses, and shares information
            about you when you use our websites, applications, and services (collectively, the
            "Service").
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Information We Collect</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Contact information, such as name, email, phone number, and mailing address.</li>
            <li>Account and intake information you provide about your situation.</li>
            <li>Documents, photos, and other files you upload to the Service.</li>
            <li>Communications with us, including support requests and feedback.</li>
            <li>Usage information, such as pages viewed and actions taken.</li>
            <li>Device and log information, such as IP address, browser type, and timestamps.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">How We Use Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide, maintain, and improve the Service.</li>
            <li>Process intake information and organize case materials.</li>
            <li>Communicate with you about your account or support requests.</li>
            <li>Monitor and protect the security and integrity of the Service.</li>
            <li>Comply with legal obligations and enforce our terms.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">How We Share Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>With service providers who process information on our behalf.</li>
            <li>With attorneys or legal partners when you request or authorize a connection.</li>
            <li>With authorities if required to comply with law or protect rights and safety.</li>
            <li>In connection with a merger, acquisition, or sale of assets.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Cookies and Similar Technologies</h2>
          <p>
            We use cookies and similar technologies to operate the Service and understand usage
            patterns. You can manage cookies through your browser settings.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Data Retention</h2>
          <p>
            We retain information for as long as needed to provide the Service, comply with legal
            obligations, resolve disputes, and enforce agreements. You may request deletion of your
            account and associated data, subject to legal requirements.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Security</h2>
          <p>
            We use reasonable safeguards to protect information. No method of transmission or
            storage is completely secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Children</h2>
          <p>
            The Service is not intended for children under 13, and we do not knowingly collect
            personal information from children.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Your Choices</h2>
          <p>
            You may request access to, correction of, or deletion of your personal information by
            contacting us at the email below. We will respond in accordance with applicable law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will update the Effective Date
            and post the revised policy on this page.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Contact Us</h2>
          <p>
            TenantGuard<br />
            [Mailing Address]<br />
            <a href="mailto:john@tenantguard.net" className="text-red-800 hover:underline">
              john@tenantguard.net
            </a>
          </p>
        </section>
      </main>

      <footer className="border-t bg-white" style={{ borderColor: 'var(--color-navBorder)' }}>
        <div className="max-w-5xl mx-auto px-4 py-6 text-sm text-gray-500 flex flex-wrap gap-4">
          <span>© 2025 TenantGuard. All rights reserved.</span>
          <a href="/terms" className="text-red-800 hover:underline">
            Terms of Service
          </a>
        </div>
      </footer>
    </div>
  )
}

export default PrivacyPolicy
