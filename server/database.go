package main

import (
	"database/sql"
	"log"
	"time"

	_ "modernc.org/sqlite"
)

func initDB(dbPath string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(1)

	migrations := []string{
		`CREATE TABLE IF NOT EXISTS leaderboard (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			board_size INTEGER DEFAULT 3,
			mode TEXT DEFAULT 'ai',
			created_at TEXT DEFAULT (datetime('now'))
		)`,
		`CREATE TABLE IF NOT EXISTS request_log (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			method TEXT NOT NULL,
			path TEXT NOT NULL,
			ip TEXT DEFAULT '',
			user_agent TEXT DEFAULT '',
			created_at TEXT DEFAULT (datetime('now'))
		)`,
	}

	for _, m := range migrations {
		if _, err := db.Exec(m); err != nil {
			return nil, err
		}
	}

	log.Println("database initialized: " + dbPath)
	return db, nil
}

func logRequest(db *sql.DB, method, path, ip, ua string) {
	db.Exec(
		"INSERT INTO request_log (method, path, ip, user_agent) VALUES (?, ?, ?, ?)",
		method, path, ip, ua,
	)
}

type AdminStats struct {
	TotalRequests  int          `json:"totalRequests"`
	TotalWins      int          `json:"totalWins"`
	UniquePlayers  int          `json:"uniquePlayers"`
	TopPlayers     []PlayerStat `json:"topPlayers"`
	RecentIPs      []string     `json:"recentIPs"`
	ModeBreakdown  []ModeCount  `json:"modeBreakdown"`
	BoardBreakdown []ModeCount  `json:"boardBreakdown"`
	DailyWins      []DailyCount `json:"dailyWins"`
	ActiveGames    int          `json:"activeGames"`
}

type ModeCount struct {
	Mode  string `json:"mode"`
	Count int    `json:"count"`
}

type DailyCount struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

func collectStats(db *sql.DB) AdminStats {
	var s AdminStats

	db.QueryRow("SELECT COUNT(*) FROM request_log").Scan(&s.TotalRequests)
	db.QueryRow("SELECT COUNT(*) FROM leaderboard").Scan(&s.TotalWins)
	db.QueryRow("SELECT COUNT(DISTINCT name) FROM leaderboard").Scan(&s.UniquePlayers)

	rows, _ := db.Query(
		"SELECT name, COUNT(*) as wins FROM leaderboard GROUP BY name ORDER BY wins DESC LIMIT 10",
	)
	for rows.Next() {
		var ps PlayerStat
		rows.Scan(&ps.Name, &ps.Wins)
		s.TopPlayers = append(s.TopPlayers, ps)
	}
	rows.Close()

	ipRows, _ := db.Query(
		"SELECT ip FROM request_log WHERE ip != '' GROUP BY ip ORDER BY MAX(id) DESC LIMIT 20",
	)
	for ipRows.Next() {
		var ip string
		ipRows.Scan(&ip)
		s.RecentIPs = append(s.RecentIPs, ip)
	}
	ipRows.Close()

	modeRows, _ := db.Query(
		"SELECT mode, COUNT(*) as count FROM leaderboard GROUP BY mode ORDER BY count DESC",
	)
	for modeRows.Next() {
		var mc ModeCount
		modeRows.Scan(&mc.Mode, &mc.Count)
		s.ModeBreakdown = append(s.ModeBreakdown, mc)
	}
	modeRows.Close()

	dailyRows, _ := db.Query(
		"SELECT date(created_at) as d, COUNT(*) as c FROM leaderboard GROUP BY d ORDER BY d DESC LIMIT 14",
	)
	for dailyRows.Next() {
		var dc DailyCount
		dailyRows.Scan(&dc.Date, &dc.Count)
		s.DailyWins = append(s.DailyWins, dc)
	}
	dailyRows.Close()

	boardRows, _ := db.Query(
		"SELECT board_size, COUNT(*) as count FROM leaderboard GROUP BY board_size ORDER BY count DESC",
	)
	for boardRows.Next() {
		var mc ModeCount
		boardRows.Scan(&mc.Mode, &mc.Count)
		s.BoardBreakdown = append(s.BoardBreakdown, mc)
	}
	boardRows.Close()

	s.ActiveGames = gameStore.Count()

	return s
}

func clearLeaderboardDB(db *sql.DB) error {
	_, err := db.Exec("DELETE FROM leaderboard")
	return err
}

func clearLogsDB(db *sql.DB) error {
	_, err := db.Exec("DELETE FROM request_log")
	return err
}

type LogEntry struct {
	ID        int    `json:"id"`
	Method    string `json:"method"`
	Path      string `json:"path"`
	IP        string `json:"ip"`
	UserAgent string `json:"userAgent"`
	CreatedAt string `json:"createdAt"`
}

func recentLogs(db *sql.DB, limit int) []LogEntry {
	rows, err := db.Query(
		"SELECT id, method, path, ip, user_agent, created_at FROM request_log ORDER BY id DESC LIMIT ?",
		limit,
	)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var logs []LogEntry
	for rows.Next() {
		var l LogEntry
		rows.Scan(&l.ID, &l.Method, &l.Path, &l.IP, &l.UserAgent, &l.CreatedAt)
		logs = append(logs, l)
	}
	return logs
}

// auto-clean old logs (keep 7 days)
func cleanOldLogs(db *sql.DB) {
	db.Exec("DELETE FROM request_log WHERE created_at < datetime('now', '-7 days')")
}

func startLogCleaner(db *sql.DB) {
	go func() {
		for {
			time.Sleep(24 * time.Hour)
			cleanOldLogs(db)
		}
	}()
}
