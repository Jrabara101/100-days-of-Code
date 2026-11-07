import { Article, ParagraphBlock, SavedHighlight, ReadResumeBookmark, QueuedArticle, ReadingMode } from '../types';
import { ARTICLES, CATEGORIES } from '../data/mockData';

const AVERAGE_WORDS_PER_MINUTE = 215; // Editorial standard reading speed
const CODE_BLOCK_TIME_SECONDS = 30; // Code inspection overhead
const DIAGRAM_TIME_SECONDS = 45; // Diagram interpretation overhead

/**
 * 1. Multi-Modal Reading & Watch-Time Calculator
 */
export function calculateDynamicReadingTime(
  article: Article,
  mode: ReadingMode = 'full'
): { minutes: number; formatted: string; speedDetail: string } {
  if (mode === 'brief') {
    return {
      minutes: 1,
      formatted: '60 SEC BRIEF',
      speedDetail: `${article.briefSummary.bullets.length} executive takeaway bullets (~60 seconds)`,
    };
  }

  if (mode === 'watch' && article.videoMetadata) {
    const mins = Math.ceil(article.videoMetadata.durationSec / 60);
    return {
      minutes: mins,
      formatted: `${article.videoMetadata.durationFormatted} STREAM`,
      speedDetail: `${article.videoMetadata.chapters.length} chapterized video blocks`,
    };
  }

  // Full Essay Calculation: words + code blocks + diagrams
  let totalWords = article.wordCount;
  let visualBonusSeconds = 0;

  article.sections.forEach((sec) => {
    sec.paragraphs.forEach((p) => {
      if (p.type === 'code') visualBonusSeconds += CODE_BLOCK_TIME_SECONDS;
      if (p.type === 'diagram') visualBonusSeconds += DIAGRAM_TIME_SECONDS;
    });
  });

  const baseMinutes = totalWords / AVERAGE_WORDS_PER_MINUTE;
  const visualMinutes = visualBonusSeconds / 60;
  const totalMinutes = Math.max(1, Math.round(baseMinutes + visualMinutes));

  return {
    minutes: totalMinutes,
    formatted: `${totalMinutes < 10 ? '0' : ''}${totalMinutes} MIN READ`,
    speedDetail: `${totalWords.toLocaleString()} words • 65ch measure`,
  };
}

/**
 * Calculates remaining reading time in section or whole article from a given paragraph index
 */
export function calculateRemainingTime(
  article: Article,
  currentSectionIndex: number,
  currentParagraphId?: string
): { sectionMinutesLeft: number; totalMinutesLeft: number } {
  let remainingWordsTotal = 0;
  let remainingWordsSection = 0;

  let passedCurrent = false;

  article.sections.forEach((sec, sIdx) => {
    const isCurrentSec = sIdx === currentSectionIndex;
    sec.paragraphs.forEach((p) => {
      if (p.id === currentParagraphId) {
        passedCurrent = true;
      }
      if (!passedCurrent) {
        return;
      }
      const wordsInP = p.content.split(/\s+/).filter(Boolean).length;
      remainingWordsTotal += wordsInP;
      if (isCurrentSec) {
        remainingWordsSection += wordsInP;
      }
    });
  });

  const totalMin = Math.max(1, Math.round(remainingWordsTotal / AVERAGE_WORDS_PER_MINUTE));
  const secMin = Math.max(1, Math.round(remainingWordsSection / AVERAGE_WORDS_PER_MINUTE));

  return {
    sectionMinutesLeft: secMin,
    totalMinutesLeft: totalMin,
  };
}

/**
 * Map video timestamp directly to corresponding DOM section and paragraph
 */
export function mapTimestampToDomElements(
  article: Article,
  currentTimeSec: number
): { headingId: string; paragraphId?: string; chapterTitle: string } | null {
  if (!article.videoMetadata) return null;

  const chapters = article.videoMetadata.chapters;
  for (let i = chapters.length - 1; i >= 0; i--) {
    if (currentTimeSec >= chapters[i].timestampSec) {
      const targetSec = article.sections.find((s) => s.id === chapters[i].headingId);
      const firstP = targetSec?.paragraphs[0]?.id;
      return {
        headingId: chapters[i].headingId,
        paragraphId: firstP,
        chapterTitle: chapters[i].title,
      };
    }
  }

  return {
    headingId: chapters[0].headingId,
    paragraphId: article.sections[0]?.paragraphs[0]?.id,
    chapterTitle: chapters[0].title,
  };
}

/**
 * Map DOM paragraph to corresponding video timestamp
 */
export function mapParagraphToVideoTimestamp(article: Article, paragraphId: string): number {
  if (!article.videoMetadata) return 0;

  for (const sec of article.sections) {
    const foundP = sec.paragraphs.find((p) => p.id === paragraphId);
    if (foundP) {
      if (foundP.videoTimestampSec !== undefined) {
        return foundP.videoTimestampSec;
      }
      if (sec.videoTimestampSec !== undefined) {
        return sec.videoTimestampSec;
      }
    }
  }
  return 0;
}

/**
 * 2. Semantic Category & Continuation Trail Resolver
 */
export function getArticleById(id: string): Article | undefined {
  return ARTICLES.find((a) => a.id === id || a.slug === id);
}

export function getCategoryById(id: string) {
  return CATEGORIES.find((c) => c.id === id || c.slug === id);
}

export function getStarterTrilogyArticles(categoryId: string): Article[] {
  const category = getCategoryById(categoryId);
  if (!category) return [];
  return category.starterTrilogyIds
    .map((id) => getArticleById(id))
    .filter((a): a is Article => Boolean(a));
}

/**
 * 3. Stateful Paragraph-Level Progress & Highlight Sync
 */
const STORAGE_KEYS = {
  BOOKMARKS: 'chronicle_reading_bookmarks_v1',
  HIGHLIGHTS: 'chronicle_saved_highlights_v1',
  QUEUE: 'chronicle_read_queue_v1',
  THEME: 'chronicle_reader_comfort_v1',
};

export function saveReadingBookmark(bookmark: ReadResumeBookmark): void {
  try {
    const existingStr = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    const bookmarks: Record<string, ReadResumeBookmark> = existingStr ? JSON.parse(existingStr) : {};
    bookmarks[bookmark.articleId] = bookmark;
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  } catch (e) {
    console.warn('Could not save bookmark to localStorage', e);
  }
}

export function getReadingBookmark(articleId: string): ReadResumeBookmark | null {
  try {
    const existingStr = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    if (!existingStr) return null;
    const bookmarks: Record<string, ReadResumeBookmark> = JSON.parse(existingStr);
    return bookmarks[articleId] || null;
  } catch (e) {
    return null;
  }
}

export function getLatestActiveBookmark(): ReadResumeBookmark | null {
  try {
    const existingStr = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    if (!existingStr) return null;
    const bookmarks: Record<string, ReadResumeBookmark> = JSON.parse(existingStr);
    const sorted = Object.values(bookmarks).sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );
    // Return only if reading is partially finished (between 5% and 92%)
    return sorted.find((b) => b.progressPercent >= 5 && b.progressPercent < 92) || null;
  } catch (e) {
    return null;
  }
}

export function clearReadingBookmark(articleId: string): void {
  try {
    const existingStr = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    if (!existingStr) return;
    const bookmarks: Record<string, ReadResumeBookmark> = JSON.parse(existingStr);
    delete bookmarks[articleId];
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
  } catch (e) {
    console.warn(e);
  }
}

// Highlights & Notebook
export function getSavedHighlights(): SavedHighlight[] {
  try {
    const str = localStorage.getItem(STORAGE_KEYS.HIGHLIGHTS);
    return str ? JSON.parse(str) : [];
  } catch (e) {
    return [];
  }
}

export function saveHighlight(highlight: Omit<SavedHighlight, 'id' | 'savedAt'>): SavedHighlight {
  const current = getSavedHighlights();
  const newHighlight: SavedHighlight = {
    ...highlight,
    id: `hl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    savedAt: new Date().toISOString(),
  };
  const updated = [newHighlight, ...current];
  try {
    localStorage.setItem(STORAGE_KEYS.HIGHLIGHTS, JSON.stringify(updated));
  } catch (e) {
    console.warn(e);
  }
  return newHighlight;
}

export function removeHighlight(id: string): void {
  const current = getSavedHighlights();
  const updated = current.filter((h) => h.id !== id);
  try {
    localStorage.setItem(STORAGE_KEYS.HIGHLIGHTS, JSON.stringify(updated));
  } catch (e) {
    console.warn(e);
  }
}

export function exportClippingsAsMarkdown(highlights: SavedHighlight[]): string {
  if (highlights.length === 0) return '# The Chronicle Notebook\n\nNo saved highlights yet.';

  let md = `# The Chronicle & Essayist — Personal Reading Notebook\n`;
  md += `*Exported on ${new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}*\n\n---\n\n`;

  const groupedByArticle: Record<string, SavedHighlight[]> = {};
  highlights.forEach((h) => {
    if (!groupedByArticle[h.articleTitle]) groupedByArticle[h.articleTitle] = [];
    groupedByArticle[h.articleTitle].push(h);
  });

  Object.entries(groupedByArticle).forEach(([title, items]) => {
    md += `## 📖 ${title}\n`;
    md += `**Category:** ${items[0]?.categoryName || 'Editorial'}\n\n`;
    items.forEach((item, idx) => {
      md += `> "${item.selectedText.trim()}"\n\n`;
      if (item.userNote) {
        md += `*Personal Note:* ${item.userNote}\n\n`;
      }
      md += `*(Saved ${new Date(item.savedAt).toLocaleDateString()})*\n\n`;
      if (idx < items.length - 1) md += `---\n\n`;
    });
    md += `\n`;
  });

  return md;
}

// Read Later Queue
export function getQueuedArticles(): QueuedArticle[] {
  try {
    const str = localStorage.getItem(STORAGE_KEYS.QUEUE);
    return str ? JSON.parse(str) : [];
  } catch (e) {
    return [];
  }
}

export function addToQueue(article: Article): QueuedArticle[] {
  const current = getQueuedArticles();
  if (current.some((q) => q.articleId === article.id)) return current;

  const newItem: QueuedArticle = {
    articleId: article.id,
    title: article.title,
    categoryName: getCategoryById(article.categoryId)?.name || 'Essay',
    readTimeMinutes: article.readTimeMinutes,
    addedAt: new Date().toISOString(),
    progressPercent: 0,
  };

  const updated = [newItem, ...current];
  try {
    localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(updated));
  } catch (e) {
    console.warn(e);
  }
  return updated;
}

export function removeFromQueue(articleId: string): QueuedArticle[] {
  const current = getQueuedArticles();
  const updated = current.filter((q) => q.articleId !== articleId);
  try {
    localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(updated));
  } catch (e) {
    console.warn(e);
  }
  return updated;
}

export function calculateQueueBudget(queue: QueuedArticle[]): {
  totalMinutes: number;
  articleCount: number;
  commuteRecommendation: string;
} {
  const totalMinutes = queue.reduce((sum, item) => sum + item.readTimeMinutes, 0);
  const articleCount = queue.length;

  let commuteRecommendation = 'Fits a quick 5-min coffee break';
  if (totalMinutes > 25) {
    commuteRecommendation = 'Fits an extended weekend study session or long flight';
  } else if (totalMinutes > 15) {
    commuteRecommendation = 'Perfect for a 20-30 min evening train or subway commute';
  } else if (totalMinutes > 8) {
    commuteRecommendation = 'Fits your 10-15 min lunch wind-down';
  }

  return { totalMinutes, articleCount, commuteRecommendation };
}
