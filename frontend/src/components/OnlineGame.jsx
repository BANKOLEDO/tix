import { useState, useEffect, useCallback } from 'react'
import { P1, P2, EMPTY } from '../game'
import PlayerShape from './PlayerShape'

export default function OnlineGame({ size, winLen, player1, player2, onBack }) {
  const [gameId, setGameId] = useState(null)
  const [board, setBoard] = useState(null)
  const [turn, setTurn] = useState(P1)
  const [winner, setWinner] = useState(null)
  const [draw, setDraw] = useState(false)
  const [myPlayer, setMyPlayer] = useState(null)
  const [joinId, setJoinId] = useState('')
  const [error, setError] = useState('')
  const api = import.meta.env.VITE_API_URL || 'http://localhost:8080'

  const pollFn = useCallback(async () => {
    if (!gameId) return
    try {
      const r = await fetch(`${api}/api/game/${gameId}`)
      const data = await r.json()
      setBoard(data.board.cells)
      setTurn(data.turn)
      if (data.winner) setWinner(data.winner)
      if (data.draw) setDraw(true)
    } catch {}
  }, [api, gameId])

  useEffect(() => {
    if (!gameId || winner || draw) return
    pollFn()
    const id = setInterval(pollFn, 1000)
    return () => clearInterval(id)
  }, [gameId, winner, draw, pollFn])

  async function createGame() {
    setError('')
    try {
      const r = await fetch(`${api}/api/game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ size, winLen, mode: 'online', player1, player2 }),
      })
      const data = await r.json()
      setGameId(data.id)
      setBoard(data.board.cells)
      setTurn(data.turn)
      setMyPlayer(P1)
    } catch {
      setError('failed to create game')
    }
  }

  async function joinGame() {
    if (!joinId.trim()) return
    setError('')
    try {
      const r = await fetch(`${api}/api/game/${joinId.trim()}`)
      if (!r.ok) { setError('game not found'); return }
      const data = await r.json()
      setGameId(data.id)
      setBoard(data.board.cells)
      setTurn(data.turn)
      setWinner(data.winner)
      setDraw(data.draw)
      setMyPlayer(P2)
    } catch {
      setError('failed to join game')
    }
  }

  async function place(row, col) {
    if (winner || draw || !gameId) return
    if (board[row][col] !== EMPTY) return
    try {
      const r = await fetch(`${api}/api/game/${gameId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: turn, row, col }),
      })
      const data = await r.json()
      if (!r.ok) { setError(data.error || 'invalid move'); return }
      setBoard(data.board.cells)
      setTurn(data.turn)
      if (data.draw) setDraw(true)
      if (data.winner) setWinner(data.winner)
    } catch {
      setError('network error')
    }
  }

  if (!gameId) {
    return (
      <div className="menu">
        <button className="btn btn-sm menu-back" onClick={onBack}>back</button>
        <div className="menu-icon">
          <svg width="64" height="64" viewBox="0 0 48 48">
            <circle cx="16" cy="24" r="11" fill="none" stroke="#2dd4bf" strokeWidth="3" />
            <circle cx="16" cy="24" r="5" fill="#2dd4bf" />
            <polygon points="32,8 44,24 32,40 20,24" fill="none" stroke="#d4a373" strokeWidth="3" />
            <polygon points="32,14 40,24 32,34 24,24" fill="#d4a373" />
          </svg>
        </div>
        <h2 className="menu-title">online</h2>
        {error && <p className="error-msg">{error}</p>}
        <div className="menu-btns">
          <button className="btn btn-lg" onClick={createGame}>create game</button>
        </div>
        <div className="menu-divider"><span>or</span></div>
        <div className="join-row">
          <input className="inp" placeholder="game id" value={joinId}
            onChange={e => setJoinId(e.target.value)} maxLength={12}
            onKeyDown={e => e.key === 'Enter' && joinGame()} />
          <button className="btn" onClick={joinGame}>join</button>
        </div>
      </div>
    )
  }

  const n = size
  const cellSize = Math.min(60, Math.floor(480 / n))
  const isMyTurn = turn === myPlayer
  const result = winner === myPlayer ? 'you win!'
    : draw ? 'draw'
    : winner !== 0 ? 'you lose'
    : null

  return (
    <div className="menu">
      {!result && (
        <div className="turn-info">
          {isMyTurn ? 'your turn' : 'waiting for opponent...'}
        </div>
      )}
      {result && (
        <div className="result-banner">
          <span className="result-label">{result}</span>
          <button className="btn btn-sm" onClick={onBack}>quit</button>
        </div>
      )}
      <div className="online-id">
        <span className="online-id-label">game id</span>
        <span className="online-id-value" onClick={() => navigator.clipboard?.writeText(gameId)}>
          {gameId}
        </span>
      </div>
      <div className="board" style={{
        gridTemplateColumns: `repeat(${n}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${n}, ${cellSize}px)`,
      }}>
        {board && board.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              className={`cell${cell !== EMPTY ? ' taken' : ''}`}
              onClick={() => place(r, c)}
              disabled={cell !== EMPTY || !!winner || draw || !isMyTurn}
              style={{ width: cellSize, height: cellSize }}
            >
              {cell !== EMPTY && <PlayerShape player={cell} size={Math.floor(cellSize * 0.5)} />}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
