import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { getLeaderboardBySeed, getGhostById, insertRunRecord } from './db';
import { validateRunTelemetry } from './antiCheat';
import { RunSubmissionPayload } from '../src/types/game';

const fastify = Fastify({ logger: true });

// Enable CORS
fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST'],
});

// Enable WebSockets
fastify.register(websocket);

// Connected WebSocket clients set
const clients = new Set<any>();

fastify.register(async function (fastifyInstance) {
  fastifyInstance.get('/ws', { websocket: true }, (connection: any, req) => {
    const socket = connection.socket || connection;
    clients.add(socket);

    socket.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'PING_DISTANCE') {
          // Check milestone broadcasts (e.g. 500m, 1000m, 2000m)
          const dist = Math.floor(data.distance);
          if (dist > 0 && dist % 500 < 25) {
            const broadcastPayload = JSON.stringify({
              type: 'MILESTONE_ALERT',
              playerHandle: data.playerHandle || 'Runner',
              distance: dist,
              timestamp: Date.now(),
            });
            for (const client of clients) {
              if (client.readyState === 1) {
                client.send(broadcastPayload);
              }
            }
          }
        }
      } catch (err) {
        // Ignore parse error
      }
    });

    socket.on('close', () => {
      clients.delete(socket);
    });
  });
});

// GET /api/runs/daily
fastify.get('/api/runs/daily', async (req, reply) => {
  const today = new Date().toISOString().slice(0, 10);
  const seed = `DAILY-${today}`;
  const leaderboard = getLeaderboardBySeed(seed, 1);
  const topDistance = leaderboard.length > 0 ? leaderboard[0].distance : 0;

  return {
    date: today,
    seed,
    modifierName: 'Slipstream Resonance',
    modifierDescription: 'Near-misses generate +25% Overdrive energy today!',
    topDistance,
    shareUrl: `/?seed=${seed}`,
  };
});

// GET /api/leaderboard
fastify.get<{ Querystring: { seed?: string; limit?: string } }>('/api/leaderboard', async (req, reply) => {
  const seed = req.query.seed || `DAILY-${new Date().toISOString().slice(0, 10)}`;
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
  const entries = getLeaderboardBySeed(seed, limit);
  return { seed, leaderboard: entries };
});

// GET /api/ghosts/:id
fastify.get<{ Params: { id: string } }>('/api/ghosts/:id', async (req, reply) => {
  const ghost = getGhostById(req.params.id);
  if (!ghost) {
    return reply.status(404).send({ error: 'Ghost run not found' });
  }
  return ghost;
});

// POST /api/runs/submit (Server-Authoritative Anti-Cheat Verification)
fastify.post<{ Body: RunSubmissionPayload }>('/api/runs/submit', async (req, reply) => {
  const payload = req.body;

  if (!payload || !payload.seed || typeof payload.distance !== 'number') {
    return reply.status(400).send({ error: 'Malformed submission payload' });
  }

  // 1. Authoritative Anti-Cheat validation
  const validation = validateRunTelemetry(payload);
  if (!validation.valid) {
    fastify.log.warn(`Cheat rejected: ${validation.reason} from ${payload.playerHandle}`);
    return reply.status(403).send({
      verified: false,
      error: 'Telemetry validation failed: ' + validation.reason,
    });
  }

  // 2. Commit record to SQLite database
  const runId = 'run_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
  const handle = (payload.playerHandle || 'Runner').trim().slice(0, 16) || 'Runner';

  insertRunRecord({
    id: runId,
    playerHandle: handle,
    seed: payload.seed,
    distance: payload.distance,
    score: payload.score,
    maxCombo: 1.0,
    nearMissCount: payload.nearMissCount || 0,
    coinsCollected: payload.coinsCollected || 0,
    durationMs: payload.durationMs || 0,
    telemetryJson: JSON.stringify(payload.inputTelemetry || []),
  });

  // 3. Broadcast milestone announcement to live WebSocket clients
  const announcement = JSON.stringify({
    type: 'NEW_HIGH_SCORE',
    playerHandle: handle,
    distance: payload.distance,
    score: payload.score,
  });
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(announcement);
    }
  }

  return {
    verified: true,
    id: runId,
    rank: 1, // rank calculation
    message: 'Run verified and posted to global leaderboard',
  };
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3002', 10);
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🎮 Game Server running at http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
