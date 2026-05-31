import { useState } from 'react'

export default function ActionsPanel({ onClear }) {
  const [clearing, setClearing] = useState(false)

  async function handleClear() {
    setClearing(true)
    await onClear()
    setClearing(false)
  }

  return (
    <div className="card">
      <h2>actions</h2>
      <button className="btn btn-danger" onClick={handleClear} disabled={clearing}>
        {clearing ? 'clearing...' : 'clear leaderboard'}
      </button>
    </div>
  )
}
