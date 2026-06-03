import React, { useState } from 'react'
import Head from 'next/head'
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, FileText, Gavel, Shield, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import { getPosts, fixMediaUrl } from '@/lib/api'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as any, delay: i * 0.08 },
  }),
}
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}
const cardHover = {
  rest: { y: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  hover: { y: -6, boxShadow: '0 16px 48px rgba(0,0,0,0.13)', transition: { type: 'spring', stiffness: 340, damping: 22 } },
}

export default function Home({ recentPosts }: { recentPosts: any[] }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'tenant' | 'attorney'>('tenant')

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleStartIntake = (role: 'tenant' | 'attorney') => {
    if (!session) {
      signIn()
      return
    }
    router.push('/intake')
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tenantguard.net'
  const ogImage = `${siteUrl}/assets/logo.png`

  const orgJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TenantGuard",
    "url": siteUrl,
    "logo": ogImage,
    "description": "Technology-enabled self-service platform connecting tenants with qualified attorneys for streamlined landlord-tenant dispute resolution.",
    "areaServed": { "@type": "State", "name": "Tennessee" }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Head>
        <title>TenantGuard - Transforming Tenant Legal Representation</title>
        <meta name="description" content="Technology-enabled self-service platform connecting tenants with qualified attorneys for streamlined landlord-tenant dispute resolution." />
        <link rel="canonical" href={siteUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="TenantGuard" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:title" content="TenantGuard - Transforming Tenant Legal Representation" />
        <meta property="og:description" content="Technology-enabled self-service platform connecting tenants with qualified attorneys for streamlined landlord-tenant dispute resolution." />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="TenantGuard - Transforming Tenant Legal Representation" />
        <meta name="twitter:description" content="Technology-enabled self-service platform connecting tenants with qualified attorneys for streamlined landlord-tenant dispute resolution." />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: orgJsonLd }} />
      </Head>

      <Navbar 
        onNavigate={(sectionId) => {
          if (sectionId === 'home') window.scrollTo({ top: 0, behavior: 'smooth' })
          else scrollToSection(sectionId)
        }}
      />

      <main>
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <motion.div
            className="max-w-7xl mx-auto text-center"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp} custom={0}>
              <Badge variant="outline" className="mb-6 border-red-800 text-red-800">Tenant-first</Badge>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-3xl sm:text-5xl md:text-6xl font-bold mb-6 text-gray-900">
              Transforming Tenant
              <span className="block text-red-800">Legal Representation</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-xl mb-8 max-w-3xl mx-auto text-gray-600">
              Technology-enabled self-service platform connecting tenants with qualified attorneys
              for streamlined landlord-tenant dispute resolution.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" className="bg-red-800 text-white hover:opacity-90 w-full sm:w-auto" onClick={() => handleStartIntake('tenant')}>
                  Start Your Case <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" variant="outline" className="border-red-800 text-red-800 hover:bg-red-50 w-full sm:w-auto" onClick={() => handleStartIntake('attorney')}>
                  Attorney Portal
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* ── The Challenge ─────────────────────────────────────────────────── */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">The Challenge</h2>
              <p className="text-lg text-gray-600">Tennessee's eviction process creates significant barriers for tenant self-representation</p>
            </motion.div>
            <motion.div className="grid md:grid-cols-3 gap-8" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}>
              {[
                { stat: '85%', label: 'Tenants lack legal representation' },
                { stat: '14 Days', label: 'Notice period before eviction filing' },
                { stat: '3–5 Hours', label: 'Attorney case setup time' },
              ].map(({ stat, label }, i) => (
                <motion.div key={stat} variants={fadeUp} custom={i} whileHover="hover" animate="rest" initial="rest">
                  <motion.div variants={cardHover}>
                    <Card className="text-center border-none shadow-sm">
                      <CardHeader>
                        <div className="text-4xl font-bold text-red-800 mb-2">{stat}</div>
                        <CardTitle className="text-lg">{label}</CardTitle>
                      </CardHeader>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Platform Features ─────────────────────────────────────────────── */}
        <section id="features" className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Platform Features</h2>
              <p className="text-lg text-gray-600">Comprehensive tools for both tenants and attorneys</p>
            </motion.div>

            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 p-1 rounded-lg">
                <Button variant={activeTab === 'tenant' ? 'default' : 'ghost'} onClick={() => setActiveTab('tenant')} className={`transition-all duration-200 ${activeTab === 'tenant' ? 'bg-red-800 text-white shadow-sm' : ''}`}>
                  For Tenants
                </Button>
                <Button variant={activeTab === 'attorney' ? 'default' : 'ghost'} onClick={() => setActiveTab('attorney')} className={`transition-all duration-200 ${activeTab === 'attorney' ? 'bg-red-800 text-white shadow-sm' : ''}`}>
                  For Attorneys
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.28, ease: 'easeInOut' }}>
                  {activeTab === 'tenant' ? (
                    <div className="space-y-6">
                      {([
                        [FileText, 'Guided Case Intake', 'Step-by-step dispute categorization and document collection'],
                        [Gavel, 'Tennessee Legal Templates', 'State-specific forms and legal document generation'],
                        [Shield, 'Mobile-Responsive Dashboard', 'Access your case anywhere with deadline tracking'],
                      ] as const).map(([Icon, title, desc], i) => (
                        <motion.div key={title} className="flex items-start space-x-4" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1, duration: 0.35 }}>
                          <Icon className="h-6 w-6 text-red-800 mt-1 shrink-0" />
                          <div><h3 className="text-xl font-semibold mb-2">{title}</h3><p className="text-gray-600">{desc}</p></div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {([
                        [CheckCircle, 'Pre-Qualified Cases', 'Browse organized cases with complete documentation'],
                        [Clock, 'Streamlined Intake', '70% reduction in case setup time'],
                        [TrendingUp, 'Integrated Workflow', 'Seamless case handoff and billing integration'],
                      ] as const).map(([Icon, title, desc], i) => (
                        <motion.div key={title} className="flex items-start space-x-4" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1, duration: 0.35 }}>
                          <Icon className="h-6 w-6 text-red-800 mt-1 shrink-0" />
                          <div><h3 className="text-xl font-semibold mb-2">{title}</h3><p className="text-gray-600">{desc}</p></div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.div key={activeTab + '-img'} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.3 }}>
                  <motion.img
                    src={activeTab === 'tenant' ? '/assets/tenant_signup_onboarding.png' : '/assets/attorney_dashboard.png'}
                    alt={activeTab === 'tenant' ? 'Tenant Signup Interface' : 'Attorney Dashboard'}
                    className="rounded-lg shadow-lg w-full"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.4 }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* ── How It Works ──────────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
              <p className="text-lg text-gray-600">Simple, efficient process connecting tenants and attorneys</p>
            </motion.div>
            <motion.div className="mb-12" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
              <img src="/assets/workflow_diagram.png" alt="TenantGuard Workflow" className="rounded-lg shadow-lg w-full max-w-4xl mx-auto" />
            </motion.div>
            <motion.div className="grid md:grid-cols-2 gap-12" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}>
              {[
                { title: 'Tenant Journey', steps: ['Signup with guided situation assessment', 'Case intake with dispute categorization', 'Document upload and organization', 'Legal guidance and document generation'] },
                { title: 'Attorney Journey', steps: ['Browse pre-qualified cases with filters', 'Evaluate complete case documentation', 'Streamlined client handoff process', 'Integrated case and billing management'] },
              ].map(({ title, steps }) => (
                <motion.div key={title} variants={fadeUp} whileHover="hover" animate="rest" initial="rest">
                  <motion.div variants={cardHover}>
                    <Card>
                      <CardHeader><CardTitle className="text-xl text-red-800">{title}</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        {steps.map((step, i) => (
                          <motion.div key={i} className="flex items-center space-x-3" initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.35 }}>
                            <div className="bg-red-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shrink-0">{i + 1}</div>
                            <span>{step}</span>
                          </motion.div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Platform Benefits ─────────────────────────────────────────────── */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Platform Benefits</h2>
              <p className="text-lg text-gray-600">Delivering value for both tenants and attorneys</p>
            </motion.div>
            <motion.div className="grid md:grid-cols-3 gap-8" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}>
              {[
                { stat: '60%', label: 'Cost Reduction', desc: 'Average tenant legal costs reduced from $2,500 to $1,000' },
                { stat: '70%', label: 'Time Savings', desc: 'Attorney case intake setup reduced from 4.5 hours to under 1 hour' },
                { stat: '90%', label: 'Completeness', desc: 'Document organization and case preparation accuracy' },
              ].map(({ stat, label, desc }, i) => (
                <motion.div key={stat} variants={fadeUp} custom={i} whileHover="hover" animate="rest" initial="rest">
                  <motion.div variants={cardHover}>
                    <Card className="text-center border-none shadow-sm">
                      <CardHeader>
                        <div className="text-4xl font-bold text-red-800 mb-2">{stat}</div>
                        <CardTitle className="text-lg">{label}</CardTitle>
                        <CardDescription>{desc}</CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Recent Blog Posts Strip ───────────────────────────────────────── */}
        {recentPosts.length > 0 && (
          <section className="py-10 bg-white border-y border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div className="flex items-center justify-between mb-6" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Latest from the Blog</h2>
                <Link href="/blog" className="text-sm text-red-800 hover:underline flex items-center gap-1 group">
                  View all
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
              <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}>
                {recentPosts.slice(0, 5).map((post, i) => (
                  <motion.div key={post.id} variants={fadeUp} custom={i}>
                    <Link href={`/blog/${post.slug}`} className="group block h-full">
                      <motion.div className="bg-white rounded-xl overflow-hidden border border-gray-100 h-full" variants={cardHover} initial="rest" whileHover="hover" animate="rest">
                        <div className="aspect-video overflow-hidden bg-gray-50">
                          {post.featured_image ? (
                            <motion.img src={fixMediaUrl(post.featured_image) ?? undefined} alt={post.title} className="w-full h-full object-cover" whileHover={{ scale: 1.07 }} transition={{ duration: 0.5 }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><FileText className="h-8 w-8 text-gray-200" /></div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors duration-200 leading-snug mb-1.5">{post.title}</h3>
                          {post.excerpt && <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{post.excerpt.slice(0, 120)}</p>}
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>
        )}

        {/* ── Modern Technology Stack ───────────────────────────────────────── */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Modern Technology Stack</h2>
              <p className="text-lg text-gray-600">Built for scalability and security</p>
            </motion.div>
            <motion.div className="grid md:grid-cols-3 gap-8" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }}>
              {[
                { title: 'Frontend', items: [['Next.js','16.1.6'],['React','18.2.0'],['TypeScript','5.9.3'],['Tailwind CSS','4.2.1'],['NextAuth.js','4.22.1']] },
                { title: 'Backend', items: [['Django','5.0.3'],['Django REST Framework','3.15.1'],['SimpleJWT','5.3.1'],['django-allauth','0.61.1'],['OpenAI SDK','2.28.0']] },
                { title: 'AI & Data', items: [['GPT-4 Turbo','Preview'],['DALL-E','3'],['pypdf','4.3.1'],['PostgreSQL','18.2'],['Multi-agent pipeline','Custom']] },
              ].map(({ title, items }, i) => (
                <motion.div key={title} variants={fadeUp} custom={i} whileHover="hover" animate="rest" initial="rest">
                  <motion.div variants={cardHover}>
                    <Card>
                      <CardHeader><CardTitle className="text-lg text-red-800">{title}</CardTitle></CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {items.map(([name, version]) => (
                          <div key={name} className="flex justify-between">
                            <span className="text-gray-700">{name}</span>
                            <span className="text-gray-400 font-mono">{version}</span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────────── */}
        <motion.section className="py-20 bg-red-800 text-white" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <motion.h2 className="text-2xl sm:text-4xl font-bold mb-6" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
              Ready to Transform Tenant Legal Representation?
            </motion.h2>
            <motion.p className="text-xl mb-8 opacity-90" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
              Join the platform that's revolutionizing landlord-tenant dispute resolution in Tennessee.
            </motion.p>
            <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }}>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" className="bg-white text-red-800 hover:bg-gray-100" onClick={() => handleStartIntake('tenant')}>
                  Get Started as Tenant
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button size="lg" variant="outline" className="text-white border-white bg-transparent hover:bg-red-700" onClick={() => handleStartIntake('attorney')}>
                  Join as Attorney
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
      </main>

      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src="/assets/logo.png" alt="TenantGuard" className="h-6 w-6" />
                <span className="text-lg font-semibold">TenantGuard</span>
              </div>
              <p className="text-gray-400 text-sm">
                Transforming tenant legal representation in Tennessee.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white">Home</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white">Features</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white">How It Works</button></li>
                <li><a href="/blog" className="hover:text-white">Blog</a></li>
                <li><a href="/contact" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Users</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => handleStartIntake('tenant')} className="hover:text-white">Tenant Portal</button></li>
                <li><button onClick={() => handleStartIntake('attorney')} className="hover:text-white">Attorney Portal</button></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>Tennessee</li>
                <li><a href="mailto:john@tenantguard.net" className="hover:text-white">john@tenantguard.net</a></li>
                <li><a href="mailto:karl@tenantguard.net" className="hover:text-white">karl@tenantguard.net</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p className="mb-3">© 2026 TenantGuard. All rights reserved.</p>
            <div className="flex justify-center gap-6">
              <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="/terms" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const recentPosts = await getPosts()
    return { props: { recentPosts } }
  } catch {
    return { props: { recentPosts: [] } }
  }
}
