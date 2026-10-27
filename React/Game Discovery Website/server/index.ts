import express from 'express';
import cors from 'cors';
import { gamesRouter } from './routes/games';
import { squadRouter } from './routes/squad';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'CRYO-DECK Discovery Engine',
    version: '1.0.0-telemetry',
  });
});

// Mount routers
app.use('/api/games', gamesRouter);
app.use('/api/squad', squadRouter);

// Forward hardware profiles direct alias
app.get('/api/hardware-profiles', (_req, res) => {
  res.redirect('/api/games/hardware-profiles');
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 CRYO-DECK Server listening on http://localhost:${PORT}`);
  console.log(`📡 Endpoints: /api/games/discover, /api/games/:id, /api/games/:id/reviews, /api/squad`);
});
