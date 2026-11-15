import { HypeRealityAnalysis, RawArticle, SensationalismAnalysis } from '../types/news';

const SENSATIONAL_LEXICON: Array<{ pattern: RegExp; weight: number; label: string }> = [
  { pattern: /\bshocking\b/i, weight: 22, label: 'shocking' },
  { pattern: /\bdestroys?\b/i, weight: 20, label: 'destroys' },
  { pattern: /\bmiracle\b/i, weight: 24, label: 'miracle' },
  { pattern: /\binsane\b/i, weight: 22, label: 'insane' },
  { pattern: /\bterrifying\b/i, weight: 24, label: 'terrifying' },
  { pattern: /\bdefenseless\b/i, weight: 20, label: 'defenseless' },
  { pattern: /\bwild\b/i, weight: 16, label: 'wild' },
  { pattern: /\bsecret\b/i, weight: 18, label: 'secret' },
  { pattern: /\bobsolete forever\b/i, weight: 22, label: 'obsolete forever' },
  { pattern: /\beveryone missed\b/i, weight: 18, label: 'curiosity gap' },
  { pattern: /\byou won['’]t believe\b/i, weight: 28, label: 'curiosity gap' },
  { pattern: /\bwhat you must know\b/i, weight: 18, label: 'urgency prompt' },
  { pattern: /\bpanic[- ]?sells?\b/i, weight: 18, label: 'panic framing' },
  { pattern: /\bclash(es)?\b/i, weight: 12, label: 'conflict frame' },
  { pattern: /\bunstoppable\b/i, weight: 14, label: 'hyperbole' },
  { pattern: /\bovernight\b/i, weight: 10, label: 'hyperbolic timeframe' },
  { pattern: /\btomorrow\b/i, weight: 10, label: 'alarmist urgency' },
];

export function stripSensationalFraming(headline: string): string {
  return headline
    .replace(/^(OPINION:\s*|BREAKING:\s*|SHOCKING:\s*)/i, '')
    .replace(/\b(SHOCKING|INSANE|TERRIFYING|DEFENSELESS|MIRACLE|WILD|SECRET|REVERSED|DESTROY)\b/gi, (m) =>
      m.toLowerCase() === 'reversed' ? 'altered' : ''
    )
    .replace(/You Won['’]t Believe What /i, '')
    .replace(/—\s*(Who Panic-Sells First\?|What You Must Know!|Could Your City Go Dark Tomorrow\?)/i, '')
    .replace(/[!?]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function analyzeSensationalism(
  title: string,
  calmOverrideTitle?: string,
  fallbackSummary?: string
): SensationalismAnalysis {
  let score = 0;
  const triggers: string[] = [];

  for (const item of SENSATIONAL_LEXICON) {
    if (item.pattern.test(title)) {
      score += item.weight;
      if (!triggers.includes(item.label)) {
        triggers.push(item.label);
      }
    }
  }

  // All-caps emphasis words (4+ chars, excluding known acronyms like TSMC, ASEAN, EU, BIS, ALS, ESA, JAXA, CERT, PLC)
  const allowedAcronyms = new Set(['TSMC', 'ASEAN', 'CERT', 'NASA', 'JAXA', 'NATO', 'OPEC', 'SWIFT', 'NVDA']);
  const tokens = title.split(/[^A-Za-z]+/).filter(Boolean);
  const shoutingWords = tokens.filter(
    (word) => word.length >= 4 && word === word.toUpperCase() && !allowedAcronyms.has(word)
  );
  if (shoutingWords.length > 0) {
    score += Math.min(24, shoutingWords.length * 12);
    triggers.push('all-caps urgency');
  }

  // Punctuation sensationalism
  if (/!/.test(title)) {
    score += 12;
    triggers.push('exclamation punctuation');
  }
  if (/\?/.test(title)) {
    score += 10;
    triggers.push('curiosity-gap question');
  }
  if (/^OPINION:/i.test(title)) {
    score += 14;
    triggers.push('opinion framing');
  }

  const clickbaitScore = Math.max(0, Math.min(100, score));
  const wasDehyped = clickbaitScore >= 30;

  let calmHeadline = title;
  if (calmOverrideTitle) {
    calmHeadline = calmOverrideTitle;
  } else if (wasDehyped) {
    const cleaned = stripSensationalFraming(title);
    calmHeadline = cleaned.length >= 24 ? cleaned : fallbackSummary || title;
  }

  return {
    clickbaitScore,
    calmHeadline,
    wasDehyped,
    triggers,
  };
}

const CAVEAT_PATTERNS: Array<{ pattern: RegExp; penalty: number }> = [
  { pattern: /\bin mice\b|\bmurine\b|\btransgenic\b/i, penalty: 32 },
  { pattern: /\bunverified\b|\bpre-?print\b|\bnot yet peer reviewed\b/i, penalty: 28 },
  { pattern: /\bsocial[- ]media\b|\bno sec filing\b|\brumor\b/i, penalty: 36 },
  { pattern: /\b15-person\b|\bpilot sites\b|\b14 municipal\b/i, penalty: 18 },
  { pattern: /\bnon-binding\b|\bbacklog\b|\b18 months away\b|\bno human\b/i, penalty: 20 },
  { pattern: /\beditorial commentary\b|\bno new primary\b/i, penalty: 25 },
];

export function analyzeHypeVsReality(
  articles: RawArticle[],
  maxClickbaitScore: number
): HypeRealityAnalysis {
  const uniqueCaveats = Array.from(
    new Set(articles.flatMap((a) => a.caveats.map((c) => c.trim()).filter(Boolean)))
  );

  let caveatWeight = 0;
  for (const caveat of uniqueCaveats) {
    let matched = false;
    for (const rule of CAVEAT_PATTERNS) {
      if (rule.pattern.test(caveat)) {
        caveatWeight += rule.penalty;
        matched = true;
        break;
      }
    }
    if (!matched) {
      caveatWeight += 10;
    }
  }

  // Divergence peaks when high-clickbait/sweeping claims meet strong empirical caveats
  const divergenceScore = Math.min(
    100,
    Math.round(caveatWeight * 0.65 + (uniqueCaveats.length > 0 ? maxClickbaitScore * 0.42 : maxClickbaitScore * 0.15))
  );

  let divergenceLevel: HypeRealityAnalysis['divergenceLevel'] = 'Verified / Low Hype';
  if (divergenceScore >= 60 && uniqueCaveats.length > 0) {
    divergenceLevel = 'High Hype Gap';
  } else if (divergenceScore >= 28 && uniqueCaveats.length > 0) {
    divergenceLevel = 'Moderate Caveat';
  }

  return {
    hasCaveatGap: uniqueCaveats.length > 0 && divergenceScore >= 25,
    divergenceLevel,
    divergenceScore,
    caveats: uniqueCaveats,
  };
}

