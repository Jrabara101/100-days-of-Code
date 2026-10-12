import { AdventureGameState, ChapterStatsResponse } from '../types/game';
import { MapDefinition } from '../../server/maps';

const API_BASE = '/api';
const LOCAL_STORAGE_KEY = 'aethelgard_local_save_v1';

export async function fetchSaveState(): Promise<Partial<AdventureGameState>> {
  try {
    const res = await fetch(`${API_BASE}/save`);
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('Network offline or backend unreachable, falling back to local storage', err);
  }

  // Fallback to local-first cache
  const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }

  // Default starter state
  return {
    status: 'EXPLORING',
    player: {
      position: {
        mapId: 'whispering_glade',
        x: 5,
        y: 10,
        facing: 'right',
      },
      inventory: [
        { id: 'lantern', name: 'Ancient Lantern', icon: 'lantern', description: 'Casts a warm amber glow, dispelling the deep night shadows.' },
      ],
      activeToolId: 'lantern',
    },
    narrativeFlags: {
      met_elder: false,
      golem_awakened: false,
      echo_viewed: false,
      has_flute: false,
      shrine_decided: false,
    },
    activeQuests: [
      {
        id: 'q1',
        title: 'The Resonant Slumber',
        description: 'Follow the ancient stone trail and speak with Elder Mael regarding the tremors.',
        isCompleted: false,
        objectives: [
          { text: 'Consult with Elder Mael at the stone circle', done: false },
          { text: 'Retrieve the Harmonic Flute from the southern grove', done: false },
          { text: 'Awaken the Dormant Golem guarding the mountain pass', done: false },
        ],
      },
    ],
    timeOfDay: 16.5,
  };
}

export async function saveGameState(state: AdventureGameState): Promise<boolean> {
  const payload = {
    player: state.player,
    narrativeFlags: state.narrativeFlags,
    activeQuests: state.activeQuests,
    timeOfDay: state.timeOfDay,
  };

  // Always write to local storage first for local-first durability
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));

  try {
    const res = await fetch(`${API_BASE}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.warn('Cloud sync deferred, save stored in local cache', err);
    return false;
  }
}

export async function fetchMapDefinition(mapId: string): Promise<MapDefinition> {
  const res = await fetch(`${API_BASE}/world/maps/${mapId}`);
  if (!res.ok) {
    throw new Error(`Failed to load world map: ${mapId}`);
  }
  return res.json();
}

export async function submitChoice(chapterId: string, choiceNodeId: string, choiceText?: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/choices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId, choiceNodeId, choiceText }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Choice submission failed to sync with backend', err);
    return false;
  }
}

export async function fetchChapterStats(chapterId: string): Promise<ChapterStatsResponse> {
  try {
    const res = await fetch(`${API_BASE}/choices/${chapterId}/stats`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch telemetry stats, utilizing fallback estimates', err);
  }

  // Fallback if backend temporarily down
  return {
    chapterId,
    totalTravelers: 300,
    dilemmas: [
      {
        id: 'shrine_equilibrium',
        title: 'Fate of the Sunken Shrine',
        description: 'When touching the heart of the submerged sanctuary:',
        options: [
          { nodeId: 'restore_shrine', text: 'Restored the Sacred Waters', count: 192, percentage: 64 },
          { nodeId: 'harvest_core', text: 'Harvested the Core for Personal Power', count: 108, percentage: 36 },
        ],
      },
      {
        id: 'guardian_mercy',
        title: 'The Sentinel of Whispers',
        description: 'Confrontation with the guardian at the threshold:',
        options: [
          { nodeId: 'spare_guardian', text: 'Spared the Ancient Construct', count: 216, percentage: 72 },
          { nodeId: 'deactivate_guardian', text: 'Deactivated and Extinguished the Core', count: 84, percentage: 28 },
        ],
      },
      {
        id: 'memory_accord',
        title: 'The Burden of Memory',
        description: 'Upon discovering the sepia vision of the Sundering:',
        options: [
          { nodeId: 'trust_elder_mael', text: 'Shared the Memory Echo with Elder Mael', count: 174, percentage: 58 },
          { nodeId: 'conceal_memory', text: 'Kept the Truth Concealed within Yourself', count: 126, percentage: 42 },
        ],
      },
    ],
  };
}
