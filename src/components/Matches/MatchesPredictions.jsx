
import { useEffect, useMemo, useState } from 'react';
import { STAGES } from '../../data/matches.js';
import { useApp } from '../../context/AppContext.jsx';
import { predictionKey } from '../../utils/matchUtils.js';
import MatchRow from './MatchRow.jsx';

function sortMatchesByCountdown(matchList) {
  const now = Date.now();

  return [...matchList].sort((a, b) => {
    const aLock = new Date(a.lockAt ?? a.datetime).getTime();
    const bLock = new Date(b.lockAt ?? b.datetime).getTime();

    const aLocked = aLock <= now;
    const bLocked = bLock <= now;

    // Primero los NO bloqueados
    if (aLocked !== bLocked) {
      return aLocked ? 1 : -1;
    }

    // Si ambos están abiertos: el más cercano al cierre primero
    if (!aLocked && !bLocked) {
      return aLock - bLock;
    }

    // Si ambos están bloqueados: el más recientemente jugado primero
    const aMatchTime = new Date(a.datetime).getTime();
    const bMatchTime = new Date(b.datetime).getTime();
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
      // búsqueda
      const matchesSearch =
        !query ||
        match.teamA.toLowerCase().includes(query) ||
        match.teamB.toLowerCase().includes(query) ||
        match.stage.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      // filtro por fase
      if (stageFilter !== 'upcoming' && stageFilter !== 'all' && match.stage !== stageFilter) {
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

    // orden especial por cierre
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

    if (updated.predictedA === currentA && updated.predictedB === currentB) {
      const next = new Map(drafts);
      next.delete(safeMatchId);
      setDrafts(next);
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

            return (
              <MatchRow
                key={matchIdString}
                match={match}
                playerId={activePlayerId}
                prediction={prediction}
                draft={draft}
                result={resultMap.get(matchIdString)}
                onDraftChange={handleDraftChange}
              />
            );
          })}
        </div>
      )}

      {draftCount > 0 && (
        <div className="save-drafts-fab" role="region" aria-label="Cambios sin guardar">
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
    </section>
  );
}
