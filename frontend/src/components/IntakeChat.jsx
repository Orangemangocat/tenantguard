import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'

const initialData = {
  state: '',
  county: '',
  rentalAddress: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  preferredContact: '',
  monthlyRent: '',
  evictionNoticeReceived: null,
  evictionNoticeType: '',
  evictionNoticeReceivedDate: '',
  evictionNoticeDocumentDate: '',
  evictionDeliveryMethod: '',
  courtDate: '',
  amountOwed: '',
  lastPaymentDate: '',
  rentAcceptedAfterNotice: null,
  rentAcceptedDates: '',
  warningDetails: '',
  leaseType: '',
  leaseStartDate: '',
  leaseEndDate: '',
  moveInDate: '',
  housingAssistance: null,
  landlordName: '',
  issueType: '',
  habitabilityIssues: '',
  habitabilityFirstReportDate: '',
  habitabilityReportMethod: '',
  habitabilityEvidence: '',
  retaliationAction: '',
  retaliationActionDate: '',
  retaliationResponse: '',
  retaliationResponseDate: '',
  discriminationDetails: '',
  discriminationDate: '',
  urgencyLevel: '',
  caseSummary: '',
  desiredOutcome: '',
  evidenceList: ''
}

const formatIsoNow = () => new Date().toISOString()

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `msg-${Math.random().toString(36).slice(2)}`
}

const buildConversationPayload = (conversationId, messages) => ({
  conversation_id: conversationId,
  platform: 'in-app-chat',
  created_utc: messages[0]?.timestampUtc || formatIsoNow(),
  messages: messages.map((message) => ({
    id: message.id,
    role: message.role,
    timestamp_utc: message.timestampUtc,
    content: message.content
  }))
})

const IntakeChat = () => {
  const [messages, setMessages] = useState([
    {
      id: generateId(),
      role: 'assistant',
      content: 'I can help organize your information and documents. I am not a lawyer and cannot guarantee outcomes.',
      timestampUtc: formatIsoNow()
    },
    {
      id: generateId(),
      role: 'assistant',
      content: 'We will focus on dates, notices, and evidence to build a clear timeline.',
      timestampUtc: formatIsoNow()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [stepIndex, setStepIndex] = useState(0)
  const [intakeData, setIntakeData] = useState(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [caseNumber, setCaseNumber] = useState('')
  const [conversationId] = useState(generateId())
  const chatContainerRef = useRef(null)
  const shouldStickToBottomRef = useRef(true)

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

  const updateJurisdiction = (value) => {
    const parts = value.split(',').map((part) => part.trim())
    let county = ''
    let state = ''
    if (parts.length >= 2) {
      county = parts[0]
      state = parts[1]
    } else if (value.toLowerCase().includes('tennessee') || value.toLowerCase().includes('tn')) {
      state = 'TN'
      county = value.replace(/tennessee|tn/gi, '').trim()
    } else {
      state = value.trim()
    }
    setIntakeData((prev) => ({
      ...prev,
      county: county || prev.county,
      state: state || prev.state
    }))
  }

  const steps = useMemo(() => {
    const list = [
      {
        id: 'jurisdiction',
        prompt: 'What state and county is the rental property in?',
        inputType: 'text',
        apply: (value) => updateJurisdiction(value)
      },
      {
        id: 'rentalAddress',
        prompt: 'What is the rental property address?',
        inputType: 'text',
        apply: (value) => setIntakeData((prev) => ({ ...prev, rentalAddress: value }))
      },
      {
        id: 'landlordName',
        prompt: 'What is the landlord or property manager name (individual or company)?',
        inputType: 'text',
        apply: (value) => setIntakeData((prev) => ({ ...prev, landlordName: value }))
      },
      {
        id: 'firstName',
        prompt: 'What is your first name?',
        inputType: 'text',
        apply: (value) => setIntakeData((prev) => ({ ...prev, firstName: value }))
      },
      {
        id: 'lastName',
        prompt: 'What is your last name?',
        inputType: 'text',
        apply: (value) => setIntakeData((prev) => ({ ...prev, lastName: value }))
      },
      {
        id: 'email',
        prompt: 'What is your email address?',
        inputType: 'text',
        apply: (value) => setIntakeData((prev) => ({ ...prev, email: value }))
      },
      {
        id: 'phone',
        prompt: 'What is the best phone number to reach you?',
        inputType: 'text',
        apply: (value) => setIntakeData((prev) => ({ ...prev, phone: value }))
      },
      {
        id: 'preferredContact',
        prompt: 'How should we contact you?',
        inputType: 'choice',
        choices: [
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
          { label: 'Text', value: 'text' }
        ],
        apply: (value) => setIntakeData((prev) => ({ ...prev, preferredContact: value }))
      },
      {
        id: 'monthlyRent',
        prompt: 'What is your monthly rent amount?',
        inputType: 'text',
        apply: (value) => setIntakeData((prev) => ({ ...prev, monthlyRent: value }))
      },
      {
        id: 'evictionNoticeReceived',
        prompt: 'Have you received a written eviction notice or court papers?',
        inputType: 'choice',
        choices: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' }
        ],
        apply: (value) =>
          setIntakeData((prev) => ({ ...prev, evictionNoticeReceived: value === 'yes' }))
      }
    ]

    if (intakeData.evictionNoticeReceived === true) {
      list.push(
        {
          id: 'evictionNoticeType',
          prompt: 'What type of notice did you receive?',
          inputType: 'choice',
          choices: [
            { label: '3-day', value: '3-day' },
            { label: '10-day', value: '10-day' },
            { label: '14-day', value: '14-day' },
            { label: '30-day', value: '30-day' },
            { label: 'Pay or quit', value: 'pay-or-quit' },
            { label: 'Cure or quit', value: 'cure-or-quit' },
            { label: 'No-cause', value: 'no-cause' },
            { label: 'Court summons', value: 'court-summons' },
            { label: 'Other', value: 'other' }
          ],
          apply: (value) => setIntakeData((prev) => ({ ...prev, evictionNoticeType: value }))
        },
        {
          id: 'evictionNoticeReceivedDate',
          prompt: 'What date did you receive the notice? (Use exact date or unknown.)',
          inputType: 'date',
          allowUnknown: true,
          apply: (value) =>
            setIntakeData((prev) => ({ ...prev, evictionNoticeReceivedDate: value }))
        },
        {
          id: 'evictionNoticeDocumentDate',
          prompt: 'What date is printed on the notice? (Use exact date or unknown.)',
          inputType: 'date',
          allowUnknown: true,
          apply: (value) =>
            setIntakeData((prev) => ({ ...prev, evictionNoticeDocumentDate: value }))
        },
        {
          id: 'evictionDeliveryMethod',
          prompt: 'How was the notice delivered?',
          inputType: 'choice',
          choices: [
            { label: 'Posted', value: 'posted' },
            { label: 'Mailed', value: 'mailed' },
            { label: 'Handed to me', value: 'handed' },
            { label: 'Other', value: 'other' }
          ],
          apply: (value) => setIntakeData((prev) => ({ ...prev, evictionDeliveryMethod: value }))
        },
        {
          id: 'courtDate',
          prompt: 'Is there a court date listed? (If yes, provide the date or use unknown.)',
          inputType: 'date',
          allowUnknown: true,
          apply: (value) => setIntakeData((prev) => ({ ...prev, courtDate: value }))
        }
      )
    } else if (intakeData.evictionNoticeReceived === false) {
      list.push({
        id: 'warningDetails',
        prompt: 'Have you received any written warnings or threats of eviction? If yes, provide dates.',
        inputType: 'text',
        apply: (value) => setIntakeData((prev) => ({ ...prev, warningDetails: value }))
      })
    }

    list.push(
      {
        id: 'amountOwed',
        prompt: 'Is there any amount owed right now? If yes, how much?',
        inputType: 'text',
        apply: (value) => setIntakeData((prev) => ({ ...prev, amountOwed: value }))
      },
      {
        id: 'lastPaymentDate',
        prompt: 'When was the last rent payment made? (Use exact date or unknown.)',
        inputType: 'date',
        allowUnknown: true,
        apply: (value) => setIntakeData((prev) => ({ ...prev, lastPaymentDate: value }))
      },
      {
        id: 'rentAcceptedAfterNotice',
        prompt: 'Has the landlord accepted any rent after the notice?',
        inputType: 'choice',
        choices: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' }
        ],
        apply: (value) =>
          setIntakeData((prev) => ({ ...prev, rentAcceptedAfterNotice: value === 'yes' }))
      }
    )

    if (intakeData.rentAcceptedAfterNotice === true) {
      list.push({
        id: 'rentAcceptedDates',
        prompt: 'What dates were those payments accepted?',
        inputType: 'text',
        apply: (value) => setIntakeData((prev) => ({ ...prev, rentAcceptedDates: value }))
      })
    }

    list.push(
      {
        id: 'leaseType',
        prompt: 'Do you have a written lease?',
        inputType: 'choice',
        choices: [
          { label: 'Written lease', value: 'written' },
          { label: 'Month-to-month', value: 'month-to-month' },
          { label: 'Oral agreement', value: 'oral' }
        ],
        apply: (value) => setIntakeData((prev) => ({ ...prev, leaseType: value }))
      }
    )

    if (intakeData.leaseType === 'written') {
      list.push(
        {
          id: 'leaseStartDate',
          prompt: 'What is the lease start date? (Use exact date or unknown.)',
          inputType: 'date',
          allowUnknown: true,
          apply: (value) => setIntakeData((prev) => ({ ...prev, leaseStartDate: value }))
        },
        {
          id: 'leaseEndDate',
          prompt: 'What is the lease end date? (Use exact date or unknown.)',
          inputType: 'date',
          allowUnknown: true,
          apply: (value) => setIntakeData((prev) => ({ ...prev, leaseEndDate: value }))
        }
      )
    } else if (intakeData.leaseType) {
      list.push({
        id: 'moveInDate',
        prompt: 'When did you move in? (Use exact date or unknown.)',
        inputType: 'date',
        allowUnknown: true,
        apply: (value) => setIntakeData((prev) => ({ ...prev, moveInDate: value }))
      })
    }

    list.push(
      {
        id: 'housingAssistance',
        prompt: 'Do you receive housing assistance (Section 8 or similar)?',
        inputType: 'choice',
        choices: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' }
        ],
        apply: (value) => setIntakeData((prev) => ({ ...prev, housingAssistance: value === 'yes' }))
      },
      {
        id: 'issueType',
        prompt: 'What is the main issue you need help with?',
        inputType: 'choice',
        choices: [
          { label: 'Non-payment', value: 'non-payment' },
          { label: 'Repairs / habitability', value: 'habitability' },
          { label: 'Retaliation', value: 'retaliation' },
          { label: 'Discrimination', value: 'discrimination' },
          { label: 'Lease violation', value: 'lease-violation' },
          { label: 'Other', value: 'other' }
        ],
        apply: (value) => setIntakeData((prev) => ({ ...prev, issueType: value }))
      }
    )

    if (intakeData.issueType === 'habitability') {
      list.push(
        {
          id: 'habitabilityIssues',
          prompt: 'Describe the repair or habitability issues (mold, pests, leaks, no heat, etc.).',
          inputType: 'text',
          apply: (value) => setIntakeData((prev) => ({ ...prev, habitabilityIssues: value }))
        },
        {
          id: 'habitabilityFirstReportDate',
          prompt: 'When did you first report these issues? (Use exact date or unknown.)',
          inputType: 'date',
          allowUnknown: true,
          apply: (value) =>
            setIntakeData((prev) => ({ ...prev, habitabilityFirstReportDate: value }))
        },
        {
          id: 'habitabilityReportMethod',
          prompt: 'How did you report them?',
          inputType: 'choice',
          choices: [
            { label: 'Text', value: 'text' },
            { label: 'Email', value: 'email' },
            { label: 'Portal', value: 'portal' },
            { label: 'Letter', value: 'letter' },
            { label: 'In person', value: 'in-person' }
          ],
          apply: (value) =>
            setIntakeData((prev) => ({ ...prev, habitabilityReportMethod: value }))
        },
        {
          id: 'habitabilityEvidence',
          prompt: 'Do you have photos, videos, or inspection reports? If yes, list them.',
          inputType: 'text',
          apply: (value) => setIntakeData((prev) => ({ ...prev, habitabilityEvidence: value }))
        }
      )
    }

    if (intakeData.issueType === 'retaliation') {
      list.push(
        {
          id: 'retaliationAction',
          prompt: 'What did you do before the landlord response (repair request, complaint, etc.)?',
          inputType: 'text',
          apply: (value) => setIntakeData((prev) => ({ ...prev, retaliationAction: value }))
        },
        {
          id: 'retaliationActionDate',
          prompt: 'What date did you take that action? (Use exact date or unknown.)',
          inputType: 'date',
          allowUnknown: true,
          apply: (value) =>
            setIntakeData((prev) => ({ ...prev, retaliationActionDate: value }))
        },
        {
          id: 'retaliationResponse',
          prompt: 'What happened after? Describe the landlord response.',
          inputType: 'text',
          apply: (value) => setIntakeData((prev) => ({ ...prev, retaliationResponse: value }))
        },
        {
          id: 'retaliationResponseDate',
          prompt: 'What date did the response happen? (Use exact date or unknown.)',
          inputType: 'date',
          allowUnknown: true,
          apply: (value) =>
            setIntakeData((prev) => ({ ...prev, retaliationResponseDate: value }))
        }
      )
    }

    if (intakeData.issueType === 'discrimination') {
      list.push(
        {
          id: 'discriminationDetails',
          prompt: 'Describe what was said or done that felt discriminatory.',
          inputType: 'text',
          apply: (value) => setIntakeData((prev) => ({ ...prev, discriminationDetails: value }))
        },
        {
          id: 'discriminationDate',
          prompt: 'When did that happen? (Use exact date or unknown.)',
          inputType: 'date',
          allowUnknown: true,
          apply: (value) => setIntakeData((prev) => ({ ...prev, discriminationDate: value }))
        }
      )
    }

    list.push(
      {
        id: 'urgencyLevel',
        prompt: 'How urgent is your situation?',
        inputType: 'choice',
        choices: [
          { label: 'Immediate (court date within 7 days)', value: 'immediate' },
          { label: 'Urgent (court date within 2 weeks)', value: 'urgent' },
          { label: 'Soon (need help within a month)', value: 'soon' },
          { label: 'Planning ahead', value: 'planning' }
        ],
        apply: (value) => setIntakeData((prev) => ({ ...prev, urgencyLevel: value }))
      },
      {
        id: 'caseSummary',
        prompt: 'Briefly describe your situation in your own words.',
        inputType: 'text',
        apply: (value) => setIntakeData((prev) => ({ ...prev, caseSummary: value }))
      },
      {
        id: 'desiredOutcome',
        prompt: 'What outcome are you hoping for?',
        inputType: 'text',
        apply: (value) => setIntakeData((prev) => ({ ...prev, desiredOutcome: value }))
      },
      {
        id: 'evidenceList',
        prompt: 'List any documents or photos you have (lease, notices, court papers, texts, receipts).',
        inputType: 'text',
        apply: (value) => setIntakeData((prev) => ({ ...prev, evidenceList: value }))
      }
    )

    return list
  }, [intakeData])

  const currentStep = steps[stepIndex]
  const isComplete = stepIndex >= steps.length

  useEffect(() => {
    const container = chatContainerRef.current
    if (!container || !shouldStickToBottomRef.current) return
    const scrollToBottom = () => {
      container.scrollTop = container.scrollHeight
    }
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(scrollToBottom)
    } else {
      scrollToBottom()
    }
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

  const openQuestions = () => {
    const missing = []
    if (intakeData.evictionNoticeReceived) {
      if (!intakeData.evictionNoticeType) missing.push('Notice type')
      if (!intakeData.evictionNoticeReceivedDate) missing.push('Notice received date')
      if (!intakeData.courtDate) missing.push('Court date (if any)')
    }
    if (!intakeData.leaseType) missing.push('Lease type')
    if (!intakeData.monthlyRent) missing.push('Monthly rent')
    return missing.slice(0, 4)
  }

  const handleChatScroll = (event) => {
    const container = event.currentTarget
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    shouldStickToBottomRef.current = distanceFromBottom < 24
  }

  const handleSubmit = async () => {
    setSubmitError('')
    setIsSubmitting(true)
    try {
      const casePayload = {
        firstName: intakeData.firstName,
        lastName: intakeData.lastName,
        email: intakeData.email,
        phone: intakeData.phone,
        preferredContact: intakeData.preferredContact || 'email',
        rentalAddress: intakeData.rentalAddress,
        monthlyRent: intakeData.monthlyRent,
        landlordName: intakeData.landlordName,
        issueType: intakeData.issueType,
        issueDescription: intakeData.caseSummary,
        urgencyLevel: intakeData.urgencyLevel,
        evictionNoticeReceived: intakeData.evictionNoticeReceived === true,
        evictionNoticeType: intakeData.evictionNoticeType,
        evictionNoticeDate: intakeData.evictionNoticeReceivedDate || null,
        courtDate: intakeData.courtDate || null,
        amountOwed: intakeData.amountOwed || null,
        moveInDate: intakeData.moveInDate || null,
        leaseType: intakeData.leaseType,
        hasGovernmentAssistance: intakeData.housingAssistance === true,
        caseSummary: intakeData.caseSummary
      }

      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(casePayload)
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit intake')
      }

      const newCaseNumber = result.case.case_number
      setCaseNumber(newCaseNumber)

      const payload = buildConversationPayload(conversationId, messages)
      await fetch(`/api/cases/${newCaseNumber}/intake-conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      setSubmitError(error?.message || 'Failed to submit intake')
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
                  <CardTitle className="text-2xl">Tenant Intake Chat</CardTitle>
                  <p className="text-sm text-gray-500">Tennessee notice and timeline intake</p>
                </div>
                <div className="text-sm text-gray-500">
                  Step {Math.min(stepIndex + 1, steps.length)} of {steps.length}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div
                ref={chatContainerRef}
                className="h-[60vh] overflow-y-auto overscroll-contain px-6 py-5 space-y-4 bg-gradient-to-br from-white via-gray-50 to-white"
                onScroll={handleChatScroll}
                style={{ overflowAnchor: 'none' }}
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
                    Intake questions complete. Review the summary and submit when ready.
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
                        {currentStep.allowUnknown && (
                          <Button variant="ghost" onClick={() => handleAnswer('unknown')}>
                            Unknown
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {isComplete && (
                  <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : 'Submit intake'}
                    </Button>
                    {caseNumber && (
                      <span className="text-sm text-emerald-700">
                        Case submitted. Your case number is {caseNumber}.
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
                <CardTitle className="text-lg">Open Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                {openQuestions().length === 0 && <p>All critical details captured.</p>}
                {openQuestions().map((question) => (
                  <div key={question} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    {question}
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-600">
                <p>County: {intakeData.county || 'Unknown'}</p>
                <p>Notice received: {intakeData.evictionNoticeReceived === null ? 'Unknown' : intakeData.evictionNoticeReceived ? 'Yes' : 'No'}</p>
                <p>Notice type: {intakeData.evictionNoticeType || 'Unknown'}</p>
                <p>Monthly rent: {intakeData.monthlyRent || 'Unknown'}</p>
                <p>Issue: {intakeData.issueType || 'Unknown'}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Evidence Checklist</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                <p>Lease, notices, court papers, texts/emails, receipts, photos.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IntakeChat
