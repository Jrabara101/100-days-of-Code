import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ThemePalette,
  TypographyPairing,
  LineWidthMode,
  FontSizeScale,
  SavedHighlight,
  ReadResumeBookmark,
  QueuedArticle,
  Article,
} from '../types';
import {
  getSavedHighlights,
  saveHighlight as persistHighlight,
  removeHighlight as deleteHighlightPersisted,
  getQueuedArticles,
  addToQueue as persistAddToQueue,
  removeFromQueue as persistRemoveFromQueue,
  getLatestActiveBookmark,
  saveReadingBookmark,
  getReadingBookmark,
} from '../services/editorialEngine';

interface ReaderComfortSettings {
  palette: ThemePalette;
  typography: TypographyPairing;
  lineWidth: LineWidthMode;
  fontSize: FontSizeScale;
}

interface PipState {
  isActive: boolean;
  isPlaying: boolean;
  currentTime: number;
  articleId: string | null;
  chapterTitle: string;
}

interface QuoteCardModalState {
  isOpen: boolean;
  quoteText: string;
  articleTitle: string;
  authorName: string;
  categoryName: string;
}

interface ReaderContextValue {
  // Comfort Settings
  settings: ReaderComfortSettings;
  setPalette: (p: ThemePalette) => void;
  setTypography: (t: TypographyPairing) => void;
  setLineWidth: (w: LineWidthMode) => void;
  setFontSize: (s: FontSizeScale) => void;
  isComfortStudioOpen: boolean;
  setIsComfortStudioOpen: (open: boolean) => void;

  // Highlights & Notebook
  highlights: SavedHighlight[];
  saveNewHighlight: (highlight: Omit<SavedHighlight, 'id' | 'savedAt'>) => SavedHighlight;
  deleteHighlight: (id: string) => void;
  isNotebookOpen: boolean;
  setIsNotebookOpen: (open: boolean) => void;

  // Read Later Queue
  queue: QueuedArticle[];
  addArticleToQueue: (article: Article) => void;
  removeArticleFromQueue: (articleId: string) => void;
  isQueueOpen: boolean;
  setIsQueueOpen: (open: boolean) => void;

  // Resume Reading Toast
  activeResumeBookmark: ReadResumeBookmark | null;
  dismissResumeBookmark: () => void;
  updateReadingProgress: (
    article: Article,
    progressPercent: number,
    paragraphId: string,
    headingId: string
  ) => void;

  // Picture in Picture Video State
  pip: PipState;
  startPipVideo: (articleId: string, startTime?: number) => void;
  closePipVideo: () => void;
  setPipPlaying: (playing: boolean) => void;
  setPipTime: (time: number) => void;
  setPipChapter: (title: string) => void;

  // Quote Card Generator
  quoteCard: QuoteCardModalState;
  openQuoteCard: (quoteText: string, articleTitle: string, authorName: string, categoryName: string) => void;
  closeQuoteCard: () => void;
}

const ReaderContext = createContext<ReaderContextValue | undefined>(undefined);

const SETTINGS_KEY = 'chronicle_user_settings_v1';

export const ReaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Reader Comfort Settings
  const [settings, setSettings] = useState<ReaderComfortSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      palette: 'paper',
      typography: 'serif',
      lineWidth: 'focused',
      fontSize: 'normal',
    };
  });

  const [isComfortStudioOpen, setIsComfortStudioOpen] = useState(false);

  // Sync theme palette with body class
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {}

    document.body.classList.remove('theme-paper', 'theme-sepia', 'theme-midnight');
    document.body.classList.add(`theme-${settings.palette}`);
  }, [settings]);

  const setPalette = (palette: ThemePalette) => setSettings((s) => ({ ...s, palette }));
  const setTypography = (typography: TypographyPairing) => setSettings((s) => ({ ...s, typography }));
  const setLineWidth = (lineWidth: LineWidthMode) => setSettings((s) => ({ ...s, lineWidth }));
  const setFontSize = (fontSize: FontSizeScale) => setSettings((s) => ({ ...s, fontSize }));

  // 2. Notebook / Highlights
  const [highlights, setHighlights] = useState<SavedHighlight[]>(() => getSavedHighlights());
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);

  const saveNewHighlight = (hl: Omit<SavedHighlight, 'id' | 'savedAt'>) => {
    const created = persistHighlight(hl);
    setHighlights(getSavedHighlights());
    return created;
  };

  const deleteHighlight = (id: string) => {
    deleteHighlightPersisted(id);
    setHighlights(getSavedHighlights());
  };

  // 3. Read Later Queue
  const [queue, setQueue] = useState<QueuedArticle[]>(() => getQueuedArticles());
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  const addArticleToQueue = (article: Article) => {
    const updated = persistAddToQueue(article);
    setQueue(updated);
  };

  const removeArticleFromQueue = (articleId: string) => {
    const updated = persistRemoveFromQueue(articleId);
    setQueue(updated);
  };

  // 4. Resume Reading Bookmark Toast
  const [activeResumeBookmark, setActiveResumeBookmark] = useState<ReadResumeBookmark | null>(() =>
    getLatestActiveBookmark()
  );

  const dismissResumeBookmark = () => {
    setActiveResumeBookmark(null);
  };

  const updateReadingProgress = (
    article: Article,
    progressPercent: number,
    paragraphId: string,
    headingId: string
  ) => {
    const remainingMins = Math.max(1, Math.round(article.readTimeMinutes * (1 - progressPercent / 100)));
    const bookmark: ReadResumeBookmark = {
      articleId: article.id,
      articleTitle: article.title,
      categoryName: article.categoryId,
      progressPercent: Math.round(progressPercent),
      remainingMinutes: remainingMins,
      lastParagraphId: paragraphId,
      lastHeadingId: headingId,
      savedAt: new Date().toISOString(),
    };
    saveReadingBookmark(bookmark);
  };

  // 5. Picture in Picture Video
  const [pip, setPip] = useState<PipState>({
    isActive: false,
    isPlaying: false,
    currentTime: 0,
    articleId: null,
    chapterTitle: '',
  });

  const startPipVideo = (articleId: string, startTime: number = 0) => {
    setPip({
      isActive: true,
      isPlaying: true,
      currentTime: startTime,
      articleId,
      chapterTitle: 'Video Stream Synced',
    });
  };

  const closePipVideo = () => {
    setPip((p) => ({ ...p, isActive: false, isPlaying: false }));
  };

  const setPipPlaying = (isPlaying: boolean) => {
    setPip((p) => ({ ...p, isPlaying }));
  };

  const setPipTime = (currentTime: number) => {
    setPip((p) => ({ ...p, currentTime }));
  };

  const setPipChapter = (chapterTitle: string) => {
    setPip((p) => ({ ...p, chapterTitle }));
  };

  // 6. Quote Card Modal
  const [quoteCard, setQuoteCard] = useState<QuoteCardModalState>({
    isOpen: false,
    quoteText: '',
    articleTitle: '',
    authorName: '',
    categoryName: '',
  });

  const openQuoteCard = (
    quoteText: string,
    articleTitle: string,
    authorName: string,
    categoryName: string
  ) => {
    setQuoteCard({
      isOpen: true,
      quoteText,
      articleTitle,
      authorName,
      categoryName,
    });
  };

  const closeQuoteCard = () => {
    setQuoteCard((q) => ({ ...q, isOpen: false }));
  };

  return (
    <ReaderContext.Provider
      value={{
        settings,
        setPalette,
        setTypography,
        setLineWidth,
        setFontSize,
        isComfortStudioOpen,
        setIsComfortStudioOpen,
        highlights,
        saveNewHighlight,
        deleteHighlight,
        isNotebookOpen,
        setIsNotebookOpen,
        queue,
        addArticleToQueue,
        removeArticleFromQueue,
        isQueueOpen,
        setIsQueueOpen,
        activeResumeBookmark,
        dismissResumeBookmark,
        updateReadingProgress,
        pip,
        startPipVideo,
        closePipVideo,
        setPipPlaying,
        setPipTime,
        setPipChapter,
        quoteCard,
        openQuoteCard,
        closeQuoteCard,
      }}
    >
      {children}
    </ReaderContext.Provider>
  );
};

export function useReader() {
  const context = useContext(ReaderContext);
  if (!context) {
    throw new Error('useReader must be used within a ReaderProvider');
  }
  return context;
}
