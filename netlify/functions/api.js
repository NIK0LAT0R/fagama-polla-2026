const { CosmosClient } = require('@azure/cosmos');

const client = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT,
  key: process.env.COSMOS_KEY
});

const database = client.database('fagama-db');
const container = database.container('players');

exports.handler = async (event) => {
  try {
    const path = event.path.replace('/.netlify/functions/api', '');

    // 👉 GET /players
    if (event.httpMethod === 'GET' && path === '/players') {
      const { resources } = await container.items.readAll().fetchAll();

      return {
        statusCode: 200,
        body: JSON.stringify(resources)
      };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Route not found' })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};