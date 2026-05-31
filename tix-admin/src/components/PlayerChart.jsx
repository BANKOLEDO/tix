export default function PlayerChart({ data, limit = 8 }) {
  if (!data?.length) return <span className="empty">no data</span>

  const max = Math.max(...data.map(p => p.wins), 1)
  const players = data.slice(0, limit)

  return (
    <div className="chart-bar-list">
      {players.map((p, i) => (
        <div className="chart-bar-row" key={i}>
          <span className="chart-bar-rank">#{i + 1}</span>
          <span className="chart-bar-label">{p.name}</span>
          <div className="chart-bar-track">
            <div className="chart-bar-fill" style={{ width: (p.wins / max) * 100 + '%' }} />
          </div>
          <span className="chart-bar-val">{p.wins}</span>
        </div>
      ))}
    </div>
  )
}
