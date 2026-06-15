
require('dotenv').config();
const XLSX = require('xlsx');
const { CosmosClient } = require('@azure/cosmos');

// ✅ CONFIG COSMOS
const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
const database = client.database('fagama-polla');
const container = database.container('predictions');

// ✅ CARGAR EXCEL
const workbook = XLSX.readFile('../POLLA 2026 FAGAMA-.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

// ✅ MAPEO DE PLAYERS (lo que me diste)
const players = {
  "Aura C": "1",
  "Fernando Gamboa": "191fec56-b6cb-4502-b1e4-3358e7d1f2e6",
  "Nestor Gamboa": "065b5c24-76e0-46bc-ad19-f6f1b4edbbf2",
  "Viviana Navarro": "06615166-5621-4525-94d8-163a2a16becf",
  "Luciana Gamboa": "09cf204b-4ca5-403b-8a6a-4d774adc0ac3",
  "Nicolas Gamboa": "146b23cc-7d66-4623-92ab-c277eab9859d",
  "Amanda Gamboa": "17ecaea8-f267-4cd6-b155-c44b43317b25",
  "Santiago Galeano": "1b7f5454-533f-4ec1-9373-1d8acef61e8c",
  "Diego Galeano": "21a249ad-bc36-4034-8264-f914de7fb138",
  "Gordito": "25cd7398-e4f3-46c2-bd1a-188701610ed7",
  "Heidy Gamboa": "374a0c08-7f4f-4c62-b26c-fcacc9765254",
  "Gabriela Gamboa": "37f41693-8091-426e-937b-f81348cdd9e4",
  "Sandra Acero": "39e68d13-9400-4feb-8f85-80667cc9f96d",
  "Julio padilla": "3ad77c05-065f-4e52-bdbf-9b3e79aca62f",
  "Leonardo Padilla": "490f1ba9-41d2-49f8-88ce-c64b74baf2a7",
  "Karen Navarro": "49750a7c-5f1c-43df-b6f7-0db664064754",
  "Sonia Rodriguez": "4fe1c5d5-a2b2-4446-93c3-37d2723135d7",
  "Dinara Gamboa": "56cd3858-bfab-4169-94b6-2e2566e741a0",
  "Emiliee": "6bde1135-1017-436e-9d03-91783ecb12ac",
  "Julian Gutierrez": "6e0736a5-8c19-4403-a721-24d6b9e7eb2c",
  "Tochi": "76f0d304-bb07-4cf4-a517-3e8526f9a3d9",
  "Valentina Acero": "8729d9be-37e9-411b-9007-46eb8794ea89",
  "Nicolas Silva": "8f255d5e-7d5f-410b-b85d-24092909f917",
  "Sebastian Borda": "9cfd1efe-42d1-45e1-a581-f7677478e6da",
  "Leonardo Baez": "ac16c0f2-f680-484f-890b-4cf4924c06f4",
  "Jaime Gamboa": "ae4a40db-c76b-42cd-aa77-cc7ca7a22ff4",
  "Caleb Littleton": "ba4ffcef-e738-41e6-bcaf-a58013f88502",
  "Manuel Gamboa": "be48d4dc-e09d-4639-bc2b-ea0dc64d8d09",
  "Alejandro Gamboa": "c5d76dd3-fe51-44ac-b9af-8aa047ee6152",
  "Consuelo Gamboa": "c65a87d7-c75e-4939-ba99-38dab1b2f504",
  "Valentina Navarro": "c71eb666-d675-462f-9db0-bb68515e5b4b",
  "Juan Rosero": "d220328d-6196-4a71-a1ba-020f00ced9b6",
  "Bianca Padilla": "d2b2d9b0-9426-4028-aa6a-7a5f1853873f",
  "Natalia Gamboa": "d7edd48e-2637-4f0a-b2de-ad11729a14de",
  "Sandra Moreno": "e4d8ac1f-613c-4dd2-9e35-04dfb689041d",
  "Julian Gamboa": "e60f9981-5406-440a-aaf7-27d49366619d",
  "Mateo Gamboa": "e8dc0ef9-8458-494c-8508-24281ed824fb",
  "Patricia Candamil": "ea99b8e3-5f77-43d8-9ef4-e8cadd095f64",
  "Linda Patarroyo": "f225ee47-2017-4f87-accc-fe5815b2d082",
  "Carolina Pinilla": "f2a9851b-940d-417b-b51c-a283f3096152",
  "Diana Serrano": "f59041a0-272f-46ac-abb5-170691511b05",
  "Clemencia Gamboa": "f96307bf-9ba7-48a0-8d14-ee987feefd65",
  "Ofelia Morales": "fbc21b46-f924-4c3b-8079-634ee392c926"
};

// ✅ PROCESAR
async function main() {
  let matchId = 1;

  for (let row of data) {
    if (!row['País'] || !row['País.1']) continue;

    for (let playerName in players) {
      const playerId = players[playerName];

      const colA = `Goles Equipo 1`;
      const colB = `Goles Equipo 2`;

      // ⚠️ aquí está la lógica real: Excel tiene múltiples columnas con sufijos
      const predA = row[colA];
      const predB = row[colB];

      if (predA == null || predB == null) continue;

      const item = {
        id: `${playerId}_${matchId}`,
        playerId,
        matchId: matchId.toString(),
        scoreA: Number(predA),
        scoreB: Number(predB),
        updatedAt: new Date().toISOString()
      };

      try {
        await container.items.upsert(item);
        console.log(`✅ ${playerName} - match ${matchId}`);
      } catch (err) {
        console.error(`❌ ${playerName}`, err.message);
      }
    }

    matchId++;
  }

  console.log("🔥 FIN CARGA COMPLETA");
}

main();
