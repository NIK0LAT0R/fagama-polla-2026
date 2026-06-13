
import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { calculateStandings } from '../../services/scoring.js';
import { fetchAllPredictions } from '../../services/cosmosApi.js';
import { exportStandingsToCSV } from '../../utils/csvExport.js';

function rankClass(rank) {
  if (rank === 1) return 'rank-gold';
  if (rank === 2) return 'rank-silver';
  if (rank === 3) return 'rank-bronze';
  return '';
}

export default function Leaderboard() {
  const { players, results } = useApp();
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
    return calculateStandings(players, allPredictions, results).sort(
      (a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name)
    );
  }, [players, allPredictions, results]);

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2>Consolidado de puntos</h2>
          <p className="panel-subtitle">
            Ganador o empate correcto: 3 pts · Goles exactos por equipo: 1 pt c/u ·
            Marcador exacto: 5 pts
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
                <th scope="col">Score</th>
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

                    <td className="player-cell">{entry.name}</td>
                    <td className="points-cell">{entry.totalPoints}</td>
                    <td>{entry.scoredMatches}</td>
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
