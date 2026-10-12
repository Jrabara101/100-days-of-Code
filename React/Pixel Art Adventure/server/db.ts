import Database from 'better-sqlite3';
import path from 'path';

// Setup SQLite database
const dbPath = path.resolve(process.cwd(), 'game.db');
export const db = new Database(dbPath);

// Enable WAL mode for high performance
db.pragma('journal_mode = WAL');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS player_save (
    id TEXT PRIMARY KEY,
    slot INTEGER DEFAULT 1,
    map_id TEXT NOT NULL,
    player_x REAL NOT NULL,
    player_y REAL NOT NULL,
    player_facing TEXT NOT NULL,
    active_tool_id TEXT,
    time_of_day REAL NOT NULL,
    inventory_json TEXT NOT NULL,
    narrative_flags_json TEXT NOT NULL,
    active_quests_json TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS choices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id TEXT NOT NULL,
    choice_node_id TEXT NOT NULL,
    choice_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_choices_chapter ON choices(chapter_id, choice_node_id);
`);

// Seed telemetry choices if empty
const countStmt = db.prepare('SELECT COUNT(*) as count FROM choices');
const { count } = countStmt.get() as { count: number };

if (count === 0) {
  const insertChoice = db.prepare(
    'INSERT INTO choices (chapter_id, choice_node_id, choice_text) VALUES (?, ?, ?)'
  );

  const seedBatch = db.transaction(() => {
    // 64% restored Sunken Shrine, 36% harvested core
    for (let i = 0; i < 64; i++) {
      insertChoice.run('ch1', 'restore_shrine', 'Restore the Sunken Shrine');
    }
    for (let i = 0; i < 36; i++) {
      insertChoice.run('ch1', 'harvest_core', 'Harvest the Core for Power');
    }

    // 72% spared the guardian, 28% deactivated guardian
    for (let i = 0; i < 72; i++) {
      insertChoice.run('ch1', 'spare_guardian', 'Spare the Stone Guardian');
    }
    for (let i = 0; i < 28; i++) {
      insertChoice.run('ch1', 'deactivate_guardian', 'Deactivate Stone Guardian Core');
    }

    // 58% entrusted Elder Mael with the secret, 42% kept memory echo concealed
    for (let i = 0; i < 58; i++) {
      insertChoice.run('ch1', 'trust_elder_mael', 'Entrust Elder Mael with the Memory');
    }
    for (let i = 0; i < 42; i++) {
      insertChoice.run('ch1', 'conceal_memory', 'Conceal the Memory Echo');
    }
  });

  seedBatch();
}
