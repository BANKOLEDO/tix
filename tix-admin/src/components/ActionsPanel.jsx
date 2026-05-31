import { useState } from 'react'
import ConfirmToast from './ConfirmToast'

export default function ActionsPanel({ onClearLeaderboard, onClearLogs }) {
  const [toast, setToast] = useState(null)

  function closeToast() { setToast(null) }

  return (
    <div className="card">
      <h2>actions</h2>
      <div className="action-buttons">
        <button className="btn btn-danger" onClick={() => setToast('leaderboard')}>
          clear leaderboard
        </button>
        <button className="btn btn-danger" onClick={() => setToast('logs')}>
          clear logs
        </button>
      </div>

      {toast === 'leaderboard' && (
        <ConfirmToast
          message="clear all leaderboard entries?"
          onConfirm={() => { closeToast(); onClearLeaderboard() }}
          onCancel={closeToast}
        />
      )}

      {toast === 'logs' && (
        <ConfirmToast
          message="clear all request logs?"
          onConfirm={() => { closeToast(); onClearLogs() }}
          onCancel={closeToast}
        />
      )}
    </div>
  )
}
