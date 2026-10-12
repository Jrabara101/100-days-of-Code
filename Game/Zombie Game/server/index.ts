import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { getDailySeedString, generateWaveConfig } from './seedDirector.js';
import { verifyCombatTelemetry } from './antiCheat.js';
import { getLeaderboard, saveLeaderboardEntry, initDatabase } from './db.js';
import { RunSubmission } from '../src/types/game.js';

const fastify = Fastify({
  logger: true,
});

// Initialize SQLite database
initDatabase();

// Register CORS
await fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

// Register WebSockets
await fastify.register(websocket);

// Connected WebSocket clients set for Spectator / Squad Relay
const activeClients = new Set<any>();

fastify.register(async function (fastifyInstance) {
  fastifyInstance.get('/ws', { websocket: true }, (socket, req) => {
    activeClients.add(socket);
    fastify.log.info(`WebSocket client connected. Active connections: ${activeClients.size}`);

    socket.on('message', (messageRaw: any) => {
      try {
        const messageStr = messageRaw.toString();
        const data = JSON.parse(messageStr);

        // Broadcast player telemetry / co-op / alert updates to other connected peers
        for (const client of activeClients) {
          if (client !== socket && client.readyState === 1) { // 1 = OPEN
            client.send(JSON.stringify(data));
          }
        }
      } catch (err) {
        // Ignore malformed payloads
      }
    });

    socket.on('close', () => {
      activeClients.delete(socket);
      fastify.log.info(`WebSocket client disconnected. Remaining: ${activeClients.size}`);
    });
  });
});

// --- REST Endpoints ---

// Daily Seed and Waves
fastify.get('/api/waves/daily', async (request, reply) => {
  const seed = getDailySeedString();
  const previewWaves = [1, 2, 3, 4, 5].map((w) => generateWaveConfig(seed, w));

  return {
    seed,
    protocol: 'DAILY_QUARANTINE_PROTOCOL',
    utcDate: new Date().toISOString().slice(0, 10),
    modifiers: [
      'Facility Power Grid Unstable (Periodic Blackout)',
      'Scrap Forge Calibration Active',
      'High-Density Mutant Biomass',
    ],
    previewWaves,
  };
});

// Custom or Specific Seed Wave Config
fastify.get<{ Params: { seed: string }; Querystring: { wave?: string } }>(
  '/api/waves/seed/:seed',
  async (request, reply) => {
    const { seed } = request.params;
    const waveNum = parseInt(request.query.wave || '1', 10);
    const waveConfig = generateWaveConfig(seed, waveNum);
    return waveConfig;
  }
);

// Global Quarantine Leaderboard
fastify.get<{ Querystring: { seed?: string; limit?: string } }>(
  '/api/leaderboard',
  async (request, reply) => {
    const seed = request.query.seed;
    const limit = request.query.limit ? parseInt(request.query.limit, 10) : 25;
    const entries = getLeaderboard(seed, limit);
    return {
      count: entries.length,
      entries,
    };
  }
);

// Telemetry & Run Submission with Anti-Cheat
fastify.post<{ Body: RunSubmission }>('/api/telemetry/submit', async (request, reply) => {
  const run = request.body;
  if (!run || !run.runSeed || typeof run.finalScore !== 'number') {
    return reply.status(400).send({ error: 'Invalid run submission payload' });
  }

  // Authoritative Anti-Cheat Verification
  const verification = verifyCombatTelemetry(run);

  // Persist into SQLite
  const savedEntry = saveLeaderboardEntry(run, verification.isValid);

  return {
    success: true,
    verified: verification.isValid,
    verifiedScore: verification.verifiedScore,
    reason: verification.reason || 'Telemetry ledger authenticated and approved.',
    entry: savedEntry,
  };
});

// Health check
fastify.get('/api/health', async () => {
  return {
    status: 'ONLINE',
    service: 'QUARANTINE_COMMAND_TELEMETRY',
    activeSpectators: activeClients.size,
    timestamp: Date.now(),
  };
});

// Start Server
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '127.0.0.1';

try {
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`☣️ Quarantine Fastify Server running on http://${HOST}:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
