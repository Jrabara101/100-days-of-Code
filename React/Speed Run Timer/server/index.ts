import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import { WebSocket } from 'ws';
import { RoomManager } from './rooms.js';
import { getMonotonicTimeMs, getAuthoritativeUtcMs } from './clockSync.js';
import { DEFAULT_TEMPLATES } from './templates.js';
import { ClientMessage } from './types.js';

import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const fastify = Fastify({
  logger: true,
});

const roomManager = new RoomManager();

// Register plugins
await fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

await fastify.register(fastifyWebsocket);

// Serve built frontend assets
try {
  await fastify.register(fastifyStatic, {
    root: distPath,
    prefix: '/',
  });

  fastify.setNotFoundHandler((req, reply) => {
    if (req.raw.url && !req.raw.url.startsWith('/api') && !req.raw.url.startsWith('/ws')) {
      reply.sendFile('index.html');
    } else {
      reply.status(404).send({ error: 'Not Found' });
    }
  });
} catch (e) {
  // dist folder not yet built in raw dev mode
}

// Health check endpoint
fastify.get('/api/health', async () => {
  return {
    status: 'online',
    monotonicMs: getMonotonicTimeMs(),
    utcMs: getAuthoritativeUtcMs(),
    version: '1.0.0',
  };
});

// Category templates endpoint
fastify.get('/api/templates', async () => {
  return DEFAULT_TEMPLATES;
});

// Get room details by code
fastify.get<{ Params: { code: string } }>('/api/rooms/:code', async (request, reply) => {
  const room = roomManager.getRoomByCode(request.params.code);
  if (!room) {
    return reply.status(404).send({ error: 'Room not found' });
  }
  return room;
});

// Match scorecards
fastify.get('/api/scorecards', async () => {
  return roomManager.getScorecards();
});

// WebSocket real-time route
fastify.register(async function (fastifyInstance) {
  fastifyInstance.get('/ws', { websocket: true }, (socket, req) => {
    let currentRoomId: string | null = null;
    let currentPlayerId: string | null = null;

    socket.on('message', (rawData) => {
      try {
        const msg: ClientMessage = JSON.parse(rawData.toString());

        switch (msg.type) {
          // 1. Monotonic NTP-Style Latency Calibration Ping
          case 'SYNC_PING': {
            const serverMonoTime = getMonotonicTimeMs();
            socket.send(JSON.stringify({
              type: 'SYNC_PONG',
              clientSendTime: msg.clientSendTime,
              serverTime: serverMonoTime,
            }));
            break;
          }

          // 2. Create Room
          case 'CREATE_ROOM': {
            const { room, hostPlayerId } = roomManager.createRoom(
              msg.gameTitle,
              msg.categoryName,
              msg.segments,
              msg.username,
              msg.avatarUrl
            );
            currentRoomId = room.roomId;
            currentPlayerId = hostPlayerId;
            roomManager.registerConnection(room.roomId, hostPlayerId, socket as unknown as WebSocket);

            socket.send(JSON.stringify({
              type: 'ROOM_STATE',
              state: room,
              yourPlayerId: hostPlayerId,
            }));
            break;
          }

          // 3. Join Room
          case 'JOIN_ROOM': {
            const result = roomManager.joinRoom(msg.roomCode, msg.username, msg.avatarUrl);
            if ('error' in result) {
              socket.send(JSON.stringify({
                type: 'ERROR',
                message: result.error,
              }));
              return;
            }

            currentRoomId = result.room.roomId;
            currentPlayerId = result.playerId;
            roomManager.registerConnection(result.room.roomId, result.playerId, socket as unknown as WebSocket);

            socket.send(JSON.stringify({
              type: 'ROOM_STATE',
              state: result.room,
              yourPlayerId: result.playerId,
            }));
            break;
          }

          // 4. Toggle Ready Check
          case 'TOGGLE_READY': {
            roomManager.toggleReady(msg.roomId, msg.playerId);
            break;
          }

          // 5. Change Game Category (Host only)
          case 'CHANGE_CATEGORY': {
            roomManager.changeCategory(msg.roomId, msg.playerId, msg.templateId);
            break;
          }

          // 6. Start Synchronized Countdown
          case 'START_COUNTDOWN': {
            const started = roomManager.startCountdown(msg.roomId, msg.playerId);
            if (!started) {
              socket.send(JSON.stringify({
                type: 'ERROR',
                message: 'Unable to start countdown. Only host can start in LOBBY status.',
              }));
            }
            break;
          }

          // 7. Authoritative Split Submission & Anti-Cheat Validation
          case 'SUBMIT_SPLIT': {
            const res = roomManager.submitSplit(
              msg.roomId,
              msg.playerId,
              msg.splitIndex,
              msg.elapsedClientMs
            );
            if (!res.success && res.error) {
              socket.send(JSON.stringify({
                type: 'ERROR',
                message: res.error,
              }));
            }
            break;
          }

          // 8. Undo Split
          case 'UNDO_SPLIT': {
            roomManager.undoSplit(msg.roomId, msg.playerId);
            break;
          }

          // 9. Skip Split
          case 'SKIP_SPLIT': {
            roomManager.skipSplit(msg.roomId, msg.playerId);
            break;
          }

          // 10. Reset Run
          case 'RESET_RUN': {
            roomManager.resetRun(msg.roomId, msg.playerId);
            break;
          }

          // 11. Live Telemetry Update (APM, Velocity)
          case 'UPDATE_TELEMETRY': {
            roomManager.updateTelemetry(
              msg.roomId,
              msg.playerId,
              msg.currentRunTimeMs,
              msg.inputRate,
              msg.velocity
            );
            break;
          }

          // 12. Add / Remove Ghost Runner
          case 'ADD_GHOST': {
            roomManager.addGhostRunner(msg.roomId, msg.ghostType);
            break;
          }
          case 'REMOVE_GHOST': {
            roomManager.removeGhost(msg.roomId, msg.ghostId);
            break;
          }

          default:
            break;
        }
      } catch (err: any) {
        fastify.log.error(err);
        socket.send(JSON.stringify({
          type: 'ERROR',
          message: 'Malformed WebSocket request payload',
        }));
      }
    });

    socket.on('close', () => {
      roomManager.removeConnection(socket as unknown as WebSocket);
    });
  });
});

// Start listening
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3005;
const HOST = '0.0.0.0';

try {
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`⚡ SpeedSync Fastify Real-Time Server running on http://${HOST}:${PORT}`);
  console.log(`⚡ WebSocket endpoint ready on ws://${HOST}:${PORT}/ws`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
