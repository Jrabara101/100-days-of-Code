export interface WorldPosition {
  mapId: string;
  x: number;
  y: number;
  facing: 'up' | 'down' | 'left' | 'right';
}

export interface DialogueChoice {
  id: string;
  text: string;
  nextNodeId: string | null;
  requiredFlags?: string[];
  setFlags?: string[];
  action?: 'awaken_golem' | 'open_chest' | 'trigger_echo' | 'climax_choice';
}

export interface DialogueNode {
  id: string;
  speaker: string;
  portraitUrl: string;
  speakerRole?: string;
  voiceType?: 'elder' | 'golem' | 'spirit' | 'wanderer' | 'player';
  text: string;
  choices: DialogueChoice[];
}

export interface QuestObjective {
  text: string;
  done: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  objectives: QuestObjective[];
}

export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface MemoryEcho {
  id: string;
  title: string;
  subtitle: string;
  prose: string;
  discoveredAt?: string;
}

export interface CommunityDilemmaOption {
  nodeId: string;
  text: string;
  count: number;
  percentage: number;
}

export interface CommunityDilemma {
  id: string;
  title: string;
  description: string;
  options: CommunityDilemmaOption[];
}

export interface ChapterStatsResponse {
  chapterId: string;
  totalTravelers: number;
  dilemmas: CommunityDilemma[];
}

export interface AdventureGameState {
  status: 'EXPLORING' | 'DIALOGUE' | 'PAUSED' | 'CUTSCENE' | 'CHAPTER_SUMMARY';
  player: {
    position: WorldPosition;
    inventory: InventoryItem[];
    activeToolId: string | null;
  };
  narrativeFlags: Record<string, boolean | string | number>;
  activeQuests: Quest[];
  currentDialogue: DialogueNode | null;
  activeMemoryEcho: MemoryEcho | null;
  timeOfDay: number; // 0.0 - 24.0 normalized clock
}
