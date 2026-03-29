import { useState, useEffect, useRef } from 'react'
import ChatWindow from './components/ChatWindow'
import MoodDashboard from './components/MoodDashboard'
import AuthPage from './components/AuthPage'
import './App.css'

const SESSION_ID = Math.random().toString(36).substring(2, 12)
const DISCLAIMER = "MindBridge is a first-response support tool. It is NOT a therapist, doctor, or replacement for professional mental health care. If you are in crisis call iCall: 9152987821"
const API_URL = 'http://localhost:8000'

export default function App() {
  const [activeTab, setActiveTab] = useState('chat')
  const [messages, setMessages] = useState([])
  const [darkMode, setDarkMode] = useState(false)
  const [user, setUser] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [editContact, setEditContact] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [editMsg, setEditMsg] = useState('')
  const profileRef = useRef(null)

  // Restore session
  useEffect(() => {
    const token = localStorage.getItem('mb_token')
    const stored = localStorage.getItem('mb_user')
    if (token && stored) {
      try { setUser(JSON.parse(stored)) } catch { }
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
  }

  const handleLogout = () => {
    localStorage.removeItem('mb_token')
    localStorage.removeItem('mb_user')
    setUser(null)
    setMessages([])
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

                  <button className="profile-logout" onClick={handleLogout}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            <button className="theme-toggle" onClick={toggleTheme} title={darkMode ? 'Light mode' : 'Dark mode'}>
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
        <div className="header-disclaimer">{DISCLAIMER}</div>
      </header>

      <main className="app-main">
        {activeTab === 'chat' ? (
          <ChatWindow messages={messages} setMessages={setMessages} sessionId={SESSION_ID} user={user} />
        ) : (
          <MoodDashboard messages={messages} />
        )}
      </main>

      <footer className="app-footer">
        <p>{DISCLAIMER}</p>
      </footer>
    </div>
  )
}
