export type CommuteFilterType = 'all' | 'break' | 'commute' | 'deep-dive';
export type PlaybackSpeed = 1.0 | 1.25 | 1.5 | 2.0;

export interface Speaker {
  id: string;
  name: string;
  role: 'host' | 'guest';
  avatar: string;
  title: string;
  handle?: string;
}

export interface TranscriptSentence {
  id: string;
  speakerId: string;
  startTimeSec: number;
  endTimeSec: number;
  text: string;
}

export interface TranscriptBlock {
  id: string;
  speakerId: string;
  startTimeSec: number;
  endTimeSec: number;
  sentences: TranscriptSentence[];
  text: string;
}

export interface Chapter {
  id: string;
  title: string;
  startTimeSec: number;
  endTimeSec: number;
  summary?: string;
  isIntroBanter?: boolean;
}

export interface MentionedResource {
  id: string;
  title: string;
  type: 'book' | 'tool' | 'article' | 'person';
  categoryLabel: string;
  authorOrHost?: string;
  description: string;
  url: string;
  timestampSec: number;
  badgeText: string;
}

export interface RetentionPoint {
  timestampSec: number;
  retentionPct: number;
  replayPct: number;
  isPeak?: boolean;
  annotation?: string;
}

export interface VoicemailQuestion {
  id: string;
  episodeId: string;
  authorName: string;
  avatar: string;
  timeAgo: string;
  durationSec: number;
  audioBlobUrl?: string;
  textPrompt?: string;
  status: 'answered' | 'queued' | 'starred';
  topicTag: string;
}

export interface ListeningVaultClip {
  id: string;
  episodeId: string;
  episodeTitle: string;
  speakerName: string;
  quoteText: string;
  startTimeSec: number;
  endTimeSec: number;
  dateSaved: string;
  tags: string[];
}

export interface CuratedPlaylist {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  episodeIds: string[];
  totalDurationSec: number;
  accentColor: string;
}

export interface Episode {
  id: string;
  number: number;
  season: number;
  title: string;
  takeawaySummary: string;
  coverUrl: string;
  coverGradient: string;
  publishDate: string;
  durationSec: number;
  commuteCategory: 'break' | 'commute' | 'deep-dive';
  
  sampleBestMoment: {
    startTimeSec: number;
    durationSec: number;
    hookSummary: string;
  };

  skipIntroTimestampSec: number;
  introBanterEndSec: number;
  
  speakers: Speaker[];
  tags: string[];
  chapters: Chapter[];
  transcript: TranscriptBlock[];
  resources: MentionedResource[];
  heatmap: number[]; // normalized 0.0 - 1.0 crowd excitement / replay curve for waveform
  retentionCurve: RetentionPoint[];
  
  guestSharePack: {
    guestName: string;
    quotes: string[];
    referralLink: string;
    referralListens: number;
    audiogramTitle: string;
  };
}

export interface SpokenWordSearchResult {
  episodeId: string;
  episodeTitle: string;
  episodeNumber: number;
  coverUrl: string;
  speakerName: string;
  startTimeSec: number;
  endTimeSec: number;
  matchedText: string;
  surroundingContext: string;
}
