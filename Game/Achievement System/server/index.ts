import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import { WebSocket } from 'ws';
import { dagEvaluator } from './evaluator';
import { TelemetryEvent } from './types';

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

const fastify = Fastify({
  logger: true,
});

// Register Plugins
await fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
});

fastify.addContentTypeParser(['application/x-www-form-urlencoded', 'text/plain'], { parseAs: 'string' }, (req, body: any, defaultDoneHandler) => {
  try {
    const str = typeof body === 'string' ? body : body ? body.toString() : '';
    defaultDoneHandler(null, str ? JSON.parse(str) : {});
  } catch (err) {
    defaultDoneHandler(null, {});
  }
});

await fastify.register(fastifyWebsocket);

// Store active WebSocket connections
const clients = new Set<WebSocket>();

function broadcast(data: any) {
  const payload = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// REST Endpoints
fastify.get('/api/health', async () => {
  return { status: 'healthy', timestamp: new Date().toISOString(), engine: 'Voxel DAG Evaluator v4.2' };
});

fastify.get('/api/achievements', async () => {
  const nodes = dagEvaluator.getAchievements();
  return {
    nodes,
    totalPoints: dagEvaluator.getTotalPoints(),
    unlockedCount: dagEvaluator.getUnlockedCount(),
    totalCount: Object.keys(nodes).length,
  };
});

fastify.get('/api/achievements/:id', async (req, reply) => {
  const { id } = req.params as { id: string };
  const node = dagEvaluator.getAchievement(id);
  if (!node) {
    return reply.status(404).send({ error: 'Achievement not found' });
  }
  return node;
});

// Telemetry Event Ingestion Pipeline
fastify.post('/api/telemetry/event', async (req, reply) => {
  const body = req.body as TelemetryEvent;
  if (!body || !body.event) {
    return reply.status(400).send({ error: 'Invalid telemetry payload: "event" is required.' });
  }

  const result = dagEvaluator.evaluateTelemetry(body);

  if (result.status === 'UNLOCKED') {
    broadcast({
      type: 'ACHIEVEMENT_UNLOCKED',
      achievementId: result.node?.id,
      achievement: result.node,
      node: result.node,
      token: result.token,
      pulsePath: result.pulsePath,
      message: result.message,
      totalPoints: result.totalPoints,
      unlockedCount: result.unlockedCount,
    });
  } else if (result.status === 'PROGRESS') {
    broadcast({
      type: 'ACHIEVEMENT_PROGRESS',
      achievementId: result.node?.id,
      node: result.node,
      message: result.message,
    });
  }

  return result;
});

// Direct Force Unlock (for testing / admin / debugging)
fastify.post('/api/achievements/unlock/:id', async (req, reply) => {
  const { id } = req.params as { id: string };
  const result = dagEvaluator.forceUnlock(id);

  if (result.status === 'UNLOCKED') {
    broadcast({
      type: 'ACHIEVEMENT_UNLOCKED',
      achievementId: result.node?.id,
      achievement: result.node,
      node: result.node,
      token: result.token,
      pulsePath: result.pulsePath,
      message: result.message,
      totalPoints: result.totalPoints,
      unlockedCount: result.unlockedCount,
    });
  }

  return result;
});

// Reset matrix state
fastify.post('/api/reset', async () => {
  dagEvaluator.resetState();
  const nodes = dagEvaluator.getAchievements();
  broadcast({
    type: 'INIT_STATE',
    nodes,
    totalPoints: dagEvaluator.getTotalPoints(),
    unlockedCount: dagEvaluator.getUnlockedCount(),
  });
  return { message: 'Matrix state restored to baseline.' };
});

// WebSocket Handler
fastify.register(async function (fastifyInstance) {
  fastifyInstance.get('/ws', { websocket: true }, (connection: any, req) => {
    const socket: WebSocket = connection.socket || connection;
    clients.add(socket);
    fastify.log.info(`WebSocket Client connected. Total active: ${clients.size}`);

    // Send initial snapshot
    socket.send(
      JSON.stringify({
        type: 'INIT_STATE',
        nodes: dagEvaluator.getAchievements(),
        totalPoints: dagEvaluator.getTotalPoints(),
        unlockedCount: dagEvaluator.getUnlockedCount(),
      })
    );

    socket.on('message', (messageRaw: any) => {
      try {
        const msg = JSON.parse(messageRaw.toString());
        if (msg.type === 'TELEMETRY') {
          const result = dagEvaluator.evaluateTelemetry(msg.payload || msg);
          if (result.status === 'UNLOCKED') {
            broadcast({
              type: 'ACHIEVEMENT_UNLOCKED',
              achievementId: result.node?.id,
              achievement: result.node,
              node: result.node,
              token: result.token,
              pulsePath: result.pulsePath,
              message: result.message,
              totalPoints: result.totalPoints,
              unlockedCount: result.unlockedCount,
            });
          } else if (result.status === 'PROGRESS') {
            broadcast({
              type: 'ACHIEVEMENT_PROGRESS',
              achievementId: result.node?.id,
              node: result.node,
              message: result.message,
            });
          }
          socket.send(JSON.stringify({ type: 'TELEMETRY_ACK', result }));
        }
      } catch (err) {
        fastify.log.error(err);
      }
    });

    socket.on('close', () => {
      clients.delete(socket);
      fastify.log.info(`WebSocket Client disconnected. Remaining: ${clients.size}`);
    });
  });
});

// Start Fastify Server
try {
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`\n🚀 [Fastify] Authoritative Achievement DAG Engine running on http://localhost:${PORT}`);
  console.log(`📡 [Fastify] WebSocket endpoint active at ws://localhost:${PORT}/ws\n`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
