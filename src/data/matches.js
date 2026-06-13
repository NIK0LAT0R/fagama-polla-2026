
/**
 * FIFA World Cup 2026 — calendario corregido
 * - Nombres en español
 * - Fechas oficiales por fases
 * - Horas en Bogotá (UTC-05:00), derivadas de la tabla ET publicada por ESPN
 * - lockAt: 00:00 de Bogotá del día anterior al partido
 */


function buildLockAtBogota(matchDateIso) {
  const [datePart] = matchDateIso.split('T');
  return `${datePart}T00:00:00-05:00`;
}


function withLock(match) {
  return {
    ...match,
    lockAt: buildLockAtBogota(match.datetime),
  };
}

export const MATCHES = [
  // =========================
  // GRUPO A (IDs 1-6)
  // =========================
  withLock({ id: 1, teamA: 'México', teamB: 'Sudáfrica', datetime: '2026-06-11T14:00:00-05:00', stage: 'Grupo A' }),
  withLock({ id: 2, teamA: 'Corea del Sur', teamB: 'Chequia', datetime: '2026-06-11T21:00:00-05:00', stage: 'Grupo A' }),
  withLock({ id: 3, teamA: 'México', teamB: 'Corea del Sur', datetime: '2026-06-18T22:00:00-05:00', stage: 'Grupo A' }),
  withLock({ id: 4, teamA: 'Chequia', teamB: 'Sudáfrica', datetime: '2026-06-18T11:00:00-05:00', stage: 'Grupo A' }),
  withLock({ id: 5, teamA: 'Chequia', teamB: 'México', datetime: '2026-06-24T20:00:00-05:00', stage: 'Grupo A' }),
  withLock({ id: 6, teamA: 'Sudáfrica', teamB: 'Corea del Sur', datetime: '2026-06-24T20:00:00-05:00', stage: 'Grupo A' }),

  // =========================
  // GRUPO B (IDs 7-12)
  // =========================
  withLock({ id: 7, teamA: 'Canadá', teamB: 'Bosnia y Herzegovina', datetime: '2026-06-12T14:00:00-05:00', stage: 'Grupo B' }),
  withLock({ id: 8, teamA: 'Catar', teamB: 'Suiza', datetime: '2026-06-13T14:00:00-05:00', stage: 'Grupo B' }),
  withLock({ id: 9, teamA: 'Canadá', teamB: 'Catar', datetime: '2026-06-18T17:00:00-05:00', stage: 'Grupo B' }),
  withLock({ id: 10, teamA: 'Suiza', teamB: 'Bosnia y Herzegovina', datetime: '2026-06-18T14:00:00-05:00', stage: 'Grupo B' }),
  withLock({ id: 11, teamA: 'Suiza', teamB: 'Canadá', datetime: '2026-06-24T14:00:00-05:00', stage: 'Grupo B' }),
  withLock({ id: 12, teamA: 'Bosnia y Herzegovina', teamB: 'Catar', datetime: '2026-06-24T14:00:00-05:00', stage: 'Grupo B' }),

  // =========================
  // GRUPO C (IDs 13-18)
  // =========================
  withLock({ id: 13, teamA: 'Brasil', teamB: 'Marruecos', datetime: '2026-06-13T17:00:00-05:00', stage: 'Grupo C' }),
  withLock({ id: 14, teamA: 'Haití', teamB: 'Escocia', datetime: '2026-06-13T20:00:00-05:00', stage: 'Grupo C' }),
  withLock({ id: 15, teamA: 'Brasil', teamB: 'Haití', datetime: '2026-06-19T20:00:00-05:00', stage: 'Grupo C' }),
  withLock({ id: 16, teamA: 'Marruecos', teamB: 'Escocia', datetime: '2026-06-19T17:00:00-05:00', stage: 'Grupo C' }),
  withLock({ id: 17, teamA: 'Escocia', teamB: 'Brasil', datetime: '2026-06-24T17:00:00-05:00', stage: 'Grupo C' }),
  withLock({ id: 18, teamA: 'Marruecos', teamB: 'Haití', datetime: '2026-06-24T17:00:00-05:00', stage: 'Grupo C' }),

  // =========================
  // GRUPO D (IDs 19-24)
  // =========================
  withLock({ id: 19, teamA: 'Estados Unidos', teamB: 'Paraguay', datetime: '2026-06-12T20:00:00-05:00', stage: 'Grupo D' }),
  withLock({ id: 20, teamA: 'Australia', teamB: 'Turquía', datetime: '2026-06-13T23:00:00-05:00', stage: 'Grupo D' }),
  withLock({ id: 21, teamA: 'Estados Unidos', teamB: 'Australia', datetime: '2026-06-19T14:00:00-05:00', stage: 'Grupo D' }),
  withLock({ id: 22, teamA: 'Turquía', teamB: 'Paraguay', datetime: '2026-06-19T23:00:00-05:00', stage: 'Grupo D' }),
  withLock({ id: 23, teamA: 'Turquía', teamB: 'Estados Unidos', datetime: '2026-06-25T21:00:00-05:00', stage: 'Grupo D' }),
  withLock({ id: 24, teamA: 'Paraguay', teamB: 'Australia', datetime: '2026-06-25T21:00:00-05:00', stage: 'Grupo D' }),

  // =========================
  // GRUPO E (IDs 25-30)
  // =========================
  withLock({ id: 25, teamA: 'Alemania', teamB: 'Curazao', datetime: '2026-06-14T12:00:00-05:00', stage: 'Grupo E' }),
  withLock({ id: 26, teamA: 'Costa de Marfil', teamB: 'Ecuador', datetime: '2026-06-14T18:00:00-05:00', stage: 'Grupo E' }),
  withLock({ id: 27, teamA: 'Alemania', teamB: 'Costa de Marfil', datetime: '2026-06-20T15:00:00-05:00', stage: 'Grupo E' }),
  withLock({ id: 28, teamA: 'Ecuador', teamB: 'Curazao', datetime: '2026-06-20T19:00:00-05:00', stage: 'Grupo E' }),
  withLock({ id: 29, teamA: 'Ecuador', teamB: 'Alemania', datetime: '2026-06-25T15:00:00-05:00', stage: 'Grupo E' }),
  withLock({ id: 30, teamA: 'Curazao', teamB: 'Costa de Marfil', datetime: '2026-06-25T15:00:00-05:00', stage: 'Grupo E' }),

  // =========================
  // GRUPO F (IDs 31-36)
  // =========================
  withLock({ id: 31, teamA: 'Países Bajos', teamB: 'Japón', datetime: '2026-06-14T15:00:00-05:00', stage: 'Grupo F' }),
  withLock({ id: 32, teamA: 'Suecia', teamB: 'Túnez', datetime: '2026-06-14T21:00:00-05:00', stage: 'Grupo F' }),
  withLock({ id: 33, teamA: 'Países Bajos', teamB: 'Suecia', datetime: '2026-06-20T12:00:00-05:00', stage: 'Grupo F' }),
  withLock({ id: 34, teamA: 'Túnez', teamB: 'Japón', datetime: '2026-06-20T23:00:00-05:00', stage: 'Grupo F' }),
  withLock({ id: 35, teamA: 'Japón', teamB: 'Suecia', datetime: '2026-06-25T18:00:00-05:00', stage: 'Grupo F' }),
  withLock({ id: 36, teamA: 'Túnez', teamB: 'Países Bajos', datetime: '2026-06-25T18:00:00-05:00', stage: 'Grupo F' }),

  // =========================
  // GRUPO G (IDs 37-42)
  // =========================
  withLock({ id: 37, teamA: 'Bélgica', teamB: 'Egipto', datetime: '2026-06-15T17:00:00-05:00', stage: 'Grupo G' }),
  withLock({ id: 38, teamA: 'Irán', teamB: 'Nueva Zelanda', datetime: '2026-06-15T23:00:00-05:00', stage: 'Grupo G' }),
  withLock({ id: 39, teamA: 'Bélgica', teamB: 'Irán', datetime: '2026-06-21T14:00:00-05:00', stage: 'Grupo G' }),
  withLock({ id: 40, teamA: 'Nueva Zelanda', teamB: 'Egipto', datetime: '2026-06-21T20:00:00-05:00', stage: 'Grupo G' }),
  withLock({ id: 41, teamA: 'Egipto', teamB: 'Irán', datetime: '2026-06-26T22:00:00-05:00', stage: 'Grupo G' }),
  withLock({ id: 42, teamA: 'Nueva Zelanda', teamB: 'Bélgica', datetime: '2026-06-26T22:00:00-05:00', stage: 'Grupo G' }),

  // =========================
  // GRUPO H (IDs 43-48)
  // =========================
  withLock({ id: 43, teamA: 'Arabia Saudita', teamB: 'Uruguay', datetime: '2026-06-15T17:00:00-05:00', stage: 'Grupo H' }),
  withLock({ id: 44, teamA: 'España', teamB: 'Cabo Verde', datetime: '2026-06-15T12:00:00-05:00', stage: 'Grupo H' }),
  withLock({ id: 45, teamA: 'España', teamB: 'Arabia Saudita', datetime: '2026-06-21T11:00:00-05:00', stage: 'Grupo H' }),
  withLock({ id: 46, teamA: 'Uruguay', teamB: 'Cabo Verde', datetime: '2026-06-21T17:00:00-05:00', stage: 'Grupo H' }),
  withLock({ id: 47, teamA: 'Cabo Verde', teamB: 'Arabia Saudita', datetime: '2026-06-26T19:00:00-05:00', stage: 'Grupo H' }),
  withLock({ id: 48, teamA: 'Uruguay', teamB: 'España', datetime: '2026-06-26T19:00:00-05:00', stage: 'Grupo H' }),

  // =========================
  // GRUPO I (IDs 49-54)
  // =========================
  withLock({ id: 49, teamA: 'Francia', teamB: 'Senegal', datetime: '2026-06-16T14:00:00-05:00', stage: 'Grupo I' }),
  withLock({ id: 50, teamA: 'Irak', teamB: 'Noruega', datetime: '2026-06-16T17:00:00-05:00', stage: 'Grupo I' }),
  withLock({ id: 51, teamA: 'Francia', teamB: 'Irak', datetime: '2026-06-22T16:00:00-05:00', stage: 'Grupo I' }),
  withLock({ id: 52, teamA: 'Noruega', teamB: 'Senegal', datetime: '2026-06-22T19:00:00-05:00', stage: 'Grupo I' }),
  withLock({ id: 53, teamA: 'Noruega', teamB: 'Francia', datetime: '2026-06-26T14:00:00-05:00', stage: 'Grupo I' }),
  withLock({ id: 54, teamA: 'Senegal', teamB: 'Irak', datetime: '2026-06-26T14:00:00-05:00', stage: 'Grupo I' }),

  // =========================
  // GRUPO J (IDs 55-60)
  // =========================
  withLock({ id: 55, teamA: 'Argentina', teamB: 'Argelia', datetime: '2026-06-16T20:00:00-05:00', stage: 'Grupo J' }),
  withLock({ id: 56, teamA: 'Austria', teamB: 'Jordania', datetime: '2026-06-16T23:00:00-05:00', stage: 'Grupo J' }),
  withLock({ id: 57, teamA: 'Argentina', teamB: 'Austria', datetime: '2026-06-22T12:00:00-05:00', stage: 'Grupo J' }),
  withLock({ id: 58, teamA: 'Jordania', teamB: 'Argelia', datetime: '2026-06-22T22:00:00-05:00', stage: 'Grupo J' }),
  withLock({ id: 59, teamA: 'Argelia', teamB: 'Austria', datetime: '2026-06-27T21:00:00-05:00', stage: 'Grupo J' }),
  withLock({ id: 60, teamA: 'Jordania', teamB: 'Argentina', datetime: '2026-06-27T21:00:00-05:00', stage: 'Grupo J' }),

  // =========================
  // GRUPO K (IDs 61-66)
  // =========================
  withLock({ id: 61, teamA: 'Portugal', teamB: 'RD del Congo', datetime: '2026-06-17T12:00:00-05:00', stage: 'Grupo K' }),
  withLock({ id: 62, teamA: 'Uzbekistán', teamB: 'Colombia', datetime: '2026-06-17T21:00:00-05:00', stage: 'Grupo K' }),
  withLock({ id: 63, teamA: 'Portugal', teamB: 'Uzbekistán', datetime: '2026-06-23T12:00:00-05:00', stage: 'Grupo K' }),
  withLock({ id: 64, teamA: 'Colombia', teamB: 'RD del Congo', datetime: '2026-06-23T21:00:00-05:00', stage: 'Grupo K' }),
  withLock({ id: 65, teamA: 'Colombia', teamB: 'Portugal', datetime: '2026-06-27T18:30:00-05:00', stage: 'Grupo K' }),
  withLock({ id: 66, teamA: 'RD del Congo', teamB: 'Uzbekistán', datetime: '2026-06-27T18:30:00-05:00', stage: 'Grupo K' }),

  // =========================
  // GRUPO L (IDs 67-72)
  // =========================
  withLock({ id: 67, teamA: 'Ghana', teamB: 'Panamá', datetime: '2026-06-17T18:00:00-05:00', stage: 'Grupo L' }),
  withLock({ id: 68, teamA: 'Inglaterra', teamB: 'Croacia', datetime: '2026-06-17T15:00:00-05:00', stage: 'Grupo L' }),
  withLock({ id: 69, teamA: 'Inglaterra', teamB: 'Ghana', datetime: '2026-06-23T15:00:00-05:00', stage: 'Grupo L' }),
  withLock({ id: 70, teamA: 'Panamá', teamB: 'Croacia', datetime: '2026-06-23T18:00:00-05:00', stage: 'Grupo L' }),
  withLock({ id: 71, teamA: 'Panamá', teamB: 'Inglaterra', datetime: '2026-06-27T16:00:00-05:00', stage: 'Grupo L' }),
  withLock({ id: 72, teamA: 'Croacia', teamB: 'Ghana', datetime: '2026-06-27T16:00:00-05:00', stage: 'Grupo L' }),

  // =========================
  // DIECISEISAVOS (Round of 32) IDs 73-88
  // =========================
  withLock({ id: 73, teamA: '2.º del Grupo A', teamB: '2.º del Grupo B', datetime: '2026-06-28T14:00:00-05:00', stage: 'Dieciseisavos' }),
  withLock({ id: 74, teamA: '1.º del Grupo E', teamB: '3.º de A/B/C/D/F', datetime: '2026-06-29T15:30:00-05:00', stage: 'Dieciseisavos' }),
  withLock({ id: 75, teamA: '1.º del Grupo F', teamB: '2.º del Grupo C', datetime: '2026-06-29T20:00:00-05:00', stage: 'Dieciseisavos' }),
  withLock({ id: 76, teamA: '1.º del Grupo C', teamB: '2.º del Grupo F', datetime: '2026-06-29T12:00:00-05:00', stage: 'Dieciseisavos' }),
  withLock({ id: 77, teamA: '1.º del Grupo I', teamB: '3.º de C/D/F/G/H', datetime: '2026-06-30T16:00:00-05:00', stage: 'Dieciseisavos' }),
  withLock({ id: 78, teamA: '2.º del Grupo E', teamB: '2.º del Grupo I', datetime: '2026-06-30T12:00:00-05:00', stage: 'Dieciseisavos' }),
  withLock({ id: 79, teamA: '1.º del Grupo A', teamB: '3.º de C/E/F/H/I', datetime: '2026-06-30T20:00:00-05:00', stage: 'Dieciseisavos' }),
  withLock({ id: 80, teamA: '1.º del Grupo L', teamB: '3.º de E/H/I/J/K', datetime: '2026-07-01T11:00:00-05:00', stage: 'Dieciseisavos' }),
  withLock({ id: 81, teamA: '1.º del Grupo D', teamB: '3.º de B/E/F/I/J', datetime: '2026-07-01T19:00:00-05:00', stage: 'Dieciseisavos' }),
  withLock({ id: 82, teamA: '1.º del Grupo G', teamB: '3.º de A/E/H/I/J', datetime: '2026-07-01T15:00:00-05:00', stage: 'Dieciseisavos' }),
  withLock({ id: 83, teamA: '2.º del Grupo K', teamB: '2.º del Grupo L', datetime: '2026-07-02T18:00:00-05:00', stage: 'Dieciseisavos' }),
  withLock({ id: 84, teamA: '1.º del Grupo H', teamB: '2.º del Grupo J', datetime: '2026-07-02T14:00:00-05:00', stage: 'Dieciseisavos' }),
  withLock({ id: 85, teamA: '1.º del Grupo B', teamB: '3.º de E/F/G/I/J', datetime: '2026-07-02T22:00:00-05:00', stage: 'Dieciseisavos' }),
  withLock({ id: 86, teamA: '1.º del Grupo J', teamB: '2.º del Grupo H', datetime: '2026-07-03T17:00:00-05:00', stage: 'Dieciseisavos' }),
  withLock({ id: 87, teamA: '1.º del Grupo K', teamB: '3.º de D/E/I/J/L', datetime: '2026-07-03T20:30:00-05:00', stage: 'Dieciseisavos' }),
  withLock({ id: 88, teamA: '2.º del Grupo D', teamB: '2.º del Grupo G', datetime: '2026-07-03T13:00:00-05:00', stage: 'Dieciseisavos' }),

  // =========================
  // OCTAVOS (Round of 16) IDs 89-96
  // =========================
  withLock({ id: 89, teamA: 'Ganador partido 74', teamB: 'Ganador partido 77', datetime: '2026-07-04T16:00:00-05:00', stage: 'Octavos de final' }),
  withLock({ id: 90, teamA: 'Ganador partido 73', teamB: 'Ganador partido 75', datetime: '2026-07-04T12:00:00-05:00', stage: 'Octavos de final' }),
  withLock({ id: 91, teamA: 'Ganador partido 76', teamB: 'Ganador partido 78', datetime: '2026-07-05T15:00:00-05:00', stage: 'Octavos de final' }),
  withLock({ id: 92, teamA: 'Ganador partido 79', teamB: 'Ganador partido 80', datetime: '2026-07-05T19:00:00-05:00', stage: 'Octavos de final' }),
  withLock({ id: 93, teamA: 'Ganador partido 83', teamB: 'Ganador partido 84', datetime: '2026-07-06T14:00:00-05:00', stage: 'Octavos de final' }),
  withLock({ id: 94, teamA: 'Ganador partido 81', teamB: 'Ganador partido 82', datetime: '2026-07-06T16:00:00-05:00', stage: 'Octavos de final' }),
  withLock({ id: 95, teamA: 'Ganador partido 86', teamB: 'Ganador partido 88', datetime: '2026-07-07T11:00:00-05:00', stage: 'Octavos de final' }),
  withLock({ id: 96, teamA: 'Ganador partido 85', teamB: 'Ganador partido 87', datetime: '2026-07-07T15:00:00-05:00', stage: 'Octavos de final' }),

  // =========================
  // CUARTOS (Quarter-finals) IDs 97-100
  // =========================
  withLock({ id: 97, teamA: 'Ganador partido 89', teamB: 'Ganador partido 90', datetime: '2026-07-09T15:00:00-05:00', stage: 'Cuartos de final' }),
  withLock({ id: 98, teamA: 'Ganador partido 93', teamB: 'Ganador partido 94', datetime: '2026-07-10T14:00:00-05:00', stage: 'Cuartos de final' }),
  withLock({ id: 99, teamA: 'Ganador partido 91', teamB: 'Ganador partido 92', datetime: '2026-07-11T16:00:00-05:00', stage: 'Cuartos de final' }),
  withLock({ id: 100, teamA: 'Ganador partido 95', teamB: 'Ganador partido 96', datetime: '2026-07-11T20:00:00-05:00', stage: 'Cuartos de final' }),

  // =========================
  // SEMIFINALES, TERCER PUESTO, FINAL
  // =========================
  withLock({ id: 101, teamA: 'Ganador partido 97', teamB: 'Ganador partido 98', datetime: '2026-07-14T14:00:00-05:00', stage: 'Semifinal' }),
  withLock({ id: 102, teamA: 'Ganador partido 99', teamB: 'Ganador partido 100', datetime: '2026-07-15T14:00:00-05:00', stage: 'Semifinal' }),
  withLock({ id: 103, teamA: 'Perdedor semifinal 101', teamB: 'Perdedor semifinal 102', datetime: '2026-07-18T16:00:00-05:00', stage: 'Tercer puesto' }),
  withLock({ id: 104, teamA: 'Ganador semifinal 101', teamB: 'Ganador semifinal 102', datetime: '2026-07-19T14:00:00-05:00', stage: 'Final' }),
].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

export const STAGES = [...new Set(MATCHES.map((m) => m.stage))];
export const MATCH_COUNT = MATCHES.length;
