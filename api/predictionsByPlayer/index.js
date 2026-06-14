
const {
  getDatabase,
  jsonResponse,
  normalizePrediction
} = require('../_shared/cosmos');

module.exports = async function (context) {
  try {
    const playerId = String(context.bindingData.playerId);

    const querySpec = {
      query: 'SELECT * FROM c WHERE c.playerId = @playerId',
      parameters: [{ name: '@playerId', value: playerId }]
    };

    const { resources } = await getDatabase()
      .container('predictions')
      .items.query(querySpec)
      .fetchAll();

    return jsonResponse(200, resources.map(normalizePrediction));
  } catch (error) {
    context.log.error('predictionsByPlayer error:', error);
    return jsonResponse(500, {
      error: 'Internal server error',
      details: error.message
    });
  }
};
