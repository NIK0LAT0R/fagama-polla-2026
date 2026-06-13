
import { useEffect, useMemo, useState } from 'react';
import { STAGES } from '../../data/matches.js';
import { useAdmin } from '../../context/AdminContext.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { formatMatchDate } from '../../utils/matchUtils.js';
import { getTeamFlagSrc } from '../../utils/flags.js';

function TeamFlag({ teamName }) {
  const [failed, setFailed] = useState(false);
  const src = getTeamFlagSrc(teamName);

  if (!src || failed) {
    return <span className="team-flag team-flag-fallback" aria-hidden="true">🏳️</span>;
  }

  return (
    <img
      src={src}
      alt={`Bandera de ${teamName}`}
      className="team-flag-img"
      onError={() => setFailed(true)}
    />
  );
}

export default function ResultsInput() {
  const { matches, resultMap, upsertResult, clearResult } = useApp();
  const { isAdmin, requireAdmin } = useAdmin();
  const [stageFilter, setStageFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredMatches = useMemo(() => {
    const query = search.trim().toLowerCase();

    return matches.filter((match) => {
      if (stageFilter !== 'all' && match.stage !== stageFilter) return false;
      if (!query) return true;

      return (
        match.teamA.toLowerCase().includes(query) ||
        match.teamB.toLowerCase().includes(query)
      );
    });
  }, [matches, stageFilter, search]);

  async function handleSave(matchId, scoreA, scoreB) {
    if (scoreA === '' || scoreB === '') {
      throw new Error('Both scores are required.');
    }

    const action = async () => {
      await upsertResult(String(matchId), Number(scoreA), Number(scoreB));
      return true;
    };

    const result = await requireAdmin(action);

    if (result === false) {
      return false;
    }

    return true;
  }

  async function handleClear(matchId) {
    const action = async () => {
      await clearResult(String(matchId));
      return true;
    };

    const result = await requireAdmin(action);

    if (result === false) {
      return false;
    }

    return true;
  }

  const adminBtnClass = isAdmin ? '' : ' btn-admin-only';

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2>Entrada de Resultados</h2>
          <p className="panel-subtitle">
            {isAdmin
              ? 'Ingresa los resultados finales para actualizar la tabla de posiciones.'
              : 'Ver resultados de partidos. Se requiere acceso de administrador para guardar o limpiar resultados.'}
          </p>
        </div>
      </header>

      <div className="toolbar toolbar-wrap">
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          aria-label="Filtrar por fase"
        >
          <option value="all">Todas las fases</option>
          {STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>

        <input
          type="search"
          placeholder="Buscar equipos…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar partidos"
        />
      </div>

      <div className="results-list">
        {filteredMatches.map((match) => {
          const result = resultMap.get(String(match.id));

          return (
            <ResultRow
              key={`${match.id}-${result?.scoreA ?? 'x'}-${result?.scoreB ?? 'x'}`}
              match={match}
              result={result}
              isAdmin={isAdmin}
              adminBtnClass={adminBtnClass}
              onSave={handleSave}
              onClear={handleClear}
            />
          );
        })}
      </div>
    </section>
  );
}

function ResultRow({ match, result, isAdmin, adminBtnClass, onSave, onClear }) {
  const [scoreA, setScoreA] = useState(result?.scoreA ?? '');
  const [scoreB, setScoreB] = useState(result?.scoreB ?? '');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('');

  useEffect(() => {
    setScoreA(result?.scoreA ?? '');
    setScoreB(result?.scoreB ?? '');
  }, [result?.scoreA, result?.scoreB, match.id]);

  async function handleSaveClick() {
    setStatusMessage('');
    setStatusType('');

    try {
      setStatusMessage('Guardando resultado…');
      setStatusType('info');

      const saveResult = await onSave(match.id, scoreA, scoreB);

      if (saveResult === false) {
        setStatusMessage('Se requiere aprobación de administrador para guardar resultados.');
        setStatusType('error');
        return;
      }

      setStatusMessage('Resultado guardado correctamente.');
      setStatusType('success');
    } catch (error) {
      console.error('Save failed:', error);
      setStatusMessage(`Error al guardar: ${error?.message ?? 'Error desconocido'}`);
      setStatusType('error');
    }
  }

  async function handleClearClick() {
    setStatusMessage('');
    setStatusType('');

    try {
      setStatusMessage('Limpiando resultado…');
      setStatusType('info');

      const clearResultResult = await onClear(match.id);

      if (clearResultResult === false) {
        setStatusMessage('Se requiere aprobación de administrador para limpiar resultados.');
        setStatusType('error');
        return;
      }

      setStatusMessage('Resultado limpiado correctamente.');
      setStatusType('success');
    } catch (error) {
      console.error('Clear failed:', error);
      setStatusMessage(`Error al limpiar: ${error?.message ?? 'Error desconocido'}`);
      setStatusType('error');
    }
  }

  return (
    <article className="result-row">
      <div className="result-info">
        <span className="match-stage">{match.stage}</span>

        <p className="result-teams result-teams-flags">
          <span className="team-with-flag">
            <TeamFlag teamName={match.teamA} />
            <span>{match.teamA}</span>
          </span>

          <span className="vs">vs</span>

          <span className="team-with-flag">
            <TeamFlag teamName={match.teamB} />
            <span>{match.teamB}</span>
          </span>
        </p>

        <time dateTime={match.datetime}>{formatMatchDate(match.datetime)}</time>
      </div>

      <div className="result-form">
        <input
          type="number"
          min="0"
          max="20"
          className="score-input"
          value={scoreA}
          onChange={(e) => setScoreA(e.target.value)}
          aria-label={`Goles para ${match.teamA}`}
        />
        <span className="score-sep">–</span>
        <input
          type="number"
          min="0"
          max="20"
          className="score-input"
          value={scoreB}
          onChange={(e) => setScoreB(e.target.value)}
          aria-label={`Goles para ${match.teamB}`}
        />
        <button
          type="button"
          className={`btn btn-primary${adminBtnClass}`}
          onClick={handleSaveClick}
        >
          {isAdmin ? 'Guardar' : 'Guardar 🔒'}
        </button>

        {result && (
          <button
            type="button"
            className={`btn btn-ghost${adminBtnClass}`}
            onClick={handleClearClick}
          >
            {isAdmin ? 'Limpiar' : 'Limpiar 🔒'}
          </button>
        )}
      </div>

      {statusMessage && (
        <p className={statusType === 'error' ? 'form-error' : 'info-banner'} role="status">
          {statusMessage}
        </p>
      )}
    </article>
  );
}
