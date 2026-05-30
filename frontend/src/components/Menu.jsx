import { useState } from 'react'

const SIZES = [
  { size: 3, win: 3, label: '3×3' },
  { size: 4, win: 3, label: '4×3' },
  { size: 5, win: 4, label: '5×4' },
  { size: 6, win: 4, label: '6×4' },
  { size: 7, win: 5, label: '7×5' },
  { size: 8, win: 5, label: '8×5' },
]

const P1_COLOR = '#2dd4bf'
const P2_COLOR = '#d4a373'

const MODES = [
  { key: 'ai', label: 'vs AI' },
  { key: 'friend', label: 'vs Friend' },
  { key: 'online', label: 'Online' },
]

export default function Menu({ onStart, onBack, name, name2, onNameChange, onName2Change }) {
  const [sel, setSel] = useState(2)
  const [mode, setMode] = useState(null)

  return (
    <div className="menu">
      <button className="btn btn-sm menu-back" onClick={onBack}>back</button>
      <div className="menu-icon">
        <svg width="64" height="64" viewBox="0 0 48 48">
          <circle cx="16" cy="24" r="11" fill="none" stroke="#2dd4bf" strokeWidth="3" />
          <circle cx="16" cy="24" r="5" fill="#2dd4bf" />
          <polygon points="32,8 44,24 32,40 20,24" fill="none" stroke="#d4a373" strokeWidth="3" />
          <polygon points="32,14 40,24 32,34 24,24" fill="#d4a373" />
        </svg>
      </div>
      <h2 className="menu-title">new game</h2>

      <div className="menu-section">
        <label className="menu-label">mode</label>
        <div className="mode-grid">
          {MODES.map(m => (
            <button key={m.key}
              className={`mode-btn${mode === m.key ? ' active' : ''}`}
              onClick={() => setMode(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode && (
        <>
          <div className="menu-section">
            <label className="menu-label" style={{ color: P1_COLOR }}>player 1</label>
            <input className="inp" placeholder="anonymous" value={name}
              onChange={e => onNameChange(e.target.value)} maxLength={16} />
          </div>
          {mode === 'friend' && (
            <div className="menu-section">
              <label className="menu-label" style={{ color: P2_COLOR }}>player 2</label>
              <input className="inp" placeholder="anonymous" value={name2}
                onChange={e => onName2Change(e.target.value)} maxLength={16} />
            </div>
          )}

          <div className="menu-section">
            <label className="menu-label">board size</label>
            <div className="size-grid">
              {SIZES.map((s, i) => (
                <button key={i}
                  className={`size-btn${sel === i ? ' active' : ''}`}
                  onClick={() => setSel(i)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-lg" onClick={() => onStart(mode, SIZES[sel])}>
            play
          </button>
        </>
      )}
    </div>
  )
}
