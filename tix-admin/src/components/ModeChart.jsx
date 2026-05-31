export default function ModeChart({ data }) {
  if (!data?.length) return <span className="empty">no data</span>

  const max = Math.max(...data.map(m => m.count), 1)

  return (
    <div className="chart-vertical">
      {data.map((m, i) => (
        <div className="chart-col-wrap" key={i}>
          <div className="chart-col" style={{ height: Math.max(4, (m.count / max) * 120) + 'px' }}>
            <span className="chart-col-val">{m.count}</span>
          </div>
          <span className="chart-col-label">{formatMode(m.mode)}</span>
        </div>
      ))}
    </div>
  )
}

function formatMode(mode) {
  if (mode === 'ai') return 'vs AI'
  if (mode === 'friend') return 'friend'
  if (mode === 'online') return 'online'
  return mode
}
