/**
 * Hollis Trust Engine: Mathematical governance, entity scanning,
 * Bayesian score aggregation, and perceptual hash algorithms.
 */

// Bayesian weighted rating calculation
// Formula: (v / (v + m)) * R + (m / (v + m)) * C
// v = number of reviews for the product
// m = minimum review weight threshold (prior confidence, default 25)
// R = average rating of the product
// C = mean rating across entire catalog (default 4.5)
export function calculateBayesianScore(averageRating, reviewCount, priorWeight = 25, priorMean = 4.5) {
  if (!reviewCount || reviewCount === 0) return priorMean;
  const weighted = (reviewCount / (reviewCount + priorWeight)) * averageRating + (priorWeight / (reviewCount + priorWeight)) * priorMean;
  return Number(weighted.toFixed(2));
}

// Entity pattern definitions for automated PII & Compliance linting
export const ENTITY_PATTERNS = [
  {
    type: 'PII_PHONE',
    label: 'Phone Number',
    regex: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
    mask: (match, p1, p2, p3) => `[•••-•••-${p3 || match.slice(-4)}]`,
    riskWeight: 20,
    tagColor: 'amber'
  },
  {
    type: 'PII_EMAIL',
    label: 'Email Address',
    regex: /\b([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\b/g,
    mask: (match, p1, p2) => `[${p1[0]}•••@${p2}]`,
    riskWeight: 20,
    tagColor: 'amber'
  },
  {
    type: 'PII_ADDRESS',
    label: 'Address',
    regex: /\b\d{1,5}\s+(?:[A-Za-z0-9.]+\s+){1,4}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Way|Lane|Ln|Court|Ct|Austin|Seattle|TX|WA|CA|NY)\b/gi,
    mask: () => '[Address redacted]',
    riskWeight: 25,
    tagColor: 'amber'
  },
  {
    type: 'MEDICAL_CLAIM',
    label: 'Health Claim',
    regex: /\b(?:cured|healed|treated|reversed|cures|heals)\s+(?:my\s+)?(?:insomnia|cancer|diabetes|arthritis|infection|anxiety|depression|covid|pain|eczema)\b/gi,
    mask: () => '[Health claim removed]',
    riskWeight: 35,
    tagColor: 'error'
  },
  {
    type: 'COMPETITOR_LINK',
    label: 'Competitor Link',
    regex: /\b(?:https?:\/\/|www\.)[^\s]+\b|(?:amazon\.com|walmart\.com|target\.com|aliexpress\.com)[^\s]*/gi,
    mask: () => '[Link redacted]',
    riskWeight: 25,
    tagColor: 'amber'
  },
  {
    type: 'PROFANITY',
    label: 'Profanity',
    regex: /\b(?:damn|crap|shit|fuck|bitch|bastard|asshole)\b/gi,
    mask: (match) => `${match[0]}${'*'.repeat(Math.max(1, match.length - 1))}`,
    riskWeight: 15,
    tagColor: 'error'
  }
];

/**
 * Scan raw review text and return detected sensitive entities with character spans
 */
export function scanTextEntities(text) {
  if (!text) return [];
  const entities = [];

  ENTITY_PATTERNS.forEach(pattern => {
    let match;
    const regex = new RegExp(pattern.regex);
    while ((match = regex.exec(text)) !== null) {
      entities.push({
        id: `${pattern.type}-${match.index}`,
        type: pattern.type,
        label: pattern.label,
        rawText: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        suggestedMask: pattern.mask(match[0], match[1], match[2], match[3]),
        riskWeight: pattern.riskWeight,
        tagColor: pattern.tagColor
      });
    }
  });

  // Sort by start index ascending
  return entities.sort((a, b) => a.startIndex - b.startIndex);
}

/**
 * Apply all entity redactions to produce sanitized text with clean capsules
 */
export function sanitizeReviewText(text, entitiesToRedact = null) {
  if (!text) return '';
  const entities = entitiesToRedact || scanTextEntities(text);
  if (entities.length === 0) return text;

  let result = '';
  let lastIndex = 0;

  entities.forEach(entity => {
    // Append text leading up to entity
    if (entity.startIndex > lastIndex) {
      result += text.substring(lastIndex, entity.startIndex);
    }
    // Append masked capsule
    result += entity.suggestedMask;
    lastIndex = entity.endIndex;
  });

  if (lastIndex < text.length) {
    result += text.substring(lastIndex);
  }

  return result;
}

/**
 * Compute aggregate risk score (0-100) and risk flag tags
 */
export function evaluateReviewRisk({
  rating,
  title,
  body,
  provenanceType, // 'verified_purchase' | 'incentivized_gifted' | 'repeat_buyer' | 'unverified'
  accountAgeDays = 30,
  hasDuplicateMediaHash = false,
  isVelocitySpikeSubnet = false
}) {
  const flags = [];
  let score = 5; // Baseline noise

  const entities = scanTextEntities(`${title || ''} ${body || ''}`);
  entities.forEach(ent => {
    score += ent.riskWeight;
    if (!flags.includes(ent.type.toLowerCase())) {
      flags.push(ent.type.toLowerCase());
    }
  });

  if (provenanceType === 'unverified') {
    score += 30;
    flags.push('unverified_buyer');
  } else if (provenanceType === 'incentivized_gifted') {
    flags.push('gifted_incentivized');
  }

  if (accountAgeDays <= 1) {
    score += 25;
    flags.push('brand_new_account');
  }

  if (hasDuplicateMediaHash) {
    score += 45;
    flags.push('duplicate_image_phash');
  }

  if (isVelocitySpikeSubnet) {
    score += 35;
    flags.push('velocity_spike_cluster');
  }

  // Low star reviews from unverified users are high priority
  if (rating <= 2 && provenanceType === 'unverified') {
    score += 20;
    flags.push('unverified_low_star');
  }

  const normalizedScore = Math.min(100, Math.max(0, score));

  return {
    riskScore: normalizedScore,
    riskLevel: normalizedScore >= 70 ? 'CRITICAL' : normalizedScore >= 40 ? 'MEDIUM' : 'LOW',
    flags,
    entities
  };
}

/**
 * Client-side Perceptual Hash (pHash) simulation for image deduplication
 */
export async function computePerceptualHash(imageElementOrCanvas) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'hash_' + Math.random().toString(36).substring(2, 9);

    ctx.drawImage(imageElementOrCanvas, 0, 0, 32, 32);
    const imgData = ctx.getImageData(0, 0, 32, 32);
    const grayValues = [];

    for (let i = 0; i < imgData.data.length; i += 4) {
      const gray = Math.floor(0.299 * imgData.data[i] + 0.587 * imgData.data[i + 1] + 0.114 * imgData.data[i + 2]);
      grayValues.push(gray);
    }

    const mean = grayValues.reduce((a, b) => a + b, 0) / grayValues.length;
    let hashHex = '';
    let currentByte = 0;

    for (let i = 0; i < 64; i++) {
      if (grayValues[i] > mean) {
        currentByte |= (1 << (i % 8));
      }
      if (i % 8 === 7) {
        hashHex += currentByte.toString(16).padStart(2, '0');
        currentByte = 0;
      }
    }

    return `phash_${hashHex.slice(0, 8)}`;
  } catch (err) {
    console.warn('pHash calculation fallback:', err);
    return 'phash_a8f2';
  }
}

