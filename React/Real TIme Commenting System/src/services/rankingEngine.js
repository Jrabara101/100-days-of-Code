/**
 * Bridge-Building & Nuance Ranking Engine
 * Calculates multidimensional quality metrics that reward substance, intellectual humility,
 * and high cross-perspective resonance over flame-wars and raw vote velocity.
 */

export function calculateCommentScore(comment) {
  if (!comment) return 0;
  const reactions = comment.reactions || {};
  
  // Weights based on cognitive value
  const changedMindWeight = 3.5;  // Intellectual humility & mind-opening
  const greatSourceWeight = 3.0;  // Epistemic rigor & external evidence
  const goodQuestionWeight = 2.0; // Curiosity & inquiry
  const spotOnWeight = 1.2;       // Standard resonance

  const changedMind = (reactions.changedMyMind || 0) * changedMindWeight;
  const greatSource = (reactions.greatSource || 0) * greatSourceWeight;
  const goodQuestion = (reactions.goodQuestion || 0) * goodQuestionWeight;
  const spotOn = (reactions.spotOn || 0) * spotOnWeight;

  // Stance bonus: reward constructive counterpoints that maintain positive reaction balance
  let stanceBonus = 0;
  if (comment.stance === 'counterpoint') {
    stanceBonus += 12; // Constructive friction is essential for high-signal debate
  } else if (comment.stance === 'resource') {
    stanceBonus += 8;
  }

  // Author / Verified Expert credibility bonus
  let credentialBonus = 0;
  if (comment.author?.isAuthor) credentialBonus += 15;
  if (comment.author?.isExpert) credentialBonus += 8;

  // Depth resonance factor: thoughtful deep replies shouldn't be penalized
  const depthFactor = Math.min((comment.depth || 0) * 1.5, 6);

  return changedMind + greatSource + goodQuestion + spotOn + stanceBonus + credentialBonus + depthFactor;
}

/**
 * Checks if a thread or any of its descendants satisfies the lens criteria
 */
export function matchesLens(comment, lensId, activeTypingThreadIds = []) {
  if (lensId === 'all' || lensId === 'high-signal' || lensId === 'newest') {
    return true;
  }

  const checkComment = (c) => {
    if (lensId === 'author-expert') {
      return c.author?.isAuthor || c.author?.isExpert;
    }
    if (lensId === 'counterpoints') {
      return c.stance === 'counterpoint';
    }
    if (lensId === 'live-now') {
      return activeTypingThreadIds.includes(c.id) || (new Date() - new Date(c.createdAt) < 1000 * 60 * 35);
    }
    return true;
  };

  // Check this comment or any of its children recursively
  if (checkComment(comment)) return true;
  if (comment.children && comment.children.length > 0) {
    return comment.children.some(child => matchesLens(child, lensId, activeTypingThreadIds));
  }
  return false;
}

/**
 * Filter and sort top-level threads according to selected lens
 */
export function applyPerspectiveLens(comments, lensId, activeTypingThreadIds = []) {
  // First filter by lens
  let filtered = comments.filter(c => matchesLens(c, lensId, activeTypingThreadIds));

  // Then sort
  const sorted = [...filtered].sort((a, b) => {
    if (lensId === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (lensId === 'live-now') {
      const aLive = activeTypingThreadIds.includes(a.id) ? 100 : 0;
      const bLive = activeTypingThreadIds.includes(b.id) ? 100 : 0;
      return (bLive + new Date(b.createdAt).getTime()) - (aLive + new Date(a.createdAt).getTime());
    }
    // Default High-Signal & Nuanced
    return calculateCommentScore(b) - calculateCommentScore(a);
  });

  return sorted;
}

/**
 * Flattens all comments into a single lookup map by ID
 */
export function buildCommentIndex(commentsList) {
  const index = {};
  function traverse(list) {
    for (const c of list) {
      index[c.id] = c;
      if (c.children && c.children.length > 0) {
        traverse(c.children);
      }
    }
  }
  traverse(commentsList);
  return index;
}

/**
 * Traverses comment tree and collects all unread comments in chronological order
 */
export function collectUnreadQueue(commentsList) {
  const unread = [];
  function traverse(list) {
    for (const c of list) {
      if (c.isUnreadSinceLastVisit) {
        unread.push(c);
      }
      if (c.children && c.children.length > 0) {
        traverse(c.children);
      }
    }
  }
  traverse(commentsList);
  // Sort oldest unread to newest so time-travel steps forward
  return unread.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

/**
 * Counts total comments in the tree
 */
export function countTotalComments(commentsList) {
  let count = 0;
  function traverse(list) {
    count += list.length;
    for (const c of list) {
      if (c.children && c.children.length > 0) {
        traverse(c.children);
      }
    }
  }
  traverse(commentsList);
  return count;
}

