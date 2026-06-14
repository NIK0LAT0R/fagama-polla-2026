
const {
  getDatabase,
  jsonResponse,
  normalizeResult
} = require('../_shared/cosmos');

module.exports = async function (context, req) {
  try {
    const container = getDatabase().container('results');

    if (req.method === 'GET') {
      const { resources } = await container.items.readAll().fetchAll();
      return jsonResponse(200, resources.map(normalizeResult));
    }

    if (req.method === 'POST') {
      const body = req.body || {};

      const item = {
        id: String(body.id ?? body.matchId),
        matchId: String(body.matchId ?? body.id),
        scoreA: Number(body.scoreA),
        scoreB: Number(body.scoreB),
        updatedAt: new Date().toISOString()
      };

      await container.items.upsert(item);
      return jsonResponse(200, { success: true, item });
    }

    return jsonResponse(405, { error: 'Method not allowed' });
  } catch (error) {
    context.log.error('results error:', error);
    return jsonResponse(500, {
      error: 'Internal server error',
      details: error.message
    });
  }
};
