
const API_BASE = '/.netlify/functions/api';

async function apiGet(path) {
  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body?.error ? ` - ${body.error}` : '';
    } catch {
      // ignore
    }
    throw new Error(`GET ${path} failed: ${response.status}${detail}`);
  }

  return response.json();
}

async function apiPost(path, body) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorBody = {};
    try {
      errorBody = await response.json();
    } catch {
      // ignore
    }

    const error = new Error(
      errorBody.error ?? `POST ${path} failed: ${response.status}`
    );
    throw error;
  }

  return response.json();
}

async function apiDelete(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    let errorBody = {};
    try {
      errorBody = await response.json();
    } catch {
      // ignore
    }

    const error = new Error(
      errorBody.error ?? `DELETE ${path} failed: ${response.status}`
    );
    throw error;
  }

  return response.json();
}

// =========================
// PLAYERS
// =========================
export async function fetchPlayers() {
  return apiGet('/players');
}

export async function createPlayerInCosmos(player) {
  return apiPost('/players', player);
}

export async function deletePlayerInCosmos(playerId) {
  return apiDelete(`/players/${playerId}`);
}

export async function claimPlayerInCosmos({
  playerId,
  claimCode,
  uid,
  force = false,
}) {
  return apiPost('/claim-player', {
    playerId,
    claimCode,
    uid,
    force,
  });
}

// =========================
// RESULTS
// =========================
export async function fetchResults() {
  return apiGet('/results');
}

export async function saveResult(result) {
  return apiPost('/results', result);
}

export async function deleteResult(matchId) {
  return apiDelete(`/results/${matchId}`);
}

// =========================
// PREDICTIONS
// =========================
export async function fetchPredictionsByPlayer(playerId) {
  return apiGet(`/predictions/${playerId}`);
}

export async function fetchAllPredictions() {
  return apiGet('/predictions-all');
}

export async function savePrediction(prediction) {
  return apiPost('/predictions', prediction);
}

// =========================
// MATCH OVERRIDES / CRUCES
// =========================
export async function fetchMatchOverrides() {
  return apiGet('/matches-overrides');
}

export async function saveMatchTeams(matchId, teamA, teamB) {
  return apiPost(`/matches/${matchId}/teams`, {
    teamA,
    teamB,
  });
}

// =========================
// RESET
// =========================
export async function resetAllCosmosData() {
  return apiDelete('/reset-all');
}
