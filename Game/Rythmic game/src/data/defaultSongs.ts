import { Beatmap } from '../types/game';

export const DEFAULT_SONGS: Beatmap[] = [
  {
    id: 'tutorial-01',
    title: 'Drop & Tap (Zero-Friction Tutorial)',
    artist: 'CyberCore Sound Lab',
    bpm: 120,
    synthTheme: 'synthwave',
    offsetMs: 50,
    difficulty: 'Easy',
    starRating: 2,
    durationMs: 38000,
    notes: [
      { id: 'n1', lane: 0, targetTimeMs: 1500, type: 'tap' },
      { id: 'n2', lane: 1, targetTimeMs: 2000, type: 'tap' },
      { id: 'n3', lane: 2, targetTimeMs: 2500, type: 'tap' },
      { id: 'n4', lane: 3, targetTimeMs: 3000, type: 'tap' },
      // Simultaneous & rhythm test
      { id: 'n5', lane: 1, targetTimeMs: 4000, type: 'tap' },
      { id: 'n6', lane: 2, targetTimeMs: 4000, type: 'tap' },
      // First Hold Note
      { id: 'n7', lane: 0, targetTimeMs: 5000, durationMs: 1500, type: 'hold' },
      { id: 'n8', lane: 3, targetTimeMs: 7000, durationMs: 1500, type: 'hold' },
      // Fever Gold Note
      { id: 'n9', lane: 1, targetTimeMs: 9000, type: 'tap', isFever: true },
      { id: 'n10', lane: 2, targetTimeMs: 9500, type: 'tap', isFever: true },
      // Steady 4/4 sequence
      { id: 'n11', lane: 0, targetTimeMs: 11000, type: 'tap' },
      { id: 'n12', lane: 1, targetTimeMs: 11500, type: 'tap' },
      { id: 'n13', lane: 2, targetTimeMs: 12000, type: 'tap' },
      { id: 'n14', lane: 3, targetTimeMs: 12500, type: 'tap' },
      { id: 'n15', lane: 2, targetTimeMs: 13000, type: 'tap' },
      { id: 'n16', lane: 1, targetTimeMs: 13500, type: 'tap' },
      { id: 'n17', lane: 0, targetTimeMs: 14000, durationMs: 2000, type: 'hold' },
      { id: 'n18', lane: 3, targetTimeMs: 14000, durationMs: 2000, type: 'hold' },
      // Climax
      { id: 'n19', lane: 1, targetTimeMs: 17000, type: 'tap', isFever: true },
      { id: 'n20', lane: 2, targetTimeMs: 17500, type: 'tap' },
      { id: 'n21', lane: 1, targetTimeMs: 18000, type: 'tap' },
      { id: 'n22', lane: 2, targetTimeMs: 18500, type: 'tap', isFever: true },
      { id: 'n23', lane: 0, targetTimeMs: 19000, type: 'tap' },
      { id: 'n24', lane: 3, targetTimeMs: 19000, type: 'tap' },
      { id: 'n25', lane: 1, targetTimeMs: 20000, durationMs: 2500, type: 'hold', isFever: true },
    ]
  },
  {
    id: 'cyber-overdrive',
    title: 'CYBER//OVERDRIVE',
    artist: 'K-Pulse x Velocity',
    bpm: 140,
    synthTheme: 'cyberpunk',
    offsetMs: 30,
    difficulty: 'Normal',
    starRating: 5,
    durationMs: 45000,
    notes: generateCyberOverdriveNotes()
  },
  {
    id: 'neon-horizon',
    title: 'NEON HORIZON (Fever Overdrive)',
    artist: 'Aura Vector',
    bpm: 160,
    synthTheme: 'drumandbass',
    offsetMs: 20,
    difficulty: 'Hard',
    starRating: 7,
    durationMs: 50000,
    notes: generateNeonHorizonNotes()
  },
  {
    id: 'quantum-velocity',
    title: 'QUANTUM VELOCITY',
    artist: 'Hyperion Zero',
    bpm: 175,
    synthTheme: 'chiptune',
    offsetMs: 15,
    difficulty: 'Expert',
    starRating: 9,
    durationMs: 48000,
    notes: generateQuantumVelocityNotes()
  }
];

function generateCyberOverdriveNotes(): Beatmap['notes'] {
  const notes: Beatmap['notes'] = [];
  const beatIntervalMs = (60 / 140) * 1000;
  let idCount = 1;

  for (let bar = 1; bar <= 24; bar++) {
    const barStart = 1000 + (bar - 1) * 4 * beatIntervalMs;
    if (bar % 4 === 1) {
      notes.push({ id: `co_${idCount++}`, lane: 0, targetTimeMs: Math.round(barStart), type: 'tap' });
      notes.push({ id: `co_${idCount++}`, lane: 1, targetTimeMs: Math.round(barStart + beatIntervalMs), type: 'tap' });
      notes.push({ id: `co_${idCount++}`, lane: 2, targetTimeMs: Math.round(barStart + 2 * beatIntervalMs), type: 'tap' });
      notes.push({ id: `co_${idCount++}`, lane: 3, targetTimeMs: Math.round(barStart + 3 * beatIntervalMs), type: 'tap' });
    } else if (bar % 4 === 2) {
      notes.push({ id: `co_${idCount++}`, lane: 1, targetTimeMs: Math.round(barStart), durationMs: Math.round(beatIntervalMs * 1.8), type: 'hold' });
      notes.push({ id: `co_${idCount++}`, lane: 2, targetTimeMs: Math.round(barStart + 2 * beatIntervalMs), type: 'tap', isFever: true });
      notes.push({ id: `co_${idCount++}`, lane: 3, targetTimeMs: Math.round(barStart + 3 * beatIntervalMs), type: 'tap' });
    } else if (bar % 4 === 3) {
      for (let s = 0; s < 4; s++) {
        notes.push({
          id: `co_${idCount++}`,
          lane: (s % 2 === 0 ? 0 : 3) as 0 | 3,
          targetTimeMs: Math.round(barStart + s * (beatIntervalMs / 2)),
          type: 'tap',
          isFever: s === 3
        });
      }
      notes.push({ id: `co_${idCount++}`, lane: 1, targetTimeMs: Math.round(barStart + 2 * beatIntervalMs), type: 'tap' });
      notes.push({ id: `co_${idCount++}`, lane: 2, targetTimeMs: Math.round(barStart + 3 * beatIntervalMs), type: 'tap' });
    } else {
      notes.push({ id: `co_${idCount++}`, lane: 0, targetTimeMs: Math.round(barStart), type: 'tap' });
      notes.push({ id: `co_${idCount++}`, lane: 3, targetTimeMs: Math.round(barStart), type: 'tap' });
      notes.push({ id: `co_${idCount++}`, lane: 2, targetTimeMs: Math.round(barStart + 2 * beatIntervalMs), durationMs: Math.round(beatIntervalMs * 1.5), type: 'hold', isFever: true });
    }
  }
  return notes;
}

function generateNeonHorizonNotes(): Beatmap['notes'] {
  const notes: Beatmap['notes'] = [];
  const beatIntervalMs = (60 / 160) * 1000;
  let idCount = 1;

  for (let bar = 1; bar <= 28; bar++) {
    const barStart = 800 + (bar - 1) * 4 * beatIntervalMs;
    const laneSequence = [0, 1, 2, 3, 2, 1, 0, 1];
    for (let i = 0; i < 4; i++) {
      const isHold = bar % 3 === 0 && i === 2;
      notes.push({
        id: `nh_${idCount++}`,
        lane: (laneSequence[(bar + i) % 4]) as 0 | 1 | 2 | 3,
        targetTimeMs: Math.round(barStart + i * beatIntervalMs),
        durationMs: isHold ? 700 : undefined,
        type: isHold ? 'hold' : 'tap',
        isFever: (bar + i) % 7 === 0
      });
      if (bar > 6 && i % 2 === 0) {
        notes.push({
          id: `nh_${idCount++}`,
          lane: ((laneSequence[(bar + i) % 4] + 2) % 4) as 0 | 1 | 2 | 3,
          targetTimeMs: Math.round(barStart + (i + 0.5) * beatIntervalMs),
          type: 'tap',
          isFever: bar % 5 === 0
        });
      }
    }
  }
  return notes;
}

function generateQuantumVelocityNotes(): Beatmap['notes'] {
  const notes: Beatmap['notes'] = [];
  const beatIntervalMs = (60 / 175) * 1000;
  let idCount = 1;

  for (let bar = 1; bar <= 30; bar++) {
    const barStart = 600 + (bar - 1) * 4 * beatIntervalMs;
    for (let step = 0; step < 4; step++) {
      const lane = ((bar * 2 + step) % 4) as 0 | 1 | 2 | 3;
      notes.push({
        id: `qv_${idCount++}`,
        lane,
        targetTimeMs: Math.round(barStart + step * beatIntervalMs),
        type: 'tap',
        isFever: (bar + step) % 6 === 0
      });
      if (bar % 2 === 0 && step === 2) {
        notes.push({
          id: `qv_${idCount++}`,
          lane: ((lane + 1) % 4) as 0 | 1 | 2 | 3,
          targetTimeMs: Math.round(barStart + (step + 0.5) * beatIntervalMs),
          type: 'tap'
        });
      }
    }
  }
  return notes;
}
