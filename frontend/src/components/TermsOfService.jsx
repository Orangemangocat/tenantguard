import logo from '../assets/logo.png'

const TermsOfService = () => {
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
          <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
          <p className="text-sm text-gray-500">Effective Date: [Month Day, Year]</p>
        </div>

        <section className="space-y-3">
          <p>
            These Terms of Service (the "Terms") govern your access to and use of TenantGuard
            websites, applications, and services (collectively, the "Service"). By accessing or
            using the Service, you agree to these Terms. If you do not agree, do not use the
            Service.
          </p>
          <p>
            TenantGuard is not a law firm and does not provide legal advice. The Service provides
            tools and information to help users organize facts and documents. Any content provided
            is for informational purposes only and should not be relied on as legal advice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Eligibility</h2>
          <p>
            You must be at least 18 years old to use the Service. By using the Service, you
            represent that you meet this requirement and have authority to enter into these Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Accounts and Security</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and
            for all activity under your account. Notify us immediately if you suspect unauthorized
            access or use.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Acceptable Use</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Do not misuse the Service or attempt to access it using a method not intended by us.</li>
            <li>Do not submit unlawful, deceptive, or harmful content.</li>
            <li>Do not interfere with the security, availability, or performance of the Service.</li>
            <li>Do not use the Service to provide or seek landlord-side eviction acceleration tactics.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">User Content</h2>
          <p>
            You retain ownership of content you submit to the Service. By submitting content, you
            grant TenantGuard a license to host, store, process, and display that content solely to
            provide and improve the Service. You are responsible for the accuracy and legality of
            any content you provide.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Third-Party Services</h2>
          <p>
            The Service may include links to or integrations with third-party services. We do not
            control those services and are not responsible for their content, policies, or
            practices.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Disclaimers</h2>
          <p>
            The Service is provided on an "as is" and "as available" basis. We disclaim all
            warranties, express or implied, including merchantability, fitness for a particular
            purpose, and non-infringement. We do not guarantee that the Service will be uninterrupted
            or error free.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, TenantGuard and its affiliates will not be
            liable for any indirect, incidental, special, consequential, or punitive damages, or any
            loss of profits or revenues, whether incurred directly or indirectly, or any loss of
            data, use, goodwill, or other intangible losses.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at any time if you violate these
            Terms or if we discontinue the Service. You may stop using the Service at any time.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. If we make material changes, we will update
            the Effective Date and post the revised Terms on this page.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Tennessee, without regard to
            conflict of law rules. Any disputes shall be brought in courts located in Davidson
            County, Tennessee, unless applicable law provides otherwise.
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
          <a href="/privacy" className="text-red-800 hover:underline">
            Privacy Policy
          </a>
        </div>
      </footer>
    </div>
  )
}

export default TermsOfService
