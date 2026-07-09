import { memo, useEffect, useState } from 'react';
import { calculateMatchPoints } from '../../services/scoring.js';
import {
  formatMatchDate,
  isMatchLocked,
  getMatchLockTime,
} from '../../utils/matchUtils.js';
import { formatCountdown } from '../../utils/countdown.js';
import { getTeamFlagSrc } from '../../utils/flags.js';

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
      alt={`Bandera de ${teamName}`}
      className="team-flag-img"
      onError={() => setFailed(true)}
    />
  );
}

function ScoreInput({ value, onChange, disabled, label }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      className="score-input"
      value={value}
      onChange={onChange}
      disabled={disabled}
      aria-label={label}
    />
  );
}

function MatchRow({
  match,
  prediction,
  draft,
  result,
  playerId,
  onDraftChange,
}) {


  // Determinamos bloqueos en predicciones con: const locked = isMatchLocked(match);
  //Para desbloquearlos, reemplazar con: const locked = false;
  const locked = isMatchLocked(match); //isMatchLocked(match);

  const [countdown, setCountdown] = useState(() =>
    formatCountdown(getMatchLockTime(match))
  );

  useEffect(() => {
    const lockTime = getMatchLockTime(match);

    setCountdown(formatCountdown(lockTime));

    const interval = setInterval(() => {
      setCountdown(formatCountdown(lockTime));
    }, 60000); // update every minute

    return () => clearInterval(interval);
  }, [match]);

  const currentA =
    prediction?.predictedA != null ? String(prediction.predictedA) : '';

  const currentB =
    prediction?.predictedB != null ? String(prediction.predictedB) : '';

  const draftA = draft?.predictedA != null ? draft.predictedA : currentA;
  const draftB = draft?.predictedB != null ? draft.predictedB : currentB;

  const points =
    prediction && result ? calculateMatchPoints(prediction, result, match) : null;

  const disabled = !playerId || locked;

  function sanitizeScore(value) {
    return value.replace(/\D/g, '').slice(0, 2);
  }

  function handleChangeA(e) {
    if (disabled) return;
    onDraftChange(match.id, 'A', sanitizeScore(e.target.value));
  }

  function handleChangeB(e) {
    if (disabled) return;
    onDraftChange(match.id, 'B', sanitizeScore(e.target.value));
  }

  function getCountdownTone(match) {
    const lockDate = getMatchLockTime(match);

    if (!lockDate) return 'countdown-safe';

    const now = Date.now();
    const lockTime = lockDate.getTime();
    const diffMs = lockTime - now;

    if (diffMs <= 0) {
      return 'countdown-locked';
    }

    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffHours < 24) {
      return 'countdown-danger';
    }

    if (diffDays < 7) {
      return 'countdown-warning';
    }

    return 'countdown-safe';
  }

  return (
    <article className={`match-row ${locked ? 'locked' : ''}`}>
      <div className="match-meta">
        <span className="match-stage">{match.stage}</span>
        <time dateTime={match.datetime}>{formatMatchDate(match.datetime)}</time>

        {countdown && !locked && (
          <span className={`countdown-text ${getCountdownTone(match)}`}>
            Este marcador se bloqueará en: ⏱ {countdown}
          </span>
        )}

        {locked && <span className="lock-badge">Predicción bloqueada</span>}
      </div>

      <div className="match-body">
        <div className="match-teams">
          <span className="team team-with-flag">
            <TeamFlag teamName={match.teamA} />
            <span>{match.teamA}</span>
          </span>

          <span className="vs">vs</span>

          <span className="team team-with-flag">
            <TeamFlag teamName={match.teamB} />
            <span>{match.teamB}</span>
          </span>
        </div>

        <div className="match-scores">
          <ScoreInput
            value={draftA}
            disabled={disabled}
            label={`Goles pronosticados para ${match.teamA}`}
            onChange={handleChangeA}
          />
          <span className="score-sep">–</span>
          <ScoreInput
            value={draftB}
            disabled={disabled}
            label={`Goles pronosticados para ${match.teamB}`}
            onChange={handleChangeB}
          />
        </div>
      </div>

      <div className="match-footer">
        {result ? (
          <span className="result-display">
            Resultado oficial:
            <strong>
              <TeamFlag teamName={match.teamA} /> {result.scoreA} – {result.scoreB}{' '}
              <TeamFlag teamName={match.teamB} />
            </strong>
            {points !== null && (
              <span className={`points-chip points-${points}`}>+{points} pts</span>
            )}
          </span>
        ) : (
          <span className="result-pending">Sin resultado aún</span>
        )}
      </div>
    </article>
  );
}

export default memo(MatchRow);