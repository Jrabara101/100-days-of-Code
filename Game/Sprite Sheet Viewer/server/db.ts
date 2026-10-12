import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'atlas_studio.sqlite');
export const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    data TEXT NOT NULL,
    image_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

export interface ProjectRecord {
  id: string;
  title: string;
  data: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export function saveProject(id: string, title: string, data: any, imageUrl: string): void {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO projects (id, title, data, image_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      data = excluded.data,
      image_url = excluded.image_url,
      updated_at = excluded.updated_at
  `);
  stmt.run(id, title, JSON.stringify(data), imageUrl, now, now);
}

export function getProject(id: string): ProjectRecord | undefined {
  const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  return stmt.get(id) as ProjectRecord | undefined;
}

export function listProjects(): Array<Omit<ProjectRecord, 'data'>> {
  const stmt = db.prepare('SELECT id, title, image_url, created_at, updated_at FROM projects ORDER BY updated_at DESC LIMIT 50');
  return stmt.all() as Array<Omit<ProjectRecord, 'data'>>;
}

export function deleteProject(id: string): void {
  const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
  stmt.run(id);
}
