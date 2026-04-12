import { useState, useEffect, useRef, useCallback } from 'react'
import MessageBubble from './MessageBubble'
import InputBar from './InputBar'
import EmergencyAlert from './EmergencyAlert'
import './ChatWindow.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const CHAR_DELAY = 18 // ms per token chunk — controls typewriter speed

export default function ChatWindow({ messages, setMessages, sessionId, user }) {
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)
  const tokenQueueRef = useRef([])
  const drippingRef = useRef(false)
  const botIdRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Drip tokens from queue one at a time with a fixed delay
  const drip = useCallback(() => {
    if (tokenQueueRef.current.length === 0) {
      drippingRef.current = false
      return
    }
    const token = tokenQueueRef.current.shift()
    setMessages(prev => prev.map(m =>
      m.id === botIdRef.current ? { ...m, content: m.content + token } : m
    ))
    setTimeout(drip, CHAR_DELAY)
  }, [setMessages])

  const enqueueToken = useCallback((token) => {
    tokenQueueRef.current.push(token)
    if (!drippingRef.current) {
      drippingRef.current = true
      setTimeout(drip, CHAR_DELAY)
    }
  }, [drip])

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading || isStreaming) return

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString(),
    }

    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    setError(null)

    const botId = Date.now() + 1
    botIdRef.current = botId
    tokenQueueRef.current = []
    drippingRef.current = false

    setMessages(prev => [...prev, {
      id: botId,
      role: 'bot',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      mood_label: null,
      confidence: null,
      crisis_tier: 0,
      emergency_resources: null,
      sms_sent: false,
      streaming: true,
    }])

    try {
      const token = localStorage.getItem('mb_token')
      const response = await fetch(`${API_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          user_name: user?.name || 'Friend',
        }),
      })

      if (!response.ok) throw new Error(`Server error: ${response.status}`)

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          let data
          try { data = JSON.parse(line.slice(6)) } catch { continue }

          if (data.type === 'metadata') {
            setMessages(prev => prev.map(m =>
              m.id === botId ? {
                ...m,
                mood_label: data.sentiment?.mood_label,
                confidence: data.sentiment?.confidence,
                crisis_tier: data.crisis_tier,
                emergency_resources: data.emergency_resources,
                sms_sent: data.sms_sent ?? false,
              } : m
            ))
          }

          if (data.type === 'token') {
            setIsLoading(false)
            setIsStreaming(true)
            enqueueToken(data.token)
          }

          if (data.type === 'crisis') {
            setIsLoading(false)
            setMessages(prev => prev.map(m =>
              m.id === botId ? {
                ...m,
                content: data.response,
                crisis_tier: data.crisis_tier,
                emergency_resources: data.emergency_resources,
                sms_sent: data.sms_sent ?? false,
                streaming: false,
              } : m
            ))
            setIsStreaming(false)
          }

          if (data.type === 'done') {
            // Wait for queue to drain before finalizing
            const finalize = () => {
              if (tokenQueueRef.current.length > 0) {
                setTimeout(finalize, CHAR_DELAY * 2)
              } else {
                setMessages(prev => prev.map(m =>
                  m.id === botId ? { ...m, streaming: false } : m
                ))
                setIsStreaming(false)
              }
            }
            finalize()
          }
        }
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== botId))
      setError(
        err.message.includes('fetch') || err.message.includes('Failed')
          ? 'Cannot connect to MindBridge server. Please make sure the backend is running.'
          : err.message
      )
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  const latestBot = messages.filter(m => m.role === 'bot').slice(-1)[0]
  const showEmergency = latestBot?.crisis_tier === 3

  return (
    <div className="chat-window">
      <div className="messages-area">
        {messages.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">🌿</span>
            <p className="empty-greeting">You are stronger than you think</p>
            <p className="empty-sub">Share what's on your mind. I'm here to listen, support, and walk with you, one step at a time.</p>
            <div className="affirmation-cards">
              <span className="affirmation-card">🌟 You are not alone</span>
              <span className="affirmation-card">🌊 Breathe, you've got this</span>
              <span className="affirmation-card">🌱 Every day is a fresh start</span>
            </div>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        )}

        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {showEmergency && (
        <EmergencyAlert resources={latestBot.emergency_resources} smsSent={latestBot.sms_sent} />
      )}

      <InputBar onSend={sendMessage} isLoading={isLoading || isStreaming} />
    </div>
  )
}
