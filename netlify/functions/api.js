
const { CosmosClient } = require('@azure/cosmos');

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY,
});

const database = client.database('fagama-polla');

// 🔧 Helper
function response(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };
}

// 🔧 Extraer ruta real
function getPath(event) {
  return event.path.replace('/.netlify/functions/api', '');
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

      return response(200, resources);
    }

    // =========================
    // GET /results
    // =========================
    if (method === 'GET' && path === '/results') {
      const { resources } = await database
        .container('results')
        .items.readAll()
        .fetchAll();

      return response(200, resources);
    }

    // =========================
    // GET /predictions/:playerId
    // =========================
    if (method === 'GET' && path.startsWith('/predictions/')) {
      const playerId = path.split('/')[2];

      const query = {
        query: 'SELECT * FROM c WHERE c.playerId = @playerId',
        parameters: [{ name: '@playerId', value: playerId }],
      };

      const { resources } = await database
        .container('predictions')
        .items.query(query)
        .fetchAll();

      return response(200, resources);
    }

    // =========================
    // GET /predictions-all
    // =========================
    if (method === 'GET' && path === '/predictions-all') {
      const { resources } = await database
        .container('predictions')
        .items.readAll()
        .fetchAll();

      return response(200, resources);
    }

    // =========================
    // POST /predictions
    // =========================
    if (method === 'POST' && path === '/predictions') {
      const body = JSON.parse(event.body);

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
      const body = JSON.parse(event.body);

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
      error: 'Internal server error',
      details: error.message,
    });
  }
};
