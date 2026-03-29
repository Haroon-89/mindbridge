import './MessageBubble.css'

const MOOD_EMOJI = {
  anxious: '😰',
  sad: '😔',
  hopeful: '😊',
  neutral: '😐',
  distressed: '😢',
}

const TIER_COLOR = {
  0: '#27ae60',
  1: '#f39c12',
  2: '#e67e22',
  3: '#c0392b',
}

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`bubble-wrapper ${isUser ? 'user' : 'bot'}`}>
      <div className={`bubble ${isUser ? 'bubble-user' : 'bubble-bot'}`}>
        <p className="bubble-text">
          {message.content}
          {message.streaming && message.content.length > 0 && <span className="stream-cursor" />}
        </p>
        {!message.streaming && (
          <span className="bubble-time">{message.timestamp}</span>
        )}
      </div>

      {!isUser && !message.streaming && message.mood_label && (
        <div className="bubble-meta">
          <span className="mood-badge">
            {MOOD_EMOJI[message.mood_label] || '🧠'} {message.mood_label}
            <span className="confidence"> · {Math.round(message.confidence * 100)}%</span>
          </span>
          {message.crisis_tier > 0 && (
            <span className="tier-badge" style={{ background: TIER_COLOR[message.crisis_tier] }}>
              Tier {message.crisis_tier} alert
            </span>
          )}
          {message.sms_sent && (
            <span className="sms-badge">✅ Emergency contact notified</span>
          )}
        </div>
      )}

      {!isUser && !message.streaming && message.crisis_tier === 2 && (
        <div className="tier2-banner">
          ⚠️ You're not alone. Reach out anytime:
          <strong> iCall: 9152987821</strong> |
          <strong> Vandrevala Foundation: 1860-2662-345</strong>
        </div>
      )}
    </div>
  )
}
