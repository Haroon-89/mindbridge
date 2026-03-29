import { useState } from 'react'
import './AuthPage.css'

const API_URL = 'http://localhost:8000'

export default function AuthPage({ onLogin, darkMode, toggleTheme }) {
  const [mode, setMode] = useState('login')   // 'login' | 'signup'
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', emergency_contact: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signup') {
        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Registration failed.')
        setMode('login')
        setError('')
        setForm(f => ({ ...f, name: '', phone: '', emergency_contact: '' }))
        return
      }

      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Login failed.')

      localStorage.setItem('mb_token', data.token)
      localStorage.setItem('mb_user', JSON.stringify({
        user_id: data.user_id,
        name: data.name,
        email: data.email,
        emergency_contact: data.emergency_contact
      }))
      onLogin(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <button className="auth-theme-toggle" onClick={toggleTheme} title={darkMode ? 'Light mode' : 'Dark mode'}>
        {darkMode ? '☀️' : '🌙'}
      </button>
      <div className="auth-card">
        <div className="auth-logo">
          <span>🌿</span>
          <div>
            <div className="auth-logo-text">MindBridge</div>
            <div className="auth-logo-sub">Your calm space, always here</div>
          </div>
        </div>

        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError('') }}>
            Sign In
          </button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError('') }}>
            Create Account
          </button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label>Your Name</label>
              <input name="name" value={form.name} onChange={update} placeholder="What should we call you?" required />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={update} placeholder="your@email.com" required />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input name="password" type="password" value={form.password} onChange={update} placeholder="••••••••" required />
          </div>

          {mode === 'signup' && (
            <>
              <div className="form-group">
                <label>Your Phone Number <span className="optional">(optional)</span></label>
                <input name="phone" value={form.phone} onChange={update} placeholder="+91xxxxxxxxxx" />
              </div>

              <div className="form-group emergency-group">
                <label>
                  Emergency Contact Number
                  <span className="required-badge">Important</span>
                </label>
                <p className="field-hint">
                  If you ever seem to be in crisis, we will send an SMS to this person to check on you.
                </p>
                <input
                  name="emergency_contact"
                  value={form.emergency_contact}
                  onChange={update}
                  placeholder="+91xxxxxxxxxx (parent, friend, counselor)"
                />
              </div>
            </>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? <span className="auth-spinner" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="auth-disclaimer">
          MindBridge is a support tool, not a replacement for professional mental health care.
        </p>
      </div>
    </div>
  )
}
