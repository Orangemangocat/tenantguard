import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useSession, signIn } from 'next-auth/react'
import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/'

interface Message {
  id: number
  sender_type: 'user' | 'ai' | 'staff'
  content: string
  timestamp: string
  is_read: boolean
}

const SENDER_LABEL: Record<string, string> = {
  ai: 'AI Assistant',
  staff: 'TenantGuard Staff',
}

const Chat = () => {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && session) {
      fetchMessages()
      const interval = setInterval(fetchMessages, 5000)
      return () => clearInterval(interval)
    }
  }, [isOpen, session])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const authHeader = () => ({
    Authorization: `Bearer ${(session as any)?.access_token}`,
  })

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_BASE}chat/messages/`, { headers: authHeader() })
      setMessages(response.data)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !session) return

    setLoading(true)
    try {
      // POST returns the full updated conversation including the AI reply
      const response = await axios.post(
        `${API_BASE}chat/messages/`,
        { content: newMessage },
        { headers: authHeader() }
      )
      setMessages(response.data)
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-red-800 text-white rounded-full shadow-lg hover:opacity-90 transition-all z-50"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-32px)] max-w-sm sm:w-80 md:w-96 z-50">
      <Card className="shadow-2xl border-red-800/20 overflow-hidden">
        <CardHeader className="bg-red-800 text-white p-4 rounded-t-xl flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Legal Assistant</CardTitle>
            <p className="text-xs opacity-80 mt-0.5">Ask about your tenant rights</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:opacity-70 transition-opacity">
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent className="p-0 flex flex-col h-96">
          {!session ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
              <MessageCircle className="h-10 w-10 text-gray-300" />
              <p className="text-gray-600 text-sm">
                Please log in to chat with our legal assistant.
              </p>
              <Button size="sm" onClick={() => signIn()}>Log In to Chat</Button>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && !loading && (
                  <div className="text-center text-gray-400 text-sm mt-8 space-y-1">
                    <p className="font-medium">Hi! I'm your TenantGuard assistant.</p>
                    <p>Ask me anything about your tenant rights in Tennessee.</p>
                  </div>
                )}

                {messages.map((m) => {
                  const isUser = m.sender_type === 'user'
                  return (
                    <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[82%] ${isUser ? '' : 'space-y-1'}`}>
                        {!isUser && (
                          <p className="text-[10px] font-semibold text-gray-400 px-1">
                            {SENDER_LABEL[m.sender_type] ?? m.sender_type}
                          </p>
                        )}
                        <div className={`p-3 rounded-2xl text-sm ${
                          isUser
                            ? 'bg-red-800 text-white rounded-tr-none'
                            : m.sender_type === 'staff'
                              ? 'bg-blue-50 text-blue-900 border border-blue-100 rounded-tl-none'
                              : 'bg-gray-100 text-gray-800 rounded-tl-none'
                        }`}>
                          <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                          <p className="text-[10px] opacity-60 mt-1 text-right">
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
                      <div className="flex gap-1 items-center h-4">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask about your rights..."
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-800/50 text-base"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !newMessage.trim()}
                  className="p-2 bg-red-800 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Chat
