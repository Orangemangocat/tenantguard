import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react'

const ContactPage = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsSubmitted(true)
        // Reset form after 3 seconds
        setTimeout(() => {
          setFormData({
            name: '',
            email: '',
            phone: '',
            subject: '',
            message: ''
          })
          setIsSubmitted(false)
          if (onClose) onClose()
        }, 3000)
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('There was an error sending your message. Please try emailing us directly at johnb@tenantguard.net')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        <div className="relative">
          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold z-10"
            >
              ×
            </button>
          )}

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h2>
              <p className="text-gray-600">
                Have questions? We're here to help. Reach out to our team.
              </p>
            </div>

            {isSubmitted ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-600">
                  Thank you for contacting us. We'll get back to you shortly.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-8">
                {/* Contact Information */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-red-800">Get in Touch</CardTitle>
                      <CardDescription>
                        Contact our team for support, questions, or partnership opportunities.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Mail className="h-5 w-5 text-red-800 mt-1" />
                        <div>
                          <p className="font-semibold text-gray-900">Email</p>
                          <a href="mailto:johnb@tenantguard.net" className="text-gray-600 hover:text-red-800">
                            johnb@tenantguard.net
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-5 w-5 text-red-800 mt-1" />
                        <div>
                          <p className="font-semibold text-gray-900">Location</p>
                          <p className="text-gray-600">
                            Davidson County, Tennessee
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-red-800">Office Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-gray-600">
                        <p><span className="font-semibold">Monday - Friday:</span> 9:00 AM - 5:00 PM</p>
                        <p><span className="font-semibold">Saturday:</span> By Appointment</p>
                        <p><span className="font-semibold">Sunday:</span> Closed</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Contact Form */}
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-red-800">Send us a Message</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="name">Full Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => updateFormData('name', e.target.value)}
                            placeholder="John Doe"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => updateFormData('email', e.target.value)}
                            placeholder="john@example.com"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => updateFormData('phone', e.target.value)}
                            placeholder="(615) 555-0123"
                          />
                        </div>

                        <div>
                          <Label htmlFor="subject">Subject *</Label>
                          <Input
                            id="subject"
                            value={formData.subject}
                            onChange={(e) => updateFormData('subject', e.target.value)}
                            placeholder="How can we help?"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="message">Message *</Label>
                          <Textarea
                            id="message"
                            value={formData.message}
                            onChange={(e) => updateFormData('message', e.target.value)}
                            placeholder="Tell us more about your inquiry..."
                            rows={5}
                            required
                          />
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-red-800 hover:bg-red-900 text-white"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            'Sending...'
                          ) : (
                            <>
                              Send Message <Send className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
