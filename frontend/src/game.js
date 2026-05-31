export const EMPTY = 0
export const P1 = 1
export const P2 = 2

export function createBoard(size) {
  return Array.from({ length: size }, () => Array(size).fill(EMPTY))
}

export function checkWin(board, player, winLen) {
  const n = board.length
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]]
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (board[r][c] !== player) continue
      for (const [dr, dc] of dirs) {
        const cells = [[r, c]]
        let ok = true
        for (let i = 1; i < winLen; i++) {
          const nr = r + dr * i
          const nc = c + dc * i
          if (nr < 0 || nr >= n || nc < 0 || nc >= n || board[nr][nc] !== player) {
            ok = false
            break
          }
          cells.push([nr, nc])
        }
        if (ok) return cells
      }
    }
  }
  return null
}

export function isFull(board) {
  return board.every(row => row.every(c => c !== EMPTY))
}

function evaluateLine(board, row, col, dr, dc, player, winLen) {
  const n = board.length
  let score = 0
  for (let start = -(winLen - 1); start <= 0; start++) {
    let pieces = 0
    let blocked = false
    for (let i = 0; i < winLen; i++) {
      const r = row + (start + i) * dr
      const c = col + (start + i) * dc
      if (r < 0 || r >= n || c < 0 || c >= n) { blocked = true; break }
      if (board[r][c] === EMPTY) continue
      if (board[r][c] === player) pieces++
      else { blocked = true; break }
    }
    if (!blocked && pieces > 0) {
      score += Math.pow(10, pieces)
    }
  }
  return score
}

export function aiMove(board, ai, human, winLen) {
  const n = board.length
  const center = Math.floor(n / 2)
  let best = -1
  let bestCell = null
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]]
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (board[r][c] !== EMPTY) continue
      let score = 0
      for (const [dr, dc] of dirs) {
        score += evaluateLine(board, r, c, dr, dc, ai, winLen) * 1.1
        score += evaluateLine(board, r, c, dr, dc, human, winLen)
      }
      const dist = Math.abs(r - center) + Math.abs(c - center)
      score += (n - dist) * 0.5
      if (score > best) { best = score; bestCell = [r, c] }
    }
  }
  return bestCell
}
