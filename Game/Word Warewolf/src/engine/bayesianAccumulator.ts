import { WordPair } from './types';

/**
 * Computes semantic divergence of a given clue string against the Civilian and Werewolf clue sets.
 * Returns a score between 0.0 (strongly civilian / safe) and 1.0 (strongly divergent / werewolf-like).
 */
export function computeClueDivergence(clueText: string, wordPair: WordPair): number {
  if (!clueText || clueText.trim().length === 0) {
    return 0.5; // neutral prior
  }

  const clean = clueText.trim().toUpperCase();

  // Exact or direct match with werewolf clues
  const isWerewolfExact = wordPair.werewolfClues.some(c => clean.includes(c) || c.includes(clean));
  // Exact or direct match with civilian clues
  const isCivilianExact = wordPair.civilianClues.some(c => clean.includes(c) || c.includes(clean));

  if (isWerewolfExact && !isCivilianExact) {
    return 0.92;
  }
  if (isCivilianExact && !isWerewolfExact) {
    return 0.12;
  }
  if (isCivilianExact && isWerewolfExact) {
    return 0.48; // ambiguous overlap
  }

  // Character similarity / lexical heuristic for words not in the predefined set
  let civOverlapMax = 0;
  for (const c of wordPair.civilianClues) {
    const sim = jaccardSimilarity(clean, c);
    if (sim > civOverlapMax) civOverlapMax = sim;
  }

  let wolfOverlapMax = 0;
  for (const w of wordPair.werewolfClues) {
    const sim = jaccardSimilarity(clean, w);
    if (sim > wolfOverlapMax) wolfOverlapMax = sim;
  }

  if (wolfOverlapMax > civOverlapMax + 0.2) {
    return Math.min(0.88, 0.5 + (wolfOverlapMax - civOverlapMax));
  } else if (civOverlapMax > wolfOverlapMax + 0.2) {
    return Math.max(0.15, 0.5 - (civOverlapMax - wolfOverlapMax));
  }

  // Generic divergence for novel words
  return 0.45 + (Math.random() * 0.15 - 0.075);
}

function jaccardSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.split(''));
  const set2 = new Set(str2.split(''));
  let intersection = 0;
  for (const char of set1) {
    if (set2.has(char)) intersection++;
  }
  const union = set1.size + set2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Updates Bayesian suspicion vector P(W_i | C_{1:k}) for N players.
 *
 * Formula:
 * P(W_i | C_{1:k}) = \frac{P(C_k | W_i) * P(W_i | C_{1:k-1})}{\sum_{j=1}^N P(C_k | W_j) * P(W_j | C_{1:k-1})}
 */
export function updateBayesianSuspicionVector(
  currentPrior: number[], // Array of size N, sums to 1.0
  speakerIndex: number,
  divergenceScore: number // D in [0, 1]
): number[] {
  const N = currentPrior.length;
  const likelihoods = new Array(N).fill(1.0);

  // If speaker is werewolf, high divergence is expected:
  // P(C_speaker | W_speaker) increases with divergence score
  // Mapping divergence D in [0, 1] to a likelihood multiplier
  const speakerLikelihood = Math.max(0.05, Math.min(3.5, 0.2 + divergenceScore * 3.0));
  likelihoods[speakerIndex] = speakerLikelihood;

  // For non-speakers j != speakerIndex, if the clue is highly divergent, the chance that
  // another player j is the werewolf is slightly reduced (since the speaker looks guilty)
  const nonSpeakerLikelihood = Math.max(0.2, 1.0 - (divergenceScore - 0.5) * 0.5);
  for (let j = 0; j < N; j++) {
    if (j !== speakerIndex) {
      likelihoods[j] = nonSpeakerLikelihood;
    }
  }

  // Calculate unnormalized posteriors
  const unnormalized = currentPrior.map((prior, i) => prior * likelihoods[i]);
  const sum = unnormalized.reduce((acc, val) => acc + val, 0);

  // Normalize back to probability simplex
  return unnormalized.map(val => (sum > 0 ? val / sum : 1 / N));
}
