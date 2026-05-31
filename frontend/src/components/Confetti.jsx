import { useState, useEffect, useRef } from 'react'

const COLORS = ['#2dd4bf', '#d4a373', '#f59e0b', '#a78bfa', '#f87171', '#34d399']

export default function Confetti({ active }) {
  const [particles, setParticles] = useState([])
  const id = useRef(0)

  useEffect(() => {
    if (!active) { setParticles([]); return }
    const items = []
    for (let i = 0; i < 40; i++) {
      id.current++
      items.push({
        id: id.current,
        x: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.3,
        dur: 0.6 + Math.random() * 0.6,
        size: 4 + Math.random() * 6,
        drift: (Math.random() - 0.5) * 40,
      })
    }
    setParticles(items)
    const t = setTimeout(() => setParticles([]), 1600)
    return () => clearTimeout(t)
  }, [active])

  if (!particles.length) return null

  return (
    <div className="confetti-container">
      {particles.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.x + '%',
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            animationDelay: p.delay + 's',
            animationDuration: p.dur + 's',
            '--drift': p.drift + 'px',
          }}
        />
      ))}
    </div>
  )
}
