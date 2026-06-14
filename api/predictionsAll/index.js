
const {
  getDatabase,
  jsonResponse,
  normalizePrediction
} = require('../_shared/cosmos');

module.exports = async function () {
  try {
    const { resources } = await getDatabase()
      .container('predictions')
      .items.readAll()
      .fetchAll();

    return jsonResponse(200, resources.map(normalizePrediction));
  } catch (error) {
    return jsonResponse(500, {
      error: 'Internal server error',
      details: error.message
    });
  }
};
