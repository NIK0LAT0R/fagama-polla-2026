
const {
  getDatabase,
  jsonResponse,
  normalizePlayer
} = require('../_shared/cosmos');

module.exports = async function (context, req) {
  try {
    const database = getDatabase();
    const container = database.container('players');

    if (req.method === 'GET') {
      const { resources } = await container.items.readAll().fetchAll();
      return jsonResponse(200, resources.map(normalizePlayer));
    }

    if (req.method === 'POST') {
      const body = req.body || {};

      const item = {
        id: String(body.id),
        name: body.name,
        claimCode: body.claimCode,
        claimedByUid: body.claimedByUid ?? null
      };

      await container.items.upsert(item);
      return jsonResponse(200, { success: true, item });
    }

    return jsonResponse(405, { error: 'Method not allowed' });
  } catch (error) {
    context.log.error('players error:', error);
    return jsonResponse(500, {
      error: 'Internal server error',
      details: error.message
    });
  }
};
