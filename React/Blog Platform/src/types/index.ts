export type ReadingMode = 'full' | 'brief' | 'watch';

export type TimeBudgetFilter = 'all' | 'commute' | 'deep' | 'video' | 'playbook';

export type ThemePalette = 'paper' | 'sepia' | 'midnight';

export type TypographyPairing = 'serif' | 'sans' | 'dyslexic';

export type LineWidthMode = 'focused' | 'wide';

export type FontSizeScale = 'compact' | 'normal' | 'large';

export interface Category {
  id: string;
  name: string;
  slug: string;
  accentColor: string; // Hex e.g. #2563EB
  accentBadgeClass: string;
  dotColorClass: string;
  iconName: string;
  pulseLabel: string; // e.g. "4 Deep Dives" or "New Video Essay"
  tagline: string;
  description: string;
  starterTrilogyIds: string[];
  velocity: 'soaring' | 'steady' | 'evergreen';
  velocityScore: number; // 0 - 100
  totalReadsThisWeek: number;
}

export interface ParagraphBlock {
  id: string;
  type: 'paragraph' | 'blockquote' | 'callout' | 'diagram' | 'code' | 'pullquote';
  content: string;
  authorNote?: string;
  codeLanguage?: string;
  diagramData?: {
    title: string;
    description: string;
    nodes: { label: string; metric?: string; status?: string }[];
  };
  highlightKeywords?: string[]; // IDs linking to inline glossary
  videoTimestampSec?: number;
}

export interface ArticleSection {
  id: string; // e.g. "section-1"
  headingId: string;
  title: string;
  subtitle?: string;
  readTimeEstimateMin: number;
  videoTimestampSec?: number;
  paragraphs: ParagraphBlock[];
}

export interface ChapterMark {
  timestampSec: number;
  timestampFormatted: string;
  title: string;
  headingId: string;
  summary: string;
}

export interface VideoMetadata {
  durationSec: number;
  durationFormatted: string;
  videoUrl?: string;
  posterUrl: string;
  chapters: ChapterMark[];
  transcriptTrackUrl?: string;
  companionAudioUrl?: string;
}

export interface BriefSummary {
  takeawayHeadline: string;
  readTimeSeconds: number;
  bullets: {
    id: string;
    text: string;
    impactLevel: 'critical' | 'strategic' | 'tactical';
    targetParagraphId: string;
    targetSectionTitle: string;
  }[];
  actionChecklist: string[];
}

export interface RabbitHoleNode {
  seriesTitle: string;
  stepIndex: number;
  totalSteps: number;
  prerequisite?: {
    id: string;
    title: string;
    category: string;
  };
  currentNode: {
    id: string;
    title: string;
  };
  nextStep?: {
    id: string;
    title: string;
    category: string;
  };
}

export interface CuratedContinuation {
  goDeeper: {
    articleId: string;
    title: string;
    category: string;
    readTime: string;
    reason: string;
  };
  contrarianView: {
    articleId: string;
    title: string;
    category: string;
    readTime: string;
    reason: string;
  };
  quickAction: {
    articleId: string;
    title: string;
    category: string;
    readTime: string;
    reason: string;
  };
}

export interface InlineGlossaryItem {
  id: string;
  term: string;
  shortDefinition: string;
  fullExplanation: string;
  citationSource?: string;
  citationUrl?: string;
  metricComparison?: {
    labelA: string;
    valA: string;
    labelB: string;
    valB: string;
  };
  relatedArticleId?: string;
  relatedArticleTitle?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  standfirst: string; // Subtitle / Deck
  categoryId: string;
  format: 'essay' | 'deep-dive' | 'video-essay' | 'playbook' | 'brief';
  author: {
    name: string;
    title: string;
    avatar: string;
    handle: string;
  };
  publishedDate: string; // ISO or formatted
  lastUpdatedDate: string;
  isEvergreen: boolean;
  freshnessLabel: string; // e.g., "Updated 3 days ago"
  coverImage: string;
  coverImageCaption?: string;
  wordCount: number;
  readTimeMinutes: number;
  hasVideo: boolean;
  videoMetadata?: VideoMetadata;
  briefSummary: BriefSummary;
  sections: ArticleSection[];
  rabbitHole: RabbitHoleNode;
  continuationTrail: CuratedContinuation;
  keyTakeaways: {
    id: string;
    text: string;
    category: string;
  }[];
  inlineGlossary: Record<string, InlineGlossaryItem>;
  featuredScore?: number; // for bento hero layout
}

export interface SavedHighlight {
  id: string;
  articleId: string;
  articleTitle: string;
  categoryName: string;
  selectedText: string;
  paragraphId?: string;
  savedAt: string;
  userNote?: string;
}

export interface ReadResumeBookmark {
  articleId: string;
  articleTitle: string;
  categoryName: string;
  progressPercent: number;
  remainingMinutes: number;
  lastParagraphId: string;
  lastHeadingId: string;
  savedAt: string;
}

export interface QueuedArticle {
  articleId: string;
  title: string;
  categoryName: string;
  readTimeMinutes: number;
  addedAt: string;
  progressPercent: number;
}
