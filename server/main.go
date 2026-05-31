package main

import (
	"bufio"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
)

var db *sql.DB
var statsStore *StatsStore
var adminSecret string

func main() {
	loadEnv()

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "tix.db"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	adminSecret = os.Getenv("ADMIN_SECRET")

	var err error
	db, err = initDB(dbPath)
	if err != nil {
		log.Fatalf("failed to init db: %v", err)
	}
	defer db.Close()

	statsStore = NewStatsStore(db)
	startLogCleaner(db)

	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", handleHealth)
	mux.HandleFunc("/api/game", handleGame)
	mux.HandleFunc("/api/game/", handleGameByID)
	mux.HandleFunc("/api/ai/move", handleAIMove)
	mux.HandleFunc("/api/win", handleWin)
	mux.HandleFunc("/api/leaderboard", handleLeaderboard)
	mux.HandleFunc("/api/admin/", handleAdmin)
	log.Printf("server listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, loggingMiddleware(cors(mux))))
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasPrefix(r.URL.Path, "/api/") {
			next.ServeHTTP(w, r)
			return
		}
		ip := r.RemoteAddr
		if idx := strings.LastIndex(ip, ":"); idx != -1 {
			ip = ip[:idx]
		}
		if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
			ip = strings.Split(fwd, ",")[0]
		}
		logRequest(db, r.Method, r.URL.Path, ip, r.UserAgent())
		next.ServeHTTP(w, r)
	})
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == "OPTIONS" {
			w.WriteHeader(204)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func jsonOK(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

func jsonErr(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

func requireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if adminSecret == "" {
			jsonErr(w, "admin not configured (set ADMIN_SECRET)", 403)
			return
		}
		auth := r.Header.Get("Authorization")
		if auth != "Bearer "+adminSecret {
			jsonErr(w, "unauthorized", 401)
			return
		}
		next(w, r)
	}
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	jsonOK(w, map[string]string{"status": "ok"})
}

func handleGame(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		jsonErr(w, "method not allowed", 405)
		return
	}
	var body struct {
		Size    int    `json:"size"`
		WinLen  int    `json:"winLen"`
		Mode    string `json:"mode"`
		Player1 string `json:"player1"`
		Player2 string `json:"player2"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonErr(w, "bad request", 400)
		return
	}
	if body.Size < 3 {
		body.Size = 3
	}
	if body.Size > 10 {
		body.Size = 10
	}
	if body.WinLen < 3 || body.WinLen > body.Size {
		body.WinLen = body.Size
	}
	if body.Mode == "" {
		body.Mode = "friend"
	}

	game := gameStore.Create(body.Size, body.WinLen, body.Mode, body.Player1, body.Player2)
	jsonOK(w, game)
}

func handleGameByID(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/game/"), "/")
	if len(parts) == 0 || parts[0] == "" {
		jsonErr(w, "missing game id", 400)
		return
	}
	id := parts[0]

	if r.Method == "GET" {
		game := gameStore.Get(id)
		if game == nil {
			jsonErr(w, "game not found", 404)
			return
		}
		jsonOK(w, game)
		return
	}

	if r.Method == "POST" {
		if len(parts) < 2 || parts[1] != "move" {
			jsonErr(w, "use /api/game/:id/move", 400)
			return
		}
		game := gameStore.Get(id)
		if game == nil {
			jsonErr(w, "game not found", 404)
			return
		}
		if game.Winner != 0 || game.Draw {
			jsonErr(w, "game over", 400)
			return
		}

		var body struct {
			Player int `json:"player"`
			Row    int `json:"row"`
			Col    int `json:"col"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			jsonErr(w, "bad request", 400)
			return
		}
		if body.Player != game.Turn {
			jsonErr(w, "not your turn", 400)
			return
		}
		if !game.Board.Place(body.Row, body.Col, body.Player) {
			jsonErr(w, "invalid move", 400)
			return
		}

		if game.Board.CheckWin(body.Player) {
			game.Winner = body.Player
		} else if game.Board.IsFull() {
			game.Draw = true
		} else {
			game.Turn = P1 + P2 - game.Turn
		}

		gameStore.Update(id, game)
		jsonOK(w, game)
		return
	}

	jsonErr(w, "method not allowed", 405)
}

func handleAIMove(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		jsonErr(w, "method not allowed", 405)
		return
	}
	var body struct {
		Cells  [][]int `json:"cells"`
		Size   int     `json:"size"`
		WinLen int     `json:"winLen"`
		AI     int     `json:"ai"`
		Human  int     `json:"human"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonErr(w, "bad request", 400)
		return
	}

	board := &Board{Cells: body.Cells, Size: body.Size, WinLen: body.WinLen}
	move := AImove(board, body.AI, body.Human)
	jsonOK(w, map[string]int{"row": move[0], "col": move[1]})
}

func handleWin(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		jsonErr(w, "method not allowed", 405)
		return
	}
	var body struct {
		Name      string `json:"name"`
		BoardSize int    `json:"boardSize"`
		Mode      string `json:"mode"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Name == "" {
		jsonErr(w, "bad request", 400)
		return
	}
	if body.BoardSize == 0 {
		body.BoardSize = 3
	}
	if body.Mode == "" {
		body.Mode = "ai"
	}
	statsStore.AddWin(body.Name, body.BoardSize, body.Mode)
	jsonOK(w, map[string]string{"ok": "true"})
}

func handleLeaderboard(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		jsonErr(w, "method not allowed", 405)
		return
	}
	top := statsStore.Leaderboard(50)
	if top == nil {
		top = []PlayerStat{}
	}
	jsonOK(w, top)
}

func handleAdmin(w http.ResponseWriter, r *http.Request) {
	if !strings.HasPrefix(r.URL.Path, "/api/admin/") {
		jsonErr(w, "not found", 404)
		return
	}

	action := strings.TrimPrefix(r.URL.Path, "/api/admin/")

	switch {
	case action == "stats":
		requireAdmin(func(w http.ResponseWriter, r *http.Request) {
			stats := collectStats(db)
			jsonOK(w, stats)
		})(w, r)

	case action == "leaderboard" && r.Method == "DELETE":
		requireAdmin(func(w http.ResponseWriter, r *http.Request) {
			if err := clearLeaderboardDB(db); err != nil {
				jsonErr(w, "failed to clear", 500)
				return
			}
			jsonOK(w, map[string]string{"ok": "true"})
		})(w, r)

	case action == "logs" && r.Method == "DELETE":
		requireAdmin(func(w http.ResponseWriter, r *http.Request) {
			if err := clearLogsDB(db); err != nil {
				jsonErr(w, "failed to clear logs", 500)
				return
			}
			jsonOK(w, map[string]string{"ok": "true"})
		})(w, r)

	case action == "logs":
		requireAdmin(func(w http.ResponseWriter, r *http.Request) {
			logs := recentLogs(db, 100)
			if logs == nil {
				logs = []LogEntry{}
			}
			jsonOK(w, logs)
		})(w, r)

	default:
		jsonErr(w, "unknown admin action", 404)
	}
}

func loadEnv() {
	f, err := os.Open(".env")
	if err != nil {
		return
	}
	defer f.Close()
	s := bufio.NewScanner(f)
	for s.Scan() {
		line := strings.TrimSpace(s.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		val := strings.TrimSpace(parts[1])
		if key != "" && os.Getenv(key) == "" {
			os.Setenv(key, val)
		}
	}
}


