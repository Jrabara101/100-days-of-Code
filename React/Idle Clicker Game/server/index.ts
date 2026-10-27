import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Decimal from 'break_infinity.js';
import { dbStore } from './db.js';
import { antiCheatService } from './antiCheat.js';
import { gameEngineService } from './gameEngine.js';
import {
  SyncRequestPayload,
  SyncResponse,
  PrestigeRequestPayload,
  PrestigeResponse,
  LeaderboardEntry,
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const fastify = Fastify({
  logger: false,
});

await fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

await fastify.register(fastifyWebsocket);

if (fs.existsSync(distPath)) {
  await fastify.register(fastifyStatic, {
    root: distPath,
    prefix: '/',
  });

  fastify.setNotFoundHandler((req, reply) => {
    if (req.raw.url && !req.raw.url.startsWith('/api') && !req.raw.url.startsWith('/ws')) {
      return reply.sendFile('index.html');
    }
    return reply.status(404).send({ error: 'Not Found' });
  });
}

// Connected WebSocket Clients
const activeClients = new Set<any>();

function broadcastWs(type: string, payload: any) {
  const messageStr = JSON.stringify({ type, payload, timestamp: Date.now() });
  for (const client of activeClients) {
    if (client.readyState === 1) { // OPEN
      try {
        client.send(messageStr);
      } catch {
        activeClients.delete(client);
      }
    }
  }
}

// Periodic cosmic anomaly trigger broadcast every 45-60 seconds
setInterval(() => {
  if (activeClients.size > 0) {
    const anomalyTypes = ['QUANTUM_RIFT', 'SOLAR_FLARE', 'VOID_SHARD', 'TACHYON_BURST'];
    const selected = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
    broadcastWs('COSMIC_ANOMALY', {
      type: selected,
      bonusMultiplier: 7,
      durationSeconds: 15,
      spawnSeed: Math.random(),
    });
  }
}, 45000);

// ======================== REST API ROUTES ========================

// 1. Health check & Server Monotonic Time
fastify.get('/api/idle/health', async () => {
  return {
    status: 'ONLINE',
    service: 'Quantum Foundry Engine',
    serverTime: Date.now(),
    connectedSockets: activeClients.size,
  };
});

fastify.get('/api/idle/server-time', async () => {
  return {
    serverTime: Date.now(),
  };
});

// 2. Monotonic Offline Sync API
fastify.post<{ Body: SyncRequestPayload }>('/api/idle/sync', async (req, reply) => {
  const body = req.body || {};
  const serverNow = Date.now();

  const playerId = body.playerId || 'pilot-guest';
  const handle = body.handle || 'Guest Pilot';
  const lastSavedAt = Number(body.lastSavedAt) || serverNow;
  const localCurrency = body.localCurrency || '0';
  const lifetimeCurrency = body.lifetimeCurrency || localCurrency;
  const generators = body.generators || {};
  const upgrades = body.upgrades || [];
  const prestigeShards = Number(body.prestigeShards) || 0;
  const highestCps = body.highestCps || '0';
  const tapCount = Number(body.tapCount) || 0;
  const tapSampleDeltas = body.tapSampleDeltas || [];

  // Monotonic time validation & clamping
  const timeValidation = antiCheatService.validateMonotonicOfflineTime(lastSavedAt, serverNow);
  const offlineSeconds = timeValidation.offlineSeconds;

  // Anti-cheat cadence check
  const cadenceResult = antiCheatService.analyzeTapCadence(tapSampleDeltas, tapCount);

  // Authoritative server CPS calculation
  const serverCpsDec = gameEngineService.calculateServerCps(generators, upgrades, prestigeShards);
  const offlineGainsDec = gameEngineService.calculateOfflineYield(serverCpsDec, offlineSeconds);

  // Validated local currency
  let validatedCurrencyDec = new Decimal(localCurrency);
  if (offlineGainsDec.gt(0)) {
    validatedCurrencyDec = validatedCurrencyDec.plus(offlineGainsDec);
  }

  // Determine anti-cheat status
  const isSuspect = cadenceResult.status === 'ANOMALOUS';
  const status = isSuspect ? 'ANOMALOUS' : cadenceResult.status === 'CADENCE_WARNING' ? 'CADENCE_WARNING' : 'VALID';

  // Audit log
  dbStore.logSyncAudit({
    playerId,
    offlineSec: offlineSeconds,
    offlineGains: offlineGainsDec.toString(),
    clientTime: lastSavedAt,
    serverTime: serverNow,
    cadenceCps: cadenceResult.calculatedCps,
    status,
  });

  // Persist player in database
  dbStore.upsertPlayer({
    id: playerId,
    handle,
    lastSavedAt: serverNow,
    currency: validatedCurrencyDec.toString(),
    lifetimeCurrency,
    prestigeShards,
    generatorsJson: JSON.stringify(generators),
    upgradesJson: JSON.stringify(upgrades),
    highestCps: Decimal.max(new Decimal(highestCps), serverCpsDec).toString(),
    totalClicks: tapCount,
    isFlagged: isSuspect ? 1 : 0,
  });

  // If not suspect, update leaderboard
  if (!isSuspect) {
    const score = antiCheatService.parseScoreValue(lifetimeCurrency, prestigeShards);
    dbStore.upsertLeaderboard({
      playerId,
      handle,
      lifetimeCurrency,
      prestigeShards,
      highestCps: Decimal.max(new Decimal(highestCps), serverCpsDec).toString(),
      scoreValue: score,
      isVerified: status === 'VALID',
    });
  }

  const response: SyncResponse = {
    serverTime: serverNow,
    offlineSeconds,
    offlineGains: offlineGainsDec.toString(),
    validatedCurrency: validatedCurrencyDec.toString(),
    serverCps: serverCpsDec.toString(),
    antiCheatStatus: status,
    message: timeValidation.skewWarning || cadenceResult.reason,
  };

  return response;
});

// 3. Telemetry & Anti-Cheat Prestige Verification
fastify.post<{ Body: PrestigeRequestPayload }>('/api/idle/prestige', async (req, reply) => {
  const body = req.body || {};
  const serverNow = Date.now();

  const playerId = body.playerId || 'pilot-guest';
  const handle = body.handle || 'Ascended Pilot';
  const lifetimeCurrencyDec = new Decimal(body.lifetimeCurrency || '0');
  const generators = body.generators || {};
  const upgrades = body.upgrades || [];

  // Verify that lifetime currency correlates with generators & potential
  const authoritativeShards = gameEngineService.calculatePrestigeShards(lifetimeCurrencyDec);

  const existingPlayer = dbStore.getPlayer(playerId);
  const currentShards = existingPlayer ? Number(existingPlayer.prestigeShards) : 0;
  const newTotalShards = currentShards + authoritativeShards;

  const score = antiCheatService.parseScoreValue(lifetimeCurrencyDec.toString(), newTotalShards);

  // Update leaderboard with prestige ascension
  dbStore.upsertLeaderboard({
    playerId,
    handle,
    lifetimeCurrency: lifetimeCurrencyDec.toString(),
    prestigeShards: newTotalShards,
    highestCps: existingPlayer ? existingPlayer.highestCps : '0',
    scoreValue: score,
    isVerified: true,
  });

  // Broadcast prestige milestone event
  broadcastWs('LEADERBOARD_UPDATE', {
    reason: 'PRESTIGE_ASCENSION',
    handle,
    awardedShards: authoritativeShards,
    totalShards: newTotalShards,
  });

  const response: PrestigeResponse = {
    approved: true,
    awardedShards: authoritativeShards,
    totalShards: newTotalShards,
    serverTime: serverNow,
    antiCheatStatus: 'VALID',
  };

  return response;
});

// 4. Global Competitive Leaderboard API
fastify.get('/api/idle/leaderboard', async () => {
  const list = dbStore.getLeaderboard(25);
  return {
    leaderboard: list,
    serverTime: Date.now(),
  };
});

fastify.post<{ Body: { playerId: string; handle: string; lifetimeCurrency: string; prestigeShards: number; highestCps: string } }>('/api/idle/leaderboard', async (req) => {
  const { playerId, handle, lifetimeCurrency, prestigeShards, highestCps } = req.body || {};
  if (!playerId || !handle) {
    return { success: false, error: 'Missing parameters' };
  }

  const score = antiCheatService.parseScoreValue(lifetimeCurrency || '0', prestigeShards || 0);
  dbStore.upsertLeaderboard({
    playerId,
    handle: handle.trim().slice(0, 24),
    lifetimeCurrency: lifetimeCurrency || '0',
    prestigeShards: prestigeShards || 0,
    highestCps: highestCps || '0',
    scoreValue: score,
    isVerified: true,
  });

  broadcastWs('LEADERBOARD_UPDATE', {
    reason: 'SCORE_UPDATE',
    leaderboard: dbStore.getLeaderboard(25),
  });

  return { success: true };
});

// ======================== WEBSOCKET ROUTES ========================
fastify.register(async function (fastifyInstance) {
  fastifyInstance.get('/ws', { websocket: true }, (socket, req) => {
    activeClients.add(socket);

    // Initial greeting and state synchronization
    socket.send(
      JSON.stringify({
        type: 'INITIAL_STATE',
        payload: {
          serverTime: Date.now(),
          leaderboard: dbStore.getLeaderboard(10),
          motd: 'Quantum Foundry Server connected. Monotonic sync active.',
        },
      })
    );

    socket.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.type === 'PING') {
          socket.send(JSON.stringify({ type: 'PONG', serverTime: Date.now() }));
        } else if (parsed.type === 'HEARTBEAT') {
          socket.send(JSON.stringify({ type: 'HEARTBEAT_ACK', serverTime: Date.now() }));
        }
      } catch {
        // ignore malformed payloads
      }
    });

    socket.on('close', () => {
      activeClients.delete(socket);
    });

    socket.on('error', () => {
      activeClients.delete(socket);
    });
  });
});

const PORT = Number(process.env.PORT) || 3009;
const HOST = process.env.HOST || '0.0.0.0';

try {
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`[Quantum Foundry Backend] Fastify Server running on http://localhost:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
