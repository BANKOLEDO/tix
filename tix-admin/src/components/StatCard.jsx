export default function StatCard({ label, value }) {
  return (
    <div className="card stat-card">
      <h2>{label}</h2>
      <div className="big-stat">{value ?? '-'}</div>
    </div>
  )
}
