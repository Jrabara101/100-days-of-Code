import { Router } from 'express';
import { SquadRoom } from '../../src/types/game';

export const squadRouter = Router();

// In-memory store for squad rooms
const squadRooms = new Map<string, SquadRoom>();

// Seed a demo squad room so the user can test immediately with pre-synced votes
squadRooms.set('RAID', {
  code: 'RAID',
  members: ['Alex', 'Valkyrie', 'Kai'],
  swipedYes: {
    'game-1': ['Alex', 'Valkyrie', 'Kai'], // Overlap match!
    'game-9': ['Alex', 'Valkyrie', 'Kai'], // Overlap match!
    'game-5': ['Alex', 'Kai'],
    'game-6': ['Valkyrie'],
  },
  overlapMatches: ['game-1', 'game-9'],
});

function calculateOverlap(room: SquadRoom): string[] {
  const minVotes = Math.max(2, room.members.length);
  const matches: string[] = [];
  for (const [gameId, voters] of Object.entries(room.swipedYes)) {
    if (voters.length >= minVotes) {
      matches.push(gameId);
    }
  }
  return matches;
}

/**
 * POST /api/squad/create
 */
squadRouter.post('/create', (req, res) => {
  const { username } = req.body;
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const room: SquadRoom = {
    code,
    members: [username?.trim() || 'Captain'],
    swipedYes: {},
    overlapMatches: [],
  };

  squadRooms.set(code, room);
  res.json(room);
});

/**
 * POST /api/squad/join
 */
squadRouter.post('/join', (req, res) => {
  const { code, username } = req.body;
  const upperCode = (code || '').toUpperCase().trim();
  const room = squadRooms.get(upperCode);

  if (!room) {
    return res.status(404).json({ error: 'Squad room code not found.' });
  }

  const user = username?.trim() || `Player_${room.members.length + 1}`;
  if (!room.members.includes(user)) {
    room.members.push(user);
    room.overlapMatches = calculateOverlap(room);
  }

  res.json(room);
});

/**
 * POST /api/squad/vote
 */
squadRouter.post('/vote', (req, res) => {
  const { code, username, gameId, vote } = req.body; // vote: 'yes' | 'no'
  const upperCode = (code || '').toUpperCase().trim();
  const room = squadRooms.get(upperCode);

  if (!room) {
    return res.status(404).json({ error: 'Squad room not found.' });
  }

  if (vote === 'yes') {
    if (!room.swipedYes[gameId]) {
      room.swipedYes[gameId] = [];
    }
    if (!room.swipedYes[gameId].includes(username)) {
      room.swipedYes[gameId].push(username);
    }
  } else if (vote === 'no') {
    if (room.swipedYes[gameId]) {
      room.swipedYes[gameId] = room.swipedYes[gameId].filter(u => u !== username);
    }
  }

  room.overlapMatches = calculateOverlap(room);
  res.json(room);
});

/**
 * GET /api/squad/:code
 */
squadRouter.get('/:code', (req, res) => {
  const upperCode = req.params.code.toUpperCase().trim();
  const room = squadRooms.get(upperCode);

  if (!room) {
    return res.status(404).json({ error: 'Squad room not found.' });
  }

  room.overlapMatches = calculateOverlap(room);
  res.json(room);
});
