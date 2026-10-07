import fs from 'fs';
import path from 'path';

export interface LeaderboardEntry {
  id: string;
  callsign: string;
  sectorId: string;
  score: number;
  waveReached: number;
  grazes: number;
  accuracy: number;
  synergies: string[];
  shipId: string;
  verified: boolean;
  runHash: string;
  timestamp: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'leaderboard.json');

const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'rec_01',
    callsign: 'NOVA-PRIME',
    sectorId: 'daily',
    score: 2450800,
    waveReached: 10,
    grazes: 184,
    accuracy: 94,
    synergies: ['scatter_shot', 'homing_missile', 'plasma_repeater'],
    shipId: 'interceptor',
    verified: true,
    runHash: 'AUTH-9BF21D4A',
    timestamp: Date.now() - 1000 * 60 * 35,
  },
  {
    id: 'rec_02',
    callsign: 'VOID_VIPER',
    sectorId: 'daily',
    score: 1980400,
    waveReached: 9,
    grazes: 142,
    accuracy: 88,
    synergies: ['plasma_repeater', 'emp_beam'],
    shipId: 'scout',
    verified: true,
    runHash: 'AUTH-7C40EE12',
    timestamp: Date.now() - 1000 * 60 * 120,
  },
  {
    id: 'rec_03',
    callsign: 'AEGIS_DREAD',
    sectorId: 'daily',
    score: 1620000,
    waveReached: 8,
    grazes: 98,
    accuracy: 82,
    synergies: ['scatter_shot', 'emp_beam'],
    shipId: 'dreadnought',
    verified: true,
    runHash: 'AUTH-53AE901F',
    timestamp: Date.now() - 1000 * 60 * 240,
  },
  {
    id: 'rec_04',
    callsign: 'CYBER_HAWK',
    sectorId: 'daily',
    score: 1240600,
    waveReached: 6,
    grazes: 112,
    accuracy: 91,
    synergies: ['homing_missile'],
    shipId: 'interceptor',
    verified: true,
    runHash: 'AUTH-31F0CA82',
    timestamp: Date.now() - 1000 * 60 * 480,
  },
  {
    id: 'rec_05',
    callsign: 'PULSE_RUNNER',
    sectorId: 'daily',
    score: 890200,
    waveReached: 5,
    grazes: 67,
    accuracy: 79,
    synergies: ['plasma_repeater'],
    shipId: 'scout',
    verified: true,
    runHash: 'AUTH-289BFA04',
    timestamp: Date.now() - 1000 * 60 * 600,
  },
];

class LeaderboardStore {
  private entries: LeaderboardEntry[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.entries = JSON.parse(raw);
      } else {
        this.entries = [...INITIAL_LEADERBOARD];
        this.save();
      }
    } catch (err) {
      console.error('Failed to load database, resetting to default:', err);
      this.entries = [...INITIAL_LEADERBOARD];
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.entries, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public getLeaderboard(sectorId?: string, limit: number = 20): LeaderboardEntry[] {
    let filtered = this.entries;
    if (sectorId && sectorId !== 'all') {
      filtered = this.entries.filter((e) => e.sectorId === sectorId || e.sectorId === 'daily');
    }
    return filtered
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  public addScore(entry: Omit<LeaderboardEntry, 'id' | 'timestamp'>): LeaderboardEntry {
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    this.entries.push(newEntry);
    this.save();
    return newEntry;
  }
}

export const db = new LeaderboardStore();
