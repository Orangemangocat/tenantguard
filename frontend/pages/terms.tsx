import Head from 'next/head'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function TermsOfService() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tenantguard.net'

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Terms of Service - TenantGuard</title>
        <meta name="description" content="TenantGuard's Terms of Service — the rules and agreements governing your use of our platform." />
        <link rel="canonical" href={`${siteUrl}/terms`} />
      </Head>

      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8 md:p-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-10">Effective Date: January 1, 2026 &nbsp;·&nbsp; Last Updated: March 1, 2026</p>

          <div className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700">

            <p>
              Please read these Terms of Service ("Terms") carefully before using the TenantGuard website and
              services operated by TenantGuard, LLC ("TenantGuard," "we," "our," or "us"). By accessing or
              using our Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.
            </p>

            <h2>1. Description of Service</h2>
            <p>
              TenantGuard is a technology platform that facilitates connections between tenants facing eviction
              or landlord-tenant disputes and qualified attorneys in Tennessee. We provide informational resources,
              an intake system, and a legal assistant chat tool. <strong>TenantGuard is not a law firm and does
              not provide legal advice.</strong> Any information provided through the Service is for general
              informational purposes only and does not constitute legal advice or create an attorney-client
              relationship.
            </p>

            <h2>2. Eligibility</h2>
            <p>
              You must be at least 18 years of age to use the Service. By using the Service, you represent and
              warrant that you meet this requirement and have the legal capacity to enter into these Terms.
            </p>

            <h2>3. User Accounts</h2>
            <p>
              To access certain features, you must create an account using Google or GitHub authentication.
              You are responsible for:
            </p>
            <ul>
              <li>Maintaining the confidentiality of your account credentials;</li>
              <li>All activity that occurs under your account;</li>
              <li>Notifying us immediately at <a href="mailto:support@tenantguard.net">support@tenantguard.net</a> of any unauthorized use.</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms or are involved
              in fraudulent or abusive activity.
            </p>

            <h2>4. No Attorney-Client Relationship</h2>
            <p>
              Use of the Service does not create an attorney-client relationship between you and TenantGuard
              or any attorney on our platform. An attorney-client relationship is only established when you
              and an attorney have explicitly agreed to representation in writing. Information you share through
              intake forms or the chat tool prior to establishing such a relationship may not be protected by
              attorney-client privilege.
            </p>

            <h2>5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws;</li>
              <li>Submit false, misleading, or fraudulent information in intake forms or communications;</li>
              <li>Impersonate any person or entity, including attorneys or TenantGuard staff;</li>
              <li>Attempt to gain unauthorized access to any part of the Service or its systems;</li>
              <li>Scrape, crawl, or systematically extract data from the Service;</li>
              <li>Upload malicious code, viruses, or any content intended to harm the Service or other users;</li>
              <li>Harass, threaten, or harm other users or attorneys on the platform.</li>
            </ul>

            <h2>6. Intellectual Property</h2>
            <p>
              All content on the Service, including text, graphics, logos, software, and AI-generated blog
              articles, is the property of TenantGuard or its licensors and is protected by applicable
              intellectual property laws. You may not reproduce, distribute, or create derivative works without
              our prior written consent.
            </p>
            <p>
              By submitting content (such as comments on blog posts), you grant TenantGuard a non-exclusive,
              royalty-free, worldwide license to display and distribute that content in connection with the Service.
            </p>

            <h2>7. Third-Party Services</h2>
            <p>
              The Service integrates with third-party providers including Google, GitHub (for authentication)
              and OpenAI (for AI-powered features). These services are governed by their own terms and privacy
              policies. TenantGuard is not responsible for the practices or content of third-party services.
            </p>

            <h2>8. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND,
              EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
              PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
              UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
            </p>
            <p>
              TENANTGUARD DOES NOT WARRANT THE ACCURACY, COMPLETENESS, OR USEFULNESS OF ANY INFORMATION ON
              THE SERVICE. RELIANCE ON SUCH INFORMATION IS SOLELY AT YOUR OWN RISK.
            </p>

            <h2>9. Limitation of Liability</h2>
            <p>
              TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, TENANTGUARD AND ITS OFFICERS, DIRECTORS,
              EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
              OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF WE HAVE BEEN
              ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p>
              OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED
              THE GREATER OF (A) THE AMOUNT YOU PAID TO TENANTGUARD IN THE TWELVE MONTHS PRECEDING THE CLAIM
              OR (B) ONE HUNDRED DOLLARS ($100).
            </p>

            <h2>10. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless TenantGuard and its affiliates, officers,
              directors, employees, and agents from any claims, liabilities, damages, losses, and expenses
              (including reasonable attorneys' fees) arising from your use of the Service, your violation of
              these Terms, or your violation of any rights of a third party.
            </p>

            <h2>11. Governing Law &amp; Dispute Resolution</h2>
            <p>
              These Terms are governed by the laws of the State of Tennessee, without regard to its conflict
              of law provisions. Any disputes arising under these Terms shall be resolved exclusively in the
              state or federal courts located in Tennessee. You consent to personal jurisdiction in such courts.
            </p>

            <h2>12. Changes to These Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. When we do, we will update the "Last
              Updated" date above. If changes are material, we will provide notice via email or a prominent
              notice on the Service. Continued use of the Service after changes take effect constitutes your
              acceptance of the revised Terms.
            </p>

            <h2>13. Termination</h2>
            <p>
              We may suspend or terminate your access to the Service at our sole discretion, without notice,
              for conduct that we believe violates these Terms or is harmful to other users, third parties,
              or TenantGuard. Upon termination, your right to use the Service ceases immediately.
            </p>

            <h2>14. Contact Us</h2>
            <p>If you have questions about these Terms, please contact us:</p>
            <ul>
              <li>Email: <a href="mailto:support@tenantguard.net">support@tenantguard.net</a></li>
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
