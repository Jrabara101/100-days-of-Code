import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import { getDailySeed, stringToSeed } from './prng.js';
import { generateSectorWaves } from './waveDirector.js';
import { verifyFlightTelemetry, RunSubmission } from './antiCheat.js';
import { db, LeaderboardEntry } from './database.js';

const fastify = Fastify({
  logger: {
    level: 'info',
  },
});

await fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
});

await fastify.register(fastifyWebsocket);

// Connected WebSocket clients set
const connectedSockets = new Set<any>();

function broadcast(data: object) {
  const payload = JSON.stringify(data);
  for (const client of connectedSockets) {
    if (client.readyState === 1) { // OPEN
      client.send(payload);
    }
  }
}

// WebSocket Route
fastify.get('/ws', { websocket: true }, (connection: any, req: any) => {
  const socket = connection.socket || connection;
  connectedSockets.add(socket);
  fastify.log.info('WebSocket client connected. Total clients: ' + connectedSockets.size);

  socket.send(
    JSON.stringify({
      type: 'INIT',
      message: 'COMM-LINK ESTABLISHED: Tactical Sector Relay Online.',
      activePilots: connectedSockets.size + 14, // Simulated active sector pilots
      timestamp: Date.now(),
    })
  );

  socket.on('message', (message: any) => {
    try {
      const parsed = JSON.parse(message.toString());
      if (parsed.type === 'GHOST_TELEMETRY') {
        // Relay ghost position to other pilots
        broadcast({
          type: 'GHOST_UPDATE',
          pilot: parsed.callsign,
          x: parsed.x,
          y: parsed.y,
          wave: parsed.wave,
        });
      }
    } catch (e) {
      // ignore
    }
  });

  socket.on('close', () => {
    connectedSockets.delete(socket);
  });
});

// REST Endpoints

// 1. Daily Sector Configuration
fastify.get('/api/sectors/daily', async (request, reply) => {
  const daily = getDailySeed();
  const sectorData = generateSectorWaves(daily.seed, 10);
  return {
    ...daily,
    ...sectorData,
  };
});

// 2. Specific Sector Waves
fastify.get('/api/sectors/:id/waves', async (request, reply) => {
  const { id } = request.params as { id: string };
  const seed = isNaN(Number(id)) ? stringToSeed(id) : Number(id);
  const sector = generateSectorWaves(seed, 10);
  return sector;
});

// 3. Flight Telemetry & Anti-Cheat Validation
fastify.post('/api/telemetry/verify-run', async (request, reply) => {
  const submission = request.body as RunSubmission;
  if (!submission || typeof submission.score !== 'number') {
    return reply.status(400).send({ error: 'Malformed telemetry packet.' });
  }

  const result = verifyFlightTelemetry(submission);
  return result;
});

// 4. Get Global Leaderboard
fastify.get('/api/leaderboard', async (request, reply) => {
  const { sectorId, limit } = request.query as { sectorId?: string; limit?: string };
  const entries = db.getLeaderboard(sectorId, limit ? parseInt(limit, 10) : 25);
  return {
    success: true,
    entries,
  };
});

// 5. Submit High Score
fastify.post('/api/leaderboard', async (request, reply) => {
  const body = request.body as {
    callsign: string;
    sectorId: string;
    score: number;
    waveReached: number;
    grazes: number;
    accuracy: number;
    synergies: string[];
    shipId: string;
    runHash: string;
    verified: boolean;
  };

  if (!body.callsign || !body.score) {
    return reply.status(400).send({ error: 'Missing mandatory pilot submission fields.' });
  }

  const entry = db.addScore({
    callsign: body.callsign.trim().toUpperCase().substring(0, 16),
    sectorId: body.sectorId || 'daily',
    score: body.score,
    waveReached: body.waveReached || 1,
    grazes: body.grazes || 0,
    accuracy: body.accuracy || 100,
    synergies: body.synergies || [],
    shipId: body.shipId || 'interceptor',
    verified: Boolean(body.verified),
    runHash: body.runHash || 'UNVERIFIED',
  });

  // Broadcast to live ticker
  broadcast({
    type: 'NEW_RECORD',
    callsign: entry.callsign,
    score: entry.score,
    wave: entry.waveReached,
    verified: entry.verified,
    timestamp: Date.now(),
  });

  return {
    success: true,
    entry,
  };
});

// Periodic simulated comms/telemetry broadcast
setInterval(() => {
  if (connectedSockets.size > 0) {
    const callsigns = ['GHOST-09', 'VALKYRIE-4', 'VIPER-LEADER', 'COMMANDER NOVA', 'SHADOW-WING'];
    const randomCallsign = callsigns[Math.floor(Math.random() * callsigns.length)];
    const messages = [
      `${randomCallsign} cleared Sector Anomaly at Wave 07`,
      `Incoming asteroid storm detected across Sector Zenith`,
      `Overcharge resonance pulse recorded: +350% multiplier`,
      `Titan Dreadnought intercepted by Allied Strike Group`,
    ];
    broadcast({
      type: 'TICKER',
      message: messages[Math.floor(Math.random() * messages.length)],
      timestamp: Date.now(),
    });
  }
}, 15000);

const PORT = Number(process.env.PORT) || 3001;
const start = async () => {
  try {
    console.log(fastify.printRoutes());
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 [SYS.AEROSTRIKE Server] Game Server & WebSockets listening on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
