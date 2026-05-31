package main

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"sync"
)

type GameState struct {
	mu      sync.Mutex
	ID      string `json:"id"`
	Board   *Board `json:"board"`
	Turn    int    `json:"turn"`
	Winner  int    `json:"winner"`
	Mode    string `json:"mode"`
	Player1 string `json:"player1"`
	Player2 string `json:"player2"`
	Draw    bool   `json:"draw"`
}

type PlayerStat struct {
	Name string `json:"name"`
	Wins int    `json:"wins"`
}

type StatsStore struct {
	db *sql.DB
}

func NewStatsStore(db *sql.DB) *StatsStore {
	return &StatsStore{db: db}
}

func (s *StatsStore) AddWin(name string, size int, mode string) {
	s.db.Exec(
		"INSERT INTO leaderboard (name, board_size, mode) VALUES (?, ?, ?)",
		name, size, mode,
	)
}

func (s *StatsStore) Leaderboard(n int) []PlayerStat {
	rows, err := s.db.Query(
		"SELECT name, COUNT(*) as wins FROM leaderboard GROUP BY name ORDER BY wins DESC, name ASC LIMIT ?",
		n,
	)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var list []PlayerStat
	for rows.Next() {
		var ps PlayerStat
		rows.Scan(&ps.Name, &ps.Wins)
		list = append(list, ps)
	}
	return list
}

type GameStore struct {
	mu    sync.RWMutex
	games map[string]*GameState
}

func NewGameStore() *GameStore {
	return &GameStore{games: make(map[string]*GameState)}
}

func (gs *GameStore) Create(size, winLen int, mode, p1, p2 string) *GameState {
	id := genID()
	game := &GameState{
		ID:      id,
		Board:   NewBoard(size, winLen),
		Turn:    P1,
		Mode:    mode,
		Player1: p1,
		Player2: p2,
	}
	gs.mu.Lock()
	gs.games[id] = game
	gs.mu.Unlock()
	return game
}

func (gs *GameStore) Get(id string) *GameState {
	gs.mu.RLock()
	defer gs.mu.RUnlock()
	return gs.games[id]
}

func (gs *GameStore) Count() int {
	gs.mu.RLock()
	defer gs.mu.RUnlock()
	return len(gs.games)
}

func (gs *GameStore) Update(id string, game *GameState) {
	gs.mu.Lock()
	gs.games[id] = game
	gs.mu.Unlock()
}

var gameStore = NewGameStore()

func genID() string {
	b := make([]byte, 6)
	rand.Read(b)
	return hex.EncodeToString(b)
}
