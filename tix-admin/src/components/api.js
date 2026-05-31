export function api(path, token) {
  return fetch(path, {
    headers: { Authorization: 'Bearer ' + token },
  })
}

export async function fetchStats(base, token) {
  const r = await api(base + '/api/admin/stats', token)
  if (!r.ok) throw new Error('failed to fetch stats')
  return r.json()
}

export async function fetchLogs(base, token) {
  const r = await api(base + '/api/admin/logs', token)
  if (!r.ok) throw new Error('failed to fetch logs')
  return r.json()
}

export async function clearLeaderboardAPI(base, token) {
  const r = await fetch(base + '/api/admin/leaderboard', {
    method: 'DELETE',
    headers: { Authorization: 'Bearer ' + token },
  })
  if (!r.ok) throw new Error('failed to clear')
  return true
}
