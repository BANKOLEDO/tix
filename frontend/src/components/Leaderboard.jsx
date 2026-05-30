export default function Leaderboard({ entries }) {
  const list = entries || []
  return (
    <aside className="lb">
      <h3 className="lb-t">leaderboard</h3>
      <div className="lb-l">
        {list.length === 0 && <p className="lb-e">no scores yet</p>}
        {list.map((e, i) => (
          <div className="lb-r" key={i}>
            <span className="lb-rk">#{i + 1}</span>
            <span className="lb-nm">{e.name}</span>
            <span className="lb-sc">{e.wins}w</span>
          </div>
        ))}
      </div>
    </aside>
  )
}
