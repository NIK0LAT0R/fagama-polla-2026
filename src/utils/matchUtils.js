/**
 * Returns true when the match kickoff time has passed (predictions locked).
 */
/**
 * Devuelve la fecha/hora de bloqueo real del partido:
 * 2:00 AM hora de Colombia del mismo día del partido.
 */
export function getMatchLockTime(match) {
  if (!match) return null;

  const source = match.datetime ?? match.lockAt ?? match.date;
  if (!source) return null;

  const matchDate = new Date(source);

  if (Number.isNaN(matchDate.getTime())) {
    console.warn('⚠️ fecha inválida en match:', match);
    return null;
  }

  // Construimos una fecha fija a las 2:00 AM Colombia (-05:00)
  const year = matchDate.getFullYear();
  const month = String(matchDate.getMonth() + 1).padStart(2, '0');
  const day = String(matchDate.getDate()).padStart(2, '0');

  return new Date(`${year}-${month}-${day}T02:00:00-05:00`);
}

/**
 * Indica si el partido ya está bloqueado.
 * Regla: bloqueado desde las 2:00 AM hora Colombia del día del partido.
 */
export function isMatchLocked(match) {
  const lockDate = getMatchLockTime(match);

  if (!lockDate || Number.isNaN(lockDate.getTime())) {
    return false;
  }

  return Date.now() >= lockDate.getTime();
}

/**
 * Fecha legible del partido para mostrar en UI.
 */
export function formatMatchDate(datetime) {
  const date = new Date(datetime);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Key para búsquedas rápidas en predictionMap.
 */
export function predictionKey(playerId, matchId) {
  return `${String(playerId)}-${String(matchId)}`;
}