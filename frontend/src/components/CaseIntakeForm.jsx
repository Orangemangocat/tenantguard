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
import { ArrowLeft, ArrowRight, Upload, CheckCircle, AlertCircle, Phone, Mail, MessageSquare } from 'lucide-react'

const CaseIntakeForm = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Contact Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredContact: '',
    address: '',
    city: '',
    zipCode: '',
    
    // Demographics
    age: '',
    isDisabled: false,
    hasChildren: false,
    householdIncome: '',
    primaryLanguage: 'english',
    needsInterpreter: false,
    
    // Property Information
    propertyAddress: '',
    propertyType: '',
    bedrooms: '',
    totalUnits: '',
    monthlyRent: '',
    tenantRentShare: '',
    moveInDate: '',
    leaseType: '',
    securityDeposit: '',
    hasGovernmentAssistance: false,
    
    // Landlord Information
    landlordName: '',
    landlordPhone: '',
    landlordEmail: '',
    propertyManager: '',
    landlordAddress: '',
    
    // Dispute Information
    disputeType: [],
    evictionNoticeReceived: false,
    evictionNoticeType: '',
    evictionNoticeDate: '',
    evictionReason: '',
    courtDate: '',
    amountOwed: '',
    
    // Timeline
    problemStartDate: '',
    urgencyLevel: '',
    responseDeadline: '',
    
    // Case Details
    caseSummary: '',
    desiredOutcome: '',
    previousAttempts: '',
    
    // Legal Preferences
    representationPreference: '',
    legalBudget: '',
    
    // Consent
    privacyConsent: false,
    attorneyMatchConsent: false
  })

  const totalSteps = 8
  const progress = (currentStep / totalSteps) * 100

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      
      // Submit data to backend API
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        // Show success message with case number
        alert(`Case submitted successfully! Your case number is: ${result.case.case_number}. You will receive a confirmation email shortly.`)
        onClose()
      } else {
        throw new Error(result.error || 'Failed to submit case')
      }
    } catch (error) {
      console.error('Error submitting case:', error)
      alert('There was an error submitting your case. Please try again or contact support.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Information</h2>
              <p className="text-gray-600">Let's start with your basic contact details</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  placeholder="Enter your first name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                placeholder="(615) 555-0123"
                required
              />
            </div>

            <div>
              <Label>Preferred Contact Method *</Label>
              <RadioGroup
                value={formData.preferredContact}
                onValueChange={(value) => updateFormData('preferredContact', value)}
                className="flex space-x-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="contact-email" />
                  <Label htmlFor="contact-email" className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="phone" id="contact-phone" />
                  <Label htmlFor="contact-phone" className="flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span>Phone</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="text" id="contact-text" />
                  <Label htmlFor="contact-text" className="flex items-center space-x-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>Text</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                placeholder="123 Main Street"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateFormData('city', e.target.value)}
                  placeholder="Nashville"
                  required
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => updateFormData('zipCode', e.target.value)}
                  placeholder="37201"
                  required
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tenant Information</h2>
              <p className="text-gray-600">Help us understand your situation and eligibility for assistance</p>
            </div>

            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => updateFormData('age', e.target.value)}
                placeholder="Enter your age"
              />
              {formData.age >= 60 && (
                <Badge variant="secondary" className="mt-2">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Senior citizen protections may apply
                </Badge>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="disabled"
                  checked={formData.isDisabled}
                  onCheckedChange={(checked) => updateFormData('isDisabled', checked)}
                />
                <Label htmlFor="disabled">I have a disability</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasChildren"
                  checked={formData.hasChildren}
                  onCheckedChange={(checked) => updateFormData('hasChildren', checked)}
                />
                <Label htmlFor="hasChildren">I have children under 18 in my household</Label>
              </div>
            </div>

            <div>
              <Label>Household Income (Annual)</Label>
              <Select value={formData.householdIncome} onValueChange={(value) => updateFormData('householdIncome', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select income range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under-30k">Under $30,000 (Qualifies for free legal aid)</SelectItem>
                  <SelectItem value="30k-50k">$30,000 - $50,000</SelectItem>
                  <SelectItem value="50k-75k">$50,000 - $75,000</SelectItem>
                  <SelectItem value="75k-100k">$75,000 - $100,000</SelectItem>
                  <SelectItem value="over-100k">Over $100,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Primary Language</Label>
              <Select value={formData.primaryLanguage} onValueChange={(value) => updateFormData('primaryLanguage', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select primary language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.primaryLanguage !== 'english' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="needsInterpreter"
                  checked={formData.needsInterpreter}
                  onCheckedChange={(checked) => updateFormData('needsInterpreter', checked)}
                />
                <Label htmlFor="needsInterpreter">I need interpreter services</Label>
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Information</h2>
              <p className="text-gray-600">Tell us about your rental property</p>
            </div>

            <div>
              <Label htmlFor="propertyAddress">Rental Property Address *</Label>
              <Input
                id="propertyAddress"
                value={formData.propertyAddress}
                onChange={(e) => updateFormData('propertyAddress', e.target.value)}
                placeholder="123 Rental Street, Nashville, TN"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Property Type *</Label>
                <Select value={formData.propertyType} onValueChange={(value) => updateFormData('propertyType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="condo">Condominium</SelectItem>
                    <SelectItem value="room">Room/Shared Housing</SelectItem>
                    <SelectItem value="mobile-home">Mobile Home</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bedrooms">Number of Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => updateFormData('bedrooms', e.target.value)}
                  placeholder="2"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthlyRent">Monthly Rent Amount *</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  value={formData.monthlyRent}
                  onChange={(e) => updateFormData('monthlyRent', e.target.value)}
                  placeholder="1200"
                  required
                />
              </div>
              <div>
                <Label htmlFor="securityDeposit">Security Deposit Paid</Label>
                <Input
                  id="securityDeposit"
                  type="number"
                  value={formData.securityDeposit}
                  onChange={(e) => updateFormData('securityDeposit', e.target.value)}
                  placeholder="1200"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="moveInDate">Move-in Date *</Label>
              <Input
                id="moveInDate"
                type="date"
                value={formData.moveInDate}
                onChange={(e) => updateFormData('moveInDate', e.target.value)}
                required
              />
            </div>

            <div>
              <Label>Lease Type *</Label>
              <RadioGroup
                value={formData.leaseType}
                onValueChange={(value) => updateFormData('leaseType', value)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="written-lease" id="written-lease" />
                  <Label htmlFor="written-lease">Written lease agreement</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="oral-agreement" id="oral-agreement" />
                  <Label htmlFor="oral-agreement">Oral/verbal agreement</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="month-to-month" id="month-to-month" />
                  <Label htmlFor="month-to-month">Month-to-month</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasGovernmentAssistance"
                checked={formData.hasGovernmentAssistance}
                onCheckedChange={(checked) => updateFormData('hasGovernmentAssistance', checked)}
              />
              <Label htmlFor="hasGovernmentAssistance">I receive government housing assistance (Section 8, etc.)</Label>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Landlord Information</h2>
              <p className="text-gray-600">Provide details about your landlord or property manager</p>
            </div>

            <div>
              <Label htmlFor="landlordName">Landlord/Property Manager Name *</Label>
              <Input
                id="landlordName"
                value={formData.landlordName}
                onChange={(e) => updateFormData('landlordName', e.target.value)}
                placeholder="John Smith or ABC Property Management"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="landlordPhone">Landlord Phone Number</Label>
                <Input
                  id="landlordPhone"
                  type="tel"
                  value={formData.landlordPhone}
                  onChange={(e) => updateFormData('landlordPhone', e.target.value)}
                  placeholder="(615) 555-0123"
                />
              </div>
              <div>
                <Label htmlFor="landlordEmail">Landlord Email</Label>
                <Input
                  id="landlordEmail"
                  type="email"
                  value={formData.landlordEmail}
                  onChange={(e) => updateFormData('landlordEmail', e.target.value)}
                  placeholder="landlord@example.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="landlordAddress">Landlord Mailing Address</Label>
              <Textarea
                id="landlordAddress"
                value={formData.landlordAddress}
                onChange={(e) => updateFormData('landlordAddress', e.target.value)}
                placeholder="123 Business St, Nashville, TN 37201"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="propertyManager">Property Management Company (if different from landlord)</Label>
              <Input
                id="propertyManager"
                value={formData.propertyManager}
                onChange={(e) => updateFormData('propertyManager', e.target.value)}
                placeholder="ABC Property Management LLC"
              />
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Legal Issue Details</h2>
              <p className="text-gray-600">What type of housing problem are you experiencing?</p>
            </div>

            <div>
              <Label>Type of Housing Issue (Select all that apply) *</Label>
              <div className="grid md:grid-cols-2 gap-3 mt-3">
                {[
                  'Eviction Notice Received',
                  'Rent Increase Dispute',
                  'Habitability Issues (repairs, mold, pests)',
                  'Security Deposit Problems',
                  'Lease Violations',
                  'Landlord Harassment',
                  'Discrimination',
                  'Utility Issues',
                  'Privacy/Entry Violations',
                  'Other Housing Issues'
                ].map((issue) => (
                  <div key={issue} className="flex items-center space-x-2">
                    <Checkbox
                      id={issue}
                      checked={formData.disputeType.includes(issue)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateFormData('disputeType', [...formData.disputeType, issue])
                        } else {
                          updateFormData('disputeType', formData.disputeType.filter(type => type !== issue))
                        }
                      }}
                    />
                    <Label htmlFor={issue} className="text-sm">{issue}</Label>
                  </div>
                ))}
              </div>
            </div>

            {formData.disputeType.includes('Eviction Notice Received') && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-800 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Eviction Notice Details
                  </CardTitle>
                  <CardDescription>
                    Time is critical for eviction cases. Please provide details about your eviction notice.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Type of Eviction Notice</Label>
                    <Select value={formData.evictionNoticeType} onValueChange={(value) => updateFormData('evictionNoticeType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select notice type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pay-or-quit">Pay Rent or Quit</SelectItem>
                        <SelectItem value="cure-or-quit">Cure or Quit (lease violation)</SelectItem>
                        <SelectItem value="unconditional-quit">Unconditional Quit</SelectItem>
                        <SelectItem value="no-cause">No Cause/End of Lease</SelectItem>
                        <SelectItem value="court-summons">Court Summons Received</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="evictionNoticeDate">Date Notice Received</Label>
                      <Input
                        id="evictionNoticeDate"
                        type="date"
                        value={formData.evictionNoticeDate}
                        onChange={(e) => updateFormData('evictionNoticeDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="courtDate">Court Date (if applicable)</Label>
                      <Input
                        id="courtDate"
                        type="date"
                        value={formData.courtDate}
                        onChange={(e) => updateFormData('courtDate', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="amountOwed">Amount Owed (if for non-payment)</Label>
                    <Input
                      id="amountOwed"
                      type="number"
                      value={formData.amountOwed}
                      onChange={(e) => updateFormData('amountOwed', e.target.value)}
                      placeholder="1200.00"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <div>
              <Label>How urgent is your situation?</Label>
              <RadioGroup
                value={formData.urgencyLevel}
                onValueChange={(value) => updateFormData('urgencyLevel', value)}
                className="space-y-2 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="immediate" id="immediate" />
                  <Label htmlFor="immediate" className="text-red-600 font-medium">
                    Immediate (court date within 7 days)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="urgent" id="urgent" />
                  <Label htmlFor="urgent" className="text-orange-600 font-medium">
                    Urgent (court date within 2 weeks)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="soon" id="soon" />
                  <Label htmlFor="soon">
                    Soon (need help within a month)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="planning" id="planning" />
                  <Label htmlFor="planning">
                    Planning ahead (no immediate deadline)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Case Summary</h2>
              <p className="text-gray-600">Help us understand your situation in detail</p>
            </div>

            <div>
              <Label htmlFor="problemStartDate">When did this problem start?</Label>
              <Input
                id="problemStartDate"
                type="date"
                value={formData.problemStartDate}
                onChange={(e) => updateFormData('problemStartDate', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="caseSummary">Describe your situation *</Label>
              <Textarea
                id="caseSummary"
                value={formData.caseSummary}
                onChange={(e) => updateFormData('caseSummary', e.target.value)}
                placeholder="Please describe what happened, when it started, and any relevant details about your housing situation..."
                rows={6}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Include important dates, communications with your landlord, and any actions you've already taken.
              </p>
            </div>

            <div>
              <Label htmlFor="desiredOutcome">What outcome are you hoping for? *</Label>
              <Textarea
                id="desiredOutcome"
                value={formData.desiredOutcome}
                onChange={(e) => updateFormData('desiredOutcome', e.target.value)}
                placeholder="For example: Stay in my apartment, get repairs made, recover security deposit, stop harassment..."
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="previousAttempts">Have you tried to resolve this issue before?</Label>
              <Textarea
                id="previousAttempts"
                value={formData.previousAttempts}
                onChange={(e) => updateFormData('previousAttempts', e.target.value)}
                placeholder="Describe any previous attempts to contact your landlord, file complaints, or seek help..."
                rows={3}
              />
            </div>
          </div>
        )

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Legal Representation</h2>
              <p className="text-gray-600">Let us know your preferences for legal assistance</p>
            </div>

            <div>
              <Label>What type of legal assistance are you looking for?</Label>
              <RadioGroup
                value={formData.representationPreference}
                onValueChange={(value) => updateFormData('representationPreference', value)}
                className="space-y-3 mt-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="self-help" id="self-help" />
                  <Label htmlFor="self-help">
                    <div>
                      <div className="font-medium">Self-Help Resources</div>
                      <div className="text-sm text-gray-600">Forms, guides, and information to represent myself</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="limited-assistance" id="limited-assistance" />
                  <Label htmlFor="limited-assistance">
                    <div>
                      <div className="font-medium">Limited Legal Assistance</div>
                      <div className="text-sm text-gray-600">Help with specific tasks like document review or court prep</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full-representation" id="full-representation" />
                  <Label htmlFor="full-representation">
                    <div>
                      <div className="font-medium">Full Legal Representation</div>
                      <div className="text-sm text-gray-600">Attorney handles my entire case</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not-sure" id="not-sure" />
                  <Label htmlFor="not-sure">
                    <div>
                      <div className="font-medium">Not Sure</div>
                      <div className="text-sm text-gray-600">Help me determine what I need</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Budget for Legal Services</Label>
              <Select value={formData.legalBudget} onValueChange={(value) => updateFormData('legalBudget', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free-only">Free services only</SelectItem>
                  <SelectItem value="under-500">Under $500</SelectItem>
                  <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                  <SelectItem value="1000-2500">$1,000 - $2,500</SelectItem>
                  <SelectItem value="over-2500">Over $2,500</SelectItem>
                  <SelectItem value="payment-plan">Need payment plan options</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">TenantGuard Cost Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700">
                  Our platform reduces average legal costs by 60% - from $2,500 to $1,000 - through 
                  streamlined case preparation and attorney matching.
                </p>
              </CardContent>
            </Card>
          </div>
        )

      case 8:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Submit</h2>
              <p className="text-gray-600">Please review your information and provide consent</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Case Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div><strong>Name:</strong> {formData.firstName} {formData.lastName}</div>
                <div><strong>Contact:</strong> {formData.email} | {formData.phone}</div>
                <div><strong>Property:</strong> {formData.propertyAddress}</div>
                <div><strong>Issue Type:</strong> {formData.disputeType.join(', ')}</div>
                <div><strong>Urgency:</strong> {formData.urgencyLevel}</div>
                <div><strong>Representation Preference:</strong> {formData.representationPreference}</div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="privacyConsent"
                  checked={formData.privacyConsent}
                  onCheckedChange={(checked) => updateFormData('privacyConsent', checked)}
                  required
                />
                <Label htmlFor="privacyConsent" className="text-sm">
                  I agree to the <a href="#" className="text-red-800 underline">Privacy Policy</a> and 
                  <a href="#" className="text-red-800 underline ml-1">Terms of Service</a>. 
                  I understand that this information will be used to match me with appropriate legal resources.
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="attorneyMatchConsent"
                  checked={formData.attorneyMatchConsent}
                  onCheckedChange={(checked) => updateFormData('attorneyMatchConsent', checked)}
                />
                <Label htmlFor="attorneyMatchConsent" className="text-sm">
                  I consent to being matched with qualified attorneys and understand that 
                  TenantGuard does not provide legal advice directly.
                </Label>
              </div>
            </div>

            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800">What Happens Next?</CardTitle>
              </CardHeader>
              <CardContent className="text-green-700 space-y-2">
                <p>• We'll review your case within 24 hours</p>
                <p>• You'll receive an email with next steps and resources</p>
                <p>• If attorney representation is needed, we'll connect you with qualified lawyers</p>
                <p>• Emergency cases (court dates within 7 days) are prioritized</p>
              </CardContent>
            </Card>
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
              <h1 className="text-2xl font-bold">TenantGuard Case Intake</h1>
              <p className="text-red-100">Step {currentStep} of {totalSteps}</p>
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
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
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
              disabled={isSubmitting}
              className="bg-red-800 hover:bg-red-900 text-white flex items-center space-x-2 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Case'}</span>
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
  )
}

export default CaseIntakeForm
