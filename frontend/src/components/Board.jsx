import { EMPTY, P1, P2 } from '../game'
import PlayerShape from './PlayerShape'

export default function Board({ board, turn, winner, mode, size, onPlace, winCells }) {
  const n = size || board?.length || 3
  const maxBoardPx = Math.min(480, window.innerWidth - 80)
  const cellSize = Math.max(36, Math.floor(maxBoardPx / n))
  const isAiThinking = mode === 'ai' && turn === P2

  const isWinCell = (r, c) => winCells?.some(([wr, wc]) => wr === r && wc === c)

  return (
    <div className="game-container">
      <div className="turn-info">
        {turn === P1 ? (
          <><PlayerShape player={P1} size={18} /><span>your turn</span></>
        ) : (
          <><PlayerShape player={P2} size={18} /><span>{mode === 'ai' ? 'ai thinking' : "player 2's turn"}</span></>
        )}
      </div>
      <div className="board" style={{
        gridTemplateColumns: `repeat(${n}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${n}, ${cellSize}px)`,
      }}>
        {board.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              className={`cell${cell !== EMPTY ? ' taken' : ''}${isWinCell(r, c) ? ' win-cell' : ''}${winner && cell !== EMPTY && isWinCell(r, c) ? ' pulse' : ''}`}
              onClick={() => onPlace(r, c)}
              disabled={cell !== EMPTY || !!winner || isAiThinking}
              style={{ width: cellSize, height: cellSize }}
            >
              {cell !== EMPTY && <PlayerShape player={cell} size={Math.floor(cellSize * 0.55)} />}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
