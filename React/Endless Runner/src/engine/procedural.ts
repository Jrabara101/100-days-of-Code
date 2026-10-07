import { Mulberry32 } from './prng';
import { BiomeType, CollectibleEntity, ObstacleEntity, TrackChunk, LaneIndex, ObstacleType, PowerUpType } from '../types/game';

export const CHUNK_LENGTH = 160; // Distance of each track chunk in meters
export const LANES_COUNT = 3;
export const LANE_DISTANCE = 3.2; // Virtual distance between lanes in perspective space

export function getBiomeForDistance(distanceMeters: number): BiomeType {
  const cycle = Math.floor(distanceMeters / 1000) % 3;
  if (cycle === 0) return 'neon_city';
  if (cycle === 1) return 'sky_bridge';
  return 'magma_vault';
}

/**
 * Procedural Track Generator
 * Produces deterministic chunks based on seed and chunkIndex.
 * Guarantees at least one traversable path at all points.
 */
export class ProceduralTrackDirector {
  private baseSeed: string;

  constructor(seed: string) {
    this.baseSeed = seed;
  }

  public generateChunk(chunkIndex: number): TrackChunk {
    const zStart = chunkIndex * CHUNK_LENGTH;
    const biome = getBiomeForDistance(zStart);
    // Create a deterministic sub-seed for this chunk
    const chunkPrng = new Mulberry32(`${this.baseSeed}_chunk_${chunkIndex}`);

    const obstacles: ObstacleEntity[] = [];
    const collectibles: CollectibleEntity[] = [];

    // First chunk (0-160m) is introductory sprint runway: coins and 1 powerup, no fatal obstacles
    if (chunkIndex === 0) {
      // Intro coin lines in center lane
      for (let z = 30; z < 140; z += 8) {
        collectibles.push({
          id: `chunk0_coin_${z}`,
          type: 'coin',
          lane: 1,
          zPos: z,
          yOffset: 0.5,
          collected: false,
        });
      }
      collectibles.push({
        id: `chunk0_powerup`,
        type: 'coin_magnet',
        lane: 0,
        zPos: 110,
        yOffset: 0.6,
        collected: false,
      });

      return {
        id: `chunk_${chunkIndex}`,
        zStart,
        length: CHUNK_LENGTH,
        biome,
        obstacles,
        collectibles,
      };
    }

    // Number of hazard clusters per chunk increases with chunk index (up to max)
    const clusterCount = Math.min(6, 3 + Math.floor(chunkIndex / 4));
    const step = (CHUNK_LENGTH - 20) / clusterCount;

    for (let c = 0; c < clusterCount; c++) {
      const clusterZ = zStart + 20 + c * step + chunkPrng.range(-4, 4);

      // Select pattern: 1-lane barrier, 2-lane hurdle combo, pitfall, or moving train
      const patternType = chunkPrng.rangeInt(0, 4);

      if (patternType === 0) {
        // Single low barrier with coins floating above to encourage jumping
        const lane = chunkPrng.choice<LaneIndex>([0, 1, 2]);
        obstacles.push({
          id: `obs_${chunkIndex}_${c}_low`,
          type: 'barrier_low',
          lane,
          zPos: clusterZ,
          height: 1.2,
          width: 2.2,
          cleared: false,
        });

        // Floating reward coins over the barrier
        for (let cz = -4; cz <= 4; cz += 4) {
          collectibles.push({
            id: `col_${chunkIndex}_${c}_jumpcoin_${cz}`,
            type: 'coin',
            lane,
            zPos: clusterZ + cz,
            yOffset: 2.2,
            collected: false,
          });
        }
      } else if (patternType === 1) {
        // High barrier (slide underneath)
        const lane = chunkPrng.choice<LaneIndex>([0, 1, 2]);
        obstacles.push({
          id: `obs_${chunkIndex}_${c}_high`,
          type: 'barrier_high',
          lane,
          zPos: clusterZ,
          height: 2.6,
          width: 2.4,
          cleared: false,
        });

        // Low sliding coins
        for (let cz = -4; cz <= 4; cz += 4) {
          collectibles.push({
            id: `col_${chunkIndex}_${c}_slidecoin_${cz}`,
            type: 'coin',
            lane,
            zPos: clusterZ + cz,
            yOffset: 0.2,
            collected: false,
          });
        }
      } else if (patternType === 2) {
        // 2-lane blockage: leaves 1 safe lane to test reflex lateral shift
        const blockedLanes = chunkPrng.choice<LaneIndex[]>([
          [0, 1], // lane 2 is safe
          [1, 2], // lane 0 is safe
          [0, 2], // lane 1 is safe
        ]);

        for (const lane of blockedLanes) {
          const type: ObstacleType = chunkPrng.chance(0.6) ? 'barrier_low' : 'barrier_high';
          obstacles.push({
            id: `obs_${chunkIndex}_${c}_wall_${lane}`,
            type,
            lane,
            zPos: clusterZ,
            height: type === 'barrier_low' ? 1.2 : 2.6,
            width: 2.4,
            cleared: false,
          });
        }

        // Place a high-value coin arc in the safe lane
        const safeLane: LaneIndex = [0, 1, 2].find((l) => !blockedLanes.includes(l as LaneIndex)) as LaneIndex;
        for (let cz = -6; cz <= 6; cz += 3) {
          collectibles.push({
            id: `col_${chunkIndex}_${c}_safecoin_${cz}`,
            type: 'coin',
            lane: safeLane,
            zPos: clusterZ + cz,
            yOffset: 0.5,
            collected: false,
          });
        }
      } else if (patternType === 3) {
        // Pitfall or Moving Cyber Drifter
        if (chunkPrng.chance(0.5) && chunkIndex >= 2) {
          // Moving train hazard
          const lane = chunkPrng.choice<LaneIndex>([0, 1, 2]);
          obstacles.push({
            id: `obs_${chunkIndex}_${c}_train`,
            type: 'moving_train',
            lane,
            zPos: clusterZ + 15, // Starts slightly ahead and hurtles backward
            height: 2.8,
            width: 2.5,
            cleared: false,
          });
        } else {
          // Pitfall hole
          const lane = chunkPrng.choice<LaneIndex>([0, 1, 2]);
          obstacles.push({
            id: `obs_${chunkIndex}_${c}_pit`,
            type: 'pitfall',
            lane,
            zPos: clusterZ,
            height: 0.2,
            width: 2.8,
            cleared: false,
          });
        }
      }

      // Occasional powerup spawn in cluster
      if (chunkPrng.chance(0.35)) {
        const pLane = chunkPrng.choice<LaneIndex>([0, 1, 2]);
        const pTypes: PowerUpType[] = ['coin_magnet', 'shield', 'overdrive_boost', 'multiplier_2x'];
        const chosenPower = chunkPrng.choice<PowerUpType>(pTypes);
        collectibles.push({
          id: `powerup_${chunkIndex}_${c}`,
          type: chosenPower,
          lane: pLane,
          zPos: clusterZ + 12,
          yOffset: 0.7,
          collected: false,
        });
      }
    }

    return {
      id: `chunk_${chunkIndex}`,
      zStart,
      length: CHUNK_LENGTH,
      biome,
      obstacles,
      collectibles,
    };
  }
}
