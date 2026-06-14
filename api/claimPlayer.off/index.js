
const {
  getDatabase,
  jsonResponse,
  normalizePlayer
} = require('../_shared/cosmos');

module.exports = async function (context, req) {
  try {
    const { playerId, claimCode, uid, force = false } = req.body || {};

    const safePlayerId = String(playerId);
    const safeClaimCode = String(claimCode ?? '').trim();
    const safeUid = String(uid ?? '').trim();

    const container = getDatabase().container('players');
    const { resource } = await container.item(safePlayerId, safePlayerId).read();

    if (!resource) {
      return jsonResponse(404, { error: 'PLAYER_NOT_FOUND' });
    }

    const storedCode = String(resource.claimCode ?? '').trim();

    if (storedCode !== safeClaimCode) {
      return jsonResponse(400, { error: 'WRONG_CODE' });
    }

    const claimedByUid = resource.claimedByUid ?? null;

    if (claimedByUid && claimedByUid !== safeUid && !force) {
      return jsonResponse(409, { error: 'ALREADY_CLAIMED' });
    }

    const updatedPlayer = {
      ...resource,
      claimedByUid: safeUid
    };

    await container.items.upsert(updatedPlayer);

    return jsonResponse(200, normalizePlayer(updatedPlayer));
  } catch (error) {
    context.log.error('claimPlayer error:', error);
    return jsonResponse(500, {
      error: 'Internal server error',
      details: error.message
    });
  }
};
