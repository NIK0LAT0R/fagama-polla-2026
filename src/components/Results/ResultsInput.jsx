import { useEffect, useMemo, useState } from 'react';
import { STAGES, MATCHES } from '../../data/matches.js';
import { useAdmin } from '../../context/AdminContext.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { formatMatchDate } from '../../utils/matchUtils.js';
import { getTeamFlagSrc } from '../../utils/flags.js';


function TeamFlag({ teamName }) {
  const [failed, setFailed] = useState(false);
  const src = getTeamFlagSrc(teamName);

  useEffect(() => {
    setFailed(false);
  }, [teamName]);

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
    12,
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

    // 1) hoy primero
    if (aIsToday !== bIsToday) {
      return aIsToday ? -1 : 1;
    }

    // 2) si ambos son de hoy: orden por hora del partido
    if (aIsToday && bIsToday) {
      return aMatchTime - bMatchTime;
    }

    // 3) los que ya cumplieron el "enviar al final" se van abajo
    if (aSendToEnd !== bSendToEnd) {
      return aSendToEnd ? 1 : -1;
    }

    // 4) entre los demás, abiertos primero
    if (aLocked !== bLocked) {
      return aLocked ? 1 : -1;
    }

    // 5) si ambos están abiertos: el cierre más próximo primero
    if (!aLocked && !bLocked) {
      return aLock - bLock;
    }

    // 6) si ambos están cerrados: el más reciente primero
    return bMatchTime - aMatchTime;
  });
}

function isPlaceholderTeam(name = '') {
  const value = String(name).toLowerCase();

  return (
    value.includes('grupo') ||
    value.includes('1.º') ||
    value.includes('2.º') ||
    value.includes('3.º') ||
    value.includes('winner') ||
    value.includes('ganador') ||
    value.includes('runner-up')
  );
}


function canEditTeams(match) {
  const knockoutStages = [
    'Dieciseisavos',
    'Octavos',
    'Cuartos',
    'Semifinal',
    'Semifinales',
    'Tercer puesto',
    'Final',
  ];

  return knockoutStages.includes(match.stage) ||
    isPlaceholderTeam(match.teamA) ||
    isPlaceholderTeam(match.teamB);
}


export default function ResultsInput() {
  const { matches, resultMap, upsertResult, clearResult, upsertMatchTeams } = useApp();

  const { isAdmin, requireAdmin } = useAdmin();

  const [stageFilter, setStageFilter] = useState('upcoming');
  const [search, setSearch] = useState('');

  const filteredMatches = useMemo(() => {
    const query = search.trim().toLowerCase();

    let nextMatches = matches.filter((match) => {
      const matchesSearch =
        !query ||
        match.teamA.toLowerCase().includes(query) ||
        match.teamB.toLowerCase().includes(query) ||
        match.stage.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (stageFilter !== 'upcoming' && stageFilter !== 'all' && match.stage !== stageFilter) {
        return false;
      }

      return true;
    });

    if (stageFilter === 'upcoming') {
      nextMatches = sortMatchesByCountdown(nextMatches);
    }

    return nextMatches;
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

    if (result === false) return false;
    return true;
  }

  async function handleClear(matchId) {
    const action = async () => {
      await clearResult(String(matchId));
      return true;
    };

    const result = await requireAdmin(action);

    if (result === false) return false;
    return true;
  }



async function handleResetTeams(matchId) {
    const baseMatch = MATCHES.find((m) => String(m.id) === String(matchId));

    if (!baseMatch) {
      throw new Error('No se encontró la definición original del partido.');
    }

    const action = async () => {
      await upsertMatchTeams(
        String(matchId),
        baseMatch.teamA,
        baseMatch.teamB
      );
      return true;
    };

    const result = await requireAdmin(action);

    if (result === false) return false;
    return true;
  }



  async function handleSaveTeams(matchId, teamA, teamB) {
    if (!teamA.trim() || !teamB.trim()) {
      throw new Error('Ambos nombres de países son requeridos.');
    }

    const action = async () => {
      await upsertMatchTeams(String(matchId), teamA.trim(), teamB.trim());
      return true;
    };

    const result = await requireAdmin(action);

    if (result === false) return false;
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
              ? 'Ingresa resultados finales y actualiza los cruces futuros.'
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
            key={`${match.id}-${result?.scoreA ?? 'x'}-${result?.scoreB ?? 'x'}-${match.teamA}-${match.teamB}`}
            match={match}
            result={result}
            isAdmin={isAdmin}
            adminBtnClass={adminBtnClass}
            onSave={handleSave}
            onClear={handleClear}
            onSaveTeams={handleSaveTeams}
            onResetTeams={handleResetTeams}
          />

          );
        })}
      </div>
    </section>
  );
}


function ResultRow({
  match,
  result,
  isAdmin,
  adminBtnClass,
  onSave,
  onClear,
  onSaveTeams,
  onResetTeams,
}){
  const [scoreA, setScoreA] = useState(result?.scoreA ?? '');
  const [scoreB, setScoreB] = useState(result?.scoreB ?? '');

  const [teamA, setTeamA] = useState(match.teamA);
  const [teamB, setTeamB] = useState(match.teamB);

  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('');

  useEffect(() => {
    setScoreA(result?.scoreA ?? '');
    setScoreB(result?.scoreB ?? '');
  }, [result?.scoreA, result?.scoreB, match.id]);

  useEffect(() => {
    setTeamA(match.teamA);
    setTeamB(match.teamB);
  }, [match.teamA, match.teamB, match.id]);

  const editableTeams = canEditTeams(match);
  const hasTeamChanges =
    teamA.trim() !== String(match.teamA).trim() ||
    teamB.trim() !== String(match.teamB).trim();

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

  async function handleSaveTeamsClick() {
    setStatusMessage('');
    setStatusType('');

    try {
      setStatusMessage('Guardando cruces…');
      setStatusType('info');

      const saveTeamsResult = await onSaveTeams(match.id, teamA, teamB);

      if (saveTeamsResult === false) {
        setStatusMessage('Se requiere aprobación de administrador para actualizar los equipos.');
        setStatusType('error');
        return;
      }

      setStatusMessage('Cruce actualizado correctamente.');
      setStatusType('success');
    } catch (error) {
      console.error('Save teams failed:', error);
      setStatusMessage(`Error al guardar equipos: ${error?.message ?? 'Error desconocido'}`);
      setStatusType('error');
    }
  }

  
async function handleResetTeamsClick() {
    setStatusMessage('');
    setStatusType('');

    try {
      setStatusMessage('Restaurando cruce original…');
      setStatusType('info');

      const resetResult = await onResetTeams(match.id);

      if (resetResult === false) {
        setStatusMessage('Se requiere aprobación de administrador para restaurar el cruce.');
        setStatusType('error');
        return;
      }

      setStatusMessage('Cruce restaurado correctamente.');
      setStatusType('success');
    } catch (error) {
      console.error('Reset teams failed:', error);
      setStatusMessage(
        `Error al restaurar equipos: ${error?.message ?? 'Error desconocido'}`
      );
      setStatusType('error');
    }
  }


  return (
    <article className="result-row">
      <div className="result-info">
        <span className="match-stage">{match.stage}</span>

        {editableTeams && isAdmin ? (
          <div className="result-teams result-teams-editable">
            <div className="team-edit-line">
              <TeamFlag teamName={teamA} />
              <input
                type="text"
                value={teamA}
                onChange={(e) => setTeamA(e.target.value)}
                className="team-name-input"
                aria-label={`Equipo A del partido ${match.id}`}
                placeholder="País equipo A"
              />
            </div>

            <span className="vs">vs</span>

            <div className="team-edit-line">
              <TeamFlag teamName={teamB} />
              <input
                type="text"
                value={teamB}
                onChange={(e) => setTeamB(e.target.value)}
                className="team-name-input"
                aria-label={`Equipo B del partido ${match.id}`}
                placeholder="País equipo B"
              />
            </div>
          </div>
        ) : (
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
        )}

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
          aria-label={`Goles para ${teamA}`}
        />
        <span className="score-sep">–</span>
        <input
          type="number"
          min="0"
          max="20"
          className="score-input"
          value={scoreB}
          onChange={(e) => setScoreB(e.target.value)}
          aria-label={`Goles para ${teamB}`}
        />

        <button
          type="button"
          className={`btn btn-primary${adminBtnClass}`}
          onClick={handleSaveClick}
        >
          {isAdmin ? 'Guardar' : 'Guardar 🔒'}
        </button>

        
        {editableTeams && isAdmin && (
          <>
            <button
              type="button"
              className={`btn btn-ghost${adminBtnClass}`}
              onClick={handleSaveTeamsClick}
              disabled={!hasTeamChanges}
            >
              Guardar cruces
            </button>

            <button
              type="button"
              className={`btn btn-ghost${adminBtnClass}`}
              onClick={handleResetTeamsClick}
            >
              Resetear cruce
            </button>
          </>
        )}


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
        <p
          className={statusType === 'error' ? 'form-error' : 'info-banner'}
          role="status"
        >
          {statusMessage}
        </p>
      )}
    </article>
  );
}

