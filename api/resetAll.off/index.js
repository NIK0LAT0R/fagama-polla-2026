
const { getDatabase, jsonResponse } = require('../_shared/cosmos');

module.exports = async function (context) {
  try {
    const database = getDatabase();

    const containers = [
      { name: 'predictions', pk: 'playerId' },
      { name: 'results', pk: 'matchId' },
      { name: 'players', pk: 'id' }
    ];

    for (const config of containers) {
      const container = database.container(config.name);
      const { resources } = await container.items.readAll().fetchAll();

      for (const item of resources) {
        await container.item(String(item.id), String(item[config.pk])).delete();
      }
    }

    return jsonResponse(200, { success: true });
  } catch (error) {
    context.log.error('resetAll error:', error);
    return jsonResponse(500, {
      error: 'Internal server error',
      details: error.message
    });
  }
};
