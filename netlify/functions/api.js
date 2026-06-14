
const { CosmosClient } = require('@azure/cosmos');

function response(statusCode, data) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
}

exports.handler = async () => {
  try {
    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;

    if (!endpoint) {
      return response(500, { error: 'COSMOS_ENDPOINT missing' });
    }

    if (!key) {
      return response(500, { error: 'COSMOS_KEY missing' });
    }

    const client = new CosmosClient({ endpoint, key });
    const database = client.database('fagama-polla');
    const container = database.container('players');

    const { resources } = await container.items.readAll().fetchAll();

    return response(200, {
      ok: true,
      endpointPreview: endpoint,
      playersCount: resources.length,
    });
  } catch (error) {
    return response(500, {
      error: 'Cosmos test failed',
      details: error.message,
    });
  }
};
