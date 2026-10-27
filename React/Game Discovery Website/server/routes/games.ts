import { Router } from 'express';
import { SEED_GAMES } from '../data/seedGames';
import { SEED_REVIEWS } from '../data/seedReviews';
import { HARDWARE_PROFILES } from '../data/hardwareProfiles';
import { calculateCosineSimilarity, containsExcludedTags } from '../engine/similarity';
import { analyzeReviewAnomalies } from '../engine/anomaly';
import { PlayerReview, GameTitle } from '../../src/types/game';

export const gamesRouter = Router();

// Mutable in-memory copies for live mutation and review posting
let gamesStore: GameTitle[] = [...SEED_GAMES];
let reviewsStore: PlayerReview[] = [...SEED_REVIEWS];

/**
 * GET /api/hardware-profiles
 */
gamesRouter.get('/hardware-profiles', (_req, res) => {
  res.json(HARDWARE_PROFILES);
});

/**
 * GET /api/discovery-queue
 * Returns 12 diverse titles for rapid keyboard curation
 */
gamesRouter.get('/discovery-queue', (_req, res) => {
  // Grab a curated slice of diverse games
  const queue = gamesStore.slice(0, 12);
  res.json(queue);
});

/**
 * GET /api/games/discover
 * Full-text search + multi-tag cosine vector matching + faceted filters
 */
gamesRouter.get('/discover', (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : '';
    const maxPrice = req.query.maxPriceCents ? Number(req.query.maxPriceCents) : undefined;
    const deckOnly = req.query.deckVerifiedOnly === 'true';
    const minScore = req.query.minScore ? Number(req.query.minScore) : 0;
    const sortBy = (typeof req.query.sortBy === 'string' ? req.query.sortBy : 'alchemy');
    const limit = req.query.limit ? Math.min(100, Math.max(1, Number(req.query.limit))) : 30;
    const offset = req.query.offset ? Math.max(0, Number(req.query.offset)) : 0;

    // Parse alchemy tags: array of { name: string, weight: number }
    let alchemyTags: { name: string; weight: number }[] = [];
    if (typeof req.query.alchemyTags === 'string') {
      try {
        alchemyTags = JSON.parse(req.query.alchemyTags);
      } catch {
        alchemyTags = [];
      }
    }

    // Parse exclude tags: array of strings
    let excludeTags: string[] = [];
    if (typeof req.query.excludeTags === 'string') {
      try {
        excludeTags = JSON.parse(req.query.excludeTags);
      } catch {
        excludeTags = [];
      }
    }

    // Filter games
    let filtered = gamesStore.filter(game => {
      // Excluded tags check
      if (containsExcludedTags(game.tags, excludeTags)) {
        return false;
      }

      // Search query match (title, developer, publisher, or tags)
      if (q) {
        const titleMatch = game.title.toLowerCase().includes(q);
        const devMatch = game.developer.toLowerCase().includes(q);
        const tagMatch = game.tags.some(t => t.name.toLowerCase().includes(q));
        if (!titleMatch && !devMatch && !tagMatch) {
          return false;
        }
      }

      // Price filter
      if (maxPrice !== undefined && game.priceCents > maxPrice) {
        return false;
      }

      // Deck Verified filter
      if (deckOnly && game.deckCompatibility !== 'VERIFIED') {
        return false;
      }

      // Minimum review score
      if (minScore > 0 && game.reviewSummary.allTimeScore < minScore) {
        return false;
      }

      return true;
    });

    // Compute similarity score for each game
    const scored = filtered.map(game => {
      const similarityScore = calculateCosineSimilarity(alchemyTags, game.tags);
      return {
        ...game,
        similarityScore: Number(similarityScore.toFixed(3)),
      };
    });

    // Sort
    scored.sort((a, b) => {
      if (sortBy === 'alchemy') {
        // If alchemy tags present, primary sort by similarity score
        if (alchemyTags.length > 0 && b.similarityScore !== a.similarityScore) {
          return (b.similarityScore || 0) - (a.similarityScore || 0);
        }
        return b.concurrentPlayers - a.concurrentPlayers;
      }
      if (sortBy === 'popular') {
        return b.concurrentPlayers - a.concurrentPlayers;
      }
      if (sortBy === 'topRated') {
        return b.reviewSummary.allTimeScore - a.reviewSummary.allTimeScore;
      }
      if (sortBy === 'discount') {
        return b.discountPercent - a.discountPercent;
      }
      if (sortBy === 'priceAsc') {
        return a.priceCents - b.priceCents;
      }
      return 0;
    });

    // Pagination
    const total = scored.length;
    const paginated = scored.slice(offset, offset + limit);

    // Collect all available unique tags across catalog
    const tagSet = new Set<string>();
    gamesStore.forEach(g => g.tags.forEach(t => tagSet.add(t.name)));
    const availableTags = Array.from(tagSet).sort();

    res.json({
      games: paginated,
      total,
      appliedAlchemy: alchemyTags,
      availableTags,
    });
  } catch (error) {
    console.error('Discover error:', error);
    res.status(500).json({ error: 'Failed to discover games' });
  }
});

/**
 * GET /api/games/:id
 * Retrieve a specific game with full details
 */
gamesRouter.get('/:id', (req, res) => {
  const game = gamesStore.find(g => g.id === req.params.id || g.slug === req.params.id);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  // Correlate with reviews to check anomaly status
  const gameReviews = reviewsStore.filter(r => r.gameId === game.id);
  const anomalyInfo = analyzeReviewAnomalies(gameReviews, game.patchNotes);

  res.json({
    ...game,
    anomalyDetected: anomalyInfo.hasAnomaly,
    anomalyMessage: anomalyInfo.message,
  });
});

/**
 * GET /api/games/:id/reviews
 * Filterable reviews with playtime verification & patch-correlated anomaly detection
 */
gamesRouter.get('/:id/reviews', (req, res) => {
  const gameId = req.params.id;
  const game = gamesStore.find(g => g.id === gameId);
  
  const allGameReviews = reviewsStore.filter(r => r.gameId === gameId);

  // Anomaly analysis across all reviews
  const anomalyResult = analyzeReviewAnomalies(allGameReviews, game?.patchNotes);

  // Filters
  const playtimeBracket = req.query.playtimeBracket as string || 'all';
  const patch = req.query.patch as string || 'all';
  const sentiment = req.query.sentiment as string || 'all';

  let filtered = allGameReviews.filter(review => {
    // Playtime bracket filter
    if (playtimeBracket === 'gt10' && review.playtimeTotalHours < 10) return false;
    if (playtimeBracket === 'gt50' && review.playtimeTotalHours < 50) return false;
    if (playtimeBracket === 'gt100' && review.playtimeTotalHours < 100) return false;

    // Patch filter
    if (patch !== 'all' && review.writtenDuringPatch !== patch) return false;

    // Sentiment filter
    if (sentiment === 'positive' && !review.recommended) return false;
    if (sentiment === 'negative' && review.recommended) return false;

    return true;
  });

  // Collect all patch versions from reviews and game
  const patchSet = new Set<string>();
  game?.patchNotes?.forEach(p => patchSet.add(p.version));
  allGameReviews.forEach(r => patchSet.add(r.writtenDuringPatch));
  const patchVersions = Array.from(patchSet).sort();

  res.json({
    gameId,
    totalCount: allGameReviews.length,
    filteredCount: filtered.length,
    anomalyDetected: anomalyResult.hasAnomaly,
    anomalyMessage: anomalyResult.message,
    timelineBuckets: anomalyResult.timelineBuckets,
    reviews: filtered,
    patchVersions,
  });
});

/**
 * POST /api/games/:id/reviews
 * Submit a playtime-verified review
 */
gamesRouter.post('/:id/reviews', (req, res) => {
  const gameId = req.params.id;
  const game = gamesStore.find(g => g.id === gameId);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  const {
    username,
    recommended,
    content,
    playtimeHours,
    playtimeToken, // simulated session telemetry verification
    receivedForFree,
  } = req.body;

  // Strict anti-brigading verification: requires verified session playtime (> 0.2 hours minimum)
  const verifiedPlaytime = Number(playtimeHours);
  if (isNaN(verifiedPlaytime) || verifiedPlaytime < 0.2) {
    return res.status(400).json({
      error: 'Playtime Verification Failed: Minimum 0.2 hours (12 minutes) of verified gameplay telemetry required to submit an authoritative review.',
    });
  }

  if (!content || typeof content !== 'string' || content.trim().length < 10) {
    return res.status(400).json({
      error: 'Review content must be at least 10 characters.',
    });
  }

  // Determine current active patch
  const latestPatch = game.patchNotes && game.patchNotes.length > 0 
    ? game.patchNotes[game.patchNotes.length - 1].version 
    : 'v1.0.0';

  const newReview: PlayerReview = {
    id: `rev-${Date.now()}`,
    gameId,
    author: {
      id: `user-${Date.now()}`,
      username: username?.trim() || 'VerifiedCommander',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      gamesOwned: 42,
    },
    recommended: Boolean(recommended),
    playtimeAtReviewHours: verifiedPlaytime,
    playtimeTotalHours: verifiedPlaytime,
    writtenDuringPatch: latestPatch,
    content: content.trim(),
    helpfulCount: 0,
    funnyCount: 0,
    receivedForFree: Boolean(receivedForFree),
    createdAt: new Date().toISOString(),
  };

  reviewsStore.unshift(newReview);

  // Recalculate game review score
  const allForGame = reviewsStore.filter(r => r.gameId === gameId);
  const posCount = allForGame.filter(r => r.recommended).length;
  const newScore = Math.round((posCount / allForGame.length) * 100);
  
  game.reviewSummary.allTimeScore = newScore;
  game.reviewSummary.totalReviews = allForGame.length;
  if (newScore >= 95) game.reviewSummary.tier = 'OVERWHELMINGLY_POSITIVE';
  else if (newScore >= 80) game.reviewSummary.tier = 'VERY_POSITIVE';
  else if (newScore >= 50) game.reviewSummary.tier = 'MIXED';
  else game.reviewSummary.tier = 'MOSTLY_NEGATIVE';

  res.status(201).json(newReview);
});

/**
 * POST /api/games/:id/reviews/:reviewId/vote
 * Upvote helpful or funny
 */
gamesRouter.post('/:id/reviews/:reviewId/vote', (req, res) => {
  const { reviewId } = req.params;
  const { type } = req.body; // 'helpful' | 'funny'
  
  const review = reviewsStore.find(r => r.id === reviewId);
  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  if (type === 'helpful') {
    review.helpfulCount += 1;
  } else if (type === 'funny') {
    review.funnyCount += 1;
  }

  res.json({ success: true, helpfulCount: review.helpfulCount, funnyCount: review.funnyCount });
});
