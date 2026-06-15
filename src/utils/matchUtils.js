/**
 * Returns true when the match kickoff time has passed (predictions locked).
 */




export function isMatchLocked(match) {
  if (!match) return false;

  const now = Date.now();

  // Usa datetime si no hay lockAt
  const lockSource = match.lockAt || match.datetime;

  const lockTime = new Date(lockSource).getTime();

  if (isNaN(lockTime)) {
    console.warn("⚠️ fecha inválida en match:", match);
    return false;
  }

  return lockTime <= now;
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
