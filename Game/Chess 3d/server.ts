import http from 'http';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
  if (url.pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

app.use(express.json());

interface ClientInfo {
  ws: WebSocket;
  id: string;
  name: string;
  roomId: string | null;
  role: 'white' | 'black' | 'spectator' | null;
}

interface RoomState {
  id: string;
  whitePlayer: string | null; // client ID
  blackPlayer: string | null; // client ID
  spectators: string[];
  fen: string;
  history: string[];
  timeWhite: number;
  timeBlack: number;
  lastMoveTimestamp: number | null;
  turn: 'w' | 'b';
  timeControl: { base: number; increment: number }; // base in seconds
  status: 'waiting' | 'active' | 'checkmate' | 'draw' | 'resigned' | 'timeout';
  winner: 'w' | 'b' | 'draw' | null;
}

const clients = new Map<WebSocket, ClientInfo>();
const rooms = new Map<string, RoomState>();

function broadcastToRoom(roomId: string, message: any, excludeWs?: WebSocket) {
  const json = JSON.stringify(message);
  for (const [ws, client] of clients.entries()) {
    if (client.roomId === roomId && ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(json);
    }
  }
}

function getRoomPlayerList(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return [];
  const list = [];
  for (const client of clients.values()) {
    if (client.roomId === roomId) {
      list.push({
        id: client.id,
        name: client.name,
        role: client.role,
      });
    }
  }
  return list;
}

wss.on('connection', (ws) => {
  const clientId = 'p_' + Math.random().toString(36).substring(2, 9);
  const client: ClientInfo = {
    ws,
    id: clientId,
    name: 'Player',
    roomId: null,
    role: null,
  };
  clients.set(ws, client);

  ws.send(JSON.stringify({ type: 'connected', peerId: clientId }));

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());

      if (data.type === 'join_room') {
        const roomId = (data.roomId || 'GENERAL').toUpperCase().trim();
        const playerName = (data.playerName || 'Grandmaster').trim().substring(0, 24);
        const preferredRole = data.rolePreference || 'auto'; // 'white' | 'black' | 'spectator' | 'auto'

        // Leave previous room if any
        if (client.roomId) {
          handleLeave(ws, client);
        }

        let room = rooms.get(roomId);
        if (!room) {
          room = {
            id: roomId,
            whitePlayer: null,
            blackPlayer: null,
            spectators: [],
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            history: [],
            timeWhite: 600,
            timeBlack: 600,
            lastMoveTimestamp: null,
            turn: 'w',
            timeControl: { base: 600, increment: 5 },
            status: 'waiting',
            winner: null,
          };
          rooms.set(roomId, room);
        }

        client.roomId = roomId;
        client.name = playerName;

        // Assign role
        if (preferredRole === 'white' && !room.whitePlayer) {
          room.whitePlayer = client.id;
          client.role = 'white';
        } else if (preferredRole === 'black' && !room.blackPlayer) {
          room.blackPlayer = client.id;
          client.role = 'black';
        } else if (preferredRole === 'spectator') {
          room.spectators.push(client.id);
          client.role = 'spectator';
        } else {
          // Auto assign
          if (!room.whitePlayer) {
            room.whitePlayer = client.id;
            client.role = 'white';
          } else if (!room.blackPlayer) {
            room.blackPlayer = client.id;
            client.role = 'black';
          } else {
            room.spectators.push(client.id);
            client.role = 'spectator';
          }
        }

        if (room.whitePlayer && room.blackPlayer && room.status === 'waiting') {
          room.status = 'active';
          room.lastMoveTimestamp = Date.now();
        }

        // Notify joined client with full state
        ws.send(
          JSON.stringify({
            type: 'room_joined',
            room: {
              ...room,
              players: getRoomPlayerList(roomId),
            },
            yourRole: client.role,
            yourId: client.id,
          })
        );

        // Notify other room members
        broadcastToRoom(
          roomId,
          {
            type: 'peer_joined',
            peer: {
              id: client.id,
              name: client.name,
              role: client.role,
            },
            room: {
              ...room,
              players: getRoomPlayerList(roomId),
            },
          },
          ws
        );
      } else if (data.type === 'move') {
        if (!client.roomId) return;
        const room = rooms.get(client.roomId);
        if (!room) return;

        // Verify player is allowed to move
        if (
          (room.turn === 'w' && client.role !== 'white') ||
          (room.turn === 'b' && client.role !== 'black')
        ) {
          return;
        }

        room.fen = data.fen;
        if (data.san) {
          room.history.push(data.san);
        }
        room.turn = room.turn === 'w' ? 'b' : 'w';
        room.timeWhite = data.timeWhite ?? room.timeWhite;
        room.timeBlack = data.timeBlack ?? room.timeBlack;
        room.lastMoveTimestamp = Date.now();
        if (data.isCheckmate) {
          room.status = 'checkmate';
          room.winner = client.role === 'white' ? 'w' : 'b';
        } else if (data.isDraw) {
          room.status = 'draw';
          room.winner = 'draw';
        }

        broadcastToRoom(client.roomId, {
          type: 'move_made',
          move: data.move,
          san: data.san,
          fen: room.fen,
          turn: room.turn,
          timeWhite: room.timeWhite,
          timeBlack: room.timeBlack,
          history: room.history,
          status: room.status,
          winner: room.winner,
        });
      } else if (data.type === 'restart_game') {
        if (!client.roomId) return;
        const room = rooms.get(client.roomId);
        if (!room) return;

        const baseTime = data.baseTime || 600;
        const inc = data.increment || 5;

        room.fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        room.history = [];
        room.turn = 'w';
        room.timeWhite = baseTime;
        room.timeBlack = baseTime;
        room.timeControl = { base: baseTime, increment: inc };
        room.lastMoveTimestamp = room.whitePlayer && room.blackPlayer ? Date.now() : null;
        room.status = room.whitePlayer && room.blackPlayer ? 'active' : 'waiting';
        room.winner = null;

        broadcastToRoom(client.roomId, {
          type: 'game_restarted',
          room: {
            ...room,
            players: getRoomPlayerList(client.roomId),
          },
        });
      } else if (data.type === 'resign') {
        if (!client.roomId) return;
        const room = rooms.get(client.roomId);
        if (!room) return;

        room.status = 'resigned';
        room.winner = client.role === 'white' ? 'b' : 'w';

        broadcastToRoom(client.roomId, {
          type: 'player_resigned',
          resignedRole: client.role,
          winner: room.winner,
          status: room.status,
        });
      } else if (data.type === 'chat') {
        if (!client.roomId) return;
        broadcastToRoom(client.roomId, {
          type: 'chat_message',
          sender: client.name,
          senderRole: client.role,
          senderId: client.id,
          text: data.text?.substring(0, 300),
          timestamp: Date.now(),
        });
      } else if (data.type === 'reaction') {
        if (!client.roomId) return;
        broadcastToRoom(client.roomId, {
          type: 'reaction_burst',
          sender: client.name,
          emoji: data.emoji,
          x: data.x,
          y: data.y,
        });
      } else if (data.type === 'voice_signal') {
        // Relay WebRTC audio signaling offer/answer/candidate to target peer
        const targetId = data.toPeerId;
        for (const [targetWs, targetClient] of clients.entries()) {
          if (targetClient.id === targetId && targetWs.readyState === WebSocket.OPEN) {
            targetWs.send(
              JSON.stringify({
                type: 'voice_signal',
                fromPeerId: client.id,
                fromPeerName: client.name,
                signal: data.signal,
              })
            );
            break;
          }
        }
      } else if (data.type === 'switch_role') {
        if (!client.roomId) return;
        const room = rooms.get(client.roomId);
        if (!room) return;
        const requestedRole = data.role; // 'white' | 'black' | 'spectator'

        if (requestedRole === 'white' && !room.whitePlayer) {
          if (client.role === 'black') room.blackPlayer = null;
          room.whitePlayer = client.id;
          client.role = 'white';
        } else if (requestedRole === 'black' && !room.blackPlayer) {
          if (client.role === 'white') room.whitePlayer = null;
          room.blackPlayer = client.id;
          client.role = 'black';
        } else if (requestedRole === 'spectator') {
          if (client.role === 'white') room.whitePlayer = null;
          if (client.role === 'black') room.blackPlayer = null;
          room.spectators.push(client.id);
          client.role = 'spectator';
        }

        broadcastToRoom(client.roomId, {
          type: 'roles_updated',
          players: getRoomPlayerList(client.roomId),
          room,
        });
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    handleLeave(ws, client);
    clients.delete(ws);
  });
});

function handleLeave(ws: WebSocket, client: ClientInfo) {
  if (!client.roomId) return;
  const roomId = client.roomId;
  const room = rooms.get(roomId);
  if (room) {
    if (room.whitePlayer === client.id) {
      room.whitePlayer = null;
      if (room.status === 'active') room.status = 'waiting';
    }
    if (room.blackPlayer === client.id) {
      room.blackPlayer = null;
      if (room.status === 'active') room.status = 'waiting';
    }
    room.spectators = room.spectators.filter((id) => id !== client.id);

    broadcastToRoom(
      roomId,
      {
        type: 'peer_left',
        peerId: client.id,
        role: client.role,
        room: {
          ...room,
          players: getRoomPlayerList(roomId),
        },
      },
      ws
    );

    // If room is empty, clean it up after a grace period
    const remaining = Array.from(clients.values()).filter((c) => c.roomId === roomId && c.id !== client.id);
    if (remaining.length === 0) {
      rooms.delete(roomId);
    }
  }
  client.roomId = null;
  client.role = null;
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    roomsCount: rooms.size,
    clientsCount: clients.size,
    timestamp: Date.now(),
  });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    // First, verify nothing is already listening by connecting to it
    const client = new net.Socket();
    client.setTimeout(150);
    client.once('connect', () => {
      client.destroy();
      resolve(false); // An existing process responded
    });
    client.once('timeout', () => {
      client.destroy();
      testBind();
    });
    client.once('error', () => {
      testBind();
    });

    const testBind = () => {
      const tester = net.createServer()
        .once('error', () => resolve(false))
        .once('listening', () => {
          tester.close(() => resolve(true));
        })
        .listen({ port, host: '0.0.0.0', exclusive: true });
    };

    client.connect(port, '127.0.0.1');
  });
}

async function findAvailablePort(preferredPort: number): Promise<number> {
  let port = preferredPort;
  while (port < preferredPort + 50) {
    if (await isPortAvailable(port)) {
      return port;
    }
    console.log(`Port ${port} in use, trying port ${port + 1}...`);
    port++;
  }
  throw new Error(`Could not find an available port starting from ${preferredPort}`);
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const actualPort = await findAvailablePort(PORT);
  server.listen({ port: actualPort, host: '0.0.0.0', exclusive: true }, () => {
    console.log(`Grandmaster 3D server running on http://localhost:${actualPort}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
