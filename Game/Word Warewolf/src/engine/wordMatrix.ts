import { WordPair } from './types';

export const WORD_PAIRS: WordPair[] = [
  {
    id: 'pair-obsidian-moonstone',
    title: 'Volcanic Glass vs Lunar Crystal',
    category: 'MINERALOGY / ARTIFACT',
    civilianWord: 'OBSIDIAN',
    werewolfWord: 'MOONSTONE',
    civilianClues: [
      'VOLCANIC',
      'BLACK',
      'GLASS',
      'SHARP',
      'LAVA',
      'FORGE',
      'REFLECTIVE',
      'DARK',
      'BLADE',
      'SILL',
      'CAUSTIC'
    ],
    werewolfClues: [
      'LUMINOUS',
      'GLOWING',
      'MOONLIGHT',
      'WHITE',
      'CRYSTALLINE',
      'JEWEL',
      'GEM',
      'MAGIC',
      'NIGHT',
      'SHINE'
    ],
    description: 'Council members clustered successfully around volcanic, vitreous rock properties.',
    divergenceHint: 'Infiltrator received luminous lunar stone descriptor, inducing divergent shimmering phrasing.'
  },
  {
    id: 'pair-campfire-torch',
    title: 'Hearth vs Sconce',
    category: 'ELEMENTAL / COMBUSTION',
    civilianWord: 'CAMPFIRE',
    werewolfWord: 'TORCH',
    civilianClues: [
      'WOOD',
      'SMOKE',
      'SPARKS',
      'WARMTH',
      'MARSHMALLOW',
      'EMBERS',
      'CIRCLE',
      'PIT',
      'CRACKLE',
      'LOGS',
      'ASH'
    ],
    werewolfClues: [
      'HANDLE',
      'CARRIED',
      'FLAME',
      'LIGHT',
      'MOBILE',
      'CAVE',
      'RUNNING',
      'STICK',
      'PITCH',
      'BURNING'
    ],
    description: 'Civilians cluster around stationary communal hearths, logs, and marshmallow embers.',
    divergenceHint: 'The Werewolf focuses on handheld portable lighting and dungeon navigation.'
  },
  {
    id: 'pair-submarine-spaceship',
    title: 'Abyssal Hull vs Cosmic Craft',
    category: 'EXPEDITION / PRESSURE VESSELS',
    civilianWord: 'SUBMARINE',
    werewolfWord: 'SPACESHIP',
    civilianClues: [
      'SONAR',
      'OCEAN',
      'DEPTH',
      'PERISCOPE',
      'TORPEDO',
      'PRESSURE',
      'DIVING',
      'BALLAST',
      'TRENCH',
      'HULL'
    ],
    werewolfClues: [
      'STARS',
      'VACUUM',
      'ROCKET',
      'COCKPIT',
      'OXYGEN',
      'THRUSTERS',
      'ORBIT',
      'GALAXY',
      'ASTRONAUT',
      'PLANET'
    ],
    description: 'Civilians describe claustrophobic aquatic depth, sonars, and water ballast.',
    divergenceHint: 'The Werewolf talks about void vacuum, orbit, and cosmic trajectories.'
  },
  {
    id: 'pair-diamond-crystal',
    title: 'Pressurized Carbon vs Mineral Prism',
    category: 'GEOLOGY / LUXURY',
    civilianWord: 'DIAMOND',
    werewolfWord: 'CRYSTAL',
    civilianClues: [
      'CARBON',
      'HARD',
      'RING',
      'EXPENSIVE',
      'MINE',
      'SPARKLE',
      'CUT',
      'CARAT',
      'UNBREAKABLE',
      'JEWELRY'
    ],
    werewolfClues: [
      'PRISM',
      'HEALING',
      'CAVE',
      'MINERAL',
      'CLEAR',
      'QUARTZ',
      'NATURAL',
      'SHARD',
      'ENERGY',
      'CLUSTER'
    ],
    description: 'Civilians emphasize industrial hardness, high monetary value, and carbon bonding.',
    divergenceHint: 'The Werewolf emphasizes esoteric energy, geometric prism refraction, and quartz.'
  },
  {
    id: 'pair-espionage-diplomacy',
    title: 'Covert Infiltration vs Statecraft',
    category: 'STATECRAFT / INTRIGUE',
    civilianWord: 'ESPIONAGE',
    werewolfWord: 'DIPLOMACY',
    civilianClues: [
      'SECRET',
      'INFILTRATE',
      'SHADOW',
      'SPY',
      'WIRETAP',
      'COVERT',
      'CIPHER',
      'BLACKMAIL',
      'DOSSIER',
      'AGENT'
    ],
    werewolfClues: [
      'TREATY',
      'AMBASSADOR',
      'PEACE',
      'TALKS',
      'HANDSHAKE',
      'SUMMIT',
      'ALLIANCE',
      'PROTOCOL',
      'EMBASSY',
      'ACCORD'
    ],
    description: 'Civilians speak of covert operations, shadows, wiretaps, and ciphers.',
    divergenceHint: 'The Werewolf speaks of open state summits, bilateral handshakes, and treaties.'
  }
];

export function getRandomWordPair(): WordPair {
  return WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
}
