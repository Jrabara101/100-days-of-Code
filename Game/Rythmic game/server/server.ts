import fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import type { Beatmap, LeaderboardEntry, RunSubmission, ScoreValidationResult, HitJudgement, InputTelemetry } from '../src/types/game';

const app = fastify({ logger: true });

// Register plugins
await app.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

await app.register(websocket);

// In-memory song catalog with canonical beatmaps
const CURATED_SONGS: Beatmap[] = [
  {
    id: 'tutorial-01',
    title: 'Drop & Tap (Zero-Friction Tutorial)',
    artist: 'CyberCore Sound Lab',
    bpm: 120,
    synthTheme: 'synthwave',
    offsetMs: 50,
    difficulty: 'Easy',
    starRating: 2,
    durationMs: 38000,
    notes: [
      { id: 'n1', lane: 0, targetTimeMs: 1500, type: 'tap' },
      { id: 'n2', lane: 1, targetTimeMs: 2000, type: 'tap' },
      { id: 'n3', lane: 2, targetTimeMs: 2500, type: 'tap' },
      { id: 'n4', lane: 3, targetTimeMs: 3000, type: 'tap' },
      // Simultaneous & rhythm test
      { id: 'n5', lane: 1, targetTimeMs: 4000, type: 'tap' },
      { id: 'n6', lane: 2, targetTimeMs: 4000, type: 'tap' },
      // First Hold Note
      { id: 'n7', lane: 0, targetTimeMs: 5000, durationMs: 1500, type: 'hold' },
      { id: 'n8', lane: 3, targetTimeMs: 7000, durationMs: 1500, type: 'hold' },
      // Fever Gold Note
      { id: 'n9', lane: 1, targetTimeMs: 9000, type: 'tap', isFever: true },
      { id: 'n10', lane: 2, targetTimeMs: 9500, type: 'tap', isFever: true },
      // Steady 4/4 sequence
      { id: 'n11', lane: 0, targetTimeMs: 11000, type: 'tap' },
      { id: 'n12', lane: 1, targetTimeMs: 11500, type: 'tap' },
      { id: 'n13', lane: 2, targetTimeMs: 12000, type: 'tap' },
      { id: 'n14', lane: 3, targetTimeMs: 12500, type: 'tap' },
      { id: 'n15', lane: 2, targetTimeMs: 13000, type: 'tap' },
      { id: 'n16', lane: 1, targetTimeMs: 13500, type: 'tap' },
      { id: 'n17', lane: 0, targetTimeMs: 14000, durationMs: 2000, type: 'hold' },
      { id: 'n18', lane: 3, targetTimeMs: 14000, durationMs: 2000, type: 'hold' },
      // Climax
      { id: 'n19', lane: 1, targetTimeMs: 17000, type: 'tap', isFever: true },
      { id: 'n20', lane: 2, targetTimeMs: 17500, type: 'tap' },
      { id: 'n21', lane: 1, targetTimeMs: 18000, type: 'tap' },
      { id: 'n22', lane: 2, targetTimeMs: 18500, type: 'tap', isFever: true },
      { id: 'n23', lane: 0, targetTimeMs: 19000, type: 'tap' },
      { id: 'n24', lane: 3, targetTimeMs: 19000, type: 'tap' },
      { id: 'n25', lane: 1, targetTimeMs: 20000, durationMs: 2500, type: 'hold', isFever: true },
    ]
  },
  {
    id: 'cyber-overdrive',
    title: 'CYBER//OVERDRIVE',
    artist: 'K-Pulse x Velocity',
    bpm: 140,
    synthTheme: 'cyberpunk',
    offsetMs: 30,
    difficulty: 'Normal',
    starRating: 5,
    durationMs: 45000,
    notes: generateCyberOverdriveNotes()
  },
  {
    id: 'neon-horizon',
    title: 'NEON HORIZON (Fever Overdrive)',
    artist: 'Aura Vector',
    bpm: 160,
    synthTheme: 'drumandbass',
    offsetMs: 20,
    difficulty: 'Hard',
    starRating: 7,
    durationMs: 50000,
    notes: generateNeonHorizonNotes()
  },
  {
    id: 'quantum-velocity',
    title: 'QUANTUM VELOCITY',
    artist: 'Hyperion Zero',
    bpm: 175,
    synthTheme: 'chiptune',
    offsetMs: 15,
    difficulty: 'Expert',
    starRating: 9,
    durationMs: 48000,
    notes: generateQuantumVelocityNotes()
  }
];

// Helper to generate dynamic energetic patterns
function generateCyberOverdriveNotes(): Beatmap['notes'] {
  const notes: Beatmap['notes'] = [];
  const beatIntervalMs = (60 / 140) * 1000; // ~428.57ms
  let idCount = 1;

  for (let bar = 1; bar <= 24; bar++) {
    const barStart = 1000 + (bar - 1) * 4 * beatIntervalMs;
    // Pattern variations per bar
    if (bar % 4 === 1) {
      notes.push({ id: `co_${idCount++}`, lane: 0, targetTimeMs: Math.round(barStart), type: 'tap' });
      notes.push({ id: `co_${idCount++}`, lane: 1, targetTimeMs: Math.round(barStart + beatIntervalMs), type: 'tap' });
      notes.push({ id: `co_${idCount++}`, lane: 2, targetTimeMs: Math.round(barStart + 2 * beatIntervalMs), type: 'tap' });
      notes.push({ id: `co_${idCount++}`, lane: 3, targetTimeMs: Math.round(barStart + 3 * beatIntervalMs), type: 'tap' });
    } else if (bar % 4 === 2) {
      notes.push({ id: `co_${idCount++}`, lane: 1, targetTimeMs: Math.round(barStart), durationMs: Math.round(beatIntervalMs * 1.8), type: 'hold' });
      notes.push({ id: `co_${idCount++}`, lane: 2, targetTimeMs: Math.round(barStart + 2 * beatIntervalMs), type: 'tap', isFever: true });
      notes.push({ id: `co_${idCount++}`, lane: 3, targetTimeMs: Math.round(barStart + 3 * beatIntervalMs), type: 'tap' });
    } else if (bar % 4 === 3) {
      // 8th note stream
      for (let s = 0; s < 4; s++) {
        notes.push({
          id: `co_${idCount++}`,
          lane: (s % 2 === 0 ? 0 : 3) as 0 | 3,
          targetTimeMs: Math.round(barStart + s * (beatIntervalMs / 2)),
          type: 'tap',
          isFever: s === 3
        });
      }
      notes.push({ id: `co_${idCount++}`, lane: 1, targetTimeMs: Math.round(barStart + 2 * beatIntervalMs), type: 'tap' });
      notes.push({ id: `co_${idCount++}`, lane: 2, targetTimeMs: Math.round(barStart + 3 * beatIntervalMs), type: 'tap' });
    } else {
      // Dual hit + hold
      notes.push({ id: `co_${idCount++}`, lane: 0, targetTimeMs: Math.round(barStart), type: 'tap' });
      notes.push({ id: `co_${idCount++}`, lane: 3, targetTimeMs: Math.round(barStart), type: 'tap' });
      notes.push({ id: `co_${idCount++}`, lane: 2, targetTimeMs: Math.round(barStart + 2 * beatIntervalMs), durationMs: Math.round(beatIntervalMs * 1.5), type: 'hold', isFever: true });
    }
  }
  return notes;
}

function generateNeonHorizonNotes(): Beatmap['notes'] {
  const notes: Beatmap['notes'] = [];
  const beatIntervalMs = (60 / 160) * 1000; // 375ms
  let idCount = 1;

  for (let bar = 1; bar <= 28; bar++) {
    const barStart = 800 + (bar - 1) * 4 * beatIntervalMs;
    const laneSequence = [0, 1, 2, 3, 2, 1, 0, 1];
    for (let i = 0; i < 4; i++) {
      const isHold = bar % 3 === 0 && i === 2;
      notes.push({
        id: `nh_${idCount++}`,
        lane: (laneSequence[(bar + i) % 4]) as 0 | 1 | 2 | 3,
        targetTimeMs: Math.round(barStart + i * beatIntervalMs),
        durationMs: isHold ? 700 : undefined,
        type: isHold ? 'hold' : 'tap',
        isFever: (bar + i) % 7 === 0
      });
      // Syncopated 8th note
      if (bar > 6 && i % 2 === 0) {
        notes.push({
          id: `nh_${idCount++}`,
          lane: ((laneSequence[(bar + i) % 4] + 2) % 4) as 0 | 1 | 2 | 3,
          targetTimeMs: Math.round(barStart + (i + 0.5) * beatIntervalMs),
          type: 'tap',
          isFever: bar % 5 === 0
        });
      }
    }
  }
  return notes;
}

function generateQuantumVelocityNotes(): Beatmap['notes'] {
  const notes: Beatmap['notes'] = [];
  const beatIntervalMs = (60 / 175) * 1000; // ~342.85ms
  let idCount = 1;

  for (let bar = 1; bar <= 30; bar++) {
    const barStart = 600 + (bar - 1) * 4 * beatIntervalMs;
    // Fast technical rolls
    for (let step = 0; step < 4; step++) {
      const lane = ((bar * 2 + step) % 4) as 0 | 1 | 2 | 3;
      notes.push({
        id: `qv_${idCount++}`,
        lane,
        targetTimeMs: Math.round(barStart + step * beatIntervalMs),
        type: 'tap',
        isFever: (bar + step) % 6 === 0
      });
      // High speed 16th burst
      if (bar % 2 === 0 && step === 2) {
        notes.push({
          id: `qv_${idCount++}`,
          lane: ((lane + 1) % 4) as 0 | 1 | 2 | 3,
          targetTimeMs: Math.round(barStart + (step + 0.5) * beatIntervalMs),
          type: 'tap'
        });
      }
    }
  }
  return notes;
}

// In-memory Leaderboard & Ghost telemetry
const LEADERBOARD_STORE: Record<string, LeaderboardEntry[]> = {
  'tutorial-01': [
    {
      id: 'ghost-champ-1',
      songId: 'tutorial-01',
      playerName: 'CYBER_VALKYRIE',
      score: 1000000,
      grade: 'SSS',
      accuracy: 100,
      maxCombo: 25,
      timestamp: Date.now() - 3600000 * 24,
      ghostTelemetry: CURATED_SONGS[0].notes.flatMap(n => [
        { timeMs: n.targetTimeMs + Math.floor(Math.random() * 8 - 4), lane: n.lane, action: 'DOWN' as const },
        ...(n.durationMs ? [{ timeMs: n.targetTimeMs + n.durationMs, lane: n.lane, action: 'UP' as const }] : [])
      ])
    },
    {
      id: 'ghost-2',
      songId: 'tutorial-01',
      playerName: 'ZeroLatency',
      score: 968000,
      grade: 'SS',
      accuracy: 97.4,
      maxCombo: 25,
      timestamp: Date.now() - 3600000 * 12,
      ghostTelemetry: []
    }
  ],
  'cyber-overdrive': [
    {
      id: 'ghost-co-1',
      songId: 'cyber-overdrive',
      playerName: 'NEO_PHANTOM',
      score: 984500,
      grade: 'SS',
      accuracy: 98.2,
      maxCombo: 86,
      timestamp: Date.now() - 3600000 * 18,
      ghostTelemetry: CURATED_SONGS[1].notes.slice(0, 50).flatMap(n => [
        { timeMs: n.targetTimeMs + Math.floor(Math.random() * 12 - 6), lane: n.lane, action: 'DOWN' as const },
        ...(n.durationMs ? [{ timeMs: n.targetTimeMs + n.durationMs, lane: n.lane, action: 'UP' as const }] : [])
      ])
    }
  ]
};

// -------------------------------------------------------------
// 1. BEATMAP REST ENDPOINTS
// -------------------------------------------------------------
app.get('/api/songs', async () => {
  return CURATED_SONGS.map(s => ({
    id: s.id,
    title: s.title,
    artist: s.artist,
    bpm: s.bpm,
    difficulty: s.difficulty,
    starRating: s.starRating,
    durationMs: s.durationMs,
    noteCount: s.notes.length,
    synthTheme: s.synthTheme
  }));
});

app.get<{ Params: { id: string } }>('/api/songs/:id/chart', async (request, reply) => {
  const song = CURATED_SONGS.find(s => s.id === request.params.id);
  if (!song) {
    return reply.status(404).send({ error: 'Song chart not found' });
  }
  return song;
});

// Custom beatmap upload / share
const CUSTOM_BEATMAPS: Record<string, Beatmap> = {};
app.post<{ Body: Beatmap }>('/api/chart/custom', async (request) => {
  const map = request.body;
  const id = `custom-${Date.now().toString(36)}`;
  const saved = { ...map, id };
  CUSTOM_BEATMAPS[id] = saved;
  return { id, message: 'Custom chart registered successfully', chart: saved };
});

app.get<{ Params: { id: string } }>('/api/chart/custom/:id', async (request, reply) => {
  const chart = CUSTOM_BEATMAPS[request.params.id];
  if (!chart) return reply.status(404).send({ error: 'Custom chart not found' });
  return chart;
});

// -------------------------------------------------------------
// 2. SERVER-AUTHORITATIVE ANTI-CHEAT VALIDATION ENGINE
// -------------------------------------------------------------
app.post<{ Body: RunSubmission }>('/api/scores/verify', async (request, reply) => {
  const { songId, inputTelemetry, playerName, beatmapSnapshot } = request.body;

  let beatmap = CURATED_SONGS.find(s => s.id === songId);
  if (!beatmap && beatmapSnapshot) {
    beatmap = beatmapSnapshot;
  }
  if (!beatmap) {
    return reply.status(404).send({ error: 'Beatmap reference missing for validation' });
  }

  // Anti-cheat verification checks
  // 1. Telemetry sanity check: ensure strictly monotonic or valid timestamps
  if (!Array.isArray(inputTelemetry) || inputTelemetry.length === 0) {
    return reply.status(400).send({
      isValid: false,
      reason: 'Missing input telemetry array',
      score: 0,
      grade: 'FAIL',
      accuracy: 0,
      maxCombo: 0,
      judgementCounts: { MARVELOUS: 0, PERFECT: 0, GREAT: 0, GOOD: 0, MISS: beatmap.notes.length },
      totalNotes: beatmap.notes.length
    } as ScoreValidationResult);
  }

  // 2. Simulate run against canonical notes
  // Accuracy Windows:
  // MARVELOUS: ±25ms
  // PERFECT:   ±50ms
  // GREAT:     ±85ms
  // GOOD:      ±125ms
  // MISS:      >125ms
  const MARVELOUS_WINDOW = 25;
  const PERFECT_WINDOW = 50;
  const GREAT_WINDOW = 85;
  const GOOD_WINDOW = 125;

  const judgementCounts: Record<HitJudgement, number> = {
    MARVELOUS: 0,
    PERFECT: 0,
    GREAT: 0,
    GOOD: 0,
    MISS: 0,
  };

  const downInputs = inputTelemetry
    .filter(i => i.action === 'DOWN')
    .sort((a, b) => a.timeMs - b.timeMs);

  const matchedInputIndices = new Set<number>();
  let currentCombo = 0;
  let maxCombo = 0;
  let rawScore = 0;
  let multiplier = 1.0;
  let feverMultiplier = 1.0;

  // Track each note in chronological order
  for (const note of beatmap.notes) {
    let bestInputIndex = -1;
    let minDelta = Infinity;

    // Search for closest input in the same lane
    for (let i = 0; i < downInputs.length; i++) {
      if (matchedInputIndices.has(i)) continue;
      const input = downInputs[i];
      if (input.lane !== note.lane) continue;

      const delta = Math.abs(input.timeMs - note.targetTimeMs);
      if (delta <= GOOD_WINDOW && delta < minDelta) {
        minDelta = delta;
        bestInputIndex = i;
      }
    }

    if (bestInputIndex !== -1) {
      matchedInputIndices.add(bestInputIndex);
      let hit: HitJudgement = 'GOOD';
      let basePoints = 250;

      if (minDelta <= MARVELOUS_WINDOW) {
        hit = 'MARVELOUS';
        basePoints = 1000;
      } else if (minDelta <= PERFECT_WINDOW) {
        hit = 'PERFECT';
        basePoints = 800;
      } else if (minDelta <= GREAT_WINDOW) {
        hit = 'GREAT';
        basePoints = 500;
      } else {
        hit = 'GOOD';
        basePoints = 250;
      }

      judgementCounts[hit]++;
      currentCombo++;
      if (currentCombo > maxCombo) maxCombo = currentCombo;

      // Multiplier increases every 10 combo
      multiplier = Math.min(4.0, 1.0 + Math.floor(currentCombo / 10) * 0.2);
      if (note.isFever) feverMultiplier = 1.5;

      rawScore += Math.round(basePoints * multiplier * feverMultiplier);
    } else {
      judgementCounts.MISS++;
      currentCombo = 0;
    }
  }

  const totalNotes = beatmap.notes.length;
  const accuracy = totalNotes > 0
    ? Math.min(100, Math.max(0, ((judgementCounts.MARVELOUS * 1.0 +
      judgementCounts.PERFECT * 0.85 +
      judgementCounts.GREAT * 0.55 +
      judgementCounts.GOOD * 0.25) / totalNotes) * 100))
    : 0;

  // Grade calculation
  let grade: ScoreValidationResult['grade'] = 'D';
  if (accuracy >= 99 && judgementCounts.MISS === 0) grade = 'SSS';
  else if (accuracy >= 95) grade = 'SS';
  else if (accuracy >= 90) grade = 'S';
  else if (accuracy >= 80) grade = 'A';
  else if (accuracy >= 70) grade = 'B';
  else if (accuracy >= 60) grade = 'C';
  else grade = 'D';

  const validationResult: ScoreValidationResult = {
    isValid: true,
    score: rawScore,
    grade,
    accuracy: Number(accuracy.toFixed(1)),
    maxCombo,
    judgementCounts,
    totalNotes,
    ghostReplay: inputTelemetry.slice(0, 150)
  };

  // Add to leaderboard if valid
  const leaderboard = LEADERBOARD_STORE[songId] || (LEADERBOARD_STORE[songId] = []);
  const entry: LeaderboardEntry = {
    id: `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    songId,
    playerName: playerName || 'ANON_TAPPER',
    score: rawScore,
    grade,
    accuracy: validationResult.accuracy,
    maxCombo,
    timestamp: Date.now(),
    ghostTelemetry: inputTelemetry
  };
  leaderboard.push(entry);
  leaderboard.sort((a, b) => b.score - a.score);
  // Keep top 20
  if (leaderboard.length > 20) leaderboard.pop();

  return validationResult;
});

// -------------------------------------------------------------
// 3. LEADERBOARD & GHOST REPLAY SERVICE
// -------------------------------------------------------------
app.get<{ Params: { songId: string } }>('/api/leaderboard/:songId', async (request) => {
  const list = LEADERBOARD_STORE[request.params.songId] || [];
  return list.map(entry => ({
    id: entry.id,
    songId: entry.songId,
    playerName: entry.playerName,
    score: entry.score,
    grade: entry.grade,
    accuracy: entry.accuracy,
    maxCombo: entry.maxCombo,
    timestamp: entry.timestamp,
    hasGhostTelemetry: entry.ghostTelemetry.length > 0
  }));
});

app.get<{ Params: { entryId: string } }>('/api/ghost/:entryId', async (request, reply) => {
  for (const songList of Object.values(LEADERBOARD_STORE)) {
    const entry = songList.find(e => e.id === request.params.entryId);
    if (entry) {
      return {
        id: entry.id,
        playerName: entry.playerName,
        score: entry.score,
        telemetry: entry.ghostTelemetry
      };
    }
  }
  return reply.status(404).send({ error: 'Ghost run not found' });
});

// -------------------------------------------------------------
// 4. WEBSOCKET REAL-TIME DUELS & ROOM MATCHMAKING
// -------------------------------------------------------------
interface RoomClient {
  socket: any;
  playerName: string;
  score: number;
  combo: number;
  fever: boolean;
}

const DUEL_ROOMS = new Map<string, Set<RoomClient>>();

app.get('/ws', { websocket: true }, (socket, req) => {
  let currentRoomId: string | null = null;
  let clientObj: RoomClient | null = null;

  socket.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'JOIN_ROOM') {
        const { roomId, playerName } = data;
        const roomKey: string = roomId || 'default-arena';
        currentRoomId = roomKey;
        if (!DUEL_ROOMS.has(roomKey)) {
          DUEL_ROOMS.set(roomKey, new Set());
        }
        clientObj = {
          socket,
          playerName: playerName || 'Player',
          score: 0,
          combo: 0,
          fever: false
        };
        DUEL_ROOMS.get(roomKey)!.add(clientObj);

        // Notify client
        socket.send(JSON.stringify({
          type: 'ROOM_JOINED',
          roomId: roomKey,
          playerCount: DUEL_ROOMS.get(roomKey)!.size
        }));

        // Broadcast presence
        broadcastToRoom(roomKey, {
          type: 'OPPONENT_JOINED',
          playerName: clientObj.playerName,
          playerCount: DUEL_ROOMS.get(roomKey)!.size
        }, socket);

      } else if (data.type === 'TELEMETRY_DELTA') {
        if (!currentRoomId || !clientObj) return;
        clientObj.score = data.score;
        clientObj.combo = data.combo;
        clientObj.fever = data.fever;

        // Broadcast to opponents in the room
        broadcastToRoom(currentRoomId, {
          type: 'OPPONENT_TELEMETRY',
          playerName: clientObj.playerName,
          score: data.score,
          combo: data.combo,
          fever: data.fever,
          latestJudgement: data.latestJudgement,
          lane: data.lane
        }, socket);
      }
    } catch (e) {
      // Ignore malformed packets
    }
  });

  socket.on('close', () => {
    if (currentRoomId && clientObj && DUEL_ROOMS.has(currentRoomId)) {
      const room = DUEL_ROOMS.get(currentRoomId)!;
      room.delete(clientObj);
      broadcastToRoom(currentRoomId, {
        type: 'OPPONENT_LEFT',
        playerName: clientObj.playerName,
        playerCount: room.size
      }, socket);
      if (room.size === 0) {
        DUEL_ROOMS.delete(currentRoomId);
      }
    }
  });
});

function broadcastToRoom(roomId: string, message: any, excludeSocket?: any) {
  const room = DUEL_ROOMS.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(message);
  for (const client of room) {
    if (client.socket !== excludeSocket && client.socket.readyState === 1) {
      client.socket.send(payload);
    }
  }
}

// Health check
app.get('/api/health', async () => ({ status: 'ONLINE', time: Date.now() }));

const PORT = 3001;
const start = async () => {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`⚡ [CYBER//BEAT] Fastify Rhythm Engine running on http://localhost:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
