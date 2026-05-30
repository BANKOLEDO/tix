package main

import (
	"crypto/rand"
	"encoding/hex"
	"sort"
	"sync"
)

type GameState struct {
	ID       string `json:"id"`
	Board    *Board `json:"board"`
	Turn     int    `json:"turn"`
	Winner   int    `json:"winner"`
	Mode     string `json:"mode"`
	Player1  string `json:"player1"`
	Player2  string `json:"player2"`
	Draw     bool   `json:"draw"`
}

type PlayerStat struct {
	Name     string `json:"name"`
	Wins     int    `json:"wins"`
	BoardSize int   `json:"boardSize"`
	Mode     string `json:"mode"`
}

type StatsStore struct {
	mu  sync.RWMutex
	all []PlayerStat
}

func (s *StatsStore) AddWin(name string, size int, mode string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.all = append(s.all, PlayerStat{Name: name, Wins: 1, BoardSize: size, Mode: mode})
}

func (s *StatsStore) Leaderboard(n int) []PlayerStat {
	s.mu.RLock()
	defer s.mu.RUnlock()

	agg := make(map[string]*PlayerStat)
	for _, stat := range s.all {
		key := stat.Name + "|" + itoa(stat.BoardSize) + "|" + stat.Mode
		if _, ok := agg[key]; !ok {
			agg[key] = &PlayerStat{Name: stat.Name, Wins: 0, BoardSize: stat.BoardSize, Mode: stat.Mode}
		}
		agg[key].Wins++
	}

	var list []PlayerStat
	for _, v := range agg {
		list = append(list, *v)
	}

	sort.Slice(list, func(i, j int) bool {
		return list[i].Wins > list[j].Wins
	})
	if n > len(list) {
		n = len(list)
	}
	return list[:n]
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	var buf [12]byte
	i := len(buf)
	for n > 0 {
		i--
		buf[i] = byte('0' + n%10)
		n /= 10
	}
	return string(buf[i:])
}

var statsStore = &StatsStore{}

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
