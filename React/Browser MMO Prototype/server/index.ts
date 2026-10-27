import fastify from 'fastify';
import cors from '@fastify/cors';
import websocketPlugin from '@fastify/websocket';
import { WorldSimulation } from './world/simulation.js';
import { ITEM_TEMPLATES } from './world/itemLedger.js';
import type { ClientPacket } from './world/types.js';

const PORT = parseInt(process.env.PORT || '3009', 10);
const HOST = process.env.HOST || '0.0.0.0';

const app = fastify({ logger: { level: 'info' } });

// Register CORS
await app.register(cors, {
  origin: true,
  credentials: true,
});

// Register WebSockets
await app.register(websocketPlugin, {
  options: {
    maxPayload: 1048576, // 1MB
  },
});

// Shard Manager: Shard ID -> WorldSimulation instance
const shards: Map<string, WorldSimulation> = new Map();

function getOrCreateShard(shardId: string): WorldSimulation {
  const normalizedId = (shardId || 'REALM').toUpperCase().trim().substring(0, 8);
  let shard = shards.get(normalizedId);
  if (!shard) {
    app.log.info(`Spawning new world shard: ${normalizedId}`);
    shard = new WorldSimulation(normalizedId);
    shards.set(normalizedId, shard);
  }
  return shard;
}

// Pre-warm default shards
getOrCreateShard('REALM');
getOrCreateShard('EDEN');
getOrCreateShard('NOVA');

// REST API Endpoints
app.get('/api/health', async () => {
  return {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now(),
  };
});

app.get('/api/shards', async () => {
  const result = [];
  for (const [id, sim] of shards.entries()) {
    result.push({
      id,
      playerCount: sim.players.size,
      botCount: sim.bots.size,
      lootCount: Object.keys(sim.itemLedger.getGroundLoot()).length,
    });
  }
  return { shards: result };
});

app.get('/api/templates', async () => {
  return { templates: ITEM_TEMPLATES };
});

// WebSocket Handler
app.register(async function (fastifyInstance) {
  fastifyInstance.get('/ws', { websocket: true }, (socket, req) => {
    // Parse query params: ?shard=REALM&name=Hero&color=#38BDF8
    const query = req.query as Record<string, string> | undefined;
    const shardId = (query?.shard || 'REALM').toUpperCase();
    const rawName = query?.name || '';
    const avatarColor = query?.color || undefined;

    const simulation = getOrCreateShard(shardId);
    let playerId: string | null = null;
    let clientRecord: any = null;

    app.log.info(`New WebSocket client connected for shard [${shardId}]`);

    // Handle incoming messages
    socket.on('message', (rawData: Buffer | string) => {
      try {
        const text = typeof rawData === 'string' ? rawData : rawData.toString('utf8');
        const packet = JSON.parse(text) as ClientPacket;

        if (packet.type === 'JOIN') {
          const joinShardId = (packet.shardId || shardId).toUpperCase();
          const targetSim = getOrCreateShard(joinShardId);

          const { player, client } = targetSim.handleJoin(
            socket,
            packet.username || rawName,
            packet.title || 'Wanderer',
            packet.avatarColor || avatarColor
          );
          playerId = player.id;
          clientRecord = client;
          return;
        }

        if (clientRecord) {
          simulation.handlePacket(clientRecord, packet);
        }
      } catch (err) {
        app.log.error(err, 'Failed to parse incoming client packet');
      }
    });

    // Auto-join if name provided in query and client didn't send JOIN immediately
    if (rawName && !playerId) {
      const { player, client } = simulation.handleJoin(socket, rawName, 'Wanderer', avatarColor);
      playerId = player.id;
      clientRecord = client;
    }

    // Handle disconnect
    socket.on('close', () => {
      if (playerId) {
        app.log.info(`Player ${playerId} disconnected from shard ${simulation.shardId}`);
        simulation.handleLeave(playerId);
      }
    });

    socket.on('error', (err) => {
      app.log.warn(err, `WebSocket error for player ${playerId}`);
      if (playerId) {
        simulation.handleLeave(playerId);
      }
    });
  });
});

// Start Server
try {
  await app.listen({ port: PORT, host: HOST });
  console.log(`⚔️ Aetherial Frontier MMO Server listening on http://${HOST}:${PORT}`);
  console.log(`📡 WebSocket endpoint active at ws://${HOST}:${PORT}/ws`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
