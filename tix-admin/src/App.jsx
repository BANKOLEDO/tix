import { useState, useEffect, useCallback, useRef } from 'react'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export default function App() {
  const [secret, setSecret] = useState('')
  const [apiUrl, setApiUrl] = useState(BASE)
  const [token, setToken] = useState('')
  const [base, setBase] = useState('')
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])
  const [actionMsg, setActionMsg] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const intervalRef = useRef(null)

  const fetchData = useCallback(async (b, t) => {
    try {
      const [statsR, logsR] = await Promise.all([
        fetch(b + '/api/admin/stats', { headers: { Authorization: 'Bearer ' + t } }),
        fetch(b + '/api/admin/logs', { headers: { Authorization: 'Bearer ' + t } }),
      ])
      if (statsR.ok) setStats(await statsR.json())
      if (logsR.ok) setLogs(await logsR.json())
    } catch {}
  }, [])

  useEffect(() => {
    if (!token || !base) return
    intervalRef.current = setInterval(() => fetchData(base, token), 15000)
    return () => clearInterval(intervalRef.current)
  }, [token, base, fetchData])

  async function login() {
    if (!secret) return
    setError('')
    const b = apiUrl.replace(/\/+$/, '')
    try {
      const r = await fetch(b + '/api/admin/stats', {
        headers: { Authorization: 'Bearer ' + secret },
      })
      if (r.status === 401) { setError('invalid secret'); return }
      if (r.status === 403) { setError('admin not configured — set ADMIN_SECRET on the server'); return }
      if (!r.ok) throw new Error()
      setToken(secret)
      setBase(b)
      const data = await r.json()
      setStats(data)
      const logsR = await fetch(b + '/api/admin/logs', {
        headers: { Authorization: 'Bearer ' + secret },
      })
      if (logsR.ok) setLogs(await logsR.json())
    } catch {
      setError('cannot reach server at ' + b)
    }
  }

  async function handleRefresh() {
    setRefreshing(true)
    await fetchData(base, token)
    setRefreshing(false)
  }

  async function clearLeaderboard() {
    if (!confirm('clear all leaderboard entries?')) return
    setActionMsg('')
    try {
      const r = await fetch(base + '/api/admin/leaderboard', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token },
      })
      if (!r.ok) throw new Error()
      setActionMsg('leaderboard cleared')
      await fetchData(base, token)
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

  const maxMode = stats?.modeBreakdown?.length ? Math.max(...stats.modeBreakdown.map(m => m.count)) : 1
  const maxPlayer = stats?.topPlayers?.length ? Math.max(...stats.topPlayers.map(p => p.wins)) : 1
  const maxDaily = stats?.dailyWins?.length ? Math.max(...stats.dailyWins.map(d => d.count)) : 1

  return (
    <div className="dashboard">
      <div className="dash-h">
        <h1>tix <span>admin</span></h1>
        <div className="dash-actions">
          <span className="auto-label">auto-refresh</span>
          <button className="btn btn-sm" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? '...' : 'refresh'}
          </button>
        </div>
      </div>

      <div className="grid-3">
        <div className="card">
          <h2>requests</h2>
          <div className="big-stat">{stats?.totalRequests ?? '-'}</div>
        </div>
        <div className="card">
          <h2>wins recorded</h2>
          <div className="big-stat">{stats?.totalWins ?? '-'}</div>
        </div>
        <div className="card">
          <h2>unique players</h2>
          <div className="big-stat">{stats?.uniquePlayers ?? '-'}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>by mode</h2>
          {stats?.modeBreakdown?.length ? (
            <div className="chart-vertical">
              {stats.modeBreakdown.map((m, i) => (
                <div className="chart-col-wrap" key={i}>
                  <div className="chart-col" style={{ height: Math.max(4, (m.count / maxMode) * 120) + 'px' }}>
                    <span className="chart-col-val">{m.count}</span>
                  </div>
                  <span className="chart-col-label">{m.mode}</span>
                </div>
              ))}
            </div>
          ) : <span className="empty">no data</span>}
        </div>

        <div className="card">
          <h2>top players</h2>
          {stats?.topPlayers?.length ? (
            <div className="chart-bar-list">
              {stats.topPlayers.slice(0, 8).map((p, i) => (
                <div className="chart-bar-row" key={i}>
                  <span className="chart-bar-rank">#{i + 1}</span>
                  <span className="chart-bar-label">{p.name}</span>
                  <div className="chart-bar-track">
                    <div className="chart-bar-fill" style={{ width: (p.wins / maxPlayer) * 100 + '%' }} />
                  </div>
                  <span className="chart-bar-val">{p.wins}</span>
                </div>
              ))}
            </div>
          ) : <span className="empty">no data</span>}
        </div>
      </div>

      {stats?.dailyWins?.length ? (
        <div className="card">
          <h2>daily wins <span className="light">(last 14 days)</span></h2>
          <div className="chart-vertical">
            {stats.dailyWins.slice(0).reverse().map((d, i) => (
              <div className="chart-col-wrap" key={i}>
                <div className="chart-col chart-col-accent" style={{ height: Math.max(4, (d.count / maxDaily) * 100) + 'px' }}>
                  <span className="chart-col-val">{d.count}</span>
                </div>
                <span className="chart-col-label">{d.date?.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid-2">
        <div className="card">
          <h2>recent IPs</h2>
          {stats?.recentIPs?.length ? (
            <div className="ip-list">
              {stats.recentIPs.map((ip, i) => (
                <div className="ip-row" key={i}>{ip}</div>
              ))}
            </div>
          ) : <span className="empty">no data</span>}
        </div>

        <div className="card">
          <h2>actions</h2>
          <button className="btn btn-danger" onClick={clearLeaderboard}>clear leaderboard</button>
          {actionMsg && <p className={actionMsg === 'failed' ? 'error' : 'success'}>{actionMsg}</p>}
        </div>
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
