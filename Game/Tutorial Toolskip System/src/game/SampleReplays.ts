import { INPUT_MASK, KeyframeSnapshot, PlayerInputPacket, ReplayEventMarker, ReplayMetadata, ReplayPayload } from '../types/replay';
import { GameSimulation } from './GameSimulation';

export function generateSyntheticMatch(
  replayId: string,
  gameTitle: string,
  authorName: string,
  durationTicks: number = 1200,
  playStyle: 'clutch' | 'speedrun' | 'rival' = 'clutch'
): ReplayPayload {
  const sim = new GameSimulation();
  sim.reset(playStyle === 'speedrun' ? 101 : 42);

  const inputs: PlayerInputPacket[] = [];
  const keyframes: KeyframeSnapshot[] = [];
  const markers: ReplayEventMarker[] = [];

  let markerCounter = 1;
  sim.onEventMarker = (m) => {
    markers.push({
      id: `m_${markerCounter++}`,
      ...m,
    });
  };

  // Initial keyframe at tick 0
  keyframes.push(sim.createSnapshot());

  for (let t = 0; t < durationTicks; t++) {
    let keys = 0;
    const progress = t / durationTicks;

    // Patterned player movement based on playstyle
    let targetX = 600 + Math.sin(t * 0.04) * (playStyle === 'speedrun' ? 450 : 300);
    let targetY = 350 + Math.cos(t * 0.03) * 220;

    if (playStyle === 'speedrun') {
      targetX = 200 + progress * 800;
      targetY = 250 + Math.sin(t * 0.08) * 150;
    }

    if (sim.player.x < targetX - 10) keys |= INPUT_MASK.RIGHT;
    else if (sim.player.x > targetX + 10) keys |= INPUT_MASK.LEFT;

    if (sim.player.y < targetY - 10) keys |= INPUT_MASK.DOWN;
    else if (sim.player.y > targetY + 10) keys |= INPUT_MASK.UP;

    // Firing rhythm
    if (t % 10 < 6) {
      keys |= INPUT_MASK.FIRE;
    }

    // Occasional dash
    if (t % 150 === 30) {
      keys |= INPUT_MASK.DASH;
    }

    // EMP ability during intense swarm
    if (t === 450 || t === 820) {
      keys |= INPUT_MASK.ABILITY;
    }

    // Cursor targeting nearest enemy or boss
    let aimX = 600;
    let aimY = 200;
    if (sim.enemies.length > 0) {
      aimX = sim.enemies[0].x;
      aimY = sim.enemies[0].y;
    }

    const inputPacket: PlayerInputPacket = {
      tick: t,
      dt: 1 / 60,
      keys,
      cursor: { x: Math.round(aimX), y: Math.round(aimY) },
    };

    inputs.push(inputPacket);
    sim.step(inputPacket);

    // Save keyframe every 60 ticks (1s interval)
    if (sim.tick % 60 === 0) {
      keyframes.push(sim.createSnapshot());
    }
  }

  // Ensure end keyframe
  keyframes.push(sim.createSnapshot());

  const totalTicks = durationTicks;
  const durationMs = Math.round((totalTicks / 60) * 1000);

  const metadata: ReplayMetadata = {
    replayId,
    gameTitle,
    authorName,
    mapSeed: `SEED-${playStyle.toUpperCase()}-77`,
    recordedAt: new Date(Date.now() - 3600000).toISOString(),
    totalTicks,
    durationMs,
    tickRate: 60,
    checksum: `sha256-${replayId}-${playStyle}-verified`,
    markers,
  };

  return {
    metadata,
    keyframes,
    inputs,
  };
}

export const SAMPLE_REPLAYS: Record<string, ReplayPayload> = {
  'clutch-solo': generateSyntheticMatch(
    'rep-clutch-001',
    'Sector 7 Breach: Solo Clutch Wipeout',
    'Aether_Ace',
    1500,
    'clutch'
  ),
  'speedrun-pb': generateSyntheticMatch(
    'rep-speedrun-002',
    'Sector Alpha Speedrun (18.4s PB)',
    'HyperDrift_99',
    1100,
    'speedrun'
  ),
  'ghost-rival': generateSyntheticMatch(
    'rep-ghost-003',
    'Shadow Echo: Rival Runner "Vortex_44"',
    'Vortex_44',
    1400,
    'rival'
  ),
};
