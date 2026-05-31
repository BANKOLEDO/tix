import { useState } from 'react'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

function api(path, token) {
  return fetch(BASE + path, {
    headers: { Authorization: 'Bearer ' + token },
  })
}

export default function App() {
  const [secret, setSecret] = useState('')
  const [apiUrl, setApiUrl] = useState(BASE)
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])
  const [actionMsg, setActionMsg] = useState('')

  async function login() {
    if (!secret) return
    setError('')
    const base = apiUrl.replace(/\/+$/, '')
    try {
      const r = await fetch(base + '/api/admin/stats', {
        headers: { Authorization: 'Bearer ' + secret },
      })
      if (r.status === 401) { setError('invalid secret'); return }
      if (!r.ok) throw new Error()
      const data = await r.json()
      setToken(secret)
      setStats(data)

      const logsR = await fetch(base + '/api/admin/logs', {
        headers: { Authorization: 'Bearer ' + secret },
      })
      if (logsR.ok) setLogs(await logsR.json())
    } catch {
      setError('cannot reach server at ' + base)
    }
  }

  async function clearLeaderboard() {
    if (!confirm('clear all leaderboard entries?')) return
    setActionMsg('')
    try {
      const r = await fetch(apiUrl.replace(/\/+$/, '') + '/api/admin/leaderboard', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token },
      })
      if (!r.ok) throw new Error()
      setActionMsg('leaderboard cleared')
      const s = await fetch(apiUrl.replace(/\/+$/, '') + '/api/admin/stats', {
        headers: { Authorization: 'Bearer ' + token },
      })
      if (s.ok) setStats(await s.json())
    } catch {
      setActionMsg('failed')
    }
  }

  if (!token) {
    return (
      <div className="login-card card">
        <h1>tix <span>admin</span></h1>
        <p className="login-hint">set <code>ADMIN_SECRET</code> on the server</p>
        <input type="password" placeholder="admin secret" value={secret}
          onChange={e => setSecret(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()} autoFocus />
        <input type="text" placeholder="http://localhost:8080" value={apiUrl}
          onChange={e => setApiUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()} />
        <button className="btn btn-accent" onClick={login}>unlock</button>
        {error && <p className="error">{error}</p>}
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dash-h">
        <h1>tix <span>admin</span></h1>
        <button className="btn btn-sm" onClick={() => window.location.reload()}>refresh</button>
      </div>

      <div className="grid">
        <div className="card">
          <h2>overview</h2>
          <div className="stat-row">
            <div><div className="stat">{stats?.totalRequests ?? '-'}</div><div className="stat-label">requests</div></div>
            <div><div className="stat">{stats?.totalWins ?? '-'}</div><div className="stat-label">wins</div></div>
            <div><div className="stat">{stats?.uniquePlayers ?? '-'}</div><div className="stat-label">players</div></div>
          </div>
        </div>

        <div className="card">
          <h2>by mode</h2>
          {stats?.modeBreakdown?.length ? (
            stats.modeBreakdown.map((m, i) => (
              <div className="mode-row" key={i}>
                <span className="mode-name">{m.mode}</span>
                <span className="mode-count">{m.count}</span>
              </div>
            ))
          ) : <span className="empty">-</span>}
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h2>top players</h2>
          {stats?.topPlayers?.length ? (
            <table><tbody>
              {stats.topPlayers.map((p, i) => (
                <tr key={i}>
                  <td className="rank">#{i + 1}</td>
                  <td>{p.name}</td>
                  <td className="wins">{p.wins}w</td>
                </tr>
              ))}
            </tbody></table>
          ) : <span className="empty">no data</span>}
        </div>

        <div className="card">
          <h2>recent IPs</h2>
          {stats?.recentIPs?.length ? (
            stats.recentIPs.map((ip, i) => (
              <div className="ip-row" key={i}>{ip}</div>
            ))
          ) : <span className="empty">no data</span>}
        </div>
      </div>

      <div className="card">
        <h2>actions</h2>
        <button className="btn btn-danger" onClick={clearLeaderboard}>clear leaderboard</button>
        {actionMsg && <p className={actionMsg === 'failed' ? 'error' : 'success'}>{actionMsg}</p>}
      </div>

      <div className="card">
        <h2>recent requests <span className="light">(last 100)</span></h2>
        <div className="log-scroll">
          {logs.length ? (
            <table><tbody>
              {logs.map((l, i) => (
                <tr key={i}>
                  <td className="muted">{l.createdAt}</td>
                  <td className="muted">{l.method}</td>
                  <td>{l.path}</td>
                  <td className="muted">{l.ip}</td>
                </tr>
              ))}
            </tbody></table>
          ) : <span className="empty">no data</span>}
        </div>
      </div>

      <div className="footer">built by <a href="https://devolabanks.xyz" target="_blank" rel="noopener">dev_olabanks</a></div>
    </div>
  )
}
