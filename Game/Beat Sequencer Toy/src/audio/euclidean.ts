/**
 * Generates a Euclidean rhythm pattern using Bjorklund's algorithm.
 * @param steps Total number of steps (typically 16)
 * @param pulses Number of active hits (pulses)
 * @param rotation Shift offset in steps
 */
export function generateEuclideanRhythm(steps: number = 16, pulses: number, rotation: number = 0): boolean[] {
  if (pulses <= 0) return new Array(steps).fill(false);
  if (pulses >= steps) return new Array(steps).fill(true);

  // Distribute pulses evenly using Bresenham / Euclidean distribution
  const pattern: boolean[] = [];
  let previous = -1;

  for (let i = 0; i < steps; i++) {
    const current = Math.floor((i * pulses) / steps);
    pattern.push(current !== previous);
    previous = current;
  }

  // Apply rotation
  if (rotation !== 0) {
    const rot = ((rotation % steps) + steps) % steps;
    return [...pattern.slice(steps - rot), ...pattern.slice(0, steps - rot)];
  }

  return pattern;
}

/**
 * Intelligent Chaos pattern generation with musical weighting
 */
export function generateChaosTrack(trackId: string): boolean[] {
  const steps: boolean[] = new Array(16).fill(false);

  for (let i = 0; i < 16; i++) {
    const isDownbeat = i % 4 === 0;
    const isBackbeat = i === 4 || i === 12;

    switch (trackId) {
      case 'kick':
        // Strong tendency on beats 1 and 3 (0 and 8), occasional offbeats
        steps[i] = (i === 0) || (i === 8 && Math.random() < 0.85) || (isDownbeat && Math.random() < 0.6) || (Math.random() < 0.18);
        break;

      case 'snare':
        // Snare on 2 and 4 (steps 4 and 12), with occasional ghost notes
        steps[i] = isBackbeat || (Math.random() < 0.12);
        break;

      case 'hihat':
        // High density groove (8th notes or 16th syncopations)
        steps[i] = (i % 2 === 0) ? Math.random() < 0.95 : Math.random() < 0.45;
        break;

      case 'openhat':
        // Off-beat open hats (2, 6, 10, 14)
        steps[i] = (i % 4 === 2) ? Math.random() < 0.75 : Math.random() < 0.08;
        break;

      case 'clap':
        // Accentuated syncopation or doubling the snare
        steps[i] = (isBackbeat && Math.random() < 0.65) || (Math.random() < 0.22);
        break;

      case 'subbass':
        // Driving sub groove supporting the kick
        steps[i] = (i === 0 || i === 6 || i === 10) ? Math.random() < 0.8 : Math.random() < 0.2;
        break;

      default:
        steps[i] = Math.random() < 0.25;
        break;
    }
  }

  return steps;
}
