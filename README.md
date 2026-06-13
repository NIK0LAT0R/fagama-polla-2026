# Fagama Polla 2026

A client-side FIFA World Cup predictions pool for 104 tournament matches. No backend, no database — everything runs in the browser with optional `localStorage` persistence.

## Features

- **Players** — Create multiple players, search, and select an active predictor
- **104 matches** — Full 2026 World Cup schedule (72 group + 32 knockout)
- **Predictions** — Score inputs per match, locked automatically at kickoff
- **Results (admin)** — Manually enter final scores
- **Scoring** — Exact score = 3 pts, correct outcome = 1 pt (configurable in `src/config/scoring.js`)
- **Leaderboard** — Live rankings with top-3 highlighting and CSV export
- **Filters** — Search and filter matches by stage

## Requirements

- [Node.js](https://nodejs.org/) 18+ and npm

## Run locally

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Build for production

```bash
npm run build
npm run preview
```

The static output is in the `dist/` folder — deploy it to any static host (Netlify, GitHub Pages, etc.).

## Project structure

```
src/
├── config/scoring.js      # Scoring rules (edit here)
├── data/matches.js        # 104 pre-loaded matches
├── services/
│   ├── storage.js         # localStorage read/write
│   └── scoring.js         # Point calculation logic
├── context/AppContext.jsx # Global state
├── components/
│   ├── Players/           # Player management
│   ├── Matches/           # Predictions UI
│   ├── Results/           # Admin results input
│   └── Leaderboard/       # Standings table
└── utils/                 # Helpers (lock logic, CSV export)
```

## Data models

| Entity      | Shape                                              |
|-------------|----------------------------------------------------|
| Player      | `{ id, name }`                                     |
| Match       | `{ id, teamA, teamB, datetime, stage }`            |
| Prediction  | `{ playerId, matchId, predictedA, predictedB }`    |
| Result      | `{ matchId, scoreA, scoreB }`                      |

## Customizing scoring

Edit `src/config/scoring.js`:

```js
export const SCORING_RULES = {
  exactScore: 3,
  correctOutcome: 1,
  incorrect: 0,
};
```

## Lock logic

Predictions compare the current system time against each match's `datetime`. Once kickoff passes, inputs are disabled and existing predictions become read-only.
