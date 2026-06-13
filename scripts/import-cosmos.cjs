
const fs = require('fs');
const path = require('path');
const { CosmosClient } = require('@azure/cosmos');

// 👇 REEMPLAZAR
const endpoint = "https://fagama-cosmos-db.documents.azure.com:443/";
const key = "jwwbytEWnjLxfmALbrNESvH6qHUgglKJDgpNC1FtNkxhcI5qVLlyzxoxnDvGBZFVcY2Mcrf3WoiDACDbuIXSDA==";

const client = new CosmosClient({ endpoint, key });

const databaseId = "fagama-polla";

async function importCollection(containerName, fileName) {
  console.log(`⏳ Importando ${containerName}`);

  const filePath = path.join(__dirname, 'exports', fileName);
  const items = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const database = client.database(databaseId);
  const container = database.container(containerName);

  let count = 0;

  for (const item of items) {
    const cleanItem = {
      ...item,
      id: String(item.id), // obligatorio en Cosmos
    };

    await container.items.upsert(cleanItem);
    count++;

    if (count % 50 === 0) {
      console.log(`   → ${count} registros procesados`);
    }
  }

  console.log(`✅ ${containerName}: ${items.length} registros importados\n`);
}

async function run() {
  try {
    await importCollection('players', 'players.json');
    await importCollection('predictions', 'predictions.json');
    await importCollection('results', 'results.json');

    console.log('🎉 Migración COMPLETA a Cosmos DB');
  } catch (error) {
    console.error('❌ Error importando:', error);
  }
}

run();
