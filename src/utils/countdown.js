/**
 * Format time remaining until a lock time in Bogotá timezone (UTC-05:00).
 * Returns a user-friendly string like "1d 3h 20m" or "15m".
 */
export function formatCountdown(lockAtIso) {
  const lockTime = new Date(lockAtIso).getTime();
  const now = Date.now();
  
  if (now >= lockTime) {
    return null; // locked
  }

  const diff = lockTime - now;
  const totalSeconds = Math.floor(diff / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  
  const remainingHours = totalHours % 24;
  const remainingMinutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${remainingHours}h ${remainingMinutes}m`;
  }
  if (remainingHours > 0) {
    return `${remainingHours}h ${remainingMinutes}m`;
  }
  return `${remainingMinutes}m`;
}
