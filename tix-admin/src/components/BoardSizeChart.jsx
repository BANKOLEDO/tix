export default function BoardSizeChart({ data }) {
  if (!data?.length) return null

  const max = Math.max(...data.map(b => b.count), 1)

  return (
    <div className="card">
      <h2>by board size</h2>
      <div className="chart-bar-list">
        {data.map((b, i) => (
          <div className="chart-bar-row" key={i}>
            <span className="chart-bar-label">{b.mode}x{b.mode}</span>
            <div className="chart-bar-track">
              <div className="chart-bar-fill chart-fill-green" style={{ width: (b.count / max) * 100 + '%' }} />
            </div>
            <span className="chart-bar-val">{b.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
