import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createBoard, checkWin, isFull, aiMove, P1, P2, EMPTY } from './game'
import { useSound } from './useSound'
import Landing from './components/Landing'
import Menu from './components/Menu'
import Board from './components/Board'
import Leaderboard from './components/Leaderboard'
import ResultModal from './components/ResultModal'
import OnlineGame from './components/OnlineGame'
import Confetti from './components/Confetti'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export default function App() {
  const [screen, setScreen] = useState('landing')
  const [size, setSize] = useState(5)
  const [winLen, setWinLen] = useState(4)
  const [mode, setMode] = useState(null)
  const [board, setBoard] = useState(createBoard(5))
  const [turn, setTurn] = useState(P1)
  const [winner, setWinner] = useState(null)
  const [draw, setDraw] = useState(false)
  const [winCells, setWinCells] = useState(null)
  const [moveCount, setMoveCount] = useState(0)
  const [name, setName] = useState(() => localStorage.getItem('tix_p1') || '')
  const [name2, setName2] = useState(() => localStorage.getItem('tix_p2') || '')
  const [lb, setLb] = useState([])
  const [showResult, setShowResult] = useState(false)
  const [showLb, setShowLb] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [score, setScore] = useState({ p1: 0, p2: 0, draws: 0 })
  const boardRef = useRef(board)
  boardRef.current = board
  const sound = useSound()
  const aiSoundRef = useRef(false)
  const placingRef = useRef(false)

  useEffect(() => { localStorage.setItem('tix_p1', name) }, [name])
  useEffect(() => { localStorage.setItem('tix_p2', name2) }, [name2])

  const fetchLb = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/leaderboard`)
      if (r.ok) setLb(await r.json() || [])
    } catch {}
  }, [])

  useEffect(() => {
    fetchLb()
    const id = setInterval(fetchLb, 5000)
    return () => clearInterval(id)
  }, [fetchLb])

  const submitWin = useCallback(async (n, sz, wl, md) => {
    try {
      await fetch(`${API}/api/win`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: n, boardSize: sz || size, mode: md || mode }),
      })
      fetchLb()
    } catch {}
  }, [fetchLb, size, mode])

  const place = useCallback((r, c) => {
    if (winner || draw || placingRef.current) return
    placingRef.current = true
    const cur = boardRef.current
    if (cur[r][c] !== EMPTY) { placingRef.current = false; return }
    const next = cur.map(row => [...row])
    next[r][c] = turn
    setMoveCount(m => m + 1)
    const wc = checkWin(next, turn, winLen)
    if (wc) {
      setBoard(next)
      setWinCells(wc)
      setWinner(turn)
      setShowConfetti(true)
      setScore(s => ({
        p1: s.p1 + (turn === P1 ? 1 : 0),
        p2: s.p2 + (turn === P2 ? 1 : 0),
        draws: s.draws,
      }))
      sound.win()
      setTimeout(() => { setShowResult(true); placingRef.current = false }, 600)
      return
    }
    if (isFull(next)) {
      setBoard(next)
      setDraw(true)
      setScore(s => ({ ...s, draws: s.draws + 1 }))
      sound.draw()
      setTimeout(() => { setShowResult(true); placingRef.current = false }, 600)
      return
    }
    setBoard(next)
    setTurn(turn === P1 ? P2 : P1)
    sound.place()
    placingRef.current = false
  }, [turn, winner, draw, winLen, sound])

  useEffect(() => {
    if (mode !== 'ai' || turn !== P2 || winner || draw) { aiSoundRef.current = false; return }
    if (!aiSoundRef.current) { aiSoundRef.current = true; sound.aiThink() }
    const id = setTimeout(() => {
      aiSoundRef.current = false
      const move = aiMove(boardRef.current, P2, P1, winLen)
      if (move) place(move[0], move[1])
    }, 400)
    return () => clearTimeout(id)
  }, [mode, turn, winner, draw, place, winLen, sound])

  const startGame = useCallback((m, opts) => {
    placingRef.current = false
    const sz = opts?.size || 5
    const wl = opts?.win || 4
    if (m === 'online') {
      setMode('online')
      setSize(sz)
      setWinLen(wl)
      setScreen('online')
      return
    }
    setMode(m)
    setSize(sz)
    setWinLen(wl)
    setBoard(createBoard(sz))
    setTurn(P1)
    setWinner(null)
    setDraw(false)
    setWinCells(null)
    setMoveCount(0)
    setShowResult(false)
    setShowConfetti(false)
    setScreen('game')
  }, [])

  const playAgain = useCallback(() => {
    placingRef.current = false
    setBoard(createBoard(size))
    setTurn(P1)
    setWinner(null)
    setDraw(false)
    setWinCells(null)
    setMoveCount(0)
    setShowResult(false)
    setShowConfetti(false)
  }, [size])

  const handleSubmit = useCallback(() => {
    const n = winner === P1 ? name : name2
    if (n.trim()) {
      submitWin(n.trim())
      setShowResult(false)
    }
  }, [winner, name, name2, submitWin])

  const goToMenu = useCallback(() => {
    placingRef.current = false
    setScreen('menu')
    setMode(null)
    setWinner(null)
    setDraw(false)
    setWinCells(null)
    setMoveCount(0)
    setShowResult(false)
    setShowConfetti(false)
    setScore({ p1: 0, p2: 0, draws: 0 })
  }, [])

  const resultLabel = useMemo(() => {
    if (winner === P1) return (name.trim() || 'player 1') + ' wins'
    if (winner === P2) return mode === 'ai' ? 'ai wins' : (name2.trim() || 'player 2') + ' wins'
    return 'draw'
  }, [winner, name, name2, mode])

  const scoreLabel = `${score.p1} - ${score.p2}${score.draws ? ` (${score.draws}d)` : ''}`

  return (
    <div className="app">
      <header className="hdr">
        <div className="hdr-brand" onClick={() => setScreen('landing')} style={{ cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 48 48">
            <polygon points="24,4 44,24 24,44 4,24" fill="none" stroke="#2dd4bf" strokeWidth="3" />
            <circle cx="24" cy="24" r="8" fill="#2dd4bf" />
          </svg>
          <span className="hdr-t">tix</span>
        </div>
        <span className="hdr-s">{size}&times;{size} get {winLen}</span>
        {mode === 'friend' && <span className="hdr-score">{scoreLabel}</span>}
        <span className="hdr-moves">{moveCount > 0 && `${moveCount} moves`}</span>
        <button className="hdr-lb-btn" onClick={() => setShowLb(!showLb)} title="leaderboard">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 6 9 6 9z"/>
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 18 9 18 9z"/>
            <path d="M4 22h16"/>
            <path d="M10 22V9h4v13"/>
            <path d="M6 22v-7h4"/>
            <path d="M14 22v-7h4"/>
          </svg>
        </button>
      </header>

      <main className="main">
        <Confetti active={showConfetti} />
        {screen === 'landing' && <Landing onEnter={() => setScreen('menu')} />}
        {screen === 'menu' && <Menu onStart={startGame} onBack={() => setScreen('landing')} name={name} name2={name2} onNameChange={setName} onName2Change={setName2} />}
        {screen === 'game' && (
          <div className="game-wrap">
            <Board board={board} turn={turn} winner={winner} mode={mode} size={size} onPlace={place} winCells={winCells} />
            <button className="btn btn-sm" onClick={goToMenu}>quit</button>
          </div>
        )}
        {screen === 'online' && (
          <OnlineGame size={size} winLen={winLen} player1={name.trim() || 'player 1'} player2={name2.trim() || 'player 2'} onBack={goToMenu} />
        )}
      </main>

      <Leaderboard entries={lb} />

      {showLb && (
        <div className="lb-overlay" onClick={() => setShowLb(false)}>
          <div className="lb-overlay-panel" onClick={e => e.stopPropagation()}>
            <div className="lb-overlay-h">
              <h3 className="lb-t">leaderboard</h3>
              <button className="lb-close" onClick={() => setShowLb(false)}>×</button>
            </div>
            <div className="lb-l">
              {(!lb || lb.length === 0) && <p className="lb-e">no scores yet</p>}
              {lb && lb.map((e, i) => (
                <div className="lb-r" key={i}>
                  <span className="lb-rk">#{i + 1}</span>
                  <span className="lb-nm">{e.name}</span>
                  <span className="lb-sc">{e.wins}w</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer className="ftr">
        <span>built by <a href="https://devolabanks.xyz" target="_blank" rel="noopener">dev_olabanks</a></span>
      </footer>

      {showResult && (
        <ResultModal
          label={resultLabel}
          showSubmit={!draw && winner !== 0 && !(winner === P2 && mode === 'ai')}
          name={winner === P1 ? name : name2}
          onNameChange={winner === P1 ? setName : setName2}
          onSubmit={handleSubmit}
          onPlayAgain={playAgain}
        />
      )}
    </div>
  )
}
