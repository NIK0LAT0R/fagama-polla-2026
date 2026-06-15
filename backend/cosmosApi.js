require('dotenv').config();
const { CosmosClient } = require('@azure/cosmos');

// ✅ Validación básica
if (!process.env.COSMOS_CONNECTION_STRING) {
  throw new Error('❌ Falta COSMOS_CONNECTION_STRING en el .env');
}

// ✅ Cliente
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);

// ✅ Config (ajusta si tus nombres son distintos)
const databaseId = 'pollaDB';
const matchesContainerId = 'matches';
const predictionsContainerId = 'predictions';

// ✅ Referencias
const database = client.database(databaseId);
const matchesContainer = database.container(matchesContainerId);
const predictionsContainer = database.container(predictionsContainerId);

// ✅ Guardar partido
async function saveMatch(match) {
  try {
    const item = {
      id: `${match.team1}-${match.team2}`,
      team1: match.team1,
      team2: match.team2,
      score1: Number(match.score1 || 0),
      score2: Number(match.score2 || 0),
      date: match.date || new Date().toISOString()
    };

    await matchesContainer.items.upsert(item);
    console.log(`✅ Match: ${item.team1} vs ${item.team2}`);
  } catch (err) {
    console.error('❌ Error guardando match:', err.message);
  }
}

// ✅ Guardar predicción
async function savePrediction(prediction) {
  try {
    const item = {
      id: `${prediction.player}-${prediction.team1}-${prediction.team2}`,
      player: prediction.player,
      team1: prediction.team1,
      team2: prediction.team2,
      pred1: Number(prediction.pred1),
      pred2: Number(prediction.pred2)
    };

    await predictionsContainer.items.upsert(item);
  } catch (err) {
    console.error(`❌ Error predicción ${prediction.player}:`, err.message);
  }
}

module.exports = {
  saveMatch,
  savePrediction
};
