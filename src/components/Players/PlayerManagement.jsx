
import { useEffect, useMemo, useState } from 'react';
import { useAdmin } from '../../context/AdminContext.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { calculateMatchPoints } from '../../services/scoring.js';
import {
  fetchPredictionsByPlayer,
  fetchAllPredictions,
} from '../../services/cosmosApi.js';
import { getPlayerImageSrc, getPlayerInitials } from '../../utils/playerImages.js';
import { getTeamFlagSrc } from '../../utils/flags.js';
import { STAGES } from '../../data/matches.js';


import { exportToExcel } from "@/utils/exportExcel";

<button
  onClick={exportToExcel}
  style={{
    padding: "10px 15px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer"
  }}
>
  Exportar Predicciones
</button>


function TeamFlag({ teamName }) {
  const [failed, setFailed] = useState(false);
  const src = getTeamFlagSrc(teamName);

  if (!src || failed) {
    return (
      <span className="team-flag team-flag-fallback" aria-hidden="true">
        🏳️
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={teamName}
      className="team-flag-img"
      onError={() => setFailed(true)}
    />
  );
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

function addDays(baseDate, days) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + days);
  return d;
}

function sortPredictionItemsByCountdown(items) {
  const now = Date.now();

  return [...items].sort((a, b) => {
    const aDate = a.match.lockAt ?? a.match.datetime;
    const bDate = b.match.lockAt ?? b.match.datetime;

    const aLock = new Date(aDate).getTime();
    const bLock = new Date(bDate).getTime();

    const aIsToday = isSameLocalDay(a.match.datetime ?? a.match.lockAt);
    const bIsToday = isSameLocalDay(b.match.datetime ?? b.match.lockAt);

    // 1) PRIORIDAD ABSOLUTA: partidos de hoy primero
    if (aIsToday !== bIsToday) {
      return aIsToday ? -1 : 1;
    }

    // 2) Si ambos son de hoy:
    //    se ordenan por hora del partido/cierre (más temprano primero)
    if (aIsToday && bIsToday) {
      return aLock - bLock;
    }

    const aLocked = aLock <= now;
    const bLocked = bLock <= now;

    // 3) Para partidos que NO son de hoy:
    //    primero los NO bloqueados
    if (aLocked !== bLocked) {
      return aLocked ? 1 : -1;
    }

    // 4) Si ambos están abiertos:
    //    el que se cierra más pronto primero
    if (!aLocked && !bLocked) {
      return aLock - bLock;
    }

    // 5) Si ambos están bloqueados:
    //    el más reciente primero
    const aMatchTime = new Date(a.match.datetime).getTime();
    const bMatchTime = new Date(b.match.datetime).getTime();

    return bMatchTime - aMatchTime;
  });
}


function AlbumPlayerCard({
  player,
  isLinked,
  isClaimed,
  isSelected,
  isAdmin,
  missingTomorrowCount,
  onSelect,
  onRemove,
  onViewPredictions,
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const needsTomorrowPredictions = missingTomorrowCount > 0;

  return (
    <article
      className={`album-card album-card-management ${
        isSelected ? 'album-card-selected' : ''
      } ${needsTomorrowPredictions ? 'album-card-alert' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect();
      }}
    >
      <div className="album-card-bg">
        <span className="album-year">26</span>
        <span className="album-accent album-accent-a" />
        <span className="album-accent album-accent-b" />
      </div>

      <div className="album-card-top">
        <span className="album-card-badge">FAGAMA</span>

        <div className="album-card-statuses">
          {isLinked && <span className="album-status-tag linked">Tu jugador</span>}
          {isClaimed && !isLinked && (
            <span className="album-status-tag">Vinculado</span>
          )}
        </div>
      </div>

      <div className="album-player-portrait">
        {!imageFailed ? (
          <img
            src={getPlayerImageSrc(player.name)}
            alt={player.name}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="album-player-fallback">
            {getPlayerInitials(player.name)}
          </div>
        )}
      </div>

      <div className="album-card-footer">
        <div className="album-card-name">{player.name}</div>

        <div
          className={
            needsTomorrowPredictions
              ? 'album-card-missing-counter pending'
              : 'album-card-missing-counter clear'
          }
        >
          {needsTomorrowPredictions
            ? missingTomorrowCount === 1
              ? 'Falta 1 marcador de mañana'
              : `Faltan ${missingTomorrowCount} marcadores de mañana`
            : 'No hay marcadores pendientes'}
        </div>

        <div className="album-card-subtitle">
          <button
            type="button"
            className="btn btn-primary album-view-btn"
            onClick={(e) => {
              e.stopPropagation();
              onViewPredictions(player.id);
            }}
          >
            Chismosear predicción
          </button>
        </div>

        {isAdmin && player.claimCode && (
          <div className="album-code-row">
            <span className="album-code-label">Código</span>
            <span className="album-code-value">{player.claimCode}</span>
          </div>
        )}

        {isAdmin && (
          <div className="album-card-actions">
            <button
              type="button"
              className="btn btn-danger"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(player.id);
              }}
            >
              Remove
            </button>
          </div>
        )}
      </div>
    </article>
  );
}


export default function PlayerManagement({
  externalViewerPlayerId,
  onViewerConsumed,
}) {
  const {
    players,
    claimedPlayer,
    matches,
    resultMap,
    addPlayer,
    removePlayer,
    resetAllData,
  } = useApp();

  const { isAdmin, requireAdmin } = useAdmin();

  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState(claimedPlayer?.id ?? '');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [predictionStageFilter, setPredictionStageFilter] = useState('upcoming');
  const [viewerPredictions, setViewerPredictions] = useState([]);
  const [viewerLoading, setViewerLoading] = useState(false);

  // ✅ nuevas: para alertas de "faltan marcadores de mañana"
  const [allPredictions, setAllPredictions] = useState([]);
  const [dayAnchor, setDayAnchor] = useState(() => Date.now());

  // ✅ Recibe jugador desde Leaderboard y abre automáticamente el viewer
  useEffect(() => {
    if (!externalViewerPlayerId) return;

    setSelectedPlayerId(String(externalViewerPlayerId));
    setViewerOpen(true);
    setPredictionStageFilter('upcoming');

    onViewerConsumed?.();
  }, [externalViewerPlayerId, onViewerConsumed]);

  // ✅ Carga todas las predicciones para calcular alertas de mañana
  useEffect(() => {
    let cancelled = false;

    
    async function loadAllPredictions() {
      try {
        let all = [];

        for (const player of players) {
          try {
            const preds = await fetchPredictionsByPlayer(player.id);

            if (Array.isArray(preds)) {
              const normalized = preds.map(p => ({
                playerId: p.playerId || player.id,
                matchId: p.matchId
              }));

              all.push(...normalized);
            }
          } catch (err) {
            console.warn("Error cargando predicciones de", player.id);
          }
        }

        if (!cancelled) {
          setAllPredictions(all);
        }

      } catch (error) {
        console.error('Error loading all predictions:', error);

        if (!cancelled) {
          setAllPredictions([]);
        }
      }
    }


    loadAllPredictions();

    return () => {
      cancelled = true;
    };
  }, []);

  // ✅ Recalcula automáticamente a la próxima medianoche
  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);

    const msUntilMidnight = nextMidnight.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      setDayAnchor(Date.now());
    }, msUntilMidnight + 1000);

    return () => clearTimeout(timeout);
  }, [dayAnchor]);

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();

    const sortedPlayers = [...players].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    if (!query) return sortedPlayers;

    return sortedPlayers.filter((p) =>
      p.name.toLowerCase().includes(query)
    );
  }, [players, search]);

  useEffect(() => {
    if (!selectedPlayerId && players.length > 0) {
      setSelectedPlayerId(claimedPlayer?.id ?? players[0].id);
    }
  }, [players, claimedPlayer, selectedPlayerId]);

  const selectedPlayer =
    players.find((p) => String(p.id) === String(selectedPlayerId)) ?? null;

  useEffect(() => {
    let cancelled = false;

    async function loadViewerPredictions() {
      if (!viewerOpen || !selectedPlayerId) {
        setViewerPredictions([]);
        return;
      }

      setViewerLoading(true);

      try {
        const next = await fetchPredictionsByPlayer(selectedPlayerId);
        if (!cancelled) {
          setViewerPredictions(next);
        }
      } catch (loadError) {
        console.error('Error loading viewer predictions:', loadError);
        if (!cancelled) {
          setViewerPredictions([]);
        }
      } finally {
        if (!cancelled) {
          setViewerLoading(false);
        }
      }
    }

    loadViewerPredictions();

    return () => {
      cancelled = true;
    };
  }, [viewerOpen, selectedPlayerId]);

  const viewerPredictionMap = useMemo(() => {
    const map = new Map();

    viewerPredictions.forEach((prediction) => {
      map.set(String(prediction.matchId), prediction);
    });

    return map;
  }, [viewerPredictions]);

  const selectedPlayerPredictions = useMemo(() => {
    if (!selectedPlayerId) return [];

    return matches.map((match) => {
      const prediction = viewerPredictionMap.get(String(match.id));
      const result = resultMap.get(String(match.id));
      const points =
        prediction && result ? calculateMatchPoints(prediction, result) : null;

      return { match, prediction, result, points };
    });
  }, [matches, viewerPredictionMap, resultMap, selectedPlayerId]);

  const visiblePredictionItems = useMemo(() => {
    let items = [...selectedPlayerPredictions];

    if (predictionStageFilter === 'upcoming') {
      return sortPredictionItemsByCountdown(items);
    }

    if (predictionStageFilter !== 'all') {
      items = items.filter((item) => item.match.stage === predictionStageFilter);
    }

    return items;
  }, [selectedPlayerPredictions, predictionStageFilter]);

  // ✅ Día objetivo: mañana
  const targetTomorrowDate = useMemo(() => {
    return addDays(new Date(dayAnchor), 1);
  }, [dayAnchor]);

  // ✅ Partidos del día siguiente
  const tomorrowMatches = useMemo(() => {
    return matches.filter((match) =>
      isSameLocalDay(match.datetime ?? match.lockAt, targetTomorrowDate)
    );
  }, [matches, targetTomorrowDate]);

  // ✅ Cantidad de partidos que le faltan a cada jugador para mañana
  const missingTomorrowCountByPlayer = useMemo(() => {
    const predictionSet = new Set(
      allPredictions.map(
        (prediction) => `${String(prediction.playerId)}_${String(prediction.matchId)}`
      )
    );

    const resultMapCounts = new Map();

    players.forEach((player) => {
      const missingCount = tomorrowMatches.reduce((acc, match) => {
        const key = `${String(player.id)}_${String(match.id)}`;
        return predictionSet.has(key) ? acc : acc + 1;
      }, 0);

      resultMapCounts.set(String(player.id), missingCount);
    });

    return resultMapCounts;
  }, [players, tomorrowMatches, allPredictions]);

  function openPredictionsView(playerId) {
    setSelectedPlayerId(String(playerId));
    setViewerOpen(true);
    setPredictionStageFilter('upcoming');
  }

  function handleAdd(e) {
    e.preventDefault();

    requireAdmin(async () => {
      const result = await addPlayer(name);

      if (!result.success) {
        if (result.reason === 'duplicate') {
          setError('Enter a unique player name.');
        } else {
          setError('Could not add player. Try again.');
        }
        return;
      }

      setName('');
      setError('');
      setInfo(`Player added. Claim code: ${result.claimCode}`);
    });
  }

  function handleRemove(playerId) {
    requireAdmin(async () => {
      await removePlayer(playerId);
    });
  }

  function handleReset() {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }

    requireAdmin(async () => {
      await resetAllData();
      setConfirmReset(false);
    });
  }

  return (
    <>
      {!viewerOpen ? (
        <section className="panel">
          
        <header className="panel-header">
          <div>
            <h2>Álbum de jugadores</h2>
            <p className="panel-subtitle">
              {isAdmin
                ? 'Administra figuritas, comparte códigos y revisa predicciones.'
                : `Vinculado como ${claimedPlayer?.name ?? 'tu jugador'}.`}
            </p>
          </div>

          {/* 🔥 BOTÓN EXPORT */}
          <button
            onClick={exportToExcel}
            className="btn btn-success"
            style={{ marginLeft: "10px" }}
          >
            Exportar Excel
          </button>

          <span className="badge">{players.length} players</span>
        </header>


          {claimedPlayer && !isAdmin && (
            <div className="info-banner linked-player-banner">
              Vinculado como <strong>{claimedPlayer.name}</strong>
            </div>
          )}

          {isAdmin && (
            <>
              <form className="inline-form" onSubmit={handleAdd}>
                <input
                  type="text"
                  placeholder="Player name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  aria-label="New player name"
                />
                <button type="submit" className="btn btn-primary">
                  Add Player
                </button>
              </form>

              {error && <p className="form-error" role="alert">{error}</p>}
              {info && <p className="info-banner" role="status">{info}</p>}
            </>
          )}

          <div className="toolbar">
            <input
              type="search"
              placeholder="Buscar jugadores…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar jugadores"
            />
          </div>

          {filteredPlayers.length === 0 ? (
            <p className="empty-state">
              {search
                ? 'No se encontraron jugadores con ese nombre.'
                : 'No hay jugadores para mostrar.'}
            </p>
          ) : (
            <div className="album-grid album-grid-management">
              {filteredPlayers.map((player) => {
                const isLinked = String(player.id) === String(claimedPlayer?.id);
                const isClaimed = Boolean(player.claimedByUid);
                const missingTomorrowCount =
                  missingTomorrowCountByPlayer.get(String(player.id)) ?? 0;

                return (
                  <AlbumPlayerCard
                    key={player.id}
                    player={player}
                    isLinked={isLinked}
                    isClaimed={isClaimed}
                    isSelected={String(player.id) === String(selectedPlayerId)}
                    isAdmin={isAdmin}
                    missingTomorrowCount={missingTomorrowCount}
                    onSelect={() => setSelectedPlayerId(player.id)}
                    onRemove={handleRemove}
                    onViewPredictions={openPredictionsView}
                  />
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="panel">
          <header className="panel-header">
            <div>
              <h2>Chismoseando predicciones</h2>
              <p className="panel-subtitle">
                Vista solo lectura de las predicciones de{' '}
                <strong>{selectedPlayer?.name ?? 'jugador seleccionado'}</strong>.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setViewerOpen(false)}
            >
              Volver al álbum
            </button>
          </header>

          {!selectedPlayer ? (
            <p className="empty-state">
              Selecciona un jugador para ver sus predicciones.
            </p>
          ) : (
            <>
              <div className="selected-album-player">
                <div className="selected-album-player__avatar">
                  <img
                    src={getPlayerImageSrc(selectedPlayer.name)}
                    alt={selectedPlayer.name}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="selected-album-player__fallback">
                    {getPlayerInitials(selectedPlayer.name)}
                  </span>
                </div>

                <div>
                  <h3>{selectedPlayer.name}</h3>
                  <p>Vista solo lectura de sus pronósticos</p>
                </div>
              </div>

              <div className="toolbar">
                <select
                  value={predictionStageFilter}
                  onChange={(e) => setPredictionStageFilter(e.target.value)}
                  aria-label="Filtrar predicciones por fase"
                >
                  <option value="upcoming">Próximos por cierre</option>
                  <option value="all">Todas las fases</option>
                  {STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>

              {viewerLoading ? (
                <p className="empty-state">Cargando predicciones…</p>
              ) : visiblePredictionItems.length === 0 ? (
                <p className="empty-state">
                  No hay partidos que coincidan con el filtro seleccionado.
                </p>
              ) : (
                <div className="prediction-grid">
                  {visiblePredictionItems.map(({ match, prediction, result, points }) => (
                    <article key={match.id} className="prediction-card">
                      <div className="prediction-card__top">
                        <span className="match-stage">{match.stage}</span>
                      </div>

                      <div className="prediction-card__teams">
                        <div className="prediction-team-line">
                          <TeamFlag teamName={match.teamA} />
                          <span>{match.teamA}</span>
                        </div>

                        <span className="vs">vs</span>

                        <div className="prediction-team-line">
                          <TeamFlag teamName={match.teamB} />
                          <span>{match.teamB}</span>
                        </div>
                      </div>

                      <div className="prediction-card__info">
                        <div className="prediction-card__item">
                          <span className="prediction-card__label">Predicción</span>
                          <strong>
                            {prediction
                              ? `${prediction.predictedA} – ${prediction.predictedB}`
                              : 'Sin predicción'}
                          </strong>
                        </div>

                        <div className="prediction-card__item">
                          <span className="prediction-card__label">Resultado</span>
                          <strong>
                            {result
                              ? `${result.scoreA} – ${result.scoreB}`
                              : 'Pendiente'}
                          </strong>
                        </div>

                        <div className="prediction-card__item">
                          <span className="prediction-card__label">Puntos</span>

                          {result ? (
                            <span className={`points-chip points-${points ?? 0}`}>
                              +{points ?? 0} pts
                            </span>
                          ) : (
                            <strong>–</strong>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {isAdmin && (
        <div className="danger-zone">
          <h3>Reset Data</h3>
          <p>Deletes all players, predictions, and results from Firebase.</p>
          <button
            type="button"
            className={`btn ${confirmReset ? 'btn-danger' : 'btn-ghost'}`}
            onClick={handleReset}
            onBlur={() => setConfirmReset(false)}
          >
            {confirmReset ? 'Confirm reset everything' : 'Reset all data'}
          </button>
        </div>
      )}
    </>
  );
}
