
import { useEffect, useMemo, useState } from 'react';
import { useAdmin } from '../../context/AdminContext.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { calculateMatchPoints } from '../../services/scoring.js';
import { fetchPredictionsByPlayer } from '../../services/cosmosApi.js';
import { getPlayerImageSrc, getPlayerInitials } from '../../utils/playerImages.js';
import { getTeamFlagSrc } from '../../utils/flags.js';
import { STAGES } from '../../data/matches.js';
import { exportToExcel } from '../../utils/exportExcel.js';

function TeamFlag({ teamName }) {
  const [failed, setFailed] = useState(false);
  const src = getTeamFlagSrc(teamName);

  useEffect(() => {
    setFailed(false);
  }, [teamName]);

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

/**
 * Extrae partes de fecha interpretadas en hora de Colombia.
 * OJO: la base sigue saliendo del reloj del dispositivo del usuario.
 * Luego la reinterpretamos en America/Bogota.
 */
function getColombiaDateParts(dateLike) {
  const date = new Date(dateLike);

  if (Number.isNaN(date.getTime())) return null;

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;

  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    second: Number(get('second')),
  };
}

/**
 * Convierte cualquier fecha en una "clave de día" en Colombia: YYYY-MM-DD
 */
function getColombiaDayKey(dateLike) {
  const parts = getColombiaDateParts(dateLike);
  if (!parts) return '';

  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');

  return `${parts.year}-${month}-${day}`;
}

/**
 * Suma días a una dayKey YYYY-MM-DD sin depender de la zona local del dispositivo.
 */
function addDaysToDayKey(dayKey, days) {
  if (!dayKey) return '';

  const [year, month, day] = dayKey.split('-').map(Number);

  // usamos UTC al mediodía para evitar saltos raros
  const base = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  base.setUTCDate(base.getUTCDate() + days);

  const nextYear = base.getUTCFullYear();
  const nextMonth = String(base.getUTCMonth() + 1).padStart(2, '0');
  const nextDay = String(base.getUTCDate()).padStart(2, '0');

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function isSameColombiaDay(dateLike, dayKeyOrDate) {
  const leftKey = getColombiaDayKey(dateLike);

  const rightKey =
    typeof dayKeyOrDate === 'string'
      ? dayKeyOrDate
      : getColombiaDayKey(dayKeyOrDate);

  return leftKey !== '' && leftKey === rightKey;
}

/**
 * Regla pedida:
 * - antes de las 2:00 AM Colombia -> revisar partidos de HOY
 * - desde las 2:00 AM Colombia -> revisar partidos de MAÑANA
 *
 * Eso hace que:
 * - 1:55 AM -> siga mostrando partidos de hoy
 * - 6:00 PM -> ya muestre partidos de mañana
 * - 2:00 AM del día siguiente -> pase a pasado-mañana
 */
function getTargetAlertInfo(now = new Date()) {
  const parts = getColombiaDateParts(now);
  const todayKey = getColombiaDayKey(now);

  if (!parts || !todayKey) {
    return {
      dayKey: '',
      label: 'pendientes',
    };
  }

  if (parts.hour < 2) {
    return {
      dayKey: todayKey,
      label: 'de hoy',
    };
  }

  return {
    dayKey: addDaysToDayKey(todayKey, 1),
    label: 'de mañana',
  };
}

/**
 * Próximo corte a las 2:00 AM hora Colombia.
 * Colombia = UTC-5 fijo, así que 2:00 AM Colombia = 07:00 UTC.
 */
function getNextColombia2am(now = new Date()) {
  const parts = getColombiaDateParts(now);
  if (!parts) return null;

  const today2amUtc = Date.UTC(parts.year, parts.month - 1, parts.day, 7, 0, 0, 0);

  if (now.getTime() < today2amUtc) {
    return new Date(today2amUtc);
  }

  const tomorrow2amUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day + 1,
    7,
    0,
    0,
    0
  );

  return new Date(tomorrow2amUtc);
}

function sortPredictionItemsByCountdown(items) {
  const now = Date.now();

  return [...items].sort((a, b) => {
    const aDate = a.match.lockAt ?? a.match.datetime;
    const bDate = b.match.lockAt ?? b.match.datetime;

    const aLock = new Date(aDate).getTime();
    const bLock = new Date(bDate).getTime();

    const aIsToday = isSameColombiaDay(a.match.datetime ?? a.match.lockAt, new Date());
    const bIsToday = isSameColombiaDay(b.match.datetime ?? b.match.lockAt, new Date());

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
  missingCount,
  pendingWindowLabel,
  onSelect,
  onViewPredictions,
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasPendingPredictions = missingCount > 0;

  const pendingMessage = hasPendingPredictions
    ? missingCount === 1
      ? `Falta 1 marcador ${pendingWindowLabel}`
      : `Faltan ${missingCount} marcadores ${pendingWindowLabel}`
    : 'No hay marcadores pendientes';

  return (
    <article
      className={`album-card album-card-management ${
        isSelected ? 'album-card-selected' : ''
      } ${hasPendingPredictions ? 'album-card-alert' : ''}`}
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
            hasPendingPredictions
              ? 'album-card-missing-counter pending'
              : 'album-card-missing-counter clear'
          }
        >
          {pendingMessage}
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
  } = useApp();

  const { isAdmin, requireAdmin } = useAdmin();

  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState(claimedPlayer?.id ?? '');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [predictionStageFilter, setPredictionStageFilter] = useState('upcoming');
  const [viewerPredictions, setViewerPredictions] = useState([]);
  const [viewerLoading, setViewerLoading] = useState(false);

  // Todas las predicciones para calcular pendientes por jugador
  const [allPredictions, setAllPredictions] = useState([]);
  const [dayAnchor, setDayAnchor] = useState(() => Date.now());

  // Abre automáticamente viewer desde leaderboard
  useEffect(() => {
    if (!externalViewerPlayerId) return;

    setSelectedPlayerId(String(externalViewerPlayerId));
    setViewerOpen(true);
    setPredictionStageFilter('upcoming');

    onViewerConsumed?.();
  }, [externalViewerPlayerId, onViewerConsumed]);

  // Carga todas las predicciones de todos los jugadores
  useEffect(() => {
    let cancelled = false;

    async function loadAllPredictions() {
      try {
        let all = [];

        for (const player of players) {
          try {
            const preds = await fetchPredictionsByPlayer(player.id);

            if (Array.isArray(preds)) {
              const normalized = preds.map((p) => ({
                playerId: String(p.playerId || player.id),
                matchId: String(p.matchId),
              }));

              all.push(...normalized);
            }
          } catch {
            console.warn('Error cargando predicciones de', player.id);
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

    if (players.length > 0) {
      loadAllPredictions();
    } else {
      setAllPredictions([]);
    }

    return () => {
      cancelled = true;
    };
  }, [players, dayAnchor]);

  // Recalcula automáticamente al próximo corte 2:00 AM Colombia
  useEffect(() => {
    const next2am = getNextColombia2am(new Date());

    if (!next2am) return undefined;

    const msUntilNext2am = next2am.getTime() - Date.now();

    const timeout = setTimeout(() => {
      setDayAnchor(Date.now());
    }, Math.max(msUntilNext2am + 1000, 1000));

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

  // Día objetivo según corte 2:00 AM Colombia
  const targetAlertInfo = useMemo(() => {
    return getTargetAlertInfo(new Date(dayAnchor));
  }, [dayAnchor]);

  const targetAlertDayKey = targetAlertInfo.dayKey;
  const pendingWindowLabel = targetAlertInfo.label; // "de hoy" o "de mañana"

  const targetMatches = useMemo(() => {
    return matches.filter((match) =>
      isSameColombiaDay(match.datetime ?? match.lockAt, targetAlertDayKey)
    );
  }, [matches, targetAlertDayKey]);

  const missingCountByPlayer = useMemo(() => {
    const predictionSet = new Set(
      allPredictions.map(
        (prediction) => `${String(prediction.playerId)}_${String(prediction.matchId)}`
      )
    );

    const countsMap = new Map();

    players.forEach((player) => {
      const missingCount = targetMatches.reduce((acc, match) => {
        const key = `${String(player.id)}_${String(match.id)}`;
        return predictionSet.has(key) ? acc : acc + 1;
      }, 0);

      countsMap.set(String(player.id), missingCount);
    });

    return countsMap;
  }, [players, targetMatches, allPredictions]);

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

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {isAdmin && (
                <button
                  type="button"
                  onClick={exportToExcel}
                  className="btn btn-primary"
                >
                  Exportar Excel
                </button>
              )}

              <span className="badge">{players.length} players</span>
            </div>
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
                const missingCount =
                  missingCountByPlayer.get(String(player.id)) ?? 0;

                return (
                  <AlbumPlayerCard
                    key={player.id}
                    player={player}
                    isLinked={isLinked}
                    isClaimed={isClaimed}
                    isSelected={String(player.id) === String(selectedPlayerId)}
                    isAdmin={isAdmin}
                    missingCount={missingCount}
                    pendingWindowLabel={pendingWindowLabel}
                    onSelect={() => setSelectedPlayerId(player.id)}
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
    </>
  );
}
