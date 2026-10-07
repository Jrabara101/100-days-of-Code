export type JamPhase = 
  | 'PRE_JAM' 
  | 'COUNTDOWN_TO_REVEAL' 
  | 'THEME_REVEAL'
  | 'JAM_ACTIVE' 
  | 'SUBMISSION_BUFFER' 
  | 'VOTING_PHASE' 
  | 'ARCHIVED';

export type AnnouncementPriority = 'info' | 'important' | 'critical' | 'wildcard';

export interface AnnouncementItem {
  id: string;
  timestamp: string;
  priority: AnnouncementPriority;
  title: string;
  content: string;
  actionUrl?: string;
}

export type AspectRatioType = '16:9' | '9:16' | '1:1' | 'A3_PRINT';
export type PaletteKey = 'cyber_neon' | 'arcade_fire' | 'retro_pixel' | 'deep_space';

export interface StickerItem {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  scale: number;
  glyph: string;
  label?: string;
}

export interface PosterTemplateConfig {
  jamTitle: string;
  themeTagline: string;
  startDate: string;
  endDate: string;
  aspectRatio: AspectRatioType;
  paletteKey: PaletteKey;
  sponsorBadges: string[];
  customStickers: StickerItem[];
  engineTag: string;
  teamName: string;
  customHeading?: string;
  prizePool?: string;
}

export interface JamState {
  jamId: string;
  jamName: string;
  currentPhase: JamPhase;
  targetEndTime: number; // Server monotonic timestamp (ms)
  themeRevealed: boolean;
  themeKeyword: string;
  themeTagline: string;
  wildcardRules: string[];
  announcements: AnnouncementItem[];
  participantCount: number;
  serverTime: number; // Server monotonic time (ms)
}

export type JammerRole = 'Code' | '2D Art' | '3D Art' | 'Audio/OST' | 'Narrative' | 'Game Design';
export type JammerEngine = 'Godot' | 'Unity' | 'Bevy' | 'Unreal' | 'WebGL' | 'PICO-8';

export interface JammerProfile {
  id: string;
  handle: string;
  avatarSeed: string;
  roles: JammerRole[];
  engines: JammerEngine[];
  bio: string;
  sampleSynthType?: 'synthwave' | 'chiptune' | 'cyberpunk' | 'ambient';
  lookingForTeam: boolean;
  teamName?: string;
  discord: string;
  timezone: string;
}

export interface SubmissionChecklist {
  playableBuild: boolean;
  webBuildReady: boolean;
  themeIntegrated: boolean;
  wildcardDocumented: boolean;
  cleanAssets: boolean;
}

export interface SubmissionData {
  teamName: string;
  gameTitle: string;
  engine: JammerEngine;
  buildFileName: string;
  fileSizeBytes: number;
  sha256Checksum: string;
  wildcardImplemented: string;
  checklistStatus: SubmissionChecklist;
  submittedAt?: number;
  submissionToken?: string;
}
