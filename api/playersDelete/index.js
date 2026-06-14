
const { getDatabase, jsonResponse } = require('../_shared/cosmos');

module.exports = async function (context, req) {
  try {
    const playerId = String(context.bindingData.playerId);
    const database = getDatabase();

    const playersContainer = database.container('players');
    const predictionsContainer = database.container('predictions');

    await playersContainer.item(playerId, playerId).delete();

    const querySpec = {
      query: 'SELECT * FROM c WHERE c.playerId = @playerId',
      parameters: [{ name: '@playerId', value: playerId }]
    };

    const { resources } = await predictionsContainer.items.query(querySpec).fetchAll();

    for (const item of resources) {
      await predictionsContainer.item(item.id, item.playerId).delete();
    }

    return jsonResponse(200, { success: true });
  } catch (error) {
    context.log.error('playersDelete error:', error);
    return jsonResponse(500, {
      error: 'Internal server error',
      details: error.message
    });
  }
};
