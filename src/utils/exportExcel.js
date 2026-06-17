
import * as XLSX from "xlsx";
import {
  fetchPlayers,
  fetchAllPredictions
} from "../services/cosmosApi";
import { STAGES } from "../data/matches";

export const exportToExcel = async () => {
  try {
    const players = await fetchPlayers();
    
  
  // 👇 CARGA REAL FUNCIONAL
  let predictions = [];

  for (const player of players) {
    try {
      const res = await fetch(`/.netlify/functions/api/predictions/${player.id}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        // 👇 NORMALIZAR AQUÍ (CLAVE)
        const normalized = data.map(p => ({
          playerId: p.playerId || player.id,
          matchId: p.matchId,
          scoreA: p.scoreA ?? p.predictedA,
          scoreB: p.scoreB ?? p.predictedB
        }));

        predictions.push(...normalized);
      }
    } catch (error) {
      console.warn("Error cargando predictions de", player.id);
    }
  }



    const matches = STAGES.flatMap(stage => stage.matches);

    if (!players || !predictions || !matches) {
      alert("Error cargando datos");
      return;
    }

    // ✅ Players
    const playerMap = Object.fromEntries(
      players
        .filter(p => p && p.id)
        .map(p => [String(p.id), p.name || "Sin nombre"])
    );

    // ✅ Matches
    const matchList = matches
      .filter(m => m && m.id)
      .map(m => ({
        id: String(m.id),
        name: `${m.teamA} vs ${m.teamB}`,
        date: new Date(m.date || m.matchDate || 0)
      }))
      .sort((a, b) => a.date - b.date);

    // ✅ Agrupación CORRECTA
    const grouped = {};

    predictions.forEach(p => {
      if (!p || !p.playerId || !p.matchId) return;

      const playerId = String(p.playerId);
      const matchId = String(p.matchId);

      if (!grouped[playerId]) grouped[playerId] = {};

      grouped[playerId][matchId] = `${p.scoreA ?? "-"}-${p.scoreB ?? "-"}`;
    });

    // ✅ Construcción de filas (FIX REAL AQUÍ)
    const rows = Object.keys(playerMap).map(playerId => {
      const row = {
        Player: playerMap[playerId]
      };

      matchList.forEach(m => {
        const matchId = String(m.id);

        row[m.name] =
          grouped[playerId] && grouped[playerId][matchId]
            ? grouped[playerId][matchId]
            : "";
      });

      return row;
    });

    // ✅ Excel
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Predictions");

    XLSX.writeFile(wb, "predictions_export.xlsx");

    console.log("✅ Excel exportado correctamente");
  } catch (error) {
    console.error("❌ Error exportando:", error);
    alert("Error al exportar Excel");
  }
};
