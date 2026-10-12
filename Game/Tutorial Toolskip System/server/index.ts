import Fastify from 'fastify';
import cors from '@fastify/cors';
import { prisma } from './db';
import { verifyReplayPayload } from '../src/engine/DeterministicVerifier';
import { ReplayPayload } from '../src/types/replay';

const fastify = Fastify({
  logger: true,
  bodyLimit: 100 * 1024 * 1024, // Support up to 100MB telemetry packages
});

async function main() {
  await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  // Health check
  fastify.get('/api/health', async () => {
    return { status: 'ok', service: 'Game Telemetry Black-Box API', timestamp: new Date().toISOString() };
  });

  // GET /api/replays - List archives
  fastify.get('/api/replays', async () => {
    const list = await prisma.replay.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        replayId: true,
        gameTitle: true,
        authorName: true,
        mapSeed: true,
        recordedAt: true,
        totalTicks: true,
        durationMs: true,
        tickRate: true,
        checksum: true,
        markersJson: true,
        isVerified: true,
        verifiedAt: true,
        createdAt: true,
      },
    });

    return list.map(item => ({
      ...item,
      markers: JSON.parse(item.markersJson),
    }));
  });

  // POST /api/replays - Upload compressed replay manifest + metadata with SHA-256 hash
  fastify.post('/api/replays', async (request, reply) => {
    const body = request.body as {
      metadata: ReplayPayload['metadata'];
      payload: ReplayPayload;
      compressedData?: string;
    };

    if (!body || !body.metadata) {
      return reply.status(400).send({ error: 'Missing replay metadata or payload' });
    }

    const { metadata, payload, compressedData } = body;
    const markersJson = JSON.stringify(metadata.markers || []);
    const payloadJson = compressedData || JSON.stringify(payload);

    try {
      const saved = await prisma.replay.upsert({
        where: { replayId: metadata.replayId },
        update: {
          gameTitle: metadata.gameTitle,
          authorName: metadata.authorName,
          mapSeed: metadata.mapSeed || null,
          totalTicks: metadata.totalTicks,
          durationMs: metadata.durationMs,
          tickRate: metadata.tickRate || 60,
          checksum: metadata.checksum,
          markersJson,
          payloadJson,
        },
        create: {
          replayId: metadata.replayId,
          gameTitle: metadata.gameTitle,
          authorName: metadata.authorName,
          mapSeed: metadata.mapSeed || null,
          totalTicks: metadata.totalTicks,
          durationMs: metadata.durationMs,
          tickRate: metadata.tickRate || 60,
          checksum: metadata.checksum,
          markersJson,
          payloadJson,
        },
      });

      return reply.status(201).send({
        success: true,
        replayId: saved.replayId,
        id: saved.id,
        checksum: saved.checksum,
        message: 'Replay package ingested successfully into flight recorder archive',
      });
    } catch (err: unknown) {
      request.log.error(err);
      const message = err instanceof Error ? err.message : String(err);
      return reply.status(500).send({ error: 'Failed to archive replay', details: message });
    }
  });

  // GET /api/replays/:id - Stream decompressed replay chunk payload
  fastify.get('/api/replays/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const record = await prisma.replay.findFirst({
      where: {
        OR: [{ replayId: id }, { id }],
      },
    });

    if (!record) {
      return reply.status(404).send({ error: `Replay archive with ID "${id}" not found` });
    }

    try {
      let parsedPayload: unknown;
      try {
        parsedPayload = JSON.parse(record.payloadJson);
      } catch {
        parsedPayload = { compressedData: record.payloadJson };
      }

      return reply.send({
        replayId: record.replayId,
        metadata: {
          replayId: record.replayId,
          gameTitle: record.gameTitle,
          authorName: record.authorName,
          mapSeed: record.mapSeed,
          recordedAt: record.recordedAt,
          totalTicks: record.totalTicks,
          durationMs: record.durationMs,
          tickRate: record.tickRate,
          checksum: record.checksum,
          markers: JSON.parse(record.markersJson),
        },
        payload: parsedPayload,
        isVerified: record.isVerified,
        verifiedAt: record.verifiedAt,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return reply.status(500).send({ error: 'Failed to parse replay payload', details: message });
    }
  });

  // POST /api/replays/:id/verify - Deterministic headless replay verification
  fastify.post('/api/replays/:id/verify', async (request, reply) => {
    const { id } = request.params as { id: string };

    const record = await prisma.replay.findFirst({
      where: {
        OR: [{ replayId: id }, { id }],
      },
    });

    if (!record) {
      return reply.status(404).send({ error: `Replay archive "${id}" not found for verification` });
    }

    try {
      const payload: ReplayPayload = JSON.parse(record.payloadJson);
      const verification = await verifyReplayPayload(payload);

      await prisma.replay.update({
        where: { id: record.id },
        data: {
          isVerified: verification.valid,
          verifiedAt: new Date(),
          verificationLog: JSON.stringify(verification),
        },
      });

      return reply.send({
        replayId: record.replayId,
        valid: verification.valid,
        verification,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return reply.status(500).send({ error: 'Deterministic verification failed', details: message });
    }
  });

  // GET /api/replays/:id/export-video - Server-side utility / clip metadata endpoint
  fastify.get('/api/replays/:id/export-video', async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as { startTick?: string; endTick?: string; fps?: string };

    const record = await prisma.replay.findFirst({
      where: {
        OR: [{ replayId: id }, { id }],
      },
    });

    if (!record) {
      return reply.status(404).send({ error: `Replay archive "${id}" not found` });
    }

    const startTick = parseInt(query.startTick || '0', 10);
    const endTick = parseInt(query.endTick || String(record.totalTicks), 10);
    const fps = parseInt(query.fps || '60', 10);

    return reply.send({
      replayId: record.replayId,
      format: 'video/webm; codecs=vp9',
      exportUrl: `/api/replays/${record.replayId}/stream`,
      durationMs: Math.round(((endTick - startTick) / fps) * 1000),
      startTick,
      endTick,
      fps,
      clientExportSupported: true,
      instructions: 'Client-side frame-perfect canvas MediaRecorder rendering is enabled.',
    });
  });

  const PORT = parseInt(process.env.PORT || '3005', 10);
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`[Fastify] Game Replay Ingestion Server listening on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
