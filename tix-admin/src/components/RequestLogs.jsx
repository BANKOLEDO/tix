import { useState } from 'react'

export default function RequestLogs({ logs }) {
  const [filter, setFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = logs.filter(l => {
    if (!filter) return true
    const q = filter.toLowerCase()
    return l.path.toLowerCase().includes(q) ||
      l.method.toLowerCase().includes(q) ||
      l.ip.toLowerCase().includes(q)
  })

  const counts = {}
  logs.forEach(l => {
    counts[l.method] = (counts[l.method] || 0) + 1
  })

  return (
    <div className="card">
      <div className="logs-header">
        <h2>recent requests <span className="light">(last 100)</span></h2>
        <button className="btn btn-sm" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? 'hide' : 'filter'}
        </button>
      </div>

      {showFilters && (
        <div className="log-filters">
          <input type="text" placeholder="search path, method, ip..." value={filter}
            onChange={e => setFilter(e.target.value)} className="log-search" />
          <div className="log-method-counts">
            {Object.entries(counts).map(([method, count]) => (
              <span className={`log-method-badge method-${method.toLowerCase()}`} key={method}>
                {method} {count}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="log-scroll">
        {filtered.length ? (
          <table><tbody>
            {filtered.map((l, i) => (
              <tr key={i}>
                <td className="muted">{l.createdAt}</td>
                <td className="muted">{l.method}</td>
                <td>{l.path}</td>
                <td className="muted">{l.ip}</td>
              </tr>
            ))}
          </tbody></table>
        ) : <span className="empty">no matching requests</span>}
      </div>
    </div>
  )
}
