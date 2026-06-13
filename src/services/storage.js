
const STORAGE_KEYS = {
  claimedPlayer: 'fagama_polla_claimed_player',
  actingPlayer: 'fagama_polla_acting_player',
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadClaimedPlayerId() {
  return read(STORAGE_KEYS.claimedPlayer, null);
}

export function saveClaimedPlayerId(playerId) {
  write(STORAGE_KEYS.claimedPlayer, playerId);
}

export function clearClaimedPlayerId() {
  localStorage.removeItem(STORAGE_KEYS.claimedPlayer);
}

export function loadActingPlayerId() {
  return read(STORAGE_KEYS.actingPlayer, null);
}

export function saveActingPlayerId(playerId) {
  write(STORAGE_KEYS.actingPlayer, playerId);
}

export function clearActingPlayerId() {
  localStorage.removeItem(STORAGE_KEYS.actingPlayer);
}
