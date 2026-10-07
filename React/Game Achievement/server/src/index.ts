import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import crypto from 'node:crypto';
import { AchievementEvaluator } from './engine/evaluator.js';
import { TelemetryPayload, WebSocketMessage } from './types.js';

const fastify = Fastify({
  logger: true
});

await fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

await fastify.register(websocket);

const evaluator = new AchievementEvaluator();
const connectedSockets = new Set<any>();

function broadcast(msg: WebSocketMessage) {
  const payload = JSON.stringify(msg);
  for (const client of connectedSockets) {
    if (client.readyState === 1) { // 1 = OPEN
      client.send(payload);
    }
  }
}

// REST Routes
fastify.get('/api/health', async () => {
  return { status: 'online', service: 'Game Achievement Engine', timestamp: new Date().toISOString() };
});

fastify.get('/api/achievements', async () => {
  return evaluator.getState();
});

fastify.get('/api/achievements/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  const ach = evaluator.getAchievement(id);
  if (!ach) {
    return reply.status(404).send({ error: 'Achievement not found' });
  }
  return ach;
});

fastify.post('/api/achievements/:id/claim', async (request, reply) => {
  const { id } = request.params as { id: string };
  const body = (request.body as { unlockToken?: string }) || {};
  const result = evaluator.claimReward(id, body.unlockToken);

  if (!result.success) {
    return reply.status(400).send({ error: result.message });
  }

  broadcast({
    type: 'REWARD_CLAIMED',
    data: {
      achievement: result.achievement,
      state: evaluator.getState(),
      message: result.message
    },
    timestamp: new Date().toISOString()
  });

  return result;
});

fastify.post('/api/achievements/:id/pin', async (request, reply) => {
  const { id } = request.params as { id: string };
  const result = evaluator.togglePin(id);
  if (!result.success) {
    return reply.status(400).send({ error: result.message });
  }

  broadcast({
    type: 'PIN_TOGGLED',
    data: {
      achievementId: id,
      pinnedIds: result.pinnedIds,
      state: evaluator.getState()
    },
    timestamp: new Date().toISOString()
  });

  return result;
});

fastify.post('/api/telemetry/event', async (request, reply) => {
  const body = request.body as Partial<TelemetryPayload>;
  if (!body.event) {
    return reply.status(400).send({ error: 'Missing event identifier' });
  }

  const payload: TelemetryPayload = {
    event: body.event,
    metadata: body.metadata || {},
    sequenceNumber: typeof body.sequenceNumber === 'number' ? body.sequenceNumber : Date.now(),
    clientTimestamp: body.clientTimestamp || Date.now(),
    sessionId: body.sessionId || 'default-player-session'
  };

  const evalResult = evaluator.processTelemetry(payload);

  if (evalResult.tamperAlert) {
    broadcast({
      type: 'TAMPER_ALERT',
      data: {
        alert: evalResult.tamperAlert,
        sequenceNumber: payload.sequenceNumber,
        sessionId: payload.sessionId
      },
      timestamp: new Date().toISOString()
    });
    return reply.status(422).send({
      success: false,
      tamperAlert: evalResult.tamperAlert
    });
  }

  if (evalResult.unlockedAchievements.length > 0) {
    for (const ach of evalResult.unlockedAchievements) {
      broadcast({
        type: 'ACHIEVEMENT_UNLOCKED',
        data: {
          achievement: ach,
          receipt: ach.receipt,
          state: evaluator.getState()
        },
        timestamp: new Date().toISOString()
      });
    }
  } else if (evalResult.updatedAchievements.length > 0) {
    broadcast({
      type: 'PROGRESS_UPDATE',
      data: {
        updated: evalResult.updatedAchievements,
        state: evaluator.getState()
      },
      timestamp: new Date().toISOString()
    });
  }

  return {
    success: true,
    unlockedCount: evalResult.unlockedAchievements.length,
    newlyUnlocked: evalResult.unlockedAchievements.map(a => a.id),
    receipts: evalResult.receipts,
    state: evaluator.getState()
  };
});

fastify.post('/api/reset', async () => {
  const state = evaluator.resetState();
  broadcast({
    type: 'SYSTEM_RESET',
    data: { state },
    timestamp: new Date().toISOString()
  });
  return { success: true, message: 'System state reset to factory benchmark', state };
});

fastify.get('/api/passport', async () => {
  const state = evaluator.getState();
  const list = Object.values(state.achievements);
  const unlocked = list.filter(a => a.isUnlocked);
  const topRarity = unlocked.length > 0 ? Math.min(...unlocked.map(a => a.globalRarityPercent)) : 100;
  const verifiedReceipts = unlocked.map(a => a.receipt?.verificationHash).filter(Boolean);

  const digest = crypto.createHmac('sha256', 'trophy-passport-secret')
    .update(`${state.totalPoints}:${unlocked.length}:${topRarity}`)
    .digest('hex').substring(0, 12).toUpperCase();

  return {
    playerId: 'PLAYER_ZERO_9X',
    handle: 'KINETIC_ARCHON',
    rankTitle: 'Grandmaster Completionist',
    totalPoints: state.totalPoints,
    totalAchievements: list.length,
    unlockedCount: unlocked.length,
    completionPercentage: Math.round((unlocked.length / list.length) * 100),
    topRarityPercent: topRarity,
    verifiedReceiptsCount: verifiedReceipts.length,
    passportHash: `PASSPORT-SIG-${digest}`,
    issuedAt: new Date().toISOString()
  };
});

// WebSocket Server Handler
fastify.register(async function (app) {
  app.get('/ws', { websocket: true }, (socket, req) => {
    connectedSockets.add(socket);

    // Send initial snapshot on connect
    socket.send(JSON.stringify({
      type: 'INIT',
      data: { state: evaluator.getState() },
      timestamp: new Date().toISOString()
    }));

    socket.on('message', (raw: Buffer) => {
      try {
        const parsed = JSON.parse(raw.toString());
        if (parsed.type === 'TELEMETRY' && parsed.payload) {
          const evalResult = evaluator.processTelemetry(parsed.payload);
          if (evalResult.tamperAlert) {
            socket.send(JSON.stringify({
              type: 'TAMPER_ALERT',
              data: { alert: evalResult.tamperAlert },
              timestamp: new Date().toISOString()
            }));
          } else {
            broadcast({
              type: evalResult.unlockedAchievements.length > 0 ? 'ACHIEVEMENT_UNLOCKED' : 'PROGRESS_UPDATE',
              data: {
                unlocked: evalResult.unlockedAchievements,
                updated: evalResult.updatedAchievements,
                state: evaluator.getState()
              },
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (err) {
        // invalid message format
      }
    });

    socket.on('close', () => {
      connectedSockets.delete(socket);
    });
  });
});

const PORT = 3001;
try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`[Neo-Vault Fastify Engine] Running on http://localhost:${PORT}`);
  console.log(`[Neo-Vault WebSockets] Listening on ws://localhost:${PORT}/ws`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
