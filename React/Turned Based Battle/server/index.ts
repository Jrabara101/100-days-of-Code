import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import { WebSocket } from 'ws';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { roomManager } from './roomManager.js';
import { dbStore } from './db.js';
import { ClientWsMessage } from './types.js';

import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const fastify = Fastify({
  logger: true,
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


// REST Endpoints
fastify.get('/api/health', async () => {
  return {
    status: 'online',
    serverTime: Date.now(),
    activeRooms: roomManager.getActiveRoomsCount(),
  };
});

fastify.get('/api/matches/recent', async () => {
  return {
    recentMatches: dbStore.getRecentMatches(10),
  };
});

// WebSocket Handler
fastify.register(async function (fastifyInstance) {
  fastifyInstance.get('/ws', { websocket: true }, (socket: WebSocket) => {
    let playerToken: string | null = null;

  socket.on('message', (raw: Buffer | string) => {
    try {
      const data = JSON.parse(raw.toString()) as ClientWsMessage;

      switch (data.type) {
        case 'CREATE_ROOM': {
          const { fighterName, isAi } = data.payload;
          const { room, token } = roomManager.createRoom(socket, fighterName, isAi);
          playerToken = token;

          socket.send(
            JSON.stringify({
              type: 'ROOM_CREATED',
              payload: {
                roomId: room.id,
                roomCode: room.code,
                token,
                slot: 'host',
              },
            })
          );

          roomManager.broadcastState(room);
          break;
        }

        case 'JOIN_ROOM': {
          const { roomCode, fighterName } = data.payload;
          const result = roomManager.joinRoom(socket, roomCode, fighterName);

          if ('error' in result) {
            socket.send(
              JSON.stringify({
                type: 'ERROR',
                payload: { message: result.error },
              })
            );
          } else {
            playerToken = result.token;
            socket.send(
              JSON.stringify({
                type: 'ROOM_JOINED',
                payload: {
                  roomId: result.room.id,
                  roomCode: result.room.code,
                  token: result.token,
                  slot: 'guest',
                },
              })
            );
          }
          break;
        }

        case 'COMMIT_ACTION': {
          if (!playerToken) {
            socket.send(
              JSON.stringify({
                type: 'ERROR',
                payload: { message: 'Unauthorized. No active session token.' },
              })
            );
            return;
          }
          roomManager.commitAction(playerToken, data.payload);
          break;
        }

        case 'REQUEST_REMATCH': {
          if (playerToken) {
            roomManager.rematch(playerToken);
          }
          break;
        }

        case 'RECONNECT': {
          const { token } = data.payload;
          const session = roomManager.reconnect(token, socket);
          if (session) {
            playerToken = token;
            socket.send(
              JSON.stringify({
                type: 'ROOM_JOINED',
                payload: {
                  roomId: session.room.id,
                  roomCode: session.room.code,
                  token,
                  slot: session.slot,
                },
              })
            );
          } else {
            socket.send(
              JSON.stringify({
                type: 'ERROR',
                payload: { message: 'Session expired or match terminated.' },
              })
            );
          }
          break;
        }
      }
    } catch (err) {
      fastify.log.error(err);
      socket.send(
        JSON.stringify({
          type: 'ERROR',
          payload: { message: 'Malformed JSON payload.' },
        })
      );
    }
  });

  socket.on('close', () => {
    fastify.log.info({ playerToken }, 'Player socket closed');
  });
  });
});


const PORT = 3008;
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`⚡ Solar Ember Combat Server running on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
