import { GameTag } from '../../src/types/game';

/**
 * Calculates cosine similarity between user tag weights and a game's tag weights:
 * similarity = (A · B) / (||A|| * ||B||)
 */
export function calculateCosineSimilarity(
  userWeights: { name: string; weight: number }[],
  gameTags: GameTag[]
): number {
  if (!userWeights || userWeights.length === 0) {
    return 1.0;
  }

  // Create lookup maps
  const userMap = new Map<string, number>();
  let userNormSq = 0;
  for (const item of userWeights) {
    const val = item.weight / 100; // normalize 0-100 to 0-1
    if (val > 0) {
      userMap.set(item.name.toLowerCase(), val);
      userNormSq += val * val;
    }
  }

  if (userMap.size === 0 || userNormSq === 0) {
    return 1.0;
  }

  const gameMap = new Map<string, number>();
  let gameNormSq = 0;
  for (const tag of gameTags) {
    gameMap.set(tag.name.toLowerCase(), tag.weight);
    gameNormSq += tag.weight * tag.weight;
  }

  if (gameNormSq === 0) {
    return 0;
  }

  // Dot product
  let dotProduct = 0;
  for (const [tagName, userVal] of userMap.entries()) {
    const gameVal = gameMap.get(tagName) || 0;
    dotProduct += userVal * gameVal;
  }

  const similarity = dotProduct / (Math.sqrt(userNormSq) * Math.sqrt(gameNormSq));
  return Math.max(0, Math.min(1, similarity));
}

/**
 * Checks if a game contains any strictly excluded tags
 */
export function containsExcludedTags(gameTags: GameTag[], excludeTags: string[]): boolean {
  if (!excludeTags || excludeTags.length === 0) return false;
  
  const excludeSet = new Set(excludeTags.map(t => t.toLowerCase()));
  return gameTags.some(tag => excludeSet.has(tag.name.toLowerCase()) && tag.weight > 0.05);
}
