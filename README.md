# tix

A configurable tic-tac-toe arena — play with friends, challenge the AI, or battle across devices. No sign-up, just play.

## features

- **custom boards** — choose from 3×3 up to 8×5 with adjustable win lengths
- **vs AI** — heuristic-based opponent with center bias
- **vs Friend** — pass-and-play on the same device
- **play online** — create a game and share the ID for cross-device play
- **leaderboard** — submit wins under any name, no auth required
- **responsive** — works on desktop and mobile

## stack

| layer | tech |
|-------|------|
| frontend | React 18 + Vite |
| backend | Go (net/http) |
| storage | in-memory |

## run locally

**Backend:**
```sh
cd server
go run .
```

**Frontend:**
```sh
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` and connects to the backend at `http://localhost:8080`.

Configure the API URL by copying `frontend/.env.example` to `frontend/.env`:
```
VITE_API_URL=http://localhost:8080
```

## project structure

```
tix/
├── server/             # Go backend
│   ├── main.go         # HTTP server, routes, handlers, CORS
│   ├── game.go         # board, win checking, AI
│   ├── store.go        # in-memory game & stats storage
│   └── .env.example
├── frontend/           # React frontend
│   ├── src/
│   │   ├── App.jsx     # root component, screen routing, API calls
│   │   ├── App.css     # global styles, responsive layout
│   │   ├── game.js     # shared game logic
│   │   ├── main.jsx    # entry point
│   │   └── components/
│   │       ├── Board.jsx
│   │       ├── Landing.jsx
│   │       ├── Leaderboard.jsx
│   │       ├── Menu.jsx
│   │       ├── OnlineGame.jsx
│   │       ├── PlayerShape.jsx
│   │       └── ResultModal.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env.example
└── .gitignore
```

## API

| method | path | description |
|--------|------|-------------|
| GET | `/api/health` | health check |
| POST | `/api/game` | create a new game |
| GET | `/api/game/:id` | get game state |
| POST | `/api/game/:id/move` | make a move |
| POST | `/api/ai/move` | compute AI move server-side |
| POST | `/api/win` | record a win |
| GET | `/api/leaderboard` | get top scores |

## deploy

**Render (Go backend):**
1. connect your repo
2. set root directory to `server/`
3. build command: `go build -o tix`
4. start command: `./tix`

**Vite (frontend):**
Build with `npm run build` and serve the `dist/` folder from any static host.

---

built by [dev_olabanks](https://devolabanks.xyz)
