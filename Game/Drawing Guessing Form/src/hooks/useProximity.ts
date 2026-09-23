/**
 * Fast Levenshtein Edit Distance & Warm Guess Proximity Engine
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  const s1 = a.trim().toLowerCase();
  const s2 = b.trim().toLowerCase();

  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const v0: number[] = [];
  const v1: number[] = [];

  for (let i = 0; i <= s2.length; i++) {
    v0[i] = i;
  }

  for (let i = 0; i < s1.length; i++) {
    v1[0] = i + 1;

    for (let j = 0; j < s2.length; j++) {
      const cost = s1[i] === s2[j] ? 0 : 1;
      v1[j + 1] = Math.min(
        v1[j] + 1,       // insertion
        v0[j + 1] + 1,   // deletion
        v0[j] + cost     // substitution
      );
    }

    for (let j = 0; j <= s2.length; j++) {
      v0[j] = v1[j];
    }
  }

  return v1[s2.length];
}

export interface ProximityResult {
  isExact: boolean;
  isWarm: boolean;
  distance: number;
}

export function evaluateGuessProximity(guess: string, targetWord: string): ProximityResult {
  const cleanGuess = guess.trim().toLowerCase();
  const cleanTarget = targetWord.trim().toLowerCase();

  if (!cleanGuess || !cleanTarget) {
    return { isExact: false, isWarm: false, distance: 99 };
  }

  if (cleanGuess === cleanTarget) {
    return { isExact: true, isWarm: false, distance: 0 };
  }

  const distance = calculateLevenshteinDistance(cleanGuess, cleanTarget);

  // Consider warm if:
  // - Distance is 1 (e.g. GIRAFE vs GIRAFFE, SPARROW vs SPAROW)
  // - Distance is 2 AND word is at least 5 letters long (e.g. GIRAF vs GIRAFFE)
  const isWarm =
    (distance === 1 && cleanTarget.length >= 3) ||
    (distance === 2 && cleanTarget.length >= 5 && Math.abs(cleanGuess.length - cleanTarget.length) <= 2);

  return {
    isExact: false,
    isWarm,
    distance,
  };
}
