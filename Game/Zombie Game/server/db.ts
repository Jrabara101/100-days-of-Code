import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { LeaderboardEntry, RunSubmission } from '../src/types/game.js';

let db: DatabaseSync;

export function initDatabase(): DatabaseSync {
  if (db) return db;

  const dbPath = path.resolve(process.cwd(), 'quarantine_leaderboard.db');
  db = new DatabaseSync(dbPath);

  // Initialize Leaderboard Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_handle TEXT NOT NULL,
      run_seed TEXT NOT NULL,
      waves_cleared INTEGER NOT NULL,
      duration_ms INTEGER NOT NULL,
      scrap_collected INTEGER NOT NULL,
      final_score INTEGER NOT NULL,
      favorite_weapon TEXT DEFAULT 'Combat Shotgun',
      verified INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  // Check if seeded mock data exists
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM leaderboard');
  const result = countStmt.get() as { count: number };

  if (result.count === 0) {
    const insertMock = db.prepare(`
      INSERT INTO leaderboard 
      (player_handle, run_seed, waves_cleared, duration_ms, scrap_collected, final_score, favorite_weapon, verified, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    insertMock.run('Vanguard-Alpha', '2026-10-09-QUARANTINE', 22, 940000, 3420, 38500, 'Tesla Arc Shotgun', 1, now);
    insertMock.run('Ghost_Operator', '2026-10-09-QUARANTINE', 18, 765000, 2810, 29200, 'Incendiary Rifle', 1, now);
    insertMock.run('Raven_9', '2026-10-09-QUARANTINE', 15, 620000, 2190, 22400, 'Cryo Scattergun', 1, now);
    insertMock.run('Hazard_Runner', 'CUSTOM_HARDCORE', 12, 490000, 1680, 17800, 'Shock SMG', 1, now);
    insertMock.run('Biohazard_Zero', 'DEFAULT_ZONE', 9, 360000, 1140, 12600, 'Assault Rifle', 1, now);
  }

  return db;
}

export function getLeaderboard(seedFilter?: string, limit = 25): LeaderboardEntry[] {
  const database = initDatabase();
  if (seedFilter) {
    const stmt = database.prepare(`
      SELECT * FROM leaderboard 
      WHERE run_seed = ?
      ORDER BY final_score DESC 
      LIMIT ?
    `);
    return stmt.all(seedFilter, limit) as unknown as LeaderboardEntry[];
  } else {
    const stmt = database.prepare(`
      SELECT * FROM leaderboard 
      ORDER BY final_score DESC 
      LIMIT ?
    `);
    return stmt.all(limit) as unknown as LeaderboardEntry[];
  }
}

export function saveLeaderboardEntry(run: RunSubmission, verified: boolean): LeaderboardEntry {
  const database = initDatabase();
  const insertStmt = database.prepare(`
    INSERT INTO leaderboard 
    (player_handle, run_seed, waves_cleared, duration_ms, scrap_collected, final_score, favorite_weapon, verified, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const createdAt = new Date().toISOString();
  const res = insertStmt.run(
    run.playerHandle || 'Field_Operator',
    run.runSeed,
    run.wavesCleared,
    run.durationMs,
    run.scrapCollected,
    run.finalScore,
    run.favoriteWeapon || 'Combat Shotgun',
    verified ? 1 : 0,
    createdAt
  );

  return {
    id: Number(res.lastInsertRowid),
    player_handle: run.playerHandle || 'Field_Operator',
    run_seed: run.runSeed,
    waves_cleared: run.wavesCleared,
    duration_ms: run.durationMs,
    scrap_collected: run.scrapCollected,
    final_score: run.finalScore,
    favorite_weapon: run.favoriteWeapon || 'Combat Shotgun',
    verified: verified ? 1 : 0,
    created_at: createdAt,
  };
}
