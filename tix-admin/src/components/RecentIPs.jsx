export default function RecentIPs({ ips }) {
  if (!ips?.length) return <span className="empty">no data</span>

  return (
    <div className="ip-list">
      {ips.map((ip, i) => (
        <div className="ip-row" key={i}>
          <span className="ip-dot" />
          {ip}
        </div>
      ))}
    </div>
  )
}
