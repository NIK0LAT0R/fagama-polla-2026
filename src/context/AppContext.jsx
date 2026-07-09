

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';


import { MATCHES } from '../data/matches.js';
import { calculateStandings } from '../services/scoring.js';
import {
  clearClaimedPlayerId,
  loadClaimedPlayerId,
  saveClaimedPlayerId,
  loadActingPlayerId,
  saveActingPlayerId,
  clearActingPlayerId,
} from '../services/storage.js';
import { generateClaimCode } from '../utils/claimCode.js';
import { createId } from '../utils/id.js';
import { predictionKey } from '../utils/matchUtils.js';
import { PLAYER_DELEGATIONS_BY_NAME } from '../config/playerDelegations.js';

import {
  fetchPlayers,
  fetchResults,
  fetchPredictionsByPlayer,
  savePrediction,
  saveResult,
  deleteResult,
  fetchMatchOverrides,
  saveMatchTeams,
} from '../services/cosmosApi.js';

import {
  ensureAnonymousAuth,
  getCurrentUid,
  subscribeToAuth,
} from '../services/firebase.js';

const AppContext = createContext(null);

function findPlayerForUid(players, uid) {
  return players.find((p) => p.claimedByUid === uid) ?? null;
}

function isValidClaim(players, playerId, uid) {
  const player = players.find((p) => String(p.id) === String(playerId));
  return player?.claimedByUid === uid;
}

export function AppProvider({ children }) {
  const [players, setPlayers] = useState([]);
  const [predictions, setPredictions] = useState([]); // solo del jugador activo
  const [results, setResults] = useState([]);
  const [matchOverrides, setMatchOverrides] = useState([]);

  const [uid, setUid] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [playersReady, setPlayersReady] = useState(false);
  const [resultsReady, setResultsReady] = useState(false);
  const [predictionsReady, setPredictionsReady] = useState(false);
  const [matchOverridesReady, setMatchOverridesReady] = useState(false);

  const [claimedPlayerId, setClaimedPlayerId] = useState(null);
  const [activePlayerId, setActivePlayerId] = useState(loadActingPlayerId() || '');
  const [claimResolved, setClaimResolved] = useState(false);

  const previousClaimedPlayerIdRef = useRef(null);

  // =========================
  // AUTH
  // =========================
  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      try {
        await ensureAnonymousAuth();
        if (!cancelled) {
          setUid(getCurrentUid());
          setAuthReady(true);
        }
      } catch {
        if (!cancelled) {
          setAuthReady(true);
        }
      }
    }

    initAuth();

    const unsubAuth = subscribeToAuth((user) => {
      setUid(user?.uid ?? null);
      setAuthReady(true);
    });

    return () => {
      cancelled = true;
      unsubAuth();
    };
  }, []);

  // =========================
  // PLAYERS
  // =========================
  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;

    async function loadPlayers() {
      setPlayersReady(false);
      try {
        const nextPlayers = await fetchPlayers();
        if (!cancelled) {
          setPlayers(nextPlayers);
          setPlayersReady(true);
          console.log('Cosmos players loaded:', nextPlayers.length);
        }
      } catch (error) {
        console.error('Error loading players from Cosmos:', error);
        if (!cancelled) {
          setPlayers([]);
          setPlayersReady(true);
        }
      }
    }

    loadPlayers();

    return () => {
      cancelled = true;
    };
  }, [authReady]);

  // =========================
  // RESULTS
  // =========================
  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;

    async function loadResults() {
      setResultsReady(false);
      try {
        const nextResults = await fetchResults();
        if (!cancelled) {
          setResults(nextResults);
          setResultsReady(true);
          console.log('Cosmos results loaded:', nextResults.length);
        }
      } catch (error) {
        console.error('Error loading results from Cosmos:', error);
        if (!cancelled) {
          setResults([]);
          setResultsReady(true);
        }
      }
    }

    loadResults();

    return () => {
      cancelled = true;
    };
  }, [authReady]);

  // =========================
  // MATCH OVERRIDES
  // =========================
  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;

    async function loadMatchOverrides() {
      setMatchOverridesReady(false);
      try {
        const nextOverrides = await fetchMatchOverrides();
        if (!cancelled) {
          setMatchOverrides(nextOverrides);
          setMatchOverridesReady(true);
          console.log('Cosmos match overrides loaded:', nextOverrides.length);
        }
      } catch (error) {
        console.error('Error loading match overrides from Cosmos:', error);
        if (!cancelled) {
          setMatchOverrides([]);
          setMatchOverridesReady(true);
        }
      }
    }

    loadMatchOverrides();

    return () => {
      cancelled = true;
    };
  }, [authReady]);

  // =========================
  // CLAIM RESOLUTION
  // =========================
  useEffect(() => {
    if (!authReady || !playersReady || !uid || claimResolved) return;

    const storedClaimedId = loadClaimedPlayerId();

    if (storedClaimedId && isValidClaim(players, storedClaimedId, uid)) {
      setClaimedPlayerId(String(storedClaimedId));
      setClaimResolved(true);
      return;
    }

    const owned = findPlayerForUid(players, uid);

    if (owned) {
      setClaimedPlayerId(String(owned.id));
      saveClaimedPlayerId(String(owned.id));
      setClaimResolved(true);
      return;
    }

    if (storedClaimedId && !isValidClaim(players, storedClaimedId, uid)) {
      clearClaimedPlayerId();
      clearActingPlayerId();
    }

    setClaimedPlayerId(null);
    setActivePlayerId('');
    setClaimResolved(true);
  }, [authReady, playersReady, uid, players, claimResolved]);

  // =========================
  // CLAIMED PLAYER
  // =========================
  const claimedPlayer = useMemo(() => {
    return players.find((p) => String(p.id) === String(claimedPlayerId)) ?? null;
  }, [players, claimedPlayerId]);

  // =========================
  // DELEGACIONES
  // =========================
  const switchablePlayers = useMemo(() => {
    if (!claimedPlayer) return [];

    const allowedNames = PLAYER_DELEGATIONS_BY_NAME[claimedPlayer.name] ?? [];

    if (allowedNames.length === 0) {
      return players.filter((p) => String(p.id) === String(claimedPlayer.id));
    }

    return players.filter((p) => allowedNames.includes(p.name));
  }, [claimedPlayer, players]);

  // =========================
  // ACTIVE PLAYER
  // =========================
  useEffect(() => {
    if (!claimedPlayer) {
      setActivePlayerId('');
      clearActingPlayerId();
      return;
    }

    const storedActingId = loadActingPlayerId();
    const allowedIds = new Set(switchablePlayers.map((p) => String(p.id)));

    if (storedActingId && allowedIds.has(String(storedActingId))) {
      setActivePlayerId(String(storedActingId));
      return;
    }

    setActivePlayerId(String(claimedPlayer.id));
    saveActingPlayerId(String(claimedPlayer.id));
  }, [claimedPlayer, switchablePlayers]);

  const activePlayer = useMemo(() => {
    return (
      players.find((p) => String(p.id) === String(activePlayerId)) ??
      claimedPlayer ??
      null
    );
  }, [players, activePlayerId, claimedPlayer]);

  const switchActivePlayer = useCallback(
    (nextPlayerId) => {
      const allowedIds = new Set(switchablePlayers.map((p) => String(p.id)));

      if (!allowedIds.has(String(nextPlayerId))) {
        console.warn('Intento de cambiar a un jugador no permitido:', nextPlayerId);
        return false;
      }

      setActivePlayerId(String(nextPlayerId));
      saveActingPlayerId(String(nextPlayerId));
      return true;
    },
    [switchablePlayers]
  );

  const resolveClaim = useCallback((playerId) => {
    const safeId = String(playerId);
    setClaimedPlayerId(safeId);
    setActivePlayerId(safeId);
    saveClaimedPlayerId(safeId);
    saveActingPlayerId(safeId);
    setClaimResolved(true);
    console.log('resolveClaim: claimed player set ->', safeId);
  }, []);

  // =========================
  // PREDICTIONS del jugador activo
  // =========================
  useEffect(() => {
    if (!authReady || !playersReady || !claimResolved) return;

    let cancelled = false;

    async function loadPredictions() {
      if (!activePlayerId) {
        setPredictions([]);
        setPredictionsReady(true);
        return;
      }

      setPredictionsReady(false);

      try {
        const nextPredictions = await fetchPredictionsByPlayer(activePlayerId);
        if (!cancelled) {
          setPredictions(nextPredictions);
          setPredictionsReady(true);
          console.log(
            'Cosmos predictions loaded for active player:',
            activePlayerId,
            nextPredictions.length
          );
        }
      } catch (error) {
        console.error('Error loading predictions from Cosmos:', error);
        if (!cancelled) {
          setPredictions([]);
          setPredictionsReady(true);
        }
      }
    }

    loadPredictions();

    return () => {
      cancelled = true;
    };
  }, [authReady, playersReady, claimResolved, activePlayerId]);

  // =========================
  // CLAIM STATUS
  // =========================
  const claimStatus = useMemo(() => {
    if (
      !authReady ||
      !playersReady ||
      !resultsReady ||
      !predictionsReady ||
      !matchOverridesReady ||
      !claimResolved
    ) {
      return 'loading';
    }

    if (!claimedPlayerId) return 'unclaimed';
    return 'claimed';
  }, [
    authReady,
    playersReady,
    resultsReady,
    predictionsReady,
    matchOverridesReady,
    claimResolved,
    claimedPlayerId,
  ]);

  // =========================
  // MATCHES MERGED
  // =========================
  const matches = useMemo(() => {
    const overrideMap = new Map(
      matchOverrides.map((item) => [String(item.id), item])
    );

    return MATCHES.map((baseMatch) => {
      const override = overrideMap.get(String(baseMatch.id));

      if (!override) return baseMatch;

      return {
        ...baseMatch,
        ...override,
      };
    });
  }, [matchOverrides]);

  // =========================
  // ADMIN ACTIONS (placeholder)
  // =========================
  const addPlayer = useCallback(
    async (name) => {
      const trimmed = name.trim();
      if (!trimmed) return { success: false, reason: 'empty' };

      const exists = players.some(
        (p) => p.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (exists) return { success: false, reason: 'duplicate' };

      const id = createId();
      const claimCode = generateClaimCode();

      console.warn('addPlayer aún no está conectado a Cosmos backend');
      return { success: true, claimCode, id };
    },
    [players]
  );

  const removePlayer = useCallback(async (playerId) => {
    console.warn('removePlayer aún no está conectado a Cosmos backend', playerId);
    return false;
  }, []);

  // =========================
  // WRITES
  // =========================
  const upsertPrediction = useCallback(
    async (playerId, matchId, predictedA, predictedB) => {
      const safePlayerId = String(playerId);
      const safeMatchId = String(matchId);

      const allowedIds = new Set(switchablePlayers.map((p) => String(p.id)));

      if (!allowedIds.has(safePlayerId)) {
        console.warn('Intento de guardar predicción para jugador no permitido:', safePlayerId);
        return;
      }

      if (safePlayerId !== String(activePlayerId)) {
        console.warn(
          'Intento de guardar predicción para un jugador distinto al activo:',
          safePlayerId,
          activePlayerId
        );
        return;
      }

      const predictionPayload = {
        id: `${safePlayerId}_${safeMatchId}`,
        playerId: safePlayerId,
        matchId: safeMatchId,
        scoreA: Number(predictedA),
        scoreB: Number(predictedB),
        updatedAt: new Date().toISOString(),
      };

      try {
        await savePrediction(predictionPayload);

        const nextPredictions = await fetchPredictionsByPlayer(activePlayerId);
        setPredictions(nextPredictions);
      } catch (err) {
        console.error('Prediction save failed', err);
      }
    },
    [activePlayerId, switchablePlayers]
  );

  const upsertResult = useCallback(async (matchId, scoreA, scoreB) => {
    const safeMatchId = String(matchId);

    const resultPayload = {
      id: safeMatchId,
      matchId: safeMatchId,
      scoreA: Number(scoreA),
      scoreB: Number(scoreB),
      updatedAt: new Date().toISOString(),
    };

    await saveResult(resultPayload);

    const nextResults = await fetchResults();
    setResults(nextResults);
  }, []);

  const clearResult = useCallback(async (matchId) => {
    const safeMatchId = String(matchId);

    await deleteResult(safeMatchId);

    const nextResults = await fetchResults();
    setResults(nextResults);
  }, []);

  const upsertMatchTeams = useCallback(async (matchId, teamA, teamB) => {
    const safeMatchId = String(matchId);

    await saveMatchTeams(safeMatchId, teamA, teamB);

    const nextOverrides = await fetchMatchOverrides();
    setMatchOverrides(nextOverrides);
  }, []);

  const handleResetAll = useCallback(async () => {
    console.warn('resetAllData aún no está conectado a Cosmos backend');
    clearClaimedPlayerId();
    clearActingPlayerId();
    setClaimedPlayerId(null);
    setActivePlayerId('');
    setPredictions([]);
    setClaimResolved(true);
  }, []);

  // =========================
  // MAPS
  // =========================
  const predictionMap = useMemo(() => {
    const map = new Map();

    for (const p of predictions) {
      map.set(predictionKey(p.playerId, p.matchId), {
        playerId: String(p.playerId),
        matchId: String(p.matchId),
        predictedA: Number(p.predictedA ?? p.scoreA),
        predictedB: Number(p.predictedB ?? p.scoreB),
      });
    }

    return map;
  }, [predictions]);

  const resultMap = useMemo(() => {
    const map = new Map();

    results.forEach((result) => {
      map.set(String(result.matchId), {
        matchId: String(result.matchId),
        scoreA: Number(result.scoreA),
        scoreB: Number(result.scoreB),
      });
    });

    return map;
  }, [results]);

  
  const standings = useMemo(() => {
    return calculateStandings(
      players,
      predictions,
      results,
      matches
    ).sort(
      (a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name)
    );
  }, [players, predictions, results, matches]);





  const value = useMemo(
    () => ({
      players,
      predictions,
      results,
      matches,

      uid,
      authReady,
      claimStatus,

      claimedPlayerId,
      claimedPlayer,

      activePlayerId,
      activePlayer,

      switchablePlayers,
      switchActivePlayer,

      resolveClaim,

      predictionMap,
      resultMap,
      standings,

      addPlayer,
      removePlayer,
      upsertPrediction,
      upsertResult,
      clearResult,
      upsertMatchTeams,
      resetAllData: handleResetAll,
    }),
    [
      players,
      predictions,
      results,
      matches,
      uid,
      authReady,
      claimStatus,
      claimedPlayerId,
      claimedPlayer,
      activePlayerId,
      activePlayer,
      switchablePlayers,
      switchActivePlayer,
      resolveClaim,
      predictionMap,
      resultMap,
      standings,
      addPlayer,
      removePlayer,
      upsertPrediction,
      upsertResult,
      clearResult,
      upsertMatchTeams,
      handleResetAll,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }

  return context;
}
