import { useState, useEffect, useCallback, useRef } from 'react'
import LoginForm from './components/LoginForm'
import Header from './components/Header'
import StatCard from './components/StatCard'
import ModeChart from './components/ModeChart'
import PlayerChart from './components/PlayerChart'
import DailyWinsChart from './components/DailyWinsChart'
import BoardSizeChart from './components/BoardSizeChart'
import RecentIPs from './components/RecentIPs'
import RequestLogs from './components/RequestLogs'
import ActionsPanel from './components/ActionsPanel'
import Footer from './components/Footer'
import { fetchStats, fetchLogs, clearLeaderboardAPI } from './components/api'

export default function App() {
  const [token, setToken] = useState('')
  const [base, setBase] = useState('')
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])
  const [actionMsg, setActionMsg] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [connected, setConnected] = useState(false)
  const intervalRef = useRef(null)

  const fetchData = useCallback(async (b, t) => {
    setRefreshing(true)
    try {
      const [s, l] = await Promise.all([
        fetchStats(b, t),
        fetchLogs(b, t),
      ])
      setStats(s)
      setLogs(l)
      setLastRefresh(new Date())
      setConnected(true)
      setError('')
    } catch {
      setConnected(false)
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (!token || !base) return
    intervalRef.current = setInterval(() => fetchData(base, token), 15000)
    return () => clearInterval(intervalRef.current)
  }, [token, base, fetchData])

  if (!token) {
    return (
      <LoginForm
        onLogin={async (secret, url) => {
          setError('')
          const b = url.replace(/\/+$/, '')
          try {
            const s = await fetchStats(b, secret)
            setToken(secret)
            setBase(b)
            setStats(s)
            const l = await fetchLogs(b, secret)
            setLogs(l)
            setLastRefresh(new Date())
            setConnected(true)
          } catch (e) {
            setError(e.message)
          }
        }}
        error={error}
      />
    )
  }

  return (
    <div className="dashboard">
      <Header
        onRefresh={() => fetchData(base, token)}
        refreshing={refreshing}
        lastRefresh={lastRefresh}
        connected={connected}
      />

      <div className="grid-3">
        <StatCard label="requests" value={stats?.totalRequests} />
        <StatCard label="wins recorded" value={stats?.totalWins} />
        <StatCard label="players" value={stats?.uniquePlayers} />
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>by mode</h2>
          <ModeChart data={stats?.modeBreakdown} />
        </div>

        <div className="card">
          <h2>top players</h2>
          <PlayerChart data={stats?.topPlayers} />
        </div>
      </div>

      <div className="grid-3-alt">
        <DailyWinsChart data={stats?.dailyWins} />
        <BoardSizeChart data={stats?.boardBreakdown} />
        <div className="card">
          <h2>active games</h2>
          <div className="big-stat">{stats?.activeGames ?? 0}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>recent IPs</h2>
          <RecentIPs ips={stats?.recentIPs} />
        </div>

        <ActionsPanel
          onClear={async () => {
            setActionMsg('')
            try {
              await clearLeaderboardAPI(base, token)
              setActionMsg('leaderboard cleared')
              await fetchData(base, token)
            } catch {
              setActionMsg('failed')
            }
          }}
        />
      </div>

      {actionMsg && (
        <p className={actionMsg === 'failed' ? 'error action-msg' : 'success action-msg'}>
          {actionMsg}
        </p>
      )}

      <RequestLogs logs={logs} />

      <Footer />
    </div>
  )
}
