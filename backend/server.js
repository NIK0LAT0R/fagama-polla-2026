
require('dotenv').config();

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;


const express = require('express');
const cors = require('cors');
const { CosmosClient } = require('@azure/cosmos');

const app = express();

app.use(cors());
app.use(express.json());

const endpoint = 'https://fagama-cosmos-db.documents.azure.com:443/';
const key = 'jwwbytEWnjLxfmALbrNESvH6qHUgglKJDgpNC1FtNkxhcI5qVLlyzxoxnDvGBZFVcY2Mcrf3WoiDACDbuIXSDA==';

const client = new CosmosClient({ endpoint, key });
const database = client.database('fagama-polla');

function normalizePlayer(item) {
  return {
    id: String(item.id),
    name: item.name,
    claimCode: item.claimCode ?? '',
    claimedByUid: item.claimedByUid ?? null,
  };
}

function normalizePrediction(item) {
  return {
    id: String(item.id),
    playerId: String(item.playerId),
    matchId: String(item.matchId),
    predictedA: Number(item.predictedA ?? item.scoreA),
    predictedB: Number(item.predictedB ?? item.scoreB),
    updatedAt: item.updatedAt ?? null,
  };
}

function normalizeResult(item) {
  return {
    id: String(item.id),
    matchId: String(item.matchId ?? item.id),
    scoreA: Number(item.scoreA),
    scoreB: Number(item.scoreB),
    updatedAt: item.updatedAt ?? null,
  };
}

// =========================
// PLAYERS
// =========================
app.get('/players', async (req, res) => {
  try {
    const container = database.container('players');
    const { resources } = await container.items.readAll().fetchAll();
    res.json(resources.map(normalizePlayer));
  } catch (error) {
    console.error('Error loading players:', error);
    res.status(500).json({ error: 'Error loading players' });
  }
});

app.post('/players', async (req, res) => {
  try {
    const container = database.container('players');
    const item = {
      id: String(req.body.id),
      name: req.body.name,
      claimCode: req.body.claimCode,
      claimedByUid: req.body.claimedByUid ?? null,
    };

    await container.items.upsert(item);
    res.status(200).json({ success: true, item });
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ error: 'Error creating player' });
  }
});

app.delete('/players/:playerId', async (req, res) => {
  try {
    const playerId = String(req.params.playerId);

    // borrar player
    const playersContainer = database.container('players');
    await playersContainer.item(playerId, playerId).delete();

    // borrar predictions del jugador
    const predictionsContainer = database.container('predictions');

    const querySpec = {
      query: 'SELECT * FROM c WHERE c.playerId = @playerId',
      parameters: [{ name: '@playerId', value: playerId }],
    };

    const { resources } = await predictionsContainer.items.query(querySpec).fetchAll();

    for (const item of resources) {
      await predictionsContainer.item(item.id, item.playerId).delete();
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: 'Error deleting player' });
  }
});

// =========================
// CLAIM PLAYER
// =========================
app.post('/claim-player', async (req, res) => {
  try {
    const playerId = String(req.body.playerId);
    const claimCode = String(req.body.claimCode ?? '').trim();
    const uid = String(req.body.uid ?? '').trim();
    const force = Boolean(req.body.force);

    const container = database.container('players');

    const { resource } = await container.item(playerId, playerId).read();

    if (!resource) {
      return res.status(404).json({ error: 'PLAYER_NOT_FOUND' });
    }

    const storedCode = String(resource.claimCode ?? '').trim();

    if (storedCode !== claimCode) {
      return res.status(400).json({ error: 'WRONG_CODE' });
    }

    const claimedByUid = resource.claimedByUid ?? null;

    if (claimedByUid && claimedByUid !== uid && !force) {
      return res.status(409).json({ error: 'ALREADY_CLAIMED' });
    }

    const updatedPlayer = {
      ...resource,
      claimedByUid: uid,
    };

    await container.items.upsert(updatedPlayer);

    res.status(200).json(normalizePlayer(updatedPlayer));
  } catch (error) {
    console.error('Error claiming player:', error);
    res.status(500).json({ error: 'Error claiming player' });
  }
});

// =========================
// PREDICTIONS
// =========================
app.get('/predictions/:playerId', async (req, res) => {
  try {
    const container = database.container('predictions');

    const querySpec = {
      query: 'SELECT * FROM c WHERE c.playerId = @playerId',
      parameters: [{ name: '@playerId', value: String(req.params.playerId) }],
    };

    const { resources } = await container.items.query(querySpec).fetchAll();
    res.json(resources.map(normalizePrediction));
  } catch (error) {
    console.error('Error loading predictions:', error);
    res.status(500).json({ error: 'Error loading predictions' });
  }
});

app.get('/predictions-all', async (req, res) => {
  try {
    const container = database.container('predictions');
    const { resources } = await container.items.readAll().fetchAll();
    res.json(resources.map(normalizePrediction));
  } catch (error) {
    console.error('Error loading all predictions:', error);
    res.status(500).json({ error: 'Error loading all predictions' });
  }
});

app.post('/predictions', async (req, res) => {
  try {
    const container = database.container('predictions');

    const item = {
      id: String(req.body.id),
      playerId: String(req.body.playerId),
      matchId: String(req.body.matchId),
      scoreA: Number(req.body.scoreA ?? req.body.predictedA),
      scoreB: Number(req.body.scoreB ?? req.body.predictedB),
      updatedAt: req.body.updatedAt ?? new Date().toISOString(),
    };

    await container.items.upsert(item);
    res.status(200).json({ success: true, item });
  } catch (error) {
    console.error('Error saving prediction:', error);
    res.status(500).json({ error: 'Error saving prediction' });
  }
});

// =========================
// RESULTS
// =========================
app.get('/results', async (req, res) => {
  try {
    const container = database.container('results');
    const { resources } = await container.items.readAll().fetchAll();
    res.json(resources.map(normalizeResult));
  } catch (error) {
    console.error('Error loading results:', error);
    res.status(500).json({ error: 'Error loading results' });
  }
});

app.post('/results', async (req, res) => {
  try {
    const container = database.container('results');

    const item = {
      id: String(req.body.id ?? req.body.matchId),
      matchId: String(req.body.matchId ?? req.body.id),
      scoreA: Number(req.body.scoreA),
      scoreB: Number(req.body.scoreB),
      updatedAt: req.body.updatedAt ?? new Date().toISOString(),
    };

    await container.items.upsert(item);
    res.status(200).json({ success: true, item });
  } catch (error) {
    console.error('Error saving result:', error);
    res.status(500).json({ error: 'Error saving result' });
  }
});

app.delete('/results/:matchId', async (req, res) => {
  try {
    const matchId = String(req.params.matchId);
    const container = database.container('results');

    await container.item(matchId, matchId).delete();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting result:', error);
    res.status(500).json({ error: 'Error deleting result' });
  }
});

// =========================
// RESET ALL
// =========================
app.delete('/reset-all', async (req, res) => {
  try {
    const containers = [
      { name: 'predictions', pk: 'playerId' },
      { name: 'results', pk: 'matchId' },
      { name: 'players', pk: 'id' },
    ];

    for (const config of containers) {
      const container = database.container(config.name);
      const { resources } = await container.items.readAll().fetchAll();

      for (const item of resources) {
        await container.item(String(item.id), String(item[config.pk])).delete();
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error resetting data:', error);
    res.status(500).json({ error: 'Error resetting data' });
  }
});

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`✅ Backend Cosmos corriendo en http://localhost:${PORT}`);
});
