export default function ResultModal({ label, showSubmit, name, onNameChange, onSubmit, onPlayAgain }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">{label}</h2>
        {showSubmit && (
          <div className="modal-submit">
            <input className="inp" placeholder="your name"
              value={name} onChange={e => onNameChange(e.target.value)} maxLength={16}
              onKeyDown={e => e.key === 'Enter' && onSubmit()} />
            <button className="btn" onClick={onSubmit}>submit to leaderboard</button>
          </div>
        )}
        <button className="btn" onClick={onPlayAgain}>play again</button>
      </div>
    </div>
  )
}
