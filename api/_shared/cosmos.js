
const { CosmosClient } = require('@azure/cosmos');

let clientInstance = null;

function getCosmosClient() {
  if (!clientInstance) {
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;

    if (!endpoint) {
      throw new Error('COSMOS_ENDPOINT is missing');
    }

    if (!key) {
      throw new Error('COSMOS_KEY is missing');
    }

    clientInstance = new CosmosClient({ endpoint, key });
  }

  return clientInstance;
}

function getDatabase() {
  return getCosmosClient().database('fagama-polla');
}

function jsonResponse(status, data) {
  return {
    status,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };
}

function normalizePlayer(item) {
  return {
    id: String(item.id),
    name: item.name,
    claimCode: item.claimCode ?? '',
    claimedByUid: item.claimedByUid ?? null
  };
}

function normalizePrediction(item) {
  return {
    id: String(item.id),
    playerId: String(item.playerId),
    matchId: String(item.matchId),
    predictedA: Number(item.predictedA ?? item.scoreA),
    predictedB: Number(item.predictedB ?? item.scoreB),
    updatedAt: item.updatedAt ?? null
  };
}

function normalizeResult(item) {
  return {
    id: String(item.id),
    matchId: String(item.matchId ?? item.id),
    scoreA: Number(item.scoreA),
    scoreB: Number(item.scoreB),
    updatedAt: item.updatedAt ?? null
  };
}

module.exports = {
  getDatabase,
  jsonResponse,
  normalizePlayer,
  normalizePrediction,
  normalizeResult
};
