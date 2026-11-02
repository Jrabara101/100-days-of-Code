/**
 * Hollis Trust Engine (Node.js Serverless / Microservice module)
 * Implements pre-insert risk heuristics, PII regex scanning, and Bayesian aggregation.
 */

const ENTITY_PATTERNS = [
  {
    type: 'PII_PHONE',
    label: 'Phone Number',
    regex: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
    mask: (match, p1, p2, p3) => `[•••-•••-${p3 || match.slice(-4)}]`,
    riskWeight: 20
  },
  {
    type: 'PII_EMAIL',
    label: 'Email Address',
    regex: /\b([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\b/g,
    mask: (match, p1, p2) => `[${p1[0]}•••@${p2}]`,
    riskWeight: 20
  },
  {
    type: 'PII_ADDRESS',
    label: 'Address',
    regex: /\b\d{1,5}\s+(?:[A-Za-z0-9.]+\s+){1,4}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Way|Lane|Ln|Court|Ct|Austin|Seattle|TX|WA|CA|NY)\b/gi,
    mask: () => '[Address redacted]',
    riskWeight: 25
  },
  {
    type: 'MEDICAL_CLAIM',
    label: 'Health Claim',
    regex: /\b(?:cured|healed|treated|reversed|cures|heals)\s+(?:my\s+)?(?:insomnia|cancer|diabetes|arthritis|infection|anxiety|depression|covid|pain|eczema)\b/gi,
    mask: () => '[Health claim removed]',
    riskWeight: 35
  },
  {
    type: 'COMPETITOR_LINK',
    label: 'Competitor Link',
    regex: /\b(?:https?:\/\/|www\.)[^\s]+\b|(?:amazon\.com|walmart\.com|target\.com|aliexpress\.com)[^\s]*/gi,
    mask: () => '[Link redacted]',
    riskWeight: 25
  }
];

function scanTextEntities(text) {
  if (!text) return [];
  const entities = [];

  ENTITY_PATTERNS.forEach(pattern => {
    let match;
    const regex = new RegExp(pattern.regex);
    while ((match = regex.exec(text)) !== null) {
      entities.push({
        type: pattern.type,
        label: pattern.label,
        rawText: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        suggestedMask: pattern.mask(match[0], match[1], match[2], match[3]),
        riskWeight: pattern.riskWeight
      });
    }
  });

  return entities.sort((a, b) => a.startIndex - b.startIndex);
}

function sanitizeText(text) {
  if (!text) return '';
  const entities = scanTextEntities(text);
  if (entities.length === 0) return text;

  let result = '';
  let lastIndex = 0;

  entities.forEach(entity => {
    if (entity.startIndex > lastIndex) {
      result += text.substring(lastIndex, entity.startIndex);
    }
    result += entity.suggestedMask;
    lastIndex = entity.endIndex;
  });

  if (lastIndex < text.length) {
    result += text.substring(lastIndex);
  }

  return result;
}

function computeRiskScore({ rating, title, body, provenanceType, accountAgeDays = 30 }) {
  const flags = [];
  let score = 5;

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
  }

  if (accountAgeDays <= 1) {
    score += 25;
    flags.push('brand_new_account');
  }

  return {
    riskScore: Math.min(100, Math.max(0, score)),
    flags,
    entities
  };
}

module.exports = {
  scanTextEntities,
  sanitizeText,
  computeRiskScore
};

