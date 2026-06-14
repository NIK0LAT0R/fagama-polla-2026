
const { getDatabase, jsonResponse } = require('../_shared/cosmos');

module.exports = async function (context) {
  try {
    const matchId = String(context.bindingData.matchId);

    await getDatabase()
      .container('results')
      .item(matchId, matchId)
      .delete();

    return jsonResponse(200, { success: true });
  } catch (error) {
    context.log.error('resultDelete error:', error);
    return jsonResponse(500, {
      error: 'Internal server error',
      details: error.message
    });
  }
};
