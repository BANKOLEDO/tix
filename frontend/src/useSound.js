import { useCallback, useRef } from 'react'

export function useSound() {
  const ctx = useRef(null)

  const getCtx = useCallback(() => {
    if (!ctx.current) ctx.current = new (window.AudioContext || window.webkitAudioContext)()
    return ctx.current
  }, [])

  const play = useCallback((freq, duration, type = 'sine', vol = 0.15) => {
    try {
      const c = getCtx()
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, c.currentTime)
      gain.gain.setValueAtTime(vol, c.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
      osc.connect(gain)
      gain.connect(c.destination)
      osc.start()
      osc.stop(c.currentTime + duration)
    } catch {}
  }, [getCtx])

  const place = useCallback(() => play(600, 0.08, 'sine', 0.1), [play])
  const win = useCallback(() => {
    play(523, 0.12, 'sine', 0.12)
    setTimeout(() => play(659, 0.12, 'sine', 0.12), 120)
    setTimeout(() => play(784, 0.2, 'sine', 0.12), 240)
  }, [play])
  const draw = useCallback(() => play(300, 0.25, 'triangle', 0.1), [play])
  const aiThink = useCallback(() => play(200, 0.06, 'square', 0.04), [play])

  return { place, win, draw, aiThink }
}
