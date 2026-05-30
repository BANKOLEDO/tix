export default function Landing({ onEnter }) {
  return (
    <div className="landing">
      <div className="landing-badge">beta</div>
      <div className="landing-icon">
        <svg width="96" height="96" viewBox="0 0 48 48">
          <circle cx="16" cy="24" r="11" fill="none" stroke="#2dd4bf" strokeWidth="3" />
          <circle cx="16" cy="24" r="5" fill="#2dd4bf" />
          <polygon points="32,8 44,24 32,40 20,24" fill="none" stroke="#d4a373" strokeWidth="3" />
          <polygon points="32,14 40,24 32,34 24,24" fill="#d4a373" />
        </svg>
      </div>
      <h1 className="landing-title">tix</h1>
      <p className="landing-sub">choose your board, play your move</p>
      <p className="landing-desc">
        a configurable tic-tac-toe arena &mdash; play with friends, challenge the AI,
        or battle across devices. no sign-up, just play.
      </p>
      <button className="btn btn-lg" onClick={onEnter}>
        get started
      </button>
      <div className="landing-features">
        <span className="landing-f">custom boards</span>
        <span className="landing-f">local &amp; online</span>
        <span className="landing-f">ai opponent</span>
        <span className="landing-f">leaderboard</span>
      </div>
    </div>
  )
}
