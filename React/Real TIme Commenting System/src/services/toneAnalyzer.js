/**
 * Constructive Tone & Intelligence Helper
 * 1. Checks if a user's question draft has already been answered by the Author.
 * 2. Provides gentle constructive reframing nudges for high-intensity or hostile drafts.
 */

// Author-answered knowledge base from the thread context
const AUTHOR_ANSWERS_KNOWLEDGE = [
  {
    topic: "viewport buffer / scroll jumps",
    keywords: ["scroll", "jump", "viewport", "buffer", "displacement", "jank", "realtime", "sync"],
    authorName: "Dr. Elena Vance",
    commentId: "c-103-1",
    excerpt: "We solve this via a dual-threshold delta buffer: If the reader is idle or scrolling slowly, the floating glass pill surfaces with avatar bubbles. But in the composer, if you attempt to reply, we show an inline indicator [Inspect Diff].",
    advice: "The author clarified how the dual-threshold delta buffer balances live velocity with scroll stability in comment #c-103-1."
  },
  {
    topic: "mobile indentation & focus drawer",
    keywords: ["mobile", "indent", "staircase", "width", "drawer", "slide-over", "breadcrumbs", "level", "squish"],
    authorName: "Dr. Elena Vance",
    commentId: "c-102-1-1",
    excerpt: "We use an expandable contextual breadcrumb trail at the top of the Focus Drawer: it shows the root parent in a muted teaser box with a 1-click toggle to expand the full lineage.",
    advice: "Dr. Vance explained the expandable breadcrumb hierarchy for the Focus Drawer in comment #c-102-1-1."
  },
  {
    topic: "confidence vs risk / pre-mortem rules",
    keywords: ["risk", "confidence", "catastrophic", "pre-mortem", "cool-down", "rfc", "framework"],
    authorName: "Dr. Elena Vance & Marcus Sterling",
    commentId: "c-101-1",
    excerpt: "The author highlighted how the 'Confidence vs Risk' duality mirrors the ancient epistemological distinction between episteme and techne, linked with Marcus's pre-mortem matrix.",
    advice: "The thread already explores operational risk boundaries and 48-hour cool-downs in thread #c-101."
  }
];

/**
 * Checks draft text against known author answers
 */
export function checkAlreadyAnswered(draftText) {
  if (!draftText || draftText.trim().length < 12) return null;
  const lower = draftText.toLowerCase();

  for (const item of AUTHOR_ANSWERS_KNOWLEDGE) {
    const matchCount = item.keywords.filter(kw => lower.includes(kw)).length;
    if (matchCount >= 2 || (matchCount >= 1 && lower.includes("?"))) {
      return item;
    }
  }
  return null;
}

/**
 * Analyzes tone and hostility/aggression in drafts
 */
export function analyzeTone(draftText) {
  if (!draftText || draftText.trim().length < 8) {
    return { isHeated: false };
  }

  const clean = draftText.trim();
  
  // Check for excessive ALL CAPS
  const lettersOnly = clean.replace(/[^a-zA-Z]/g, "");
  const uppercaseLetters = clean.replace(/[^A-Z]/g, "");
  const capsRatio = lettersOnly.length > 10 ? uppercaseLetters.length / lettersOnly.length : 0;
  
  // Excessive exclamation marks
  const exclamationCount = (clean.match(/!/g) || []).length;

  // Hostile / Dismissive triggers
  const hostileRegex = /\b(stupid|idiot|garbage|nonsense|ridiculous|clueless|moron|complete lie|terrible|worthless|trash|shut up|hate this)\b/i;
  const hasHostileWord = hostileRegex.test(clean);

  const isHeated = capsRatio > 0.55 || hasHostileWord || exclamationCount >= 4;

  if (!isHeated) {
    return { isHeated: false };
  }

  // Generate a constructive reframe suggestion
  let reframed = clean;
  // Replace hostile terms with diplomatic inquiry
  reframed = reframed
    .replace(/\b(stupid|idiot|garbage|nonsense|ridiculous|trash)\b/gi, "challenging in practice")
    .replace(/\b(complete lie|clueless)\b/gi, "unaligned with my observations")
    .replace(/!{2,}/g, ".")
    .toLowerCase();
  
  // Capitalize first letter
  reframed = reframed.charAt(0).toUpperCase() + reframed.slice(1);
  const suggestion = `I see a potential counterpoint to this premise: ${reframed}`;

  return {
    isHeated: true,
    reason: capsRatio > 0.55 
      ? "High capitalization detected" 
      : hasHostileWord 
        ? "Sharp language detected" 
        : "High emotional intensity detected",
    suggestedStance: "counterpoint",
    suggestedReframing: suggestion
  };
}

