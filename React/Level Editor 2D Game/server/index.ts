import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { mapRoutes } from './routes/maps.js';
import { tilesetRoutes } from './routes/tilesets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const server = Fastify({
  logger: true,
});

async function main() {
  await server.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Register API routes
  await server.register(mapRoutes);
  await server.register(tilesetRoutes);

  // Serve static files in production if dist exists
  if (fs.existsSync(distPath)) {
    try {
      await server.register(fastifyStatic, {
        root: distPath,
        prefix: '/',
      });

      server.setNotFoundHandler((req, reply) => {
        if (req.raw.url && !req.raw.url.startsWith('/api')) {
          reply.sendFile('index.html');
        } else {
          reply.status(404).send({ error: 'Endpoint Not Found' });
        }
      });
    } catch (err) {
      server.log.warn('Could not register static folder: ' + err);
    }
  }

  // Health check
  server.get('/api/health', async () => {
    return {
      status: 'online',
      system: 'Forge2D Level Studio Authoritative Fastify Backend',
      timestamp: new Date().toISOString(),
    };
  });

  const PORT = Number(process.env.PORT) || 3002;
  const HOST = '127.0.0.1';

  try {
    await server.listen({ port: PORT, host: HOST });
    console.log(`\n⚡ Forge2D Backend Server running at http://${HOST}:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
