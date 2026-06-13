/**
 * Returns true when the match kickoff time has passed (predictions locked).
 */

export function isMatchLocked(matchOrDatetime) {
  if (typeof matchOrDatetime === 'object' && matchOrDatetime?.lockAt) {
    return Date.now() >= new Date(matchOrDatetime.lockAt).getTime();
  }

  // fallback por compatibilidad si aún le pasas datetime viejo
  return Date.now() >= new Date(matchOrDatetime).getTime();
}


/** Format ISO datetime for display. */
export function formatMatchDate(datetime) {
  return new Date(datetime).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Prediction map key for fast lookup. */
export function predictionKey(playerId, matchId) {
  return `${String(playerId)}-${String(matchId)}`;
}
