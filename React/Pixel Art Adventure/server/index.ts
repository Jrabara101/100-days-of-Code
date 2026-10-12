import Fastify from 'fastify';
import cors from '@fastify/cors';
import { gameRoutes } from './routes.js';

const fastify = Fastify({
  logger: true,
});

// Configure CORS
await fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
});

// Register API Routes under /api prefix
await fastify.register(gameRoutes, { prefix: '/api' });

const PORT = Number(process.env.PORT) || 3001;

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🎮 Game Services API server listening on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
