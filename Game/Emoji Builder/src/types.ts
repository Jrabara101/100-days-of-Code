export type AspectRatio = '1:1' | '9:16' | '16:9';

export type SceneMood = 'playful' | 'dramatic' | 'spooky' | 'cyberpunk' | 'romantic';

export type ThemeId =
  | 'berry_patisserie'
  | 'honey_meadow'
  | 'lavender_dream'
  | 'matcha_garden'
  | 'ocean_lagoon'
  | 'toybox_garden'
  | 'comic_atelier';

export type BackgroundMode = 'styled_pattern' | 'picture_artwork';

export interface EmojiSticker {
  id: string;
  char: string;
  name?: string;
  x: number; // Percentage offset (0 - 100)
  y: number; // Percentage offset (0 - 100)
  scale: number; // Default 1.0
  rotation: number; // In degrees (-180 to 180)
  flipped?: boolean;
  animation?: 'bounce' | 'shake' | 'float' | 'pulse' | 'wobble';
  zIndex?: number;
}

export interface SpeechBubble {
  id: string;
  text: string;
  x: number; // Percentage offset (0 - 100)
  y: number;
  type: 'speech' | 'thought' | 'whisper' | 'shout';
  tailDirection: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

export interface BranchChoice {
  id: string;
  labelEmoji: string;
  label: string;
  targetPanelId: string;
}

export interface StoryPanel {
  id: string;
  title?: string;
  stickers: EmojiSticker[];
  speechBubbles?: SpeechBubble[];
  caption: string;
  mood: SceneMood;
  backgroundGradient: string;
  durationMs: number;
  soundEffect?: string;
  choices?: BranchChoice[];
}

export interface EmojiStoryState {
  storyId: string;
  title: string;
  author: string;
  theme: ThemeId;
  bgMode: BackgroundMode;
  aspectRatio: AspectRatio;
  panels: StoryPanel[];
  activePanelId: string;
  selectedStickerId: string | null;
  selectedBubbleId: string | null;
  playback: {
    isPlaying: boolean;
    currentIndex: number;
    speedMultiplier: number;
    loop: boolean;
  };
  gameMode: 'creator' | 'reader' | 'plot_guesser';
  targetSecretPlot?: string;
  guesserState?: {
    guesses: string[];
    isSolved: boolean;
    hintsRevealed: number;
  };
}

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  icon: string;
  bodyBg: string;
  canvasBg: string;
  primaryColor: string;
  primaryLight: string;
  badgeBg: string;
  badgeText: string;
  accentColor: string;
  borderColor: string;
  frameBorderColor: string;
  cardShadow: string;
  btnShadow: string;
  pictureSrc: string;
  canvasPattern: string;
  fontFamily: string;
  isDark?: boolean;
}
