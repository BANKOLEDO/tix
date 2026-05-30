import { P1, P2 } from '../game'

const COLORS = {
  [P1]: '#2dd4bf',
  [P2]: '#d4a373',
}

export default function PlayerShape({ player, size }) {
  const s = size || 36
  const c = COLORS[player]

  if (player === P1) {
    return (
      <svg width={s} height={s} viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="20" fill="none" stroke={c} strokeWidth="3" opacity="0.25" />
        <circle cx="24" cy="24" r="10" fill={c} />
      </svg>
    )
  }

  return (
    <svg width={s} height={s} viewBox="0 0 48 48">
      <polygon points="24,4 44,24 24,44 4,24" fill="none" stroke={c} strokeWidth="3" opacity="0.25" />
      <polygon points="24,12 36,24 24,36 12,24" fill={c} />
    </svg>
  )
}
