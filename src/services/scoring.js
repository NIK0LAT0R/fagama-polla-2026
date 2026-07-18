
/**
 * Reglas oficiales Polla Mundialista Fagama 2026
 *
 * Puntaje:
 * - 5 puntos si acierta el marcador exacto
 * - 3 puntos si acierta ganador o empate
 * - 1 punto por acertar los goles del equipo A
 * - 1 punto por acertar los goles del equipo B
 *
 * Nota:
 * Si el marcador es exacto, el total debe ser 5 puntos (no 3+1+1 por separado).
 */

/**
 * Determina el resultado del partido:
 * - 'A' = gana equipo A
 * - 'B' = gana equipo B
 * - 'draw' = empate
 */








const STAGE_MULTIPLIERS = {
  'Cuartos de final': 2,
  Semifinal: 2,
  'Tercer puesto': 4,
  Final: 4,
};



function getOutcome(scoreA, scoreB) {
  if (scoreA > scoreB) return 'A';
  if (scoreB > scoreA) return 'B';
  return 'draw';
}

/**
 * Convierte a número de forma segura.
 */
function toSafeNumber(value) {
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

/**
 * Calcula los puntos de una predicción frente al resultado real.
 */


export function calculateMatchPoints(
  prediction,
  result,
  match = null
) {

  if (!prediction || !result) return null;

  const predictedA = toSafeNumber(prediction.predictedA ?? prediction.scoreA);
  const predictedB = toSafeNumber(prediction.predictedB ?? prediction.scoreB);
  const scoreA = toSafeNumber(result.scoreA);
  const scoreB = toSafeNumber(result.scoreB);


  let points = 0;

  if (predictedA === scoreA && predictedB === scoreB) {
    points = 5;
  } else {
    if (
      getOutcome(predictedA, predictedB) ===
      getOutcome(scoreA, scoreB)
    ) {
      points += 3;
    }

    if (predictedA === scoreA) {
      points += 1;
    }

    if (predictedB === scoreB) {
      points += 1;
    }
  }

  
  const multiplier =
    match?.stage
      ? STAGE_MULTIPLIERS[match.stage] ?? 1
      : 1;

  points *= multiplier;


  return points;

}

/**
 * Construye la tabla general de posiciones.
 */

export function calculateStandings(
  players,
  predictions,
  results,
  matches
) {
  const safePlayers = Array.isArray(players) ? players : [];
  const safePredictions = Array.isArray(predictions) ? predictions : [];
  const safeResults = Array.isArray(results) ? results : [];

  // Solo jugadores válidos / vinculados
  const validPlayers = safePlayers.filter(
    (p) => p && p.id && p.name && p.claimedByUid
  );

  // Ojo: forzamos keys string para evitar problemas de tipo
  const resultMap = new Map(
    safeResults.map((r) => [String(r.matchId), r])
  );
  
  const matchMap = new Map(
    (matches || []).map((m) => [String(m.id), m])
  );


  console.log(
    'calculateStandings: players',
    safePlayers.length,
    '-> valid',
    validPlayers.length
  );
  console.log('calculateStandings: predictions', safePredictions.length);
  console.log('calculateStandings: results', safeResults.length);

  const standings = validPlayers.map((player) => {
    const playerPredictions = safePredictions.filter(
      (p) => String(p.playerId) === String(player.id)
    );

    let totalPoints = 0;
    let scoredMatches = 0;
    let exactScores = 0;
    let correctOutcomes = 0;

    for (const prediction of playerPredictions) {
      const result = resultMap.get(String(prediction.matchId));
      if (!result) continue;

      
    const match = matchMap.get(String(prediction.matchId));
    
    console.log(
      'DEBUG MATCH',
      prediction.matchId,
      match?.stage
    );


    let points = calculateMatchPoints(
      prediction,
      result,
      match
    );



    
    console.log(
      'DEBUG POINTS BEFORE',
      points
    );


    



      if (points !== null) {
        totalPoints += points;
        scoredMatches += 1;

        const predictedA = toSafeNumber(prediction.predictedA ?? prediction.scoreA);
        const predictedB = toSafeNumber(prediction.predictedB ?? prediction.scoreB);
        const scoreA = toSafeNumber(result.scoreA);
        const scoreB = toSafeNumber(result.scoreB);

        if (
          predictedA !== null &&
          predictedB !== null &&
          scoreA !== null &&
          scoreB !== null
        ) {
          if (predictedA === scoreA && predictedB === scoreB) {
            exactScores += 1;
          } else if (
            getOutcome(predictedA, predictedB) === getOutcome(scoreA, scoreB)
          ) {
            correctOutcomes += 1;
          }
        }
      }
    }

    console.log(
      `calculateStandings: player ${player.id} (${player.name}) -> points ${totalPoints}, scoredMatches ${scoredMatches}, exactScores ${exactScores}, correctOutcomes ${correctOutcomes}`
    );

    return {
      playerId: player.id,
      name: player.name,
      totalPoints,
      scoredMatches,
      exactScores,
      correctOutcomes,
    };
  });

  return standings;
}
