import './MoodDashboard.css'

const TIER_COLOR = { 0: '#27ae60', 1: '#f39c12', 2: '#e67e22', 3: '#c0392b' }
const MOOD_COLOR = {
  anxious: '#e67e22',
  sad: '#3498db',
  hopeful: '#27ae60',
  neutral: '#95a5a6',
  distressed: '#c0392b',
}

export default function MoodDashboard({ messages }) {
  const botMessages = messages.filter(m => m.role === 'bot' && m.mood_label)

  if (botMessages.length === 0) {
    return (
      <div className="dashboard-empty">
        <span>📊</span>
        <p>No mood data yet. Start a conversation to see your mood trends.</p>
      </div>
    )
  }

  // Summary stats
  const totalMessages = messages.filter(m => m.role === 'user').length
  const moodCounts = botMessages.reduce((acc, m) => {
    acc[m.mood_label] = (acc[m.mood_label] || 0) + 1
    return acc
  }, {})
  const mostCommonMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const highestTier = Math.max(...botMessages.map(m => m.crisis_tier || 0))

  // Line chart via SVG
  const chartW = 600
  const chartH = 180
  const padL = 40
  const padB = 30
  const padT = 16
  const padR = 20
  const innerW = chartW - padL - padR
  const innerH = chartH - padB - padT

  const points = botMessages.map((m, i) => {
    const x = padL + (i / Math.max(botMessages.length - 1, 1)) * innerW
    const y = padT + (1 - m.confidence) * innerH
    return { x, y, tier: m.crisis_tier || 0, label: m.mood_label, conf: m.confidence }
  })

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')

  // Bar chart for mood distribution
  const moodEntries = Object.entries(moodCounts)
  const maxCount = Math.max(...moodEntries.map(e => e[1]))

  return (
    <div className="dashboard">
      {/* Summary cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <span className="card-value">{totalMessages}</span>
          <span className="card-label">Messages Sent</span>
        </div>
        <div className="summary-card">
          <span className="card-value" style={{ color: MOOD_COLOR[mostCommonMood] || '#2E75B6' }}>
            {mostCommonMood}
          </span>
          <span className="card-label">Most Common Mood</span>
        </div>
        <div className="summary-card">
          <span className="card-value" style={{ color: TIER_COLOR[highestTier] }}>
            Tier {highestTier}
          </span>
          <span className="card-label">Highest Crisis Level</span>
        </div>
      </div>

      {/* Line chart */}
      <div className="chart-card">
        <h3 className="chart-title">Sentiment Confidence Over Conversation</h3>
        <div className="svg-wrapper">
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="line-chart">
            {/* Y axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map(v => {
              const y = padT + (1 - v) * innerH
              return (
                <g key={v}>
                  <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#e0eaf4" strokeWidth="1" />
                  <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#8ab0cc">
                    {Math.round(v * 100)}%
                  </text>
                </g>
              )
            })}

            {/* X axis */}
            <line x1={padL} y1={chartH - padB} x2={chartW - padR} y2={chartH - padB} stroke="#b8d4ee" strokeWidth="1.5" />

            {/* Polyline */}
            {points.length > 1 && (
              <polyline
                points={polyline}
                fill="none"
                stroke="#2E75B6"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}

            {/* Data points */}
            {points.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="6" fill={TIER_COLOR[p.tier]} stroke="#fff" strokeWidth="2" />
                <text x={p.x} y={chartH - padB + 16} textAnchor="middle" fontSize="10" fill="#8ab0cc">
                  {i + 1}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <div className="chart-legend">
          {Object.entries(TIER_COLOR).map(([tier, color]) => (
            <span key={tier} className="legend-item">
              <span className="legend-dot" style={{ background: color }} />
              Tier {tier}
            </span>
          ))}
        </div>
      </div>

      {/* Bar chart — mood distribution */}
      <div className="chart-card">
        <h3 className="chart-title">Mood Distribution</h3>
        <div className="bar-chart">
          {moodEntries.map(([mood, count]) => (
            <div key={mood} className="bar-row">
              <span className="bar-label">{mood}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(count / maxCount) * 100}%`,
                    background: MOOD_COLOR[mood] || '#2E75B6',
                  }}
                />
              </div>
              <span className="bar-count">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
