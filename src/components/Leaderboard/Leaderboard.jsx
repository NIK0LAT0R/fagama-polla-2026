
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { calculateStandings, calculateMatchPoints } from '../../services/scoring.js';
import { fetchAllPredictions } from '../../services/cosmosApi.js';
import { exportStandingsToCSV } from '../../utils/csvExport.js';
import { getPlayerImageSrc, getPlayerInitials } from '../../utils/playerImages.js';

function rankClass(rank) {
  if (rank === 1) return 'rank-gold';
  if (rank === 2) return 'rank-silver';
  if (rank === 3) return 'rank-bronze';
  return '';
}

function isSameLocalDay(dateLike, baseDate = new Date()) {
  const d = new Date(dateLike);

  if (Number.isNaN(d.getTime())) return false;

  return (
    d.getFullYear() === baseDate.getFullYear() &&
    d.getMonth() === baseDate.getMonth() &&
    d.getDate() === baseDate.getDate()
  );
}

function PlayerMiniAvatar({ playerName }) {
  const [failed, setFailed] = useState(false);
  const src = getPlayerImageSrc(playerName);

  if (!src || failed) {
    return (
      <div className="leaderboard-player-avatar leaderboard-player-avatar-fallback">
        {getPlayerInitials(playerName)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={playerName}
      className="leaderboard-player-avatar"
      onError={() => setFailed(true)}
    />
  );
}

function buildResultsMap(results) {
  if (results instanceof Map) return results;

  if (Array.isArray(results)) {
    return new Map(
      results.map((result) => [
        String(result.matchId ?? result.id),
        result,
      ])
    );
  }

  return new Map();
}

export default function Leaderboard({ onInspectPlayer }) {
  const { players, results, matches } = useApp();
  const [allPredictions, setAllPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadLeaderboardPredictions() {
      setLoading(true);

      try {
        const nextPredictions = await fetchAllPredictions();

        if (!cancelled) {
          setAllPredictions(nextPredictions);
        }
      } catch (error) {
        console.error('Error loading leaderboard predictions:', error);

        if (!cancelled) {
          setAllPredictions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadLeaderboardPredictions();

    return () => {
      cancelled = true;
    };
  }, []);

  const standings = useMemo(() => {
    const baseStandings = calculateStandings(players, allPredictions, results, matches).map((entry) => {
      const matchedPlayer =
        players.find((p) => String(p.id) === String(entry.playerId)) ||
        players.find((p) => p.name === entry.name);

      return {
        ...entry,
        playerId: matchedPlayer?.id ?? entry.playerId ?? entry.name,
        dailyPoints: 0,
      };
    });

    const resultsMap = buildResultsMap(results);
    const matchMap = new Map(matches.map((match) => [String(match.id), match]));
    const standingsMap = new Map(
      baseStandings.map((entry) => [String(entry.playerId), entry])
    );

    const today = new Date();

    allPredictions.forEach((prediction) => {
      const playerEntry = standingsMap.get(String(prediction.playerId));
      const match = matchMap.get(String(prediction.matchId));
      const result = resultsMap.get(String(prediction.matchId));

      if (!playerEntry || !match || !result) return;

      const matchDate = match.lockAt ?? match.datetime;
      if (!isSameLocalDay(matchDate, today)) return;

      const points = calculateMatchPoints(prediction, result, match);
      playerEntry.dailyPoints += points;
    });

    return [...baseStandings].sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.dailyPoints !== a.dailyPoints) return b.dailyPoints - a.dailyPoints;
      if ((b.scoredMatches ?? 0) !== (a.scoredMatches ?? 0)) {
        return (b.scoredMatches ?? 0) - (a.scoredMatches ?? 0);
      }
      return a.name.localeCompare(b.name);
    });
  }, [players, allPredictions, results, matches]);

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2>Consolidado de puntos</h2>
          <p className="panel-subtitle">
            Ganador o empate correcto: 6 pts · Goles exactos por equipo: 2 pt c/u ·
            Marcador exacto: 10 pts
          </p>
        </div>

        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => exportStandingsToCSV(standings)}
          disabled={standings.length === 0}
        >
          Exportar CSV
        </button>
      </header>

      {loading ? (
        <p className="empty-state">Cargando tabla…</p>
      ) : standings.length === 0 ? (
        <p className="empty-state">
          Añade jugadores e ingresa resultados para ver la tabla.
        </p>
      ) : (
        <div className="table-wrap">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th scope="col">Posición</th>
                <th scope="col">Jugador</th>
                <th scope="col">Puntos</th>
                <th scope="col">Acum.hoy</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((entry, index) => {
                const rank = index + 1;

                return (
                  <tr key={entry.playerId} className={rankClass(rank)}>
                    <td>
                      <span className="rank-cell">
                        {rank <= 3 && (
                          <span className="medal" aria-hidden="true">
                            {'🥇🥈🥉'[rank - 1]}
                          </span>
                        )}
                        {rank}
                      </span>
                    </td>

                    <td className="player-cell">
                      <div className="leaderboard-player-cell">
                        <PlayerMiniAvatar playerName={entry.name} />

                        <div className="leaderboard-player-meta">
                          <div className="leaderboard-player-name">{entry.name}</div>

                          <button
                            type="button"
                            className="leaderboard-player-link"
                            onClick={() => onInspectPlayer?.(entry.playerId)}
                          >
                            Ver predicciones
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="points-cell">{entry.totalPoints}</td>
                    <td className="daily-points-cell">{entry.dailyPoints}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
