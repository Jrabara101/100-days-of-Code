import Fastify from 'fastify';
import cors from '@fastify/cors';
import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';

const app = Fastify({
  logger: {
    level: 'info',
  },
});

await app.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
});

app.setNotFoundHandler((request, reply) => {
  reply.code(404).send({ error: 'Route not found', path: request.url });
});

app.setErrorHandler((error, _request, reply) => {
  reply.code(500).send({ error: error.message });
});


// Initialize SQLite database
const dbPath = resolve(process.cwd(), 'telemetry.db');
const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS telemetry_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    app_version TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    gpu_renderer TEXT NOT NULL,
    gpu_vendor TEXT,
    cpu_cores INTEGER NOT NULL,
    memory_gb REAL,
    screen_refresh_rate REAL NOT NULL,
    dpr REAL NOT NULL,
    user_agent TEXT NOT NULL,
    avg_fps REAL NOT NULL,
    p99_frametime_ms REAL NOT NULL,
    one_percent_low_fps REAL NOT NULL,
    long_task_count INTEGER NOT NULL,
    dropped_frames INTEGER NOT NULL,
    stability_score REAL NOT NULL,
    raw_payload TEXT
  );
`);

// Seed initial realistic fleet sessions if empty
const countRow = db.prepare('SELECT COUNT(*) as cnt FROM telemetry_sessions').get() as { cnt: number };
if (countRow.cnt === 0) {
  const seedSessions = [
    {
      session_id: 'seed-01-m3max',
      app_version: 'v1.4.2',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
      gpu_renderer: 'Apple M3 Max (38-core GPU)',
      gpu_vendor: 'Apple Inc.',
      cpu_cores: 16,
      memory_gb: 36,
      screen_refresh_rate: 120,
      dpr: 2.0,
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      avg_fps: 119.2,
      p99_frametime_ms: 9.2,
      one_percent_low_fps: 108.7,
      long_task_count: 0,
      dropped_frames: 2,
      stability_score: 99.4,
    },
    {
      session_id: 'seed-02-rtx4080',
      app_version: 'v1.4.2',
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      gpu_renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 Direct3D11)',
      gpu_vendor: 'NVIDIA',
      cpu_cores: 24,
      memory_gb: 32,
      screen_refresh_rate: 165,
      dpr: 1.0,
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      avg_fps: 164.1,
      p99_frametime_ms: 6.8,
      one_percent_low_fps: 147.0,
      long_task_count: 0,
      dropped_frames: 4,
      stability_score: 98.8,
    },
    {
      session_id: 'seed-03-rtx3060',
      app_version: 'v1.4.2',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      gpu_renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11)',
      gpu_vendor: 'NVIDIA',
      cpu_cores: 12,
      memory_gb: 16,
      screen_refresh_rate: 60,
      dpr: 1.0,
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      avg_fps: 59.4,
      p99_frametime_ms: 18.2,
      one_percent_low_fps: 54.9,
      long_task_count: 1,
      dropped_frames: 18,
      stability_score: 95.1,
    },
    {
      session_id: 'seed-04-intel-iris',
      app_version: 'v1.4.2',
      timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      gpu_renderer: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11)',
      gpu_vendor: 'Intel',
      cpu_cores: 8,
      memory_gb: 8,
      screen_refresh_rate: 60,
      dpr: 1.25,
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      avg_fps: 48.2,
      p99_frametime_ms: 38.5,
      one_percent_low_fps: 26.0,
      long_task_count: 6,
      dropped_frames: 142,
      stability_score: 72.4, // Flagged regression!
    },
    {
      session_id: 'seed-05-adreno',
      app_version: 'v1.4.2',
      timestamp: new Date(Date.now() - 3600000 * 0.8).toISOString(),
      gpu_renderer: 'Adreno (TM) 740',
      gpu_vendor: 'Qualcomm',
      cpu_cores: 8,
      memory_gb: 12,
      screen_refresh_rate: 120,
      dpr: 2.62,
      user_agent: 'Mozilla/5.0 (Linux; Android 14; SM-S918B)',
      avg_fps: 114.6,
      p99_frametime_ms: 14.1,
      one_percent_low_fps: 71.0,
      long_task_count: 2,
      dropped_frames: 35,
      stability_score: 89.2,
    },
    {
      session_id: 'seed-06-mali-budget',
      app_version: 'v1.4.2',
      timestamp: new Date(Date.now() - 3600000 * 0.3).toISOString(),
      gpu_renderer: 'Mali-G57 MC2',
      gpu_vendor: 'ARM',
      cpu_cores: 8,
      memory_gb: 4,
      screen_refresh_rate: 60,
      dpr: 2.0,
      user_agent: 'Mozilla/5.0 (Linux; Android 13; Redmi Note 11)',
      avg_fps: 34.8,
      p99_frametime_ms: 54.2,
      one_percent_low_fps: 18.5,
      long_task_count: 12,
      dropped_frames: 420,
      stability_score: 54.0, // Critical regression!
    }
  ];

  const insertStmt = db.prepare(`
    INSERT INTO telemetry_sessions (
      session_id, app_version, timestamp, gpu_renderer, gpu_vendor,
      cpu_cores, memory_gb, screen_refresh_rate, dpr, user_agent,
      avg_fps, p99_frametime_ms, one_percent_low_fps, long_task_count,
      dropped_frames, stability_score, raw_payload
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const s of seedSessions) {
    insertStmt.run(
      s.session_id, s.app_version, s.timestamp, s.gpu_renderer, s.gpu_vendor,
      s.cpu_cores, s.memory_gb, s.screen_refresh_rate, s.dpr, s.user_agent,
      s.avg_fps, s.p99_frametime_ms, s.one_percent_low_fps, s.long_task_count,
      s.dropped_frames, s.stability_score, JSON.stringify(s)
    );
  }
}

// Ingest Endpoint
app.post('/api/telemetry/report', async (request, reply) => {
  const body = (request.body || {}) as any;

  const sessionId = String(body.sessionId || `sess-${Date.now()}`);
  const appVersion = String(body.appVersion || 'v1.0.0');
  const timestamp = new Date().toISOString();
  const gpuRenderer = String(body.gpuRenderer || body.hardwareProfile?.gpuRenderer || 'Unknown Renderer');
  const gpuVendor = String(body.hardwareProfile?.gpuVendor || 'Unknown Vendor');
  const cpuCores = Number(body.cpuCores || body.hardwareProfile?.cores || 4);
  const memoryGb = Number(body.memoryGb || body.hardwareProfile?.deviceMemoryGb || 8);
  const screenRefreshRate = Number(body.screenRefreshRate || body.hardwareProfile?.screenRefreshRate || 60);
  const dpr = Number(body.dpr || body.hardwareProfile?.dpr || 1.0);
  const userAgent = String(body.hardwareProfile?.userAgent || request.headers['user-agent'] || 'Unknown Agent');
  const avgFps = Number(body.avgFps || 60);
  const p99FrameTimeMs = Number(body.p99FrameTimeMs || 16.66);
  const onePercentLowFps = Number(body.onePercentLowFps || (p99FrameTimeMs > 0 ? 1000 / p99FrameTimeMs : 60));
  const longTaskCount = Number(body.longTaskCount || 0);
  const droppedFrames = Number(body.droppedFrames || 0);
  const stabilityScore = Number(body.stabilityScore || 100);
  const rawPayload = JSON.stringify(body);

  const insertStmt = db.prepare(`
    INSERT INTO telemetry_sessions (
      session_id, app_version, timestamp, gpu_renderer, gpu_vendor,
      cpu_cores, memory_gb, screen_refresh_rate, dpr, user_agent,
      avg_fps, p99_frametime_ms, one_percent_low_fps, long_task_count,
      dropped_frames, stability_score, raw_payload
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStmt.run(
    sessionId, appVersion, timestamp, gpuRenderer, gpuVendor,
    cpuCores, memoryGb, screenRefreshRate, dpr, userAgent,
    avgFps, p99FrameTimeMs, onePercentLowFps, longTaskCount,
    droppedFrames, stabilityScore, rawPayload
  );

  return reply.code(201).send({
    success: true,
    sessionId,
    receivedAt: timestamp,
    message: 'Telemetry session successfully ingested into fleet matrix',
  });
});

// Fleet Summary Endpoint
app.get('/api/telemetry/summary', async (_request, reply) => {
  const totalRow = db.prepare('SELECT COUNT(*) as total, AVG(stability_score) as avgStability, AVG(avg_fps) as avgFps, AVG(p99_frametime_ms) as avgP99 FROM telemetry_sessions').get() as any;

  // GPU distribution
  const gpuRows = db.prepare(`
    SELECT gpu_renderer as name, COUNT(*) as count, AVG(avg_fps) as avgFps
    FROM telemetry_sessions
    GROUP BY gpu_renderer
    ORDER BY count DESC
    LIMIT 8
  `).all() as any[];

  // Core counts
  const coreRows = db.prepare(`
    SELECT cpu_cores as cores, COUNT(*) as count
    FROM telemetry_sessions
    GROUP BY cpu_cores
    ORDER BY cpu_cores ASC
  `).all() as any[];

  // Memory tiers
  const memRows = db.prepare(`
    SELECT ROUND(memory_gb) as memoryGb, COUNT(*) as count
    FROM telemetry_sessions
    WHERE memory_gb IS NOT NULL
    GROUP BY ROUND(memory_gb)
    ORDER BY memoryGb ASC
  `).all() as any[];

  // Flagged hardware regressions
  const regressionRows = db.prepare(`
    SELECT id, gpu_renderer as gpuRenderer, avg_fps as avgFps, one_percent_low_fps as onePercentLowFps, stability_score as stabilityScore, long_task_count as longTaskCount, timestamp
    FROM telemetry_sessions
    WHERE stability_score < 80 OR one_percent_low_fps < 30 OR long_task_count > 3
    ORDER BY id DESC
    LIMIT 10
  `).all() as any[];

  const formattedRegressions = regressionRows.map(r => ({
    id: `REG-${r.id}`,
    gpuRenderer: r.gpuRenderer,
    avgFps: Number(r.avgFps.toFixed(1)),
    onePercentLowFps: Number(r.onePercentLowFps.toFixed(1)),
    severity: r.stabilityScore < 65 ? 'critical' : 'warning',
    reason: r.longTaskCount > 5 ? `${r.longTaskCount} Long Tasks freezing main thread` : `Severe 1% low drop (${r.onePercentLowFps.toFixed(1)} FPS)`,
    timestamp: r.timestamp,
  }));

  // Recent sessions
  const recentRows = db.prepare(`
    SELECT session_id as sessionId, timestamp, gpu_renderer as gpuRenderer, avg_fps as avgFps, one_percent_low_fps as onePercentLowFps, stability_score as stabilityScore, long_task_count as longTaskCount
    FROM telemetry_sessions
    ORDER BY id DESC
    LIMIT 15
  `).all() as any[];

  const formattedRecent = recentRows.map(r => ({
    sessionId: r.sessionId,
    timestamp: r.timestamp,
    gpuRenderer: r.gpuRenderer,
    avgFps: Number(r.avgFps.toFixed(1)),
    onePercentLowFps: Number(r.onePercentLowFps.toFixed(1)),
    stabilityScore: Number(r.stabilityScore.toFixed(1)),
    longTaskCount: r.longTaskCount,
  }));

  return reply.send({
    totalReports: totalRow?.total || 0,
    fleetStabilityScore: Number((totalRow?.avgStability || 0).toFixed(1)),
    fleetAverageFps: Number((totalRow?.avgFps || 0).toFixed(1)),
    fleetP99Ms: Number((totalRow?.avgP99 || 0).toFixed(2)),
    hardwareDistribution: {
      gpus: gpuRows.map(g => ({ name: g.name, count: g.count, avgFps: Number(g.avgFps.toFixed(1)) })),
      coreCounts: coreRows.map(c => ({ cores: c.cores, count: c.count })),
      memoryTiers: memRows.map(m => ({ memoryGb: m.memoryGb, count: m.count })),
    },
    regressions: formattedRegressions,
    recentSessions: formattedRecent,
  });
});

// Health check
app.get('/api/health', async () => {
  return { status: 'ok', service: 'avionics-telemetry-backend', uptime: process.uptime() };
});

const PORT = Number(process.env.PORT || 3001);
const HOST = '127.0.0.1';

try {
  await app.listen({ port: PORT, host: HOST });
  console.log(`[Avionics Telemetry Ingest] Server running at http://${HOST}:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
