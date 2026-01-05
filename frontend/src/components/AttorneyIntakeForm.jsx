import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { ArrowLeft, ArrowRight, Upload, CheckCircle, AlertCircle, Scale, Briefcase, DollarSign, Users, Clock, FileText } from 'lucide-react'

const AttorneyIntakeForm = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    // Professional Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    firmName: '',
    firmAddress: '',
    firmCity: '',
    firmZip: '',
    firmWebsite: '',
    
    // Legal Credentials
    barNumber: '',
    barState: '',
    barAdmissionDate: '',
    lawSchool: '',
    graduationYear: '',
    yearsExperience: '',
    
    // Practice Areas & Expertise
    practiceAreas: [],
    landlordTenantExperience: '',
    evictionExperience: '',
    courtExperience: [],
    specializations: [],
    
    // Case Preferences
    caseTypes: [],
    clientTypes: [],
    minimumCaseValue: '',
    maximumCaseload: '',
    responseTime: '',
    availabilityHours: [],
    
    // Budget & Pricing
    hourlyRate: '',
    flatFeeServices: [],
    paymentTerms: '',
    retainerAmount: '',
    paymentMethods: [],
    feeStructurePreference: '',
    
    // Lead Generation Preferences
    leadBudget: '',
    leadVolume: '',
    leadQuality: '',
    marketingPreferences: [],
    referralSources: [],
    
    // Geographic Coverage
    serviceAreas: [],
    travelRadius: '',
    remoteConsultation: false,
    
    // Technology & Tools
    caseManagementSoftware: '',
    communicationTools: [],
    documentSigning: [],
    
    // Professional References
    references: [
      { name: '', relationship: '', phone: '', email: '' },
      { name: '', relationship: '', phone: '', email: '' }
    ],
    
    // Compliance & Insurance
    malpracticeInsurance: false,
    insuranceCarrier: '',
    coverageAmount: '',
    disciplinaryHistory: false,
    disciplinaryDetails: '',
    
    // Platform Preferences
    profileVisibility: '',
    clientCommunication: [],
    caseUpdates: '',
    marketingConsent: false,
    dataSharing: false,
    
    // Additional Information
    motivation: '',
    additionalServices: '',
    specialRequirements: '',
    
    // Terms & Agreements
    termsAccepted: false,
    privacyConsent: false
  })

  const totalSteps = 10
  const progress = (currentStep / totalSteps) * 100

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateArrayField = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      
      // Submit data to backend API
      const response = await fetch('/api/attorneys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        alert(`Attorney application submitted successfully! Your application ID is: ${result.attorney.application_id}. We will review your application and contact you within 2-3 business days.`)
        onClose()
      } else {
        throw new Error(result.error || 'Failed to submit attorney application')
      }
    } catch (error) {
      console.error('Error submitting attorney application:', error)
      alert('There was an error submitting your application. Please try again or contact support.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">Professional Information</h3>
              <p className="text-gray-600 mt-2">Tell us about yourself and your practice</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@lawfirm.com"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="(615) 555-0123"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="firmName">Law Firm Name *</Label>
              <Input
                id="firmName"
                placeholder="Smith & Associates Law Firm"
                value={formData.firmName}
                onChange={(e) => updateFormData('firmName', e.target.value)}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="firmAddress">Firm Address *</Label>
                <Input
                  id="firmAddress"
                  placeholder="123 Legal Plaza, Suite 400"
                  value={formData.firmAddress}
                  onChange={(e) => updateFormData('firmAddress', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="firmZip">ZIP Code *</Label>
                <Input
                  id="firmZip"
                  placeholder="37201"
                  value={formData.firmZip}
                  onChange={(e) => updateFormData('firmZip', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="firmWebsite">Firm Website</Label>
              <Input
                id="firmWebsite"
                placeholder="https://www.yourfirm.com"
                value={formData.firmWebsite}
                onChange={(e) => updateFormData('firmWebsite', e.target.value)}
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">Legal Credentials</h3>
              <p className="text-gray-600 mt-2">Your bar admission and educational background</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="barNumber">Bar Number *</Label>
                <Input
                  id="barNumber"
                  placeholder="12345"
                  value={formData.barNumber}
                  onChange={(e) => updateFormData('barNumber', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="barState">Bar State *</Label>
                <Select value={formData.barState} onValueChange={(value) => updateFormData('barState', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TN">Tennessee</SelectItem>
                    <SelectItem value="AL">Alabama</SelectItem>
                    <SelectItem value="GA">Georgia</SelectItem>
                    <SelectItem value="KY">Kentucky</SelectItem>
                    <SelectItem value="MS">Mississippi</SelectItem>
                    <SelectItem value="NC">North Carolina</SelectItem>
                    <SelectItem value="SC">South Carolina</SelectItem>
                    <SelectItem value="VA">Virginia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="barAdmissionDate">Bar Admission Date *</Label>
                <Input
                  id="barAdmissionDate"
                  type="date"
                  value={formData.barAdmissionDate}
                  onChange={(e) => updateFormData('barAdmissionDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="yearsExperience">Years of Legal Experience *</Label>
                <Select value={formData.yearsExperience} onValueChange={(value) => updateFormData('yearsExperience', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-2">0-2 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="6-10">6-10 years</SelectItem>
                    <SelectItem value="11-15">11-15 years</SelectItem>
                    <SelectItem value="16-20">16-20 years</SelectItem>
                    <SelectItem value="20+">20+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lawSchool">Law School *</Label>
                <Input
                  id="lawSchool"
                  placeholder="Vanderbilt University Law School"
                  value={formData.lawSchool}
                  onChange={(e) => updateFormData('lawSchool', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="graduationYear">Graduation Year *</Label>
                <Input
                  id="graduationYear"
                  placeholder="2015"
                  value={formData.graduationYear}
                  onChange={(e) => updateFormData('graduationYear', e.target.value)}
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">Practice Areas & Expertise</h3>
              <p className="text-gray-600 mt-2">Your areas of legal specialization</p>
            </div>

            <div>
              <Label>Primary Practice Areas * (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  'Landlord-Tenant Law',
                  'Real Estate Law',
                  'Civil Litigation',
                  'Contract Law',
                  'Property Law',
                  'Housing Law',
                  'Consumer Protection',
                  'Business Law'
                ].map((area) => (
                  <div key={area} className="flex items-center space-x-2">
                    <Checkbox
                      id={area}
                      checked={formData.practiceAreas.includes(area)}
                      onCheckedChange={(checked) => updateArrayField('practiceAreas', area, checked)}
                    />
                    <Label htmlFor={area} className="text-sm">{area}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="landlordTenantExperience">Landlord-Tenant Experience *</Label>
              <Select value={formData.landlordTenantExperience} onValueChange={(value) => updateFormData('landlordTenantExperience', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">New to landlord-tenant law</SelectItem>
                  <SelectItem value="intermediate">Some experience (1-3 years)</SelectItem>
                  <SelectItem value="experienced">Experienced (4-10 years)</SelectItem>
                  <SelectItem value="expert">Expert (10+ years)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="evictionExperience">Eviction Case Experience *</Label>
              <Select value={formData.evictionExperience} onValueChange={(value) => updateFormData('evictionExperience', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your eviction experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No eviction experience</SelectItem>
                  <SelectItem value="few">Handled 1-10 eviction cases</SelectItem>
                  <SelectItem value="moderate">Handled 11-50 eviction cases</SelectItem>
                  <SelectItem value="extensive">Handled 50+ eviction cases</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Court Experience (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  'General Sessions Court',
                  'Circuit Court',
                  'Chancery Court',
                  'Federal Court',
                  'Appeals Court',
                  'Mediation/Arbitration'
                ].map((court) => (
                  <div key={court} className="flex items-center space-x-2">
                    <Checkbox
                      id={court}
                      checked={formData.courtExperience.includes(court)}
                      onCheckedChange={(checked) => updateArrayField('courtExperience', court, checked)}
                    />
                    <Label htmlFor={court} className="text-sm">{court}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">Case Preferences</h3>
              <p className="text-gray-600 mt-2">What types of cases are you interested in?</p>
            </div>

            <div>
              <Label>Preferred Case Types * (Select all that apply)</Label>
              <div className="grid grid-cols-1 gap-3 mt-2">
                {[
                  'Eviction Defense',
                  'Security Deposit Disputes',
                  'Habitability Issues',
                  'Lease Violations',
                  'Rent Disputes',
                  'Discrimination Claims',
                  'Unlawful Entry',
                  'Utility Issues',
                  'Property Damage Claims'
                ].map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={type}
                      checked={formData.caseTypes.includes(type)}
                      onCheckedChange={(checked) => updateArrayField('caseTypes', type, checked)}
                    />
                    <Label htmlFor={type} className="text-sm">{type}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Preferred Client Types * (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  'Individual Tenants',
                  'Families with Children',
                  'Senior Citizens',
                  'Disabled Individuals',
                  'Low-Income Clients',
                  'Section 8 Recipients',
                  'Students',
                  'Small Business Tenants'
                ].map((client) => (
                  <div key={client} className="flex items-center space-x-2">
                    <Checkbox
                      id={client}
                      checked={formData.clientTypes.includes(client)}
                      onCheckedChange={(checked) => updateArrayField('clientTypes', client, checked)}
                    />
                    <Label htmlFor={client} className="text-sm">{client}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minimumCaseValue">Minimum Case Value</Label>
                <Select value={formData.minimumCaseValue} onValueChange={(value) => updateFormData('minimumCaseValue', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select minimum value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-minimum">No minimum</SelectItem>
                    <SelectItem value="500">$500+</SelectItem>
                    <SelectItem value="1000">$1,000+</SelectItem>
                    <SelectItem value="2500">$2,500+</SelectItem>
                    <SelectItem value="5000">$5,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="maximumCaseload">Maximum Monthly Caseload</Label>
                <Select value={formData.maximumCaseload} onValueChange={(value) => updateFormData('maximumCaseload', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select caseload limit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-3">1-3 cases</SelectItem>
                    <SelectItem value="4-6">4-6 cases</SelectItem>
                    <SelectItem value="7-10">7-10 cases</SelectItem>
                    <SelectItem value="11-15">11-15 cases</SelectItem>
                    <SelectItem value="15+">15+ cases</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">Budget & Pricing</h3>
              <p className="text-gray-600 mt-2">Your fee structure and payment preferences</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hourlyRate">Hourly Rate *</Label>
                <Input
                  id="hourlyRate"
                  placeholder="$250"
                  value={formData.hourlyRate}
                  onChange={(e) => updateFormData('hourlyRate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="retainerAmount">Typical Retainer Amount</Label>
                <Input
                  id="retainerAmount"
                  placeholder="$2,500"
                  value={formData.retainerAmount}
                  onChange={(e) => updateFormData('retainerAmount', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="feeStructurePreference">Preferred Fee Structure *</Label>
              <Select value={formData.feeStructurePreference} onValueChange={(value) => updateFormData('feeStructurePreference', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fee structure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly billing only</SelectItem>
                  <SelectItem value="flat-fee">Flat fee preferred</SelectItem>
                  <SelectItem value="hybrid">Hybrid (hourly + flat fee options)</SelectItem>
                  <SelectItem value="contingency">Contingency when applicable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Flat Fee Services Offered (Select all that apply)</Label>
              <div className="grid grid-cols-1 gap-3 mt-2">
                {[
                  'Initial Consultation - $150',
                  'Lease Review - $200',
                  'Demand Letter - $300',
                  'Court Filing - $500',
                  'Settlement Negotiation - $750',
                  'Full Eviction Defense - $1,500'
                ].map((service) => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox
                      id={service}
                      checked={formData.flatFeeServices.includes(service)}
                      onCheckedChange={(checked) => updateArrayField('flatFeeServices', service, checked)}
                    />
                    <Label htmlFor={service} className="text-sm">{service}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Accepted Payment Methods * (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  'Credit Card',
                  'Bank Transfer',
                  'Check',
                  'Cash',
                  'Payment Plans',
                  'Legal Aid Vouchers'
                ].map((method) => (
                  <div key={method} className="flex items-center space-x-2">
                    <Checkbox
                      id={method}
                      checked={formData.paymentMethods.includes(method)}
                      onCheckedChange={(checked) => updateArrayField('paymentMethods', method, checked)}
                    />
                    <Label htmlFor={method} className="text-sm">{method}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">Lead Generation Preferences</h3>
              <p className="text-gray-600 mt-2">How you want to receive and manage leads</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="leadBudget">Monthly Lead Budget *</Label>
                <Select value={formData.leadBudget} onValueChange={(value) => updateFormData('leadBudget', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-500">$0 - $500</SelectItem>
                    <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                    <SelectItem value="1000-2500">$1,000 - $2,500</SelectItem>
                    <SelectItem value="2500-5000">$2,500 - $5,000</SelectItem>
                    <SelectItem value="5000+">$5,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="leadVolume">Preferred Lead Volume *</Label>
                <Select value={formData.leadVolume} onValueChange={(value) => updateFormData('leadVolume', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead volume" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-5">1-5 leads per month</SelectItem>
                    <SelectItem value="6-10">6-10 leads per month</SelectItem>
                    <SelectItem value="11-20">11-20 leads per month</SelectItem>
                    <SelectItem value="21-50">21-50 leads per month</SelectItem>
                    <SelectItem value="50+">50+ leads per month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="leadQuality">Lead Quality Preference *</Label>
              <Select value={formData.leadQuality} onValueChange={(value) => updateFormData('leadQuality', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select quality preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high-quality">High quality, fewer leads</SelectItem>
                  <SelectItem value="balanced">Balanced quality and volume</SelectItem>
                  <SelectItem value="high-volume">High volume, mixed quality</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Marketing Preferences (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  'Online Directory Listing',
                  'Social Media Marketing',
                  'Content Marketing',
                  'Email Campaigns',
                  'Referral Program',
                  'Community Outreach'
                ].map((pref) => (
                  <div key={pref} className="flex items-center space-x-2">
                    <Checkbox
                      id={pref}
                      checked={formData.marketingPreferences.includes(pref)}
                      onCheckedChange={(checked) => updateArrayField('marketingPreferences', pref, checked)}
                    />
                    <Label htmlFor={pref} className="text-sm">{pref}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Preferred Referral Sources (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  'Legal Aid Organizations',
                  'Community Centers',
                  'Social Services',
                  'Other Attorneys',
                  'Real Estate Agents',
                  'Tenant Advocacy Groups'
                ].map((source) => (
                  <div key={source} className="flex items-center space-x-2">
                    <Checkbox
                      id={source}
                      checked={formData.referralSources.includes(source)}
                      onCheckedChange={(checked) => updateArrayField('referralSources', source, checked)}
                    />
                    <Label htmlFor={source} className="text-sm">{source}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">Service Coverage & Availability</h3>
              <p className="text-gray-600 mt-2">Where and when you provide services</p>
            </div>

            <div>
              <Label>Service Areas * (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  'Davidson County',
                  'Williamson County',
                  'Rutherford County',
                  'Wilson County',
                  'Sumner County',
                  'Cheatham County',
                  'Robertson County',
                  'Dickson County'
                ].map((area) => (
                  <div key={area} className="flex items-center space-x-2">
                    <Checkbox
                      id={area}
                      checked={formData.serviceAreas.includes(area)}
                      onCheckedChange={(checked) => updateArrayField('serviceAreas', area, checked)}
                    />
                    <Label htmlFor={area} className="text-sm">{area}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="travelRadius">Travel Radius</Label>
                <Select value={formData.travelRadius} onValueChange={(value) => updateFormData('travelRadius', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select travel radius" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Within 10 miles</SelectItem>
                    <SelectItem value="25">Within 25 miles</SelectItem>
                    <SelectItem value="50">Within 50 miles</SelectItem>
                    <SelectItem value="100">Within 100 miles</SelectItem>
                    <SelectItem value="statewide">Statewide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="responseTime">Response Time Commitment *</Label>
                <Select value={formData.responseTime} onValueChange={(value) => updateFormData('responseTime', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select response time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="same-day">Same day</SelectItem>
                    <SelectItem value="24-hours">Within 24 hours</SelectItem>
                    <SelectItem value="48-hours">Within 48 hours</SelectItem>
                    <SelectItem value="72-hours">Within 72 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Availability Hours * (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[
                  'Monday 9-5',
                  'Tuesday 9-5',
                  'Wednesday 9-5',
                  'Thursday 9-5',
                  'Friday 9-5',
                  'Saturday Morning',
                  'Evening Hours',
                  'Emergency Availability'
                ].map((hours) => (
                  <div key={hours} className="flex items-center space-x-2">
                    <Checkbox
                      id={hours}
                      checked={formData.availabilityHours.includes(hours)}
                      onCheckedChange={(checked) => updateArrayField('availabilityHours', hours, checked)}
                    />
                    <Label htmlFor={hours} className="text-sm">{hours}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remoteConsultation"
                checked={formData.remoteConsultation}
                onCheckedChange={(checked) => updateFormData('remoteConsultation', checked)}
              />
              <Label htmlFor="remoteConsultation">I offer remote consultations via video/phone</Label>
            </div>
          </div>
        )

      case 8:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">Professional References</h3>
              <p className="text-gray-600 mt-2">Provide two professional references</p>
            </div>

            {formData.references.map((ref, index) => (
              <Card key={index} className="p-4">
                <h4 className="font-medium mb-4">Reference {index + 1}</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`ref${index}Name`}>Name *</Label>
                    <Input
                      id={`ref${index}Name`}
                      placeholder="Reference name"
                      value={ref.name}
                      onChange={(e) => {
                        const newRefs = [...formData.references]
                        newRefs[index].name = e.target.value
                        updateFormData('references', newRefs)
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`ref${index}Relationship`}>Relationship *</Label>
                    <Input
                      id={`ref${index}Relationship`}
                      placeholder="Former colleague, client, etc."
                      value={ref.relationship}
                      onChange={(e) => {
                        const newRefs = [...formData.references]
                        newRefs[index].relationship = e.target.value
                        updateFormData('references', newRefs)
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`ref${index}Phone`}>Phone *</Label>
                    <Input
                      id={`ref${index}Phone`}
                      placeholder="(615) 555-0123"
                      value={ref.phone}
                      onChange={(e) => {
                        const newRefs = [...formData.references]
                        newRefs[index].phone = e.target.value
                        updateFormData('references', newRefs)
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`ref${index}Email`}>Email *</Label>
                    <Input
                      id={`ref${index}Email`}
                      placeholder="reference@email.com"
                      value={ref.email}
                      onChange={(e) => {
                        const newRefs = [...formData.references]
                        newRefs[index].email = e.target.value
                        updateFormData('references', newRefs)
                      }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )

      case 9:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">Compliance & Insurance</h3>
              <p className="text-gray-600 mt-2">Professional insurance and compliance information</p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="malpracticeInsurance"
                checked={formData.malpracticeInsurance}
                onCheckedChange={(checked) => updateFormData('malpracticeInsurance', checked)}
              />
              <Label htmlFor="malpracticeInsurance">I have professional malpractice insurance *</Label>
            </div>

            {formData.malpracticeInsurance && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="insuranceCarrier">Insurance Carrier *</Label>
                  <Input
                    id="insuranceCarrier"
                    placeholder="Insurance company name"
                    value={formData.insuranceCarrier}
                    onChange={(e) => updateFormData('insuranceCarrier', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="coverageAmount">Coverage Amount *</Label>
                  <Select value={formData.coverageAmount} onValueChange={(value) => updateFormData('coverageAmount', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select coverage amount" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100k">$100,000</SelectItem>
                      <SelectItem value="250k">$250,000</SelectItem>
                      <SelectItem value="500k">$500,000</SelectItem>
                      <SelectItem value="1m">$1,000,000</SelectItem>
                      <SelectItem value="2m+">$2,000,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="disciplinaryHistory"
                checked={formData.disciplinaryHistory}
                onCheckedChange={(checked) => updateFormData('disciplinaryHistory', checked)}
              />
              <Label htmlFor="disciplinaryHistory">I have disciplinary history with any bar association</Label>
            </div>

            {formData.disciplinaryHistory && (
              <div>
                <Label htmlFor="disciplinaryDetails">Please explain any disciplinary history *</Label>
                <Textarea
                  id="disciplinaryDetails"
                  placeholder="Provide details about any disciplinary actions..."
                  value={formData.disciplinaryDetails}
                  onChange={(e) => updateFormData('disciplinaryDetails', e.target.value)}
                />
              </div>
            )}
          </div>
        )

      case 10:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">Additional Information & Terms</h3>
              <p className="text-gray-600 mt-2">Final details and agreement to terms</p>
            </div>

            <div>
              <Label htmlFor="motivation">Why do you want to join TenantGuard? *</Label>
              <Textarea
                id="motivation"
                placeholder="Tell us about your motivation for joining our platform..."
                value={formData.motivation}
                onChange={(e) => updateFormData('motivation', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="additionalServices">Additional Services You Offer</Label>
              <Textarea
                id="additionalServices"
                placeholder="Any other legal services you provide that might benefit tenants..."
                value={formData.additionalServices}
                onChange={(e) => updateFormData('additionalServices', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="specialRequirements">Special Requirements or Accommodations</Label>
              <Textarea
                id="specialRequirements"
                placeholder="Any special requirements for your practice or client interactions..."
                value={formData.specialRequirements}
                onChange={(e) => updateFormData('specialRequirements', e.target.value)}
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="termsAccepted"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) => updateFormData('termsAccepted', checked)}
                />
                <Label htmlFor="termsAccepted">I accept the TenantGuard Terms of Service and Attorney Agreement *</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="privacyConsent"
                  checked={formData.privacyConsent}
                  onCheckedChange={(checked) => updateFormData('privacyConsent', checked)}
                />
                <Label htmlFor="privacyConsent">I consent to the collection and use of my information as described in the Privacy Policy *</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="marketingConsent"
                  checked={formData.marketingConsent}
                  onCheckedChange={(checked) => updateFormData('marketingConsent', checked)}
                />
                <Label htmlFor="marketingConsent">I consent to receiving marketing communications and platform updates</Label>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Next Steps</h4>
              <p className="text-blue-800 text-sm">
                After submitting your application, our team will review your information within 2-3 business days. 
                If approved, you'll receive access to our attorney portal where you can manage your profile, 
                view available cases, and start receiving qualified leads.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-red-800 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">TenantGuard Attorney Application</h2>
              <p className="text-red-100 mt-1">Step {currentStep} of {totalSteps}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-red-700"
            >
              ✕
            </Button>
          </div>
          <div className="mt-4">
            <Progress value={progress} className="bg-red-700" />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            <div className="text-sm text-gray-500">
              Step {currentStep} of {totalSteps}
            </div>

            {currentStep === totalSteps ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.termsAccepted || !formData.privacyConsent}
                className="bg-red-800 hover:bg-red-900 text-white flex items-center space-x-2 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Application'}</span>
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                className="bg-red-800 hover:bg-red-900 text-white flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AttorneyIntakeForm
