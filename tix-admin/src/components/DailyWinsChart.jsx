export default function DailyWinsChart({ data }) {
  if (!data?.length) return null

  const max = Math.max(...data.map(d => d.count), 1)
  const days = [...data].reverse()

  return (
    <div className="card">
      <h2>daily wins <span className="light">(last 14 days)</span></h2>
      <div className="chart-vertical">
        {days.map((d, i) => (
          <div className="chart-col-wrap" key={i}>
            <div className="chart-col chart-col-accent" style={{ height: Math.max(4, (d.count / max) * 100) + 'px' }}>
              <span className="chart-col-val">{d.count}</span>
            </div>
            <span className="chart-col-label">{d.date?.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
