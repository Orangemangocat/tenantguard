import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'

const initialData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  firmName: '',
  firmAddress: '',
  firmZip: '',
  barNumber: '',
  barState: '',
  barAdmissionDate: '',
  lawSchool: '',
  graduationYear: '',
  yearsExperience: '',
  landlordTenantExperience: '',
  evictionExperience: '',
  responseTime: '',
  hourlyRate: '',
  feeStructurePreference: '',
  leadBudget: '',
  leadVolume: '',
  leadQuality: '',
  motivation: '',
  termsAccepted: false,
  privacyConsent: false
}

const formatIsoNow = () => new Date().toISOString()

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `msg-${Math.random().toString(36).slice(2)}`
}

const AttorneyIntakeChat = () => {
  const [messages, setMessages] = useState([
    {
      id: generateId(),
      role: 'assistant',
      content: 'Thanks for your interest in joining TenantGuard. I will collect a few required details to process your application.',
      timestampUtc: formatIsoNow()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [stepIndex, setStepIndex] = useState(0)
  const [intakeData, setIntakeData] = useState(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [applicationId, setApplicationId] = useState('')
  const chatContainerRef = useRef(null)

  const appendMessage = (role, content) => {
    setMessages((prev) => [
      ...prev,
      {
        id: generateId(),
        role,
        content,
        timestampUtc: formatIsoNow()
      }
    ])
  }

  const steps = useMemo(() => ([
    {
      id: 'firstName',
      prompt: 'First name?',
      inputType: 'text',
      apply: (value) => setIntakeData((prev) => ({ ...prev, firstName: value }))
    },
    {
      id: 'lastName',
      prompt: 'Last name?',
      inputType: 'text',
      apply: (value) => setIntakeData((prev) => ({ ...prev, lastName: value }))
    },
    {
      id: 'email',
      prompt: 'Email address?',
      inputType: 'text',
      apply: (value) => setIntakeData((prev) => ({ ...prev, email: value }))
    },
    {
      id: 'phone',
      prompt: 'Phone number?',
      inputType: 'text',
      apply: (value) => setIntakeData((prev) => ({ ...prev, phone: value }))
    },
    {
      id: 'firmName',
      prompt: 'Law firm name?',
      inputType: 'text',
      apply: (value) => setIntakeData((prev) => ({ ...prev, firmName: value }))
    },
    {
      id: 'firmAddress',
      prompt: 'Firm address?',
      inputType: 'text',
      apply: (value) => setIntakeData((prev) => ({ ...prev, firmAddress: value }))
    },
    {
      id: 'firmZip',
      prompt: 'Firm ZIP code?',
      inputType: 'text',
      apply: (value) => setIntakeData((prev) => ({ ...prev, firmZip: value }))
    },
    {
      id: 'barNumber',
      prompt: 'Bar number?',
      inputType: 'text',
      apply: (value) => setIntakeData((prev) => ({ ...prev, barNumber: value }))
    },
    {
      id: 'barState',
      prompt: 'Bar state?',
      inputType: 'text',
      apply: (value) => setIntakeData((prev) => ({ ...prev, barState: value }))
    },
    {
      id: 'barAdmissionDate',
      prompt: 'Bar admission date?',
      inputType: 'date',
      apply: (value) => setIntakeData((prev) => ({ ...prev, barAdmissionDate: value }))
    },
    {
      id: 'lawSchool',
      prompt: 'Law school?',
      inputType: 'text',
      apply: (value) => setIntakeData((prev) => ({ ...prev, lawSchool: value }))
    },
    {
      id: 'graduationYear',
      prompt: 'Graduation year?',
      inputType: 'text',
      apply: (value) => setIntakeData((prev) => ({ ...prev, graduationYear: value }))
    },
    {
      id: 'yearsExperience',
      prompt: 'Years of experience?',
      inputType: 'text',
      apply: (value) => setIntakeData((prev) => ({ ...prev, yearsExperience: value }))
    },
    {
      id: 'landlordTenantExperience',
      prompt: 'Landlord-tenant experience level?',
      inputType: 'choice',
      choices: [
        { label: 'Minimal', value: 'minimal' },
        { label: 'Moderate', value: 'moderate' },
        { label: 'Extensive', value: 'extensive' }
      ],
      apply: (value) => setIntakeData((prev) => ({ ...prev, landlordTenantExperience: value }))
    },
    {
      id: 'evictionExperience',
      prompt: 'Eviction defense experience?',
      inputType: 'choice',
      choices: [
        { label: 'Minimal', value: 'minimal' },
        { label: 'Moderate', value: 'moderate' },
        { label: 'Extensive', value: 'extensive' }
      ],
      apply: (value) => setIntakeData((prev) => ({ ...prev, evictionExperience: value }))
    },
    {
      id: 'responseTime',
      prompt: 'Typical response time to new leads?',
      inputType: 'choice',
      choices: [
        { label: 'Same day', value: 'same-day' },
        { label: '1-2 days', value: '1-2-days' },
        { label: '3-5 days', value: '3-5-days' }
      ],
      apply: (value) => setIntakeData((prev) => ({ ...prev, responseTime: value }))
    },
    {
      id: 'hourlyRate',
      prompt: 'Hourly rate (USD)?',
      inputType: 'text',
      apply: (value) => setIntakeData((prev) => ({ ...prev, hourlyRate: value }))
    },
    {
      id: 'feeStructurePreference',
      prompt: 'Fee structure preference?',
      inputType: 'choice',
      choices: [
        { label: 'Hourly', value: 'hourly' },
        { label: 'Flat fee', value: 'flat-fee' },
        { label: 'Hybrid', value: 'hybrid' }
      ],
      apply: (value) => setIntakeData((prev) => ({ ...prev, feeStructurePreference: value }))
    },
    {
      id: 'leadBudget',
      prompt: 'Monthly lead budget?',
      inputType: 'choice',
      choices: [
        { label: '$0 - $250', value: '0-250' },
        { label: '$250 - $1,000', value: '250-1000' },
        { label: '$1,000+', value: '1000+' }
      ],
      apply: (value) => setIntakeData((prev) => ({ ...prev, leadBudget: value }))
    },
    {
      id: 'leadVolume',
      prompt: 'Preferred lead volume per month?',
      inputType: 'choice',
      choices: [
        { label: '1-5', value: '1-5' },
        { label: '6-15', value: '6-15' },
        { label: '16+', value: '16+' }
      ],
      apply: (value) => setIntakeData((prev) => ({ ...prev, leadVolume: value }))
    },
    {
      id: 'leadQuality',
      prompt: 'Lead quality preference?',
      inputType: 'choice',
      choices: [
        { label: 'High qualification only', value: 'high' },
        { label: 'Balanced', value: 'balanced' },
        { label: 'High volume', value: 'volume' }
      ],
      apply: (value) => setIntakeData((prev) => ({ ...prev, leadQuality: value }))
    },
    {
      id: 'motivation',
      prompt: 'Why do you want to join TenantGuard?',
      inputType: 'text',
      apply: (value) => setIntakeData((prev) => ({ ...prev, motivation: value }))
    },
    {
      id: 'termsAccepted',
      prompt: 'Do you accept the terms of service?',
      inputType: 'choice',
      choices: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' }
      ],
      apply: (value) => setIntakeData((prev) => ({ ...prev, termsAccepted: value === 'yes' }))
    },
    {
      id: 'privacyConsent',
      prompt: 'Do you consent to the privacy policy?',
      inputType: 'choice',
      choices: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' }
      ],
      apply: (value) => setIntakeData((prev) => ({ ...prev, privacyConsent: value === 'yes' }))
    }
  ]), [intakeData])

  const currentStep = steps[stepIndex]
  const isComplete = stepIndex >= steps.length

  useEffect(() => {
    if (!chatContainerRef.current) return
    chatContainerRef.current.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth'
    })
  }, [messages])

  useEffect(() => {
    if (!currentStep || isComplete) return
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.content !== currentStep.prompt || lastMessage.role !== 'assistant') {
      appendMessage('assistant', currentStep.prompt)
    }
  }, [currentStep, isComplete, messages])

  const handleAnswer = (value) => {
    if (!currentStep) return
    const trimmed = value.trim()
    if (!trimmed) return
    appendMessage('user', trimmed)
    currentStep.apply(trimmed)
    setInputValue('')
    setStepIndex((prev) => prev + 1)
  }

  const handleSubmit = async () => {
    setSubmitError('')
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/attorneys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intakeData)
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit attorney application')
      }

      setApplicationId(result.attorney.application_id)
    } catch (error) {
      setSubmitError(error?.message || 'Failed to submit attorney application')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-10 px-4">
        <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-white">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">Attorney Intake Chat</CardTitle>
                  <p className="text-sm text-gray-500">Required application details</p>
                </div>
                <div className="text-sm text-gray-500">
                  Step {Math.min(stepIndex + 1, steps.length)} of {steps.length}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div
                ref={chatContainerRef}
                className="h-[60vh] overflow-y-auto px-6 py-5 space-y-4 bg-gradient-to-br from-white via-gray-50 to-white"
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        message.role === 'user'
                          ? 'bg-red-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isComplete && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    Intake questions complete. Submit when ready.
                  </div>
                )}
              </div>
              <div className="border-t bg-white px-6 py-4">
                {!isComplete && currentStep && (
                  <div className="flex flex-col gap-3">
                    {currentStep.inputType === 'choice' && (
                      <div className="flex flex-wrap gap-2">
                        {currentStep.choices?.map((choice) => (
                          <Button
                            key={choice.value}
                            variant="outline"
                            onClick={() => handleAnswer(choice.value)}
                          >
                            {choice.label}
                          </Button>
                        ))}
                      </div>
                    )}
                    {currentStep.inputType !== 'choice' && (
                      <div className="flex flex-wrap gap-3">
                        <input
                          className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          type={currentStep.inputType === 'date' ? 'date' : 'text'}
                          value={inputValue}
                          onChange={(event) => setInputValue(event.target.value)}
                          placeholder="Type your answer"
                        />
                        <Button onClick={() => handleAnswer(inputValue)} disabled={!inputValue.trim()}>
                          Send
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                {isComplete && (
                  <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : 'Submit application'}
                    </Button>
                    {applicationId && (
                      <span className="text-sm text-emerald-700">
                        Application submitted. ID: {applicationId}
                      </span>
                    )}
                    {submitError && <span className="text-sm text-red-600">{submitError}</span>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>Firm: {intakeData.firmName || 'Unknown'}</p>
                <p>Bar state: {intakeData.barState || 'Unknown'}</p>
                <p>Experience: {intakeData.yearsExperience || 'Unknown'}</p>
                <p>Response time: {intakeData.responseTime || 'Unknown'}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Required Consents</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <p>Terms accepted: {intakeData.termsAccepted ? 'Yes' : 'No'}</p>
                <p>Privacy consent: {intakeData.privacyConsent ? 'Yes' : 'No'}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AttorneyIntakeChat
