package main

const (
	EMPTY = 0
	P1    = 1
	P2    = 2
)

type Board struct {
	Cells    [][]int `json:"cells"`
	Size     int     `json:"size"`
	WinLen   int     `json:"winLen"`
}

func NewBoard(size, winLen int) *Board {
	cells := make([][]int, size)
	for i := range cells {
		cells[i] = make([]int, size)
	}
	return &Board{Cells: cells, Size: size, WinLen: winLen}
}

func (b *Board) Clone() *Board {
	cells := make([][]int, b.Size)
	for i := range cells {
		cells[i] = make([]int, b.Size)
		copy(cells[i], b.Cells[i])
	}
	return &Board{Cells: cells, Size: b.Size, WinLen: b.WinLen}
}

func (b *Board) IsEmpty(r, c int) bool {
	return r >= 0 && r < b.Size && c >= 0 && c < b.Size && b.Cells[r][c] == EMPTY
}

func (b *Board) Place(r, c, player int) bool {
	if !b.IsEmpty(r, c) {
		return false
	}
	b.Cells[r][c] = player
	return true
}

func (b *Board) CheckWin(player int) bool {
	dirs := [][2]int{{0, 1}, {1, 0}, {1, 1}, {1, -1}}
	for r := 0; r < b.Size; r++ {
		for c := 0; c < b.Size; c++ {
			if b.Cells[r][c] != player {
				continue
			}
			for _, d := range dirs {
				dr, dc := d[0], d[1]
				ok := true
				for i := 1; i < b.WinLen; i++ {
					nr, nc := r+dr*i, c+dc*i
					if nr < 0 || nr >= b.Size || nc < 0 || nc >= b.Size || b.Cells[nr][nc] != player {
						ok = false
						break
					}
				}
				if ok {
					return true
				}
			}
		}
	}
	return false
}

func (b *Board) IsFull() bool {
	for r := 0; r < b.Size; r++ {
		for c := 0; c < b.Size; c++ {
			if b.Cells[r][c] == EMPTY {
				return false
			}
		}
	}
	return true
}

func (b *Board) AvailableMoves() [][2]int {
	var moves [][2]int
	for r := 0; r < b.Size; r++ {
		for c := 0; c < b.Size; c++ {
			if b.Cells[r][c] == EMPTY {
				moves = append(moves, [2]int{r, c})
			}
		}
	}
	return moves
}

func evaluateLine(board *Board, row, col, dr, dc, player int) int {
	score := 0
	for start := -(board.WinLen - 1); start <= 0; start++ {
		pieces := 0
		blocked := false
		for i := 0; i < board.WinLen; i++ {
			r := row + (start+i)*dr
			c := col + (start+i)*dc
			if r < 0 || r >= board.Size || c < 0 || c >= board.Size {
				blocked = true
				break
			}
			if board.Cells[r][c] == EMPTY {
				continue
			}
			if board.Cells[r][c] == player {
				pieces++
			} else {
				blocked = true
				break
			}
		}
		if !blocked && pieces > 0 {
			var val int = 1
			for i := 0; i < pieces; i++ {
				val *= 10
			}
			score += val
		}
	}
	return score
}

func AImove(board *Board, ai, human int) [2]int {
	center := board.Size / 2
	best := -1
	var bestCell [2]int
	dirs := [][2]int{{0, 1}, {1, 0}, {1, 1}, {1, -1}}

	for r := 0; r < board.Size; r++ {
		for c := 0; c < board.Size; c++ {
			if board.Cells[r][c] != EMPTY {
				continue
			}
			score := 0
			for _, d := range dirs {
				score += evaluateLine(board, r, c, d[0], d[1], ai) * 11 / 10
				score += evaluateLine(board, r, c, d[0], d[1], human)
			}
			dist := abs(r-center) + abs(c-center)
			score += (board.Size - dist) * 5 / 10
			if score > best {
				best = score
				bestCell = [2]int{r, c}
			}
		}
	}
	return bestCell
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}
