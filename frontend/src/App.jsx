import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { ArrowRight, Users, Clock, FileText, CheckCircle, Gavel, Shield, TrendingUp, Menu, X } from 'lucide-react'
import CaseIntakeForm from './components/CaseIntakeForm.jsx'
import AttorneyIntakeForm from './components/AttorneyIntakeForm.jsx'
import ContactPage from './components/ContactPage.jsx'
import BlogList from './components/BlogList.jsx'
import BlogPost from './components/BlogPost.jsx'
import BlogAdmin from './components/BlogAdmin.jsx'
import Login from './components/Login.jsx'
import Register from './components/Register.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'
import Onboarding from './components/Onboarding.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'

import './App.css'
import './theme.css'

// Import assets
import logo from './assets/logo.png'
import tenantSignupImage from './assets/tenant_signup_onboarding.png'
import attorneyDashboardImage from './assets/attorney_dashboard.png'
import workflowDiagramImage from './assets/workflow_diagram.png'

function App() {
  const [activeTab, setActiveTab] = useState('tenant')
  const [showIntakeForm, setShowIntakeForm] = useState(false)
  const [showAttorneyForm, setShowAttorneyForm] = useState(false)
  const [showContactPage, setShowContactPage] = useState(false)
  const [currentPage, setCurrentPage] = useState('home')
  const [showBlog, setShowBlog] = useState(false)
  const [showBlogAdmin, setShowBlogAdmin] = useState(false)
  const [selectedBlogPost, setSelectedBlogPost] = useState(null)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const API_BASE = import.meta.env.VITE_API_BASE_URL

  // Handle OAuth callback - extract tokens from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const accessToken = urlParams.get('access_token')
    const refreshToken = urlParams.get('refresh_token')

    if (accessToken && window.location.pathname === '/auth/callback') {
      // Store tokens
      localStorage.setItem('access_token', accessToken)
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken)
      }

      // Decode JWT to get user info
      try {
        const base64Url = accessToken.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(atob(base64))
        setCurrentUser({
          id: payload.user_id,
          email: payload.email,
          role: payload.role
        })
      } catch (e) {
        console.error('Error decoding token:', e)
      }

      // Clean up URL
      window.history.replaceState({}, document.title, '/')
    }
  }, [])

  // Check for existing token on page load
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token && !currentUser) {
      try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(atob(base64))

        // Check if token is expired
        if (payload.exp * 1000 > Date.now()) {
          setCurrentUser({
            id: payload.user_id,
            email: payload.email,
            role: payload.role
          })
        } else {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      } catch (e) {
        console.error('Error decoding stored token:', e)
      }
    }
  }, [])

  // If user navigates directly to /admin-panel or /onboarding, render those views
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    // redirect to home
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, '/')
    }
  }

  // Full-page intake routes
  if (pathname === '/tenant-intake') {
    return (
      <ThemeProvider>
        <ProtectedRoute>
          <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto py-12 px-4">
              <CaseIntakeForm />
            </div>
          </div>
        </ProtectedRoute>
      </ThemeProvider>
    )
  }

  if (pathname === '/attorney-intake') {
    return (
      <ThemeProvider>
        <ProtectedRoute>
          <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto py-12 px-4">
              <AttorneyIntakeForm />
            </div>
          </div>
        </ProtectedRoute>
      </ThemeProvider>
    )
  }

  if (pathname === '/admin-panel' || showAdminPanel) {
    return (
      <ThemeProvider>
        <ProtectedRoute requireAdmin={true}>
          <AdminDashboard
            user={currentUser}
            onLogout={handleLogout}
            onClose={() => {
              setShowAdminPanel(false)
              if (typeof window !== 'undefined') window.history.replaceState({}, document.title, '/')
            }}
          />
        </ProtectedRoute>
      </ThemeProvider>
    )
  }

  if (pathname === '/onboarding') {
    return (
      <ThemeProvider>
        <ProtectedRoute>
          <Onboarding user={currentUser} onFinish={() => { if (typeof window !== 'undefined') window.history.replaceState({}, document.title, '/') }} />
        </ProtectedRoute>
      </ThemeProvider>
    )
  }

  // Handle /blog URL routing
  useEffect(() => {
    if (window.location.pathname === '/blog' || window.location.pathname.startsWith('/blog/')) {
      setShowBlog(true)
    }
  }, [])

  const scrollToSection = (sectionId) => {
    setCurrentPage('home')
    setTimeout(() => {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white" style={{
        backgroundColor: 'var(--color-background)',
        transition: 'background-color 0.3s ease'
      }}>
        {/* Header */}
        <header style={{ backgroundColor: 'var(--color-navBg)', borderColor: 'var(--color-navBorder)' }} className="shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <img src={logo} alt="TenantGuard" className="h-8 w-8" />
                <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>TenantGuard</span>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex space-x-8">
                <Button variant="ghost" style={{ color: 'var(--color-textSecondary)' }} className="hover:opacity-80" onClick={() => { setCurrentPage('home'); window.scrollTo(0, 0) }}>Home</Button>
                <Button variant="ghost" style={{ color: 'var(--color-textSecondary)' }} className="hover:opacity-80" onClick={() => scrollToSection('features')}>Features</Button>
                <Button variant="ghost" style={{ color: 'var(--color-textSecondary)' }} className="hover:opacity-80" onClick={() => scrollToSection('how-it-works')}>How It Works</Button>
                <Button variant="ghost" style={{ color: 'var(--color-textSecondary)' }} className="hover:opacity-80" onClick={() => setShowBlog(true)}>Blog</Button>
                <Button variant="ghost" style={{ color: 'var(--color-textSecondary)' }} className="hover:opacity-80" onClick={() => setShowContactPage(true)}>Contact</Button>
              </nav>

              {/* Desktop Action Buttons */}
              <div className="hidden md:flex items-center gap-2">
                {currentUser ? (
                  <div className="relative" onMouseEnter={() => setShowUserMenu(true)} onMouseLeave={() => setShowUserMenu(false)}>
                    <Button variant="ghost" style={{ color: 'var(--color-textSecondary)' }} className="hover:opacity-80">
                      {currentUser.email || currentUser.username || 'User'}
                    </Button>
                    {showUserMenu && (
                      <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                        <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Edit Profile</a>
                        <a href="/my-tenant-case" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">View Tenant Submission</a>
                        <a href="/my-lawyer-profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">View Lawyer Profile</a>
                        {currentUser.role === 'admin' && (
                          <a href="/admin-panel" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Admin Panel</a>
                        )}
                        <a href="/onboarding" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Onboarding</a>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          onClick={() => {
                            setCurrentUser(null)
                            localStorage.removeItem('access_token')
                            localStorage.removeItem('refresh_token')
                            setShowUserMenu(false)
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button variant="ghost" style={{ color: 'var(--color-textSecondary)' }} className="hover:opacity-80" onClick={() => setShowLogin(true)}>Login</Button>
                )}
                <Button style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }} className="hover:opacity-90" onClick={() => setShowIntakeForm(true)}>Tenants</Button>
                <Button style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }} className="hover:opacity-90" onClick={() => setShowAttorneyForm(true)}>Attorneys</Button>
              </div>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  style={{
                    color: 'var(--color-textSecondary)',
                    touchAction: 'manipulation',
                    width: '56px',
                    height: '56px',
                    minWidth: '56px',
                    minHeight: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px'
                  }}
                  aria-label="Toggle mobile menu"
                >
                  {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </div>
            </div>

            {/* Mobile Menu */}
            {showMobileMenu && (
              <div className="md:hidden py-4 border-t" style={{ borderColor: 'var(--color-navBorder)' }}>
                <nav className="flex flex-col space-y-2">
                  <Button
                    variant="ghost"
                    style={{ color: 'var(--color-textSecondary)' }}
                    className="hover:opacity-80 justify-start"
                    onClick={() => {
                      setCurrentPage('home');
                      window.scrollTo(0, 0);
                      setShowMobileMenu(false);
                    }}
                  >
                    Home
                  </Button>
                  <Button
                    variant="ghost"
                    style={{ color: 'var(--color-textSecondary)' }}
                    className="hover:opacity-80 justify-start"
                    onClick={() => {
                      scrollToSection('features');
                      setShowMobileMenu(false);
                    }}
                  >
                    Features
                  </Button>
                  <Button
                    variant="ghost"
                    style={{ color: 'var(--color-textSecondary)' }}
                    className="hover:opacity-80 justify-start"
                    onClick={() => {
                      scrollToSection('how-it-works');
                      setShowMobileMenu(false);
                    }}
                  >
                    How It Works
                  </Button>
                  <Button
                    variant="ghost"
                    style={{ color: 'var(--color-textSecondary)' }}
                    className="hover:opacity-80 justify-start"
                    onClick={() => {
                      setShowBlog(true);
                      setShowMobileMenu(false);
                    }}
                  >
                    Blog
                  </Button>
                  <Button
                    variant="ghost"
                    style={{ color: 'var(--color-textSecondary)' }}
                    className="hover:opacity-80 justify-start"
                    onClick={() => {
                      setShowContactPage(true);
                      setShowMobileMenu(false);
                    }}
                  >
                    Contact
                  </Button>
                  <div className="border-t pt-2 mt-2" style={{ borderColor: 'var(--color-navBorder)' }}>
                    {currentUser ? (
                      <>
                        <div className="px-3 py-2 text-sm" style={{ color: 'var(--color-textSecondary)' }}>
                          {currentUser.email || currentUser.username || 'User'}
                        </div>
                        {currentUser?.role !== 'admin' && (
                          <a
                            href="/onboarding"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                            onClick={() => setShowMobileMenu(false)}
                          >
                            Onboarding
                          </a>
                        )}
                        <Button
                          variant="ghost"
                          style={{ color: 'var(--color-textSecondary)' }}
                          className="hover:opacity-80 justify-start w-full"
                          onClick={() => {
                            setCurrentUser(null);
                            localStorage.removeItem('access_token');
                            localStorage.removeItem('refresh_token');
                            setShowMobileMenu(false);
                          }}
                        >
                          Logout
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        style={{ color: 'var(--color-textSecondary)' }}
                        className="hover:opacity-80 justify-start w-full"
                        onClick={() => {
                          setShowLogin(true);
                          setShowMobileMenu(false);
                        }}
                      >
                        Login
                      </Button>
                    )}
                    <Button
                      style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
                      className="hover:opacity-90 w-full mt-2"
                      onClick={() => {
                        setShowIntakeForm(true);
                        setShowMobileMenu(false);
                      }}
                    >
                      Tenants
                    </Button>
                    <Button
                      style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
                      className="hover:opacity-90 w-full mt-2"
                      onClick={() => {
                        setShowAttorneyForm(true);
                        setShowMobileMenu(false);
                      }}
                    >
                      Attorneys
                    </Button>
                  </div>
                </nav>
              </div>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <Badge variant="outline" style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primaryLight)' }} className="mb-6">
              Tennessee
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
              Transforming Tenant
              <span className="block" style={{ color: 'var(--color-primary)' }}>Legal Representation</span>
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto" style={{ color: 'var(--color-textSecondary)' }}>
              Technology-enabled self-service platform connecting tenants with qualified attorneys
              for streamlined landlord-tenant dispute resolution in Tennessee.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                style={{ backgroundColor: 'var(--color-primary)', color: '#ffffff' }}
                className="hover:opacity-90"
                onClick={() => setShowIntakeForm(true)}
              >
                Start Your Case <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', backgroundColor: 'transparent' }}
                className="hover:opacity-80"
                onClick={() => setShowAttorneyForm(true)}
              >
                Attorney Portal
              </Button>
            </div>
          </div>
        </section>

        {/* Challenge Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">The Challenge</h2>
              <p className="text-lg text-gray-600">
                Tennessee's eviction process creates significant barriers for tenant self-representation
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="text-4xl font-bold text-red-800 mb-2">85%</div>
                  <CardTitle className="text-lg">Tenants lack legal representation</CardTitle>
                </CardHeader>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="text-4xl font-bold text-red-800 mb-2">14 Days</div>
                  <CardTitle className="text-lg">Notice period before eviction filing</CardTitle>
                </CardHeader>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="text-4xl font-bold text-red-800 mb-2">3-5 Hours</div>
                  <CardTitle className="text-lg">Attorney case setup time</CardTitle>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Platform Features */}
        <section id="features" className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Platform Features</h2>
              <p className="text-lg text-gray-600">
                Comprehensive tools for both tenants and attorneys
              </p>
            </div>

            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 p-1 rounded-lg">
                <Button
                  variant={activeTab === 'tenant' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('tenant')}
                  className={activeTab === 'tenant' ? 'bg-red-800 text-white' : ''}
                >
                  For Tenants
                </Button>
                <Button
                  variant={activeTab === 'attorney' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('attorney')}
                  className={activeTab === 'attorney' ? 'bg-red-800 text-white' : ''}
                >
                  For Attorneys
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                {activeTab === 'tenant' ? (
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <FileText className="h-6 w-6 text-red-800 mt-1" />
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Guided Case Intake</h3>
                        <p className="text-gray-600">Step-by-step dispute categorization and document collection</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <Gavel className="h-6 w-6 text-red-800 mt-1" />
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Tennessee Legal Templates</h3>
                        <p className="text-gray-600">State-specific forms and legal document generation</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <Shield className="h-6 w-6 text-red-800 mt-1" />
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Mobile-Responsive Dashboard</h3>
                        <p className="text-gray-600">Access your case anywhere with deadline tracking</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <CheckCircle className="h-6 w-6 text-red-800 mt-1" />
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Pre-Qualified Cases</h3>
                        <p className="text-gray-600">Browse organized cases with complete documentation</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <Clock className="h-6 w-6 text-red-800 mt-1" />
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Reduced Onboarding</h3>
                        <p className="text-gray-600">70% reduction in case setup time</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <TrendingUp className="h-6 w-6 text-red-800 mt-1" />
                      <div>
                        <h3 className="text-xl font-semibold mb-2">Integrated Workflow</h3>
                        <p className="text-gray-600">Seamless case handoff and billing integration</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <img
                  src={activeTab === 'tenant' ? tenantSignupImage : attorneyDashboardImage}
                  alt={activeTab === 'tenant' ? 'Tenant Signup Interface' : 'Attorney Dashboard'}
                  className="rounded-lg shadow-lg w-full"
                />
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
              <p className="text-lg text-gray-600">
                Simple, efficient process connecting tenants and attorneys
              </p>
            </div>

            <div className="mb-12">
              <img
                src={workflowDiagramImage}
                alt="TenantGuard Workflow"
                className="rounded-lg shadow-lg w-full max-w-4xl mx-auto"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-red-800">Tenant Journey</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                    <span>Signup with guided situation assessment</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                    <span>Case intake with dispute categorization</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                    <span>Document upload and organization</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                    <span>Legal guidance and document generation</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-red-800">Attorney Journey</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                    <span>Browse pre-qualified cases with filters</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                    <span>Evaluate complete case documentation</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                    <span>Streamlined client handoff process</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-800 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                    <span>Integrated case and billing management</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Platform Benefits */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Platform Benefits</h2>
              <p className="text-lg text-gray-600">
                Delivering value for both tenants and attorneys
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="text-4xl font-bold text-red-800 mb-2">60%</div>
                  <CardTitle className="text-lg">Cost Reduction</CardTitle>
                  <CardDescription>
                    Average tenant legal costs reduced from $2,500 to $1,000
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="text-4xl font-bold text-red-800 mb-2">70%</div>
                  <CardTitle className="text-lg">Time Savings</CardTitle>
                  <CardDescription>
                    Attorney case onboarding reduced from 4.5 hours to under 1 hour
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="text-center">
                <CardHeader>
                  <div className="text-4xl font-bold text-red-800 mb-2">90%</div>
                  <CardTitle className="text-lg">Completeness</CardTitle>
                  <CardDescription>
                    Document organization and case preparation accuracy
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Modern Technology Stack</h2>
              <p className="text-lg text-gray-600">
                Built for scalability and security
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-800">Frontend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-600">
                    <li>React 18</li>
                    <li>Tailwind CSS</li>
                    <li>Shadcn/UI</li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-800">Backend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-600">
                    <li>Node.js</li>
                    <li>Express</li>
                    <li>MongoDB</li>
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-800">Infrastructure</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-gray-600">
                    <li>AWS Cloud</li>
                    <li>Docker</li>
                    <li>CI/CD Pipeline</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-red-800 text-white">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Transform Tenant Legal Representation?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join the platform that's revolutionizing landlord-tenant dispute resolution in Tennessee.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-white text-red-800 hover:bg-gray-100" onClick={() => setShowIntakeForm(true)}>
                Get Started as Tenant
              </Button>
              <Button size="lg" variant="secondary" className="bg-white text-red-800 hover:bg-gray-100 border-2 border-white" onClick={() => setShowAttorneyForm(true)}>
                Join as Attorney
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <img src={logo} alt="TenantGuard" className="h-6 w-6" />
                  <span className="text-lg font-semibold">TenantGuard</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Transforming tenant legal representation in Tennessee.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><button onClick={() => { setCurrentPage('home'); window.scrollTo(0, 0) }} className="hover:text-white">Home</button></li>
                  <li><button onClick={() => scrollToSection('features')} className="hover:text-white">Features</button></li>
                  <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white">How It Works</button></li>
                  <li><button onClick={() => setShowContactPage(true)} className="hover:text-white">Contact</button></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">For Users</h3>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><button onClick={() => setShowIntakeForm(true)} className="hover:text-white">Tenant Portal</button></li>
                  <li><button onClick={() => setShowAttorneyForm(true)} className="hover:text-white">Attorney Portal</button></li>
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
              <p>© 2025 TenantGuard. All rights reserved.</p>
            </div>
          </div>
        </footer>

        {/* Case Intake Form Modal */}
        {showIntakeForm && (
          <CaseIntakeForm onClose={() => setShowIntakeForm(false)} />
        )}

        {/* Attorney Intake Form Modal */}
        {showAttorneyForm && (
          <AttorneyIntakeForm onClose={() => setShowAttorneyForm(false)} />
        )}

        {/* Contact Page Modal */}
        {showContactPage && (
          <ContactPage onClose={() => setShowContactPage(false)} />
        )}

        {/* Blog Pages */}
        {showBlog && !selectedBlogPost && !showBlogAdmin && (
          <div className="fixed inset-0 bg-white z-50 overflow-y-auto" style={{ backgroundColor: 'var(--color-background)' }}>
            <header style={{ backgroundColor: 'var(--color-navBg)', borderColor: 'var(--color-navBorder)' }} className="shadow-sm border-b sticky top-0 z-10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                  <div className="flex items-center space-x-3">
                    <img src={logo} alt="TenantGuard" className="h-8 w-8" />
                    <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>TenantGuard Blog</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentUser && currentUser.role === 'admin' && (
                      <Button variant="outline" onClick={() => setShowBlogAdmin(true)}>Admin</Button>
                    )}
                    <Button onClick={() => setShowBlog(false)}>Close</Button>
                  </div>
                </div>
              </div>
            </header>
            <BlogList onPostClick={(slug) => setSelectedBlogPost(slug)} />
          </div>
        )}

        {selectedBlogPost && (
          <div className="fixed inset-0 bg-white z-50 overflow-y-auto" style={{ backgroundColor: 'var(--color-background)' }}>
            <header style={{ backgroundColor: 'var(--color-navBg)', borderColor: 'var(--color-navBorder)' }} className="shadow-sm border-b sticky top-0 z-10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                  <div className="flex items-center space-x-3">
                    <img src={logo} alt="TenantGuard" className="h-8 w-8" />
                    <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>TenantGuard Blog</span>
                  </div>
                  <Button onClick={() => { setSelectedBlogPost(null); setShowBlog(false) }}>Close</Button>
                </div>
              </div>
            </header>
            <BlogPost slug={selectedBlogPost} onBack={() => setSelectedBlogPost(null)} />
          </div>
        )}

        {showBlogAdmin && currentUser && currentUser.role === 'admin' && (
          <div className="fixed inset-0 bg-white z-50 overflow-y-auto" style={{ backgroundColor: 'var(--color-background)' }}>
            <header style={{ backgroundColor: 'var(--color-navBg)', borderColor: 'var(--color-navBorder)' }} className="shadow-sm border-b sticky top-0 z-10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                  <div className="flex items-center space-x-3">
                    <img src={logo} alt="TenantGuard" className="h-8 w-8" />
                    <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>TenantGuard Blog Admin</span>
                  </div>
                  <Button onClick={() => setShowBlogAdmin(false)}>Close</Button>
                </div>
              </div>
            </header>
            <BlogAdmin onBack={() => setShowBlogAdmin(false)} currentUser={currentUser} />
          </div>
        )}

        {/* Login Modal */}
        {showLogin && !currentUser && (
          <Login
            onClose={() => setShowLogin(false)}
            onSuccess={(user) => {
              setCurrentUser(user)
              setShowLogin(false)
            }}
            onSwitchToRegister={() => {
              setShowLogin(false)
              setShowRegister(true)
            }}
          />
        )}

        {/* Register Modal */}
        {showRegister && !currentUser && (
          <Register
            onSuccess={(user) => {
              setCurrentUser(user)
              setShowRegister(false)
            }}
            onSwitchToLogin={() => {
              setShowRegister(false)
              setShowLogin(true)
            }}
            onClose={() => setShowRegister(false)}
          />
        )}

        {/* Admin Panel */}
        {showAdminPanel && currentUser && (
          <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
            <AdminDashboard
              user={currentUser}
              onLogout={() => {
                setCurrentUser(null)
                setShowAdminPanel(false)
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
              }}
              onClose={() => setShowAdminPanel(false)}
            />
          </div>
        )}
      </div>
    </ThemeProvider>
  )
}

export default App
