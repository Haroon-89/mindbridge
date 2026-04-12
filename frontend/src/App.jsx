import { useState, useEffect, useRef } from 'react'
import ChatWindow from './components/ChatWindow'
import MoodDashboard from './components/MoodDashboard'
import AuthPage from './components/AuthPage'
import './App.css'

const newSessionId = () => Math.random().toString(36).substring(2, 12)
const DISCLAIMER = "MindBridge is a first-response support tool. It is NOT a therapist, doctor, or replacement for professional mental health care. If you are in crisis call iCall: 9152987821"
const API_URL = 'http://localhost:8000'

export default function App() {
  const [activeTab, setActiveTab] = useState('chat')
  const [messages, setMessages] = useState([])
  const [allMessages, setAllMessages] = useState([])
  const [sessionId, setSessionId] = useState(newSessionId)
  const [darkMode, setDarkMode] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
  const [user, setUser] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [editContact, setEditContact] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editMsg, setEditMsg] = useState('')
  const profileRef = useRef(null)

  const fetchHistory = async (token) => {
    try {
      const res = await fetch(`${API_URL}/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) return
      const data = await res.json()
      setAllMessages(data.map((r, i) => ({ id: i, role: r.role, content: r.message, mood_label: r.mood_label, crisis_tier: r.crisis_tier, timestamp: r.timestamp })))
    } catch { }
  }

  // Restore session
  useEffect(() => {
    const token = localStorage.getItem('mb_token')
    const stored = localStorage.getItem('mb_user')
    if (token && stored) {
      try {
        setUser(JSON.parse(stored))
        fetchHistory(token)
      } catch { }
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
        setEditMsg('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogin = (data) => {
    const u = { user_id: data.user_id, name: data.name, email: data.email, emergency_contact: data.emergency_contact }
    setUser(u)
    setEditContact(data.emergency_contact || '')
    const token = localStorage.getItem('mb_token')
    if (token) fetchHistory(token)
  }

  const handleLogout = () => {
    localStorage.removeItem('mb_token')
    localStorage.removeItem('mb_user')
    setUser(null)
    setMessages([])
    setAllMessages([])
    setProfileOpen(false)
  }

  const saveContact = async () => {
    setEditSaving(true)
    setEditMsg('')
    try {
      const token = localStorage.getItem('mb_token')
      const res = await fetch(`${API_URL}/auth/update-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ emergency_contact: editContact })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to save.')
      const updated = { ...user, emergency_contact: editContact }
      setUser(updated)
      localStorage.setItem('mb_user', JSON.stringify(updated))
      setEditMsg('Saved!')
    } catch (e) {
      setEditMsg(e.message)
    } finally {
      setEditSaving(false)
    }
  }

  const handleNewChat = async () => {
    try {
      const token = localStorage.getItem('mb_token')
      await fetch(`${API_URL}/clear-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ session_id: sessionId })
      })
    } catch { }
    setAllMessages(prev => {
      const existingIds = new Set(prev.map(m => m.id))
      const newOnes = messages.filter(m => !existingIds.has(m.id))
      return [...prev, ...newOnes]
    })
    setMessages([])
    setSessionId(newSessionId())
    setActiveTab('chat')
  }

  const toggleTheme = () => setDarkMode(d => !d)

  if (!user) {
    return (
      <div className={`app ${darkMode ? 'dark' : ''}`}>
        <AuthPage onLogin={handleLogin} darkMode={darkMode} toggleTheme={toggleTheme} />
      </div>
    )
  }

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <header className="app-header">
        <div className="header-top">
          <div className="logo">
            <span className="logo-icon">🌿</span>
            <div>
              <span className="logo-text">MindBridge</span>
              <div className="logo-tagline">Your calm space, always here</div>
            </div>
          </div>

          <div className="header-right">
            <nav className="nav-tabs">
              <button className={`nav-tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
                Chat
              </button>
              <button className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                Mood Dashboard
              </button>

            </nav>

            {/* Profile dropdown */}
            <div className="profile-wrap" ref={profileRef}>
              <button className="profile-btn" onClick={() => { setProfileOpen(o => !o); setEditContact(user.emergency_contact || ''); setEditMsg('') }}>
                <span className="profile-avatar">{user.name.charAt(0).toUpperCase()}</span>
              </button>

              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-header">
                    <div className="profile-avatar-lg">{user.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="profile-name">{user.name}</div>
                      <div className="profile-email">{user.email}</div>
                    </div>
                  </div>

                  <div className="profile-section">
                    <label className="profile-label">Emergency Contact</label>
                    <p className="profile-hint">SMS is sent to this number if a crisis is detected.</p>
                    <input
                      className="profile-input"
                      value={editContact}
                      onChange={e => setEditContact(e.target.value)}
                      placeholder="+91xxxxxxxxxx"
                    />
                    {editMsg && <span className={`profile-msg ${editMsg === 'Saved!' ? 'ok' : 'err'}`}>{editMsg}</span>}
                    <button className="profile-save-btn" onClick={saveContact} disabled={editSaving}>
                      {editSaving ? 'Saving...' : 'Save Contact'}
                    </button>
                  </div>

                  <div className="profile-theme-row">
                    <span className="profile-label">{darkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
                    <button className="profile-theme-toggle" onClick={toggleTheme}>
                      {darkMode ? 'Switch to Light' : 'Switch to Dark'}
                    </button>
                  </div>

                  <button className="profile-logout" onClick={handleLogout}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="app-body">
        <div className="new-chat-corner">
          <button className="new-chat-sidebar-btn" onClick={handleNewChat}>
            <span className="new-chat-plus">+</span>
            <span>New Chat</span>
          </button>
        </div>

        <main className="app-main">
        {activeTab === 'chat' ? (
          <div className="chat-main-wrap">
            <ChatWindow messages={messages} setMessages={setMessages} sessionId={sessionId} user={user} />
          </div>
        ) : (
          <MoodDashboard messages={[...allMessages, ...messages.filter(m => !allMessages.find(a => a.id === m.id))]} />
        )}
        </main>
      </div>

      <footer className="app-footer">
        <span className="footer-disclaimer-icon">⚠️</span>
        <p className="footer-disclaimer">{DISCLAIMER}</p>
      </footer>
    </div>
  )
}
