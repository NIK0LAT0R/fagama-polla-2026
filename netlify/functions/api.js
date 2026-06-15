const { CosmosClient } = require('@azure/cosmos');

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY,
});

const database = client.database('fagama-polla');

function response(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };
}

function getPath(event) {
  return event.path.replace('/.netlify/functions/api', '');
}

function normalizePlayer(item) {
  return {
    id: String(item.id),
    name: item.name,
    claimCode: item.claimCode ?? '',
    claimedByUid: item.claimedByUid ?? null,
  };
}

function normalizePrediction(item) {
  return {
    id: String(item.id),
    playerId: String(item.playerId),
    matchId: String(item.matchId),
    predictedA: Number(item.predictedA ?? item.scoreA),
    predictedB: Number(item.predictedB ?? item.scoreB),
    updatedAt: item.updatedAt ?? null,
  };
}

function normalizeResult(item) {
  return {
    id: String(item.id),
    matchId: String(item.matchId ?? item.id),
    scoreA: Number(item.scoreA),
    scoreB: Number(item.scoreB),
    updatedAt: item.updatedAt ?? null,
  };
}

exports.handler = async (event) => {
  const path = getPath(event);
  const method = event.httpMethod;

  try {
    // =========================
    // GET /players
    // =========================
    if (method === 'GET' && path === '/players') {
      const { resources } = await database
        .container('players')
        .items.readAll()
        .fetchAll();

      return response(200, resources.map(normalizePlayer));
    }

    // =========================
    // POST /claim-player
    // =========================
    if (method === 'POST' && path === '/claim-player') {
      const body = JSON.parse(event.body || '{}');

      const playerId = String(body.playerId ?? '');
      const claimCode = String(body.claimCode ?? '').trim();
      const uid = String(body.uid ?? '').trim();
      const force = Boolean(body.force);

      const container = database.container('players');

      const { resource } = await container.item(playerId, playerId).read();

      if (!resource) {
        return response(404, { error: 'PLAYER_NOT_FOUND' });
      }

      const storedCode = String(resource.claimCode ?? '').trim();

      if (storedCode !== claimCode) {
        return response(400, { error: 'WRONG_CODE' });
      }

      const claimedByUid = resource.claimedByUid ?? null;

      if (claimedByUid && claimedByUid !== uid && !force) {
        return response(409, { error: 'ALREADY_CLAIMED' });
      }

      const updatedPlayer = {
        ...resource,
        claimedByUid: uid,
      };

      await container.items.upsert(updatedPlayer);

      return response(200, normalizePlayer(updatedPlayer));
    }

    // =========================
    // GET /results
    // =========================
    if (method === 'GET' && path === '/results') {
      const { resources } = await database
        .container('results')
        .items.readAll()
        .fetchAll();

      return response(200, resources.map(normalizeResult));
    }

    // =========================
    // GET /predictions/:playerId
    // =========================
    if (method === 'GET' && path.startsWith('/predictions/')) {
      const playerId = path.split('/')[2];

      const query = {
        query: 'SELECT * FROM c WHERE c.playerId = @playerId',
        parameters: [{ name: '@playerId', value: String(playerId) }],
      };

      const { resources } = await database
        .container('predictions')
        .items.query(query)
        .fetchAll();

      return response(200, resources.map(normalizePrediction));
    }

    // =========================
    // GET /predictions-all
    // =========================
    if (method === 'GET' && path === '/predictions-all') {
      const { resources } = await database
        .container('predictions')
        .items.readAll()
        .fetchAll();

      return response(200, resources.map(normalizePrediction));
    }

    // =========================
    // POST /predictions
    // =========================
    if (method === 'POST' && path === '/predictions') {
      const body = JSON.parse(event.body || '{}');

      const item = {
        id: String(body.id),
        playerId: String(body.playerId),
        matchId: String(body.matchId),
        scoreA: Number(body.scoreA),
        scoreB: Number(body.scoreB),
        updatedAt: new Date().toISOString(),
      };

      await database.container('predictions').items.upsert(item);

      return response(200, { success: true });
    }

    // =========================
    // POST /results
    // =========================
    if (method === 'POST' && path === '/results') {
      const body = JSON.parse(event.body || '{}');

      const item = {
        id: String(body.id ?? body.matchId),
        matchId: String(body.matchId ?? body.id),
        scoreA: Number(body.scoreA),
        scoreB: Number(body.scoreB),
        updatedAt: new Date().toISOString(),
      };

      await database.container('results').items.upsert(item);

      return response(200, { success: true });
    }

    // =========================
    // DELETE /results/:matchId
    // =========================
    if (method === 'DELETE' && path.startsWith('/results/')) {
      const matchId = path.split('/')[2];

      await database
        .container('results')
        .item(matchId, matchId)
        .delete();

      return response(200, { success: true });
    }

    // =========================
    // NOT FOUND
    // =========================
    return response(404, { error: 'Route not found' });
  } catch (error) {
    console.error('Function error:', error);

    return response(500, {
      error: error.message,
    });
  }
};
