
const { getDatabase, jsonResponse } = require('../_shared/cosmos');

module.exports = async function (context, req) {
  try {
    const body = req.body || {};

    const item = {
      id: String(body.id),
      playerId: String(body.playerId),
      matchId: String(body.matchId),
      scoreA: Number(body.scoreA),
      scoreB: Number(body.scoreB),
      updatedAt: new Date().toISOString()
    };

    await getDatabase().container('predictions').items.upsert(item);

    return jsonResponse(200, { success: true });
  } catch (error) {
    context.log.error('predictionsSave error:', error);
    return jsonResponse(500, {
      error: 'Internal server error',
      details: error.message
    });
  }
};
