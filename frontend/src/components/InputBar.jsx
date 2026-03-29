import { useState } from 'react'
import './InputBar.css'

export default function InputBar({ onSend, isLoading }) {
  const [text, setText] = useState('')

  const handleSend = () => {
    if (!text.trim() || isLoading) return
    onSend(text.trim())
    setText('')
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="input-bar">
      <textarea
        className="input-field"
        placeholder="How are you feeling today? Type here..."
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKey}
        rows={1}
        disabled={isLoading}
      />
      <button
        className="send-btn"
        onClick={handleSend}
        disabled={isLoading || !text.trim()}
      >
        {isLoading ? <span className="spinner" /> : '➤'}
      </button>
    </div>
  )
}
