import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.resolve(dbDir, 'foundry.sqlite');
export class DatabaseStore {
    db;
    constructor() {
        this.db = new DatabaseSync(dbPath);
        this.initTables();
        this.seedLeaderboard();
    }
    initTables() {
        // Players state
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        handle TEXT NOT NULL,
        lastSavedAt INTEGER NOT NULL,
        currency TEXT NOT NULL,
        lifetimeCurrency TEXT NOT NULL,
        prestigeShards INTEGER NOT NULL DEFAULT 0,
        generatorsJson TEXT NOT NULL,
        upgradesJson TEXT NOT NULL,
        highestCps TEXT NOT NULL,
        totalClicks INTEGER NOT NULL DEFAULT 0,
        isFlagged INTEGER NOT NULL DEFAULT 0,
        updatedAt INTEGER NOT NULL
      );
    `);
        // Global competitive leaderboard
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        playerId TEXT PRIMARY KEY,
        handle TEXT NOT NULL,
        lifetimeCurrency TEXT NOT NULL,
        prestigeShards INTEGER NOT NULL,
        highestCps TEXT NOT NULL,
        scoreValue REAL NOT NULL,
        updatedAt INTEGER NOT NULL,
        isVerified INTEGER NOT NULL DEFAULT 1
      );
    `);
        // Sync audits for monotonic time & cadence anti-cheat
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS sync_audit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playerId TEXT NOT NULL,
        offlineSec INTEGER NOT NULL,
        offlineGains TEXT NOT NULL,
        clientTime INTEGER NOT NULL,
        serverTime INTEGER NOT NULL,
        cadenceCps REAL NOT NULL,
        status TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      );
    `);
    }
    seedLeaderboard() {
        const existing = this.db.prepare('SELECT COUNT(*) as count FROM leaderboard').get();
        if (existing.count === 0) {
            const champions = [
                { id: 'champ-1', handle: 'Aetherion_Prime', lifetimeCurrency: '4.82e38', shards: 2450, highestCps: '9.21e35', score: 38.68 },
                { id: 'champ-2', handle: 'SingularityPilot', lifetimeCurrency: '1.75e32', shards: 890, highestCps: '3.14e29', score: 32.24 },
                { id: 'champ-3', handle: 'NovaHarvester', lifetimeCurrency: '8.40e26', shards: 320, highestCps: '1.20e24', score: 26.92 },
                { id: 'champ-4', handle: 'ChronosTinkerer', lifetimeCurrency: '5.10e21', shards: 95, highestCps: '7.85e18', score: 21.70 },
                { id: 'champ-5', handle: 'FluxArchitect', lifetimeCurrency: '9.60e16', shards: 24, highestCps: '1.50e14', score: 16.98 },
                { id: 'champ-6', handle: 'QuantumSparks', lifetimeCurrency: '3.25e12', shards: 6, highestCps: '4.20e9', score: 12.51 },
            ];
            const stmt = this.db.prepare(`
        INSERT INTO leaderboard (playerId, handle, lifetimeCurrency, prestigeShards, highestCps, scoreValue, updatedAt, isVerified)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `);
            const now = Date.now();
            for (const c of champions) {
                stmt.run(c.id, c.handle, c.lifetimeCurrency, c.shards, c.highestCps, c.score, now);
            }
        }
    }
    getPlayer(id) {
        const stmt = this.db.prepare('SELECT * FROM players WHERE id = ?');
        return stmt.get(id);
    }
    upsertPlayer(data) {
        const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO players 
      (id, handle, lastSavedAt, currency, lifetimeCurrency, prestigeShards, generatorsJson, upgradesJson, highestCps, totalClicks, isFlagged, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(data.id, data.handle, data.lastSavedAt, data.currency, data.lifetimeCurrency, data.prestigeShards, data.generatorsJson, data.upgradesJson, data.highestCps, data.totalClicks, data.isFlagged, Date.now());
    }
    getLeaderboard(limit = 20) {
        const stmt = this.db.prepare(`
      SELECT playerId, handle, lifetimeCurrency, prestigeShards, highestCps, updatedAt, (isVerified = 1) as isVerified
      FROM leaderboard
      ORDER BY scoreValue DESC
      LIMIT ?
    `);
        const rows = stmt.all(limit);
        return rows.map((r) => ({
            playerId: r.playerId,
            handle: r.handle,
            lifetimeCurrency: r.lifetimeCurrency,
            prestigeShards: Number(r.prestigeShards),
            highestCps: r.highestCps,
            updatedAt: Number(r.updatedAt),
            isVerified: Boolean(r.isVerified),
        }));
    }
    upsertLeaderboard(entry) {
        const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO leaderboard 
      (playerId, handle, lifetimeCurrency, prestigeShards, highestCps, scoreValue, updatedAt, isVerified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(entry.playerId, entry.handle, entry.lifetimeCurrency, entry.prestigeShards, entry.highestCps, entry.scoreValue, Date.now(), entry.isVerified ? 1 : 0);
    }
    logSyncAudit(data) {
        const stmt = this.db.prepare(`
      INSERT INTO sync_audit (playerId, offlineSec, offlineGains, clientTime, serverTime, cadenceCps, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(data.playerId, data.offlineSec, data.offlineGains, data.clientTime, data.serverTime, data.cadenceCps, data.status, Date.now());
    }
}
export const dbStore = new DatabaseStore();
