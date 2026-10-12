import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { saveProject, getProject, listProjects, deleteProject } from './db';
import { optimizeAtlasWithMaxRects } from './repacker';

const fastify = Fastify({
  logger: true,
});

const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Register plugins
fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

fastify.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

fastify.register(fastifyStatic, {
  root: uploadsDir,
  prefix: '/uploads/',
});

// Health check
fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Upload sprite sheet
fastify.post('/api/upload', async (req, reply) => {
  const data = await req.file();
  if (!data) {
    return reply.status(400).send({ error: 'No file uploaded' });
  }

  const buffer = await data.toBuffer();
  const metadata = await sharp(buffer).metadata();

  const ext = path.extname(data.filename) || '.png';
  const uniqueName = `sprite_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
  const filePath = path.join(uploadsDir, uniqueName);

  await fs.promises.writeFile(filePath, buffer);

  return {
    success: true,
    url: `/uploads/${uniqueName}`,
    filename: data.filename,
    dimensions: {
      width: metadata.width || 0,
      height: metadata.height || 0,
    },
    format: metadata.format,
  };
});

// Save project
fastify.post('/api/atlas', async (req, reply) => {
  const body = req.body as any;
  if (!body || !body.id || !body.title) {
    return reply.status(400).send({ error: 'Project id and title are required' });
  }

  saveProject(body.id, body.title, body, body.imageUrl || '');
  return { success: true, id: body.id };
});

// List projects
fastify.get('/api/atlas', async () => {
  const list = listProjects();
  return { success: true, projects: list };
});

// Get project by ID
fastify.get('/api/atlas/:id', async (req, reply) => {
  const { id } = req.params as { id: string };
  const record = getProject(id);
  if (!record) {
    return reply.status(404).send({ error: 'Project not found' });
  }

  return {
    success: true,
    project: JSON.parse(record.data),
  };
});

// Delete project
fastify.delete('/api/atlas/:id', async (req) => {
  const { id } = req.params as { id: string };
  deleteProject(id);
  return { success: true, id };
});

// Sprite Sheet Compactor & Redundancy Auditor
fastify.post('/api/atlas/optimize', async (req, reply) => {
  const body = req.body as any;
  if (!body || !body.frames || !body.imageUrl) {
    return reply.status(400).send({ error: 'Missing frames or imageUrl in request body' });
  }

  let imageBuffer: Buffer;

  if (body.imageUrl.startsWith('data:image/')) {
    // Base64 data URL
    const base64Data = body.imageUrl.replace(/^data:image\/\w+;base64,/, '');
    imageBuffer = Buffer.from(base64Data, 'base64');
  } else if (body.imageUrl.startsWith('/uploads/')) {
    // Local uploaded file
    const localPath = path.join(process.cwd(), body.imageUrl);
    if (!fs.existsSync(localPath)) {
      return reply.status(404).send({ error: 'Sprite image file not found on server' });
    }
    imageBuffer = await fs.promises.readFile(localPath);
  } else {
    return reply.status(400).send({ error: 'Unsupported imageUrl format' });
  }

  try {
    const result = await optimizeAtlasWithMaxRects(imageBuffer, body.frames, uploadsDir);
    return {
      success: true,
      optimization: result,
    };
  } catch (err: any) {
    fastify.log.error(err);
    return reply.status(500).send({ error: err.message || 'Optimization failed' });
  }
});

const PORT = 3001;
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Fastify Sprite Studio backend running on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
