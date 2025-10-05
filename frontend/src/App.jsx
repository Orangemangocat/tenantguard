import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { ArrowRight, Users, Clock, FileText, CheckCircle, Gavel, Shield, TrendingUp } from 'lucide-react'
import CaseIntakeForm from './components/CaseIntakeForm.jsx'
import AttorneyIntakeForm from './components/AttorneyIntakeForm.jsx'
import './App.css'

// Import assets
import logo from './assets/logo.png'
import tenantSignupImage from './assets/tenant_signup_onboarding.png'
import attorneyDashboardImage from './assets/attorney_dashboard.png'
import workflowDiagramImage from './assets/workflow_diagram.png'

function App() {
  const [activeTab, setActiveTab] = useState('tenant')
  const [showIntakeForm, setShowIntakeForm] = useState(false)
  const [showAttorneyForm, setShowAttorneyForm] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="TenantGuard" className="h-8 w-8" />
              <span className="text-xl font-bold text-red-800">TenantGuard</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Button variant="ghost" className="text-gray-600 hover:text-red-800">Home</Button>
              <Button variant="ghost" className="text-gray-600 hover:text-red-800">Features</Button>
              <Button variant="ghost" className="text-gray-600 hover:text-red-800">How It Works</Button>
              <Button variant="ghost" className="text-gray-600 hover:text-red-800">Benefits</Button>
              <Button variant="ghost" className="text-gray-600 hover:text-red-800">Contact</Button>
            </nav>
            <Button className="bg-red-800 hover:bg-red-900 text-white">Get Started</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 text-red-800 border-red-200">
            Davidson County, Tennessee
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Transforming Tenant
            <span className="text-red-800 block">Legal Representation</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Technology-enabled self-service platform connecting tenants with qualified attorneys 
            for streamlined landlord-tenant dispute resolution in Tennessee.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-red-800 hover:bg-red-900 text-white"
              onClick={() => setShowIntakeForm(true)}
            >
              Start Your Case <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-red-800 text-red-800 hover:bg-red-50"
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
      <section className="py-16">
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
      <section className="py-16 bg-gray-50">
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
            Join the platform that's revolutionizing landlord-tenant dispute resolution in Davidson County, Tennessee.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-red-800 hover:bg-gray-100">
              Get Started as Tenant
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-red-800">
              Join as Attorney
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-3">
            <img src={logo} alt="TenantGuard" className="h-6 w-6" />
            <span className="text-lg font-semibold">TenantGuard</span>
          </div>
          <p className="text-center text-gray-400 mt-4">
            © 2025 TenantGuard. Transforming tenant legal representation in Tennessee.
          </p>
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
    </div>
  )
}

export default App
