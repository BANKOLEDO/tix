export default function Header({ onRefresh, refreshing, lastRefresh, connected }) {
  return (
    <div className="dash-h">
      <div className="dash-title">
        <h1>tix <span>admin</span></h1>
        <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} title={connected ? 'connected' : 'disconnected'} />
      </div>
      <div className="dash-actions">
        {lastRefresh && (
          <span className="last-refresh" title={lastRefresh}>
            {timeAgo(lastRefresh)}
          </span>
        )}
        <button className="btn btn-sm" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? '...' : 'refresh'}
        </button>
      </div>
    </div>
  )
}

function timeAgo(date) {
  const sec = Math.floor((Date.now() - date) / 1000)
  if (sec < 10) return 'just now'
  if (sec < 60) return sec + 's ago'
  return Math.floor(sec / 60) + 'm ago'
}
