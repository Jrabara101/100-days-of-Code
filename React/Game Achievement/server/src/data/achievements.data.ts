import { AchievementItem } from '../types.js';

export const INITIAL_ACHIEVEMENTS: Record<string, AchievementItem> = {
  'combat_01': {
    id: 'combat_01',
    title: 'First Bloodline',
    description: 'Defeat your first elite champion in the Colosseum of Echoes.',
    isSecret: false,
    category: 'combat',
    tier: 'bronze',
    points: 25,
    globalRarityPercent: 78.4,
    steps: [
      { id: 'c1_s1', label: 'Enter the Colosseum', current: 1, target: 1, isCompleted: true },
      { id: 'c1_s2', label: 'Slay Gladiator Prime', current: 1, target: 1, isCompleted: true }
    ],
    reward: {
      id: 'rew_c1',
      type: 'cosmetic_title',
      title: 'Title: The Novice Striker',
      value: 'Novice Striker',
      isClaimed: true
    },
    isUnlocked: true,
    unlockedAt: '2026-10-01T14:32:00.000Z',
    isPinned: false
  },
  'combat_02': {
    id: 'combat_02',
    title: 'Flawless Decimation',
    description: 'Vanquish the Abyssal Dragon Lord without taking a single point of damage.',
    isSecret: false,
    category: 'combat',
    tier: 'gold',
    points: 150,
    globalRarityPercent: 4.2,
    steps: [
      { id: 'c2_s1', label: 'Summon Abyssal Dragon Lord', current: 1, target: 1, isCompleted: true },
      { id: 'c2_s2', label: 'Complete fight with 100% HP', current: 0, target: 1, isCompleted: false },
      { id: 'c2_s3', label: 'Execute critical combo finish', current: 0, target: 1, isCompleted: false }
    ],
    reward: {
      id: 'rew_c2',
      type: 'profile_banner',
      title: 'Holographic Banner: Dragonfire Foil',
      value: 'banner_dragonfire',
      isClaimed: false
    },
    isUnlocked: false,
    unlockedAt: null,
    isPinned: true
  },
  'combat_03': {
    id: 'combat_03',
    title: 'Hyperdrive Combo: 500x',
    description: 'Chain together 500 consecutive strikes without breaking kinetic momentum.',
    isSecret: false,
    category: 'combat',
    tier: 'silver',
    points: 75,
    globalRarityPercent: 22.8,
    steps: [
      { id: 'c3_s1', label: 'Reach 100 Hit Combo', current: 100, target: 100, isCompleted: true },
      { id: 'c3_s2', label: 'Reach 300 Hit Combo', current: 280, target: 300, isCompleted: false },
      { id: 'c3_s3', label: 'Reach 500 Hit Combo', current: 280, target: 500, isCompleted: false }
    ],
    reward: {
      id: 'rew_c3',
      type: 'in_game_currency',
      title: 'Aether Shards: 2,500 Units',
      value: '2500',
      isClaimed: false
    },
    isUnlocked: false,
    unlockedAt: null,
    isPinned: false
  },
  'combat_04': {
    id: 'combat_04',
    title: 'Void Zenith Executioner',
    description: 'Solo all 4 Sovereign Archons in Hellfire difficulty under 10 minutes total.',
    isSecret: false,
    category: 'combat',
    tier: 'prismatic',
    points: 300,
    globalRarityPercent: 0.8,
    steps: [
      { id: 'c4_s1', label: 'Defeat Ignis the Blazing', current: 1, target: 1, isCompleted: true },
      { id: 'c4_s2', label: 'Defeat Glacies the Rime', current: 0, target: 1, isCompleted: false },
      { id: 'c4_s3', label: 'Defeat Fulgur the Lightning', current: 0, target: 1, isCompleted: false },
      { id: 'c4_s4', label: 'Defeat Nihil the Singularity', current: 0, target: 1, isCompleted: false }
    ],
    reward: {
      id: 'rew_c4',
      type: 'cosmetic_title',
      title: 'Mythic Title: Architect of Oblivion',
      value: 'Architect of Oblivion',
      isClaimed: false
    },
    isUnlocked: false,
    unlockedAt: null,
    isPinned: false
  },
  'exploration_01': {
    id: 'exploration_01',
    title: 'Cartographer of Neon Spire',
    description: 'Survey all sectors and uncover every surveillance beacon across the Neon Spire.',
    isSecret: false,
    category: 'exploration',
    tier: 'bronze',
    points: 40,
    globalRarityPercent: 64.1,
    steps: [
      { id: 'e1_s1', label: 'Lower Underbelly Beacons', current: 5, target: 5, isCompleted: true },
      { id: 'e1_s2', label: 'Mid-Tier Habitation Beacons', current: 5, target: 5, isCompleted: true },
      { id: 'e1_s3', label: 'Apex Sky-Deck Beacons', current: 3, target: 5, isCompleted: false }
    ],
    reward: {
      id: 'rew_e1',
      type: 'in_game_currency',
      title: 'Data Credits: 1,000 Units',
      value: '1000',
      isClaimed: false
    },
    isUnlocked: false,
    unlockedAt: null,
    isPinned: false
  },
  'exploration_02': {
    id: 'exploration_02',
    title: 'Sub-Orbital Wayfarer',
    description: 'Freefall from orbit and land inside the planetary cooling tube without engaging thrusters.',
    isSecret: false,
    category: 'exploration',
    tier: 'gold',
    points: 125,
    globalRarityPercent: 8.7,
    steps: [
      { id: 'e2_s1', label: 'Eject at 80,000 meters altitude', current: 1, target: 1, isCompleted: true },
      { id: 'e2_s2', label: 'Navigate atmospheric thermal turbulence', current: 1, target: 1, isCompleted: true },
      { id: 'e2_s3', label: 'Stick laser-aligned pinpoint landing', current: 0, target: 1, isCompleted: false }
    ],
    reward: {
      id: 'rew_e2',
      type: 'profile_banner',
      title: 'Profile Theme: Orbital Terminal Horizon',
      value: 'banner_orbital',
      isClaimed: false
    },
    isUnlocked: false,
    unlockedAt: null,
    isPinned: false
  },
  'exploration_03': {
    id: 'exploration_03',
    title: 'Vault of the Ancients',
    description: 'Solve the 5 gravitational prism puzzles guarding the core of the sunken Titan ruin.',
    isSecret: false,
    category: 'exploration',
    tier: 'silver',
    points: 90,
    globalRarityPercent: 19.3,
    steps: [
      { id: 'e3_s1', label: 'Harmonize Emerald Prism', current: 1, target: 1, isCompleted: true },
      { id: 'e3_s2', label: 'Harmonize Sapphire Prism', current: 1, target: 1, isCompleted: true },
      { id: 'e3_s3', label: 'Harmonize Ruby Prism', current: 1, target: 1, isCompleted: true },
      { id: 'e3_s4', label: 'Harmonize Amethyst Prism', current: 1, target: 1, isCompleted: true },
      { id: 'e3_s5', label: 'Harmonize Void Prism', current: 1, target: 1, isCompleted: true }
    ],
    reward: {
      id: 'rew_e3',
      type: 'cosmetic_title',
      title: 'Title: Chrono-Archaeologist',
      value: 'Chrono-Archaeologist',
      isClaimed: false
    },
    isUnlocked: true,
    unlockedAt: '2026-10-03T18:12:44.000Z',
    isPinned: true
  },
  'mastery_01': {
    id: 'mastery_01',
    title: 'Grand Synthesizer',
    description: 'Forge 50 exotic tier artifacts with 98%+ thermodynamic purity rating.',
    isSecret: false,
    category: 'mastery',
    tier: 'gold',
    points: 175,
    globalRarityPercent: 6.4,
    steps: [
      { id: 'm1_s1', label: 'Synthesize standard catalysts', current: 50, target: 50, isCompleted: true },
      { id: 'm1_s2', label: 'Synthesize exotic alloys', current: 38, target: 50, isCompleted: false },
      { id: 'm1_s3', label: 'Attain 99% purity catalyst', current: 0, target: 1, isCompleted: false }
    ],
    reward: {
      id: 'rew_m1',
      type: 'profile_banner',
      title: 'Animated Banner: Quantum Crucible Aura',
      value: 'banner_crucible',
      isClaimed: false
    },
    isUnlocked: false,
    unlockedAt: null,
    isPinned: false
  },
  'mastery_02': {
    id: 'mastery_02',
    title: 'Omni-Ascendant Sovereign',
    description: 'Attain maximum prestige mastery level in all 6 character specialization disciplines.',
    isSecret: false,
    category: 'mastery',
    tier: 'prismatic',
    points: 350,
    globalRarityPercent: 0.5,
    steps: [
      { id: 'm2_s1', label: 'Vanguard Discipline Maxed', current: 100, target: 100, isCompleted: true },
      { id: 'm2_s2', label: 'Phantom Discipline Maxed', current: 100, target: 100, isCompleted: true },
      { id: 'm2_s3', label: 'Technomancer Discipline Maxed', current: 100, target: 100, isCompleted: true },
      { id: 'm2_s4', label: 'Bio-Chirurgeon Discipline Maxed', current: 100, target: 100, isCompleted: true },
      { id: 'm2_s5', label: 'Warpweaver Discipline Maxed', current: 85, target: 100, isCompleted: false },
      { id: 'm2_s6', label: 'Aetheric Sovereign Discipline Maxed', current: 40, target: 100, isCompleted: false }
    ],
    reward: {
      id: 'rew_m2',
      type: 'cosmetic_title',
      title: 'Apex Title: Omni-Ascendant',
      value: 'Omni-Ascendant',
      isClaimed: false
    },
    isUnlocked: false,
    unlockedAt: null,
    isPinned: true
  },
  'secret_01': {
    id: 'secret_01',
    title: 'Ghost in the Machine',
    description: 'Decrypt the hidden terminal transmission inside the forgotten server sub-vault.',
    secretHint: 'Listen closely to the flickering CRT in Sector 7... The radio frequency pulses every midnight.',
    isSecret: true,
    category: 'secrets',
    tier: 'silver',
    points: 80,
    globalRarityPercent: 14.8,
    steps: [
      { id: 's1_s1', label: 'Tune scanner to frequency 108.4 MHz', current: 1, target: 1, isCompleted: true },
      { id: 's1_s2', label: 'Input the 8-bit bypass cipher', current: 0, target: 1, isCompleted: false }
    ],
    reward: {
      id: 'rew_s1',
      type: 'in_game_currency',
      title: 'Encrypted Cryptocores: 3,000',
      value: '3000',
      isClaimed: false
    },
    isUnlocked: false,
    unlockedAt: null,
    isPinned: false
  },
  'secret_02': {
    id: 'secret_02',
    title: 'The Glitch in the Matrix',
    description: 'Break outside the geometry bounds of the Citadel using precise velocity clipping.',
    secretHint: 'Where the waterfall meets the reflective glass wall, sprint and roll at negative angle.',
    isSecret: true,
    category: 'secrets',
    tier: 'gold',
    points: 160,
    globalRarityPercent: 3.1,
    steps: [
      { id: 's2_s1', label: 'Discover the out-of-bounds coordinate', current: 1, target: 1, isCompleted: true },
      { id: 's2_s2', label: 'Plant the rogue resonance beacon', current: 0, target: 1, isCompleted: false }
    ],
    reward: {
      id: 'rew_s2',
      type: 'profile_banner',
      title: 'Exclusive Glitch Banner: Reality Fractured',
      value: 'banner_glitch',
      isClaimed: false
    },
    isUnlocked: false,
    unlockedAt: null,
    isPinned: false
  },
  'secret_03': {
    id: 'secret_03',
    title: 'Prismatic Singularity Core',
    description: 'Feed every planetary celestial deity crystal into the eternal black hole altar.',
    secretHint: 'The void requires four offerings: Sun, Moon, Void, and Infinity. Gather them beneath the eclipse.',
    isSecret: true,
    category: 'secrets',
    tier: 'prismatic',
    points: 400,
    globalRarityPercent: 0.3,
    steps: [
      { id: 's3_s1', label: 'Eclipse ritual initiated', current: 1, target: 1, isCompleted: true },
      { id: 's3_s2', label: 'Sun Core sacrificed', current: 0, target: 1, isCompleted: false },
      { id: 's3_s3', label: 'Moon Core sacrificed', current: 0, target: 1, isCompleted: false },
      { id: 's3_s4', label: 'Infinity Core sacrificed', current: 0, target: 1, isCompleted: false }
    ],
    reward: {
      id: 'rew_s3',
      type: 'cosmetic_title',
      title: 'Sacred Title: Singularity Devourer',
      value: 'Singularity Devourer',
      isClaimed: false
    },
    isUnlocked: false,
    unlockedAt: null,
    isPinned: false
  }
};
