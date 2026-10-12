import { prisma } from './db';
import { SAMPLE_REPLAYS } from '../src/game/SampleReplays';

async function seed() {
  console.log('Seeding SQLite database with canonical tournament replay archives...');

  for (const [key, payload] of Object.entries(SAMPLE_REPLAYS)) {
    const { metadata } = payload;
    await prisma.replay.upsert({
      where: { replayId: metadata.replayId },
      update: {
        gameTitle: metadata.gameTitle,
        authorName: metadata.authorName,
        mapSeed: metadata.mapSeed || null,
        totalTicks: metadata.totalTicks,
        durationMs: metadata.durationMs,
        tickRate: metadata.tickRate,
        checksum: metadata.checksum,
        markersJson: JSON.stringify(metadata.markers),
        payloadJson: JSON.stringify(payload),
        isVerified: true,
        verifiedAt: new Date(),
      },
      create: {
        replayId: metadata.replayId,
        gameTitle: metadata.gameTitle,
        authorName: metadata.authorName,
        mapSeed: metadata.mapSeed || null,
        totalTicks: metadata.totalTicks,
        durationMs: metadata.durationMs,
        tickRate: metadata.tickRate,
        checksum: metadata.checksum,
        markersJson: JSON.stringify(metadata.markers),
        payloadJson: JSON.stringify(payload),
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    console.log(`Seeded replay: [${metadata.replayId}] ${metadata.gameTitle}`);
  }

  console.log('Seeding completed successfully.');
}

seed().catch(console.error);
