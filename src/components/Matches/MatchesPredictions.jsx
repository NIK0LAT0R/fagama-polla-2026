import { useEffect, useMemo, useState } from 'react';
import { STAGES } from '../../data/matches.js';
import { useApp } from '../../context/AppContext.jsx';
import { predictionKey } from '../../utils/matchUtils.js';
import { calculateMatchPoints } from '../../services/scoring.js';
import { fetchPredictionsByPlayer } from '../../services/cosmosApi.js';
import MatchRow from './MatchRow.jsx';

function isSameLocalDay(dateLike, baseDate = new Date()) {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return false;

  return (
    d.getFullYear() === baseDate.getFullYear() &&
    d.getMonth() === baseDate.getMonth() &&
    d.getDate() === baseDate.getDate()
  );
}

function getNoonOfNextDay(dateLike) {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;

  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() + 1,
    12, // 12:00 PM
    0,
    0,
    0
  );
}

function sortMatchesByCountdown(matchList) {
  const now = new Date();
  const nowMs = now.getTime();

  return [...matchList].sort((a, b) => {
    const aDateSource = a.lockAt ?? a.datetime;
    const bDateSource = b.lockAt ?? b.datetime;

    const aLock = new Date(aDateSource).getTime();
    const bLock = new Date(bDateSource).getTime();

    const aMatchTime = new Date(a.datetime).getTime();
    const bMatchTime = new Date(b.datetime).getTime();

    const aIsToday = isSameLocalDay(a.datetime ?? a.lockAt, now);
    const bIsToday = isSameLocalDay(b.datetime ?? b.lockAt, now);

    const aNoonNextDay = getNoonOfNextDay(a.datetime ?? a.lockAt);
    const bNoonNextDay = getNoonOfNextDay(b.datetime ?? b.lockAt);

    const aSendToEnd = aNoonNextDay ? nowMs >= aNoonNextDay.getTime() : false;
    const bSendToEnd = bNoonNextDay ? nowMs >= bNoonNextDay.getTime() : false;

    const aLocked = aLock <= nowMs;
    const bLocked = bLock <= nowMs;

    // 1) Partidos de hoy SIEMPRE primero
    if (aIsToday !== bIsToday) {
      return aIsToday ? -1 : 1;
    }

    // 2) Si ambos son de hoy:
    //    orden cronológico (más temprano primero)
    if (aIsToday && bIsToday) {
      return aMatchTime - bMatchTime;
    }

    // 3) Para partidos que NO son de hoy:
    //    los que AÚN NO han llegado al mediodía del día siguiente
    //    se quedan arriba; los demás se van al final
    if (aSendToEnd !== bSendToEnd) {
      return aSendToEnd ? 1 : -1;
    }

    // 4) Mientras aún no se van al final:
    //    primero los no bloqueados
    if (aLocked !== bLocked) {
      return aLocked ? 1 : -1;
    }

    // 5) Si ambos están abiertos,
    //    el más próximo al cierre primero
    if (!aLocked && !bLocked) {
      return aLock - bLock;
    }

    // 6) Si ambos están bloqueados o ambos ya están "al final":
    //    el más reciente primero
    return bMatchTime - aMatchTime;
  });
}

export default function MatchesPredictions({ onDirtyChange }) {
  const {
    matches,
    players,
    activePlayerId,
    predictionMap,
    resultMap,
    upsertPrediction,
    uid,
  } = useApp();

  const [stageFilter, setStageFilter] = useState('upcoming');
  const [predictionStatusFilter, setPredictionStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [drafts, setDrafts] = useState(new Map());
  const [saveMessage, setSaveMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');

  // Modal ranking por partido
  const [selectedMatchStats, setSelectedMatchStats] = useState(null);
  const [matchRankingLoading, setMatchRankingLoading] = useState(false);
  const [matchRankingError, setMatchRankingError] = useState('');

  useEffect(() => {
    try {
      console.log('MatchesPredictions debug', {
        uid,
        activePlayerId,
        predictionMapKeys: Array.from(predictionMap.keys()),
      });
    } catch {
      // ignore
    }
  }, [uid, activePlayerId, predictionMap]);

  useEffect(() => {
    onDirtyChange?.(drafts.size > 0);
  }, [drafts, onDirtyChange]);

  useEffect(() => {
    setDrafts(new Map());
  }, [activePlayerId]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (drafts.size > 0) {
        const warning =
          'Tienes cambios sin guardar. Si sales ahora, perderás tus predicciones no guardadas.';
        event.preventDefault();
        event.returnValue = warning;
        return warning;
      }
      return undefined;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [drafts]);

  const activePlayer = players.find(
    (p) => String(p.id) === String(activePlayerId)
  );

  const filteredMatches = useMemo(() => {
    const query = search.trim().toLowerCase();

    let nextMatches = matches.filter((match) => {
      const matchesSearch =
        !query ||
        match.teamA.toLowerCase().includes(query) ||
        match.teamB.toLowerCase().includes(query) ||
        match.stage.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // filtro por fase
      if (
        stageFilter !== 'upcoming' &&
        stageFilter !== 'all' &&
        match.stage !== stageFilter
      ) {
        return false;
      }

      // filtro por estado de predicción
      if (!activePlayerId) {
        return predictionStatusFilter === 'all';
      }

      const savedPrediction = predictionMap.get(
        predictionKey(activePlayerId, match.id)
      );
      const hasSavedPrediction = Boolean(savedPrediction);

      if (predictionStatusFilter === 'without') {
        return !hasSavedPrediction;
      }

      if (predictionStatusFilter === 'with') {
        return hasSavedPrediction;
      }

      return true;
    });

    if (stageFilter === 'upcoming') {
      nextMatches = sortMatchesByCountdown(nextMatches);
    }

    return nextMatches;
  }, [
    matches,
    stageFilter,
    predictionStatusFilter,
    search,
    activePlayerId,
    predictionMap,
  ]);

  const draftCount = drafts.size;

  function handleDraftChange(matchId, side, nextValue) {
    const safeMatchId = String(matchId);

    const currentPrediction = predictionMap.get(
      predictionKey(activePlayerId, matchId)
    );

    const currentA =
      currentPrediction?.predictedA != null
        ? String(currentPrediction.predictedA)
        : '';

    const currentB =
      currentPrediction?.predictedB != null
        ? String(currentPrediction.predictedB)
        : '';

    const existingDraft =
      drafts.get(safeMatchId) || {
        predictedA: currentA,
        predictedB: currentB,
      };

    const updated = {
      predictedA: side === 'A' ? nextValue : existingDraft.predictedA,
      predictedB: side === 'B' ? nextValue : existingDraft.predictedB,
    };

    // Si vuelve a quedar igual a lo guardado, remove draft
    if (updated.predictedA === currentA && updated.predictedB === currentB) {
      setDrafts((prev) => {
        const next = new Map(prev);
        next.delete(safeMatchId);
        return next;
      });
      return;
    }

    setDrafts((prev) => {
      const next = new Map(prev);
      next.set(safeMatchId, { matchId: safeMatchId, ...updated });
      return next;
    });
  }

  async function handleSaveAll() {
    if (!activePlayerId) return;
    if (draftCount === 0) return;

    const draftsArray = Array.from(drafts.values());

    const hasIncomplete = draftsArray.some(
      (draft) => draft.predictedA === '' || draft.predictedB === ''
    );

    if (hasIncomplete) {
      setSaveStatus('error');
      setSaveMessage('Completa todas las predicciones antes de guardar.');
      return;
    }

    try {
      setSaveStatus('saving');
      setSaveMessage('Guardando cambios…');

      const savePromises = draftsArray.map((draft) =>
        upsertPrediction(
          activePlayerId,
          draft.matchId,
          Number(draft.predictedA),
          Number(draft.predictedB)
        )
      );

      await Promise.all(savePromises);

      setDrafts(new Map());
      setSaveStatus('success');
      setSaveMessage('Predicciones guardadas correctamente.');
      console.log('All drafted predictions saved successfully', draftsArray);
    } catch (error) {
      console.error('Failed to save drafted predictions', error);
      setSaveStatus('error');
      setSaveMessage('Error al guardar las predicciones. Intenta de nuevo.');
    }
  }

  async function openMatchRanking(match) {
    const matchIdString = String(match.id);
    const result = resultMap.get(matchIdString);

    if (!result) return;

    setSelectedMatchStats({
      match,
      ranking: [],
    });
    setMatchRankingLoading(true);
    setMatchRankingError('');

    try {
      const rankingRows = await Promise.all(
        players.map(async (player) => {
          try {
            const predictions = await fetchPredictionsByPlayer(player.id);

            const matchPrediction = Array.isArray(predictions)
              ? predictions.find(
                  (prediction) =>
                    String(prediction.matchId) === String(match.id)
                )
              : null;

            if (!matchPrediction) {
              return {
                playerId: player.id,
                player: player.name,
                prediction: 'Sin predicción',
                points: 0,
                hasPrediction: false,
              };
            }

            
            const normalizedPrediction = {
              predictedA:
                matchPrediction.predictedA ?? matchPrediction.scoreA ?? 0,
              predictedB:
                matchPrediction.predictedB ?? matchPrediction.scoreB ?? 0,
            };

            const points = calculateMatchPoints(
              normalizedPrediction,
              result,
              match
            );



            return {
              playerId: player.id,
              player: player.name,
              prediction: `${normalizedPrediction.predictedA} – ${normalizedPrediction.predictedB}`,
              points,
              hasPrediction: true,
            };
          } catch (error) {
            console.warn(`Error cargando predicción de ${player.name}`, error);
            return {
              playerId: player.id,
              player: player.name,
              prediction: 'Sin predicción',
              points: 0,
              hasPrediction: false,
            };
          }
        })
      );

      rankingRows.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (a.hasPrediction !== b.hasPrediction) return a.hasPrediction ? -1 : 1;
        return a.player.localeCompare(b.player);
      });

      setSelectedMatchStats({
        match,
        ranking: rankingRows,
      });
    } catch (error) {
      console.error('Error building match ranking:', error);
      setMatchRankingError('No se pudo cargar el ranking del partido.');
    } finally {
      setMatchRankingLoading(false);
    }
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2>Partidos y Predicciones</h2>
          <p className="panel-subtitle">
            {activePlayer
              ? `Prediciendo a nombre de ${activePlayer.name}`
              : 'Vincula tu jugador para ingresar predicciones.'}
          </p>
        </div>

        <span className="badge">
          {stageFilter === 'upcoming'
            ? `Ordenado por cierre · ${filteredMatches.length}`
            : `${filteredMatches.length} / ${matches.length}`}
        </span>
      </header>

      <div className="toolbar toolbar-wrap">
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          aria-label="Filtrar por fase"
        >
          <option value="upcoming">Próximos por cierre</option>
          <option value="all">Todas las fases</option>
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>

        <input
          type="search"
          placeholder="Buscar equipos o fase..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar partidos"
        />
      </div>

      <div className="toolbar">
        <select
          value={predictionStatusFilter}
          onChange={(e) => setPredictionStatusFilter(e.target.value)}
          aria-label="Filtrar por estado de predicción"
        >
          <option value="all">Todas (todos)</option>
          <option value="without">Sin predicción</option>
          <option value="with">Con predicción guardada</option>
        </select>
      </div>

      {!activePlayer && (
        <p className="info-banner">
          Vincula tu jugador para ingresar predicciones.
        </p>
      )}

      {saveMessage && (
        <p
          className={saveStatus === 'error' ? 'form-error' : 'info-banner'}
          role="status"
        >
          {saveMessage}
        </p>
      )}

      {filteredMatches.length === 0 ? (
        <p className="empty-state">No hay partidos que coincidan con los filtros.</p>
      ) : (
        <div className="match-list">
          {filteredMatches.map((match) => {
            const matchIdString = String(match.id);

            const prediction = activePlayerId
              ? predictionMap.get(predictionKey(activePlayerId, match.id))
              : null;

            const draft = drafts.get(matchIdString);
            const hasOfficialResult = Boolean(resultMap.get(matchIdString));

            return (
              <div key={matchIdString} style={{ marginBottom: '12px' }}>
                <MatchRow
                  match={match}
                  playerId={activePlayerId}
                  prediction={prediction}
                  draft={draft}
                  result={resultMap.get(matchIdString)}
                  onDraftChange={handleDraftChange}
                />

                {hasOfficialResult && (
                  <div style={{ marginTop: '-2px', marginBottom: '12px' }}>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => openMatchRanking(match)}
                    >
                      Ver ranking del partido
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {draftCount > 0 && (
        <div
          className="save-drafts-fab"
          role="region"
          aria-label="Cambios sin guardar"
        >
          <div className="save-drafts-fab__content">
            <div className="save-drafts-fab__meta">
              <span className="save-drafts-fab__title">Cambios sin guardar</span>
              <span className="save-drafts-fab__count">
                {draftCount} cambio{draftCount !== 1 ? 's' : ''} pendiente
                {draftCount !== 1 ? 's' : ''}
              </span>
            </div>

            <button
              type="button"
              className="save-drafts-btn"
              onClick={handleSaveAll}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving'
                ? 'Guardando...'
                : `Guardar cambios (${draftCount})`}
            </button>
          </div>
        </div>
      )}

      {selectedMatchStats && (
        <div
          onClick={() => setSelectedMatchStats(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '720px',
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 18px 60px rgba(0,0,0,0.25)',
            }}
          >
            <div
              style={{
                padding: '18px 20px',
                borderBottom: '1px solid #e6edf3',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                background: '#ffffff',
              }}
            >
              <div>
                <h3 style={{ margin: 0, color: '#111827' }}>
                  {selectedMatchStats.match.teamA} vs {selectedMatchStats.match.teamB}
                </h3>
                <p style={{ margin: '6px 0 0', color: '#5b7083' }}>
                  Ranking por puntos obtenidos en este partido
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMatchStats(null)}
                className="btn btn-ghost"
              >
                Cerrar
              </button>
            </div>

            <div
              style={{
                padding: '16px 20px 20px',
                overflowY: 'auto',
                background: '#ffffff',
              }}
            >
              {matchRankingLoading ? (
                <p className="empty-state">Cargando ranking del partido…</p>
              ) : matchRankingError ? (
                <p className="form-error">{matchRankingError}</p>
              ) : (
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    background: '#ffffff',
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '10px 8px',
                          borderBottom: '1px solid #d9e3ea',
                          color: '#1f2937',
                          background: '#f8fafc',
                          fontWeight: 700,
                        }}
                      >
                        #
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '10px 8px',
                          borderBottom: '1px solid #d9e3ea',
                          color: '#1f2937',
                          background: '#f8fafc',
                          fontWeight: 700,
                        }}
                      >
                        Jugador
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '10px 8px',
                          borderBottom: '1px solid #d9e3ea',
                          color: '#1f2937',
                          background: '#f8fafc',
                          fontWeight: 700,
                        }}
                      >
                        Predicción
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '10px 8px',
                          borderBottom: '1px solid #d9e3ea',
                          color: '#1f2937',
                          background: '#f8fafc',
                          fontWeight: 700,
                        }}
                      >
                        Puntos
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMatchStats.ranking.map((row, index) => (
                      <tr key={`${row.playerId}-${index}`}>
                        <td
                          style={{
                            padding: '10px 8px',
                            borderBottom: '1px solid #eef3f7',
                            color: '#111827',
                            fontWeight: 700,
                            background: '#ffffff',
                          }}
                        >
                          {index + 1}
                        </td>
                        <td
                          style={{
                            padding: '10px 8px',
                            borderBottom: '1px solid #eef3f7',
                            color: '#111827',
                            fontWeight: 600,
                            background: '#ffffff',
                          }}
                        >
                          {row.player}
                        </td>
                        <td
                          style={{
                            padding: '10px 8px',
                            borderBottom: '1px solid #eef3f7',
                            color: '#374151',
                            background: '#ffffff',
                          }}
                        >
                          {row.prediction}
                        </td>
                        <td
                          style={{
                            padding: '10px 8px',
                            borderBottom: '1px solid #eef3f7',
                            color: '#111827',
                            background: '#ffffff',
                          }}
                        >
                          <span className={`points-chip points-${row.points ?? 0}`}>
                            +{row.points ?? 0} pts
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}