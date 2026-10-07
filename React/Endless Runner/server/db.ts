import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { LeaderboardEntry } from '../src/types/game';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'game.db');
export const db = new Database(dbPath);

// Enable WAL mode for high performance
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS leaderboard (
    id TEXT PRIMARY KEY,
    playerHandle TEXT NOT NULL,
    seed TEXT NOT NULL,
    distance INTEGER NOT NULL,
    score INTEGER NOT NULL,
    maxCombo REAL NOT NULL,
    nearMissCount INTEGER NOT NULL,
    coinsCollected INTEGER NOT NULL,
    durationMs INTEGER NOT NULL,
    telemetryJson TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_leaderboard_seed_dist ON leaderboard(seed, distance DESC);
`);

// Insert initial ghost benchmark runs if empty
const countStmt = db.prepare('SELECT COUNT(*) as count FROM leaderboard');
const count = (countStmt.get() as { count: number }).count;

if (count === 0) {
  const insertStmt = db.prepare(`
    INSERT INTO leaderboard (id, playerHandle, seed, distance, score, maxCombo, nearMissCount, coinsCollected, durationMs, telemetryJson)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const todaySeed = `DAILY-${new Date().toISOString().slice(0, 10)}`;

  // Default ghost 1: CyberViper
  insertStmt.run(
    'ghost-1',
    'CyberViper',
    todaySeed,
    3420,
    32500,
    3.0,
    14,
    182,
    88000,
    JSON.stringify([
      { timeMs: 0, action: 'MOVE_LEFT', lane: 0, y: 0 },
      { timeMs: 4000, action: 'JUMP', lane: 0, y: 2.2 },
      { timeMs: 12000, action: 'MOVE_RIGHT', lane: 1, y: 0 },
      { timeMs: 18000, action: 'SLIDE', lane: 1, y: 0 },
    ])
  );

  // Default ghost 2: NeonDrifter
  insertStmt.run(
    'ghost-2',
    'NeonDrifter',
    todaySeed,
    2150,
    19800,
    2.0,
    8,
    115,
    55000,
    JSON.stringify([
      { timeMs: 0, action: 'MOVE_RIGHT', lane: 2, y: 0 },
      { timeMs: 6000, action: 'JUMP', lane: 2, y: 2.0 },
    ])
  );
}

export function getLeaderboardBySeed(seed: string, limit = 20): LeaderboardEntry[] {
  const stmt = db.prepare(`
    SELECT id, playerHandle, seed, distance, score, maxCombo, nearMissCount, coinsCollected, durationMs, createdAt
    FROM leaderboard
    WHERE seed = ?
    ORDER BY distance DESC, score DESC
    LIMIT ?
  `);
  return stmt.all(seed, limit) as LeaderboardEntry[];
}

export function getGhostById(id: string): { playerHandle: string; finalDistance: number; telemetry: any[] } | null {
  const stmt = db.prepare('SELECT playerHandle, distance, telemetryJson FROM leaderboard WHERE id = ?');
  const row = stmt.get(id) as { playerHandle: string; distance: number; telemetryJson: string } | undefined;
  if (!row) return null;
  return {
    playerHandle: row.playerHandle,
    finalDistance: row.distance,
    telemetry: row.telemetryJson ? JSON.parse(row.telemetryJson) : [],
  };
}

export function insertRunRecord(entry: {
  id: string;
  playerHandle: string;
  seed: string;
  distance: number;
  score: number;
  maxCombo: number;
  nearMissCount: number;
  coinsCollected: number;
  durationMs: number;
  telemetryJson: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO leaderboard (id, playerHandle, seed, distance, score, maxCombo, nearMissCount, coinsCollected, durationMs, telemetryJson)
    VALUES (@id, @playerHandle, @seed, @distance, @score, @maxCombo, @nearMissCount, @coinsCollected, @durationMs, @telemetryJson)
  `);
  stmt.run(entry);
}
