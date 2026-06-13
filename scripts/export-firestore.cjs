
const fs = require('fs');
const path = require('path');

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccountPath = path.join(__dirname, 'service-account.json');
const exportDir = path.join(__dirname, 'exports');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ No se encontró el archivo scripts/service-account.json');
  process.exit(1);
}

if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

const serviceAccount = JSON.parse(
  fs.readFileSync(serviceAccountPath, 'utf8')
);

// Inicializar Firebase Admin solo una vez
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

function serializeFirestoreData(data) {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(serializeFirestoreData);
  }

  if (typeof data === 'object') {
    // Detectar Firestore Timestamp
    if (typeof data.toDate === 'function') {
      return data.toDate().toISOString();
    }

    const result = {};
    for (const key of Object.keys(data)) {
      result[key] = serializeFirestoreData(data[key]);
    }
    return result;
  }

  return data;
}

async function exportCollection(collectionName) {
  console.log(`⏳ Exportando colección: ${collectionName}`);

  const snapshot = await db.collection(collectionName).get();
  const documents = [];

  snapshot.forEach((doc) => {
    documents.push({
      id: doc.id,
      ...serializeFirestoreData(doc.data()),
    });
  });

  const outputPath = path.join(exportDir, `${collectionName}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(documents, null, 2), 'utf8');

  console.log(`✅ ${collectionName}: ${documents.length} documentos exportados`);
}

async function run() {
  try {
    await exportCollection('players');
    await exportCollection('predictions');
    await exportCollection('results');

    console.log('\n🎉 Exportación completada con éxito.');
    console.log(`📁 Archivos generados en: ${exportDir}`);
  } catch (error) {
    console.error('❌ Error al exportar Firestore:', error);
    process.exit(1);
  }
}

run();
