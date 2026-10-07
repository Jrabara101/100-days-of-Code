import { DatabaseSync } from 'node:sqlite';

export class DatabaseStore {
  private db: DatabaseSync;

  constructor() {
    this.db = new DatabaseSync(':memory:');
    this.initTables();
  }

  private initTables(): void {
    // Sessions
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        playerName TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      );
    `);

    // Match history
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS match_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        roomCode TEXT NOT NULL,
        winnerId TEXT,
        rounds INTEGER NOT NULL,
        statsJson TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      );
    `);

    // Active room cache
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS rooms (
        roomId TEXT PRIMARY KEY,
        roomCode TEXT UNIQUE NOT NULL,
        phase TEXT NOT NULL,
        isAi INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `);
  }

  public saveSession(token: string, playerName: string): void {
    const stmt = this.db.prepare(
      'INSERT OR REPLACE INTO sessions (token, playerName, createdAt) VALUES (?, ?, ?)'
    );
    stmt.run(token, playerName, Date.now());
  }

  public getSession(token: string): { token: string; playerName: string; createdAt: number } | undefined {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE token = ?');
    return stmt.get(token) as { token: string; playerName: string; createdAt: number } | undefined;
  }

  public saveMatchHistory(
    roomCode: string,
    winnerId: string | undefined,
    rounds: number,
    stats: object
  ): void {
    const stmt = this.db.prepare(
      'INSERT INTO match_history (roomCode, winnerId, rounds, statsJson, createdAt) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(roomCode, winnerId || 'DRAW', rounds, JSON.stringify(stats), Date.now());
  }

  public getRecentMatches(limit: number = 10): Array<{
    id: number;
    roomCode: string;
    winnerId: string;
    rounds: number;
    statsJson: string;
    createdAt: number;
  }> {
    const stmt = this.db.prepare(
      'SELECT * FROM match_history ORDER BY createdAt DESC LIMIT ?'
    );
    return stmt.all(limit) as Array<{
      id: number;
      roomCode: string;
      winnerId: string;
      rounds: number;
      statsJson: string;
      createdAt: number;
    }>;
  }

  public upsertRoom(roomId: string, roomCode: string, phase: string, isAi: boolean): void {
    const stmt = this.db.prepare(
      'INSERT OR REPLACE INTO rooms (roomId, roomCode, phase, isAi, updatedAt) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(roomId, roomCode, phase, isAi ? 1 : 0, Date.now());
  }

  public deleteRoom(roomId: string): void {
    const stmt = this.db.prepare('DELETE FROM rooms WHERE roomId = ?');
    stmt.run(roomId);
  }
}

export const dbStore = new DatabaseStore();
