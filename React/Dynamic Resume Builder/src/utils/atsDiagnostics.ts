import { DocumentState, AtsDiagnosticResult } from '../types/resume';

export const POWER_ACTION_VERBS = [
  'scaled',
  'architected',
  'formulated',
  'created',
  'spearheaded',
  'accelerated',
  'orchestrated',
  'mentored',
  'standardized',
  'engineered',
  'constructed',
  'optimized',
  'delivered',
  'decreased',
  'increased',
  'automated',
  'pioneered',
  'established',
  'designed',
  'developed',
  'implemented',
  'led',
  'transformed',
  'resolved',
  'streamlined',
  'championed',
  'deployed',
  'integrated',
  'reduced',
  'maximized',
];

export const WEAK_PHRASE_REPLACEMENTS: Record<string, string> = {
  'worked on': 'Architected and engineered',
  'responsible for': 'Spearheaded and delivered',
  'helped with': 'Collaborated on and accelerated',
  'handled': 'Orchestrated and managed',
  'did': 'Executed and formulated',
  'made': 'Constructed and deployed',
  'assisted in': 'Contributed to scaling',
};

export function calculateAtsDiagnostics(doc: DocumentState): AtsDiagnosticResult {
  // Aggregate all text
  const textChunks: string[] = [
    doc.header.fullName,
    doc.header.roleTitle,
    doc.header.secondaryTitle,
    doc.header.location,
  ];

  let totalBullets = 0;
  let bulletsWithMetrics = 0;

  for (const section of doc.sections) {
    if (!section.isVisible) continue;
    if (section.content.text) {
      textChunks.push(section.content.text);
    }
    if (section.content.items) {
      for (const item of section.content.items) {
        textChunks.push(item.role, item.company);
        for (const bullet of item.bullets) {
          totalBullets++;
          textChunks.push(bullet);
          if (/\b(\d+%|\$\d+[\d,]*|\d+x|\d+\+|\d{2,})\b/i.test(bullet)) {
            bulletsWithMetrics++;
          }
        }
      }
    }
    if (section.content.capabilities) {
      for (const cat of section.content.capabilities) {
        textChunks.push(cat.category);
        for (const skill of cat.skills) {
          textChunks.push(skill.name);
        }
      }
    }
    if (section.content.education) {
      for (const edu of section.content.education) {
        textChunks.push(edu.degree, edu.institution);
      }
    }
    if (section.content.patents) {
      for (const pat of section.content.patents) {
        textChunks.push(pat.title, pat.description);
      }
    }
  }

  const combinedText = textChunks.join(' ');
  const words = combinedText
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);

  const wordCount = words.length;

  // Find unique action verbs present
  const foundVerbsSet = new Set<string>();
  for (const verb of POWER_ACTION_VERBS) {
    // Regex for word boundary
    const regex = new RegExp(`\\b${verb}\\b`, 'i');
    if (regex.test(combinedText)) {
      foundVerbsSet.add(verb);
    }
  }

  const foundActionVerbs = Array.from(foundVerbsSet);
  const actionVerbCount = foundActionVerbs.length;

  // Target role check
  const targetRolePresent =
    doc.header.roleTitle.trim().length > 3 &&
    doc.header.secondaryTitle.trim().length > 2;

  // Metrics ratio
  const metricsRatio = totalBullets > 0 ? (bulletsWithMetrics / totalBullets) * 100 : 0;

  // Heuristic Scoring (Target: 80 - 95 for rich CV)
  let score = 50;

  // Verbs points (up to 20 pts)
  score += Math.min(20, actionVerbCount * 2);

  // Word count points (up to 15 pts) - ideal range 350 - 650 words
  if (wordCount >= 350 && wordCount <= 700) {
    score += 15;
  } else if (wordCount >= 200) {
    score += 8;
  }

  // Metrics ratio points (up to 10 pts)
  if (metricsRatio >= 60) {
    score += 10;
  } else if (metricsRatio >= 30) {
    score += 6;
  }

  // Target Role points (5 pts)
  if (targetRolePresent) {
    score += 5;
  }

  score = Math.min(98, Math.max(25, score));

  let rating: AtsDiagnosticResult['rating'] = 'Needs Improvement';
  if (score >= 85) {
    rating = 'Strong Fit';
  } else if (score >= 70) {
    rating = 'Competitive';
  }

  const recommendations: string[] = [];
  if (actionVerbCount < 10) {
    recommendations.push('Incorporate at least 10 high-impact action verbs (e.g. "Orchestrated", "Scaled").');
  }
  if (metricsRatio < 50) {
    recommendations.push('Include measurable metrics (% increase, $ saved, latency reduction) in more bullets.');
  }
  if (!targetRolePresent) {
    recommendations.push('Clarify both Primary and Secondary Target Roles in header.');
  }
  if (wordCount < 350) {
    recommendations.push('Expand bullet points with context and impact to reach optimal word density.');
  }

  return {
    score,
    rating,
    actionVerbCount,
    foundActionVerbs,
    wordCount,
    targetRolePresent,
    bulletCount: totalBullets,
    metricsRatio: Math.round(metricsRatio),
    recommendations,
  };
}

export function autoEnhanceDoc(doc: DocumentState): { updatedDoc: DocumentState; enhancementsApplied: number } {
  let count = 0;
  const newSections = doc.sections.map((section) => {
    if (section.type === 'experience' && section.content.items) {
      const newItems = section.content.items.map((item) => {
        const newBullets = item.bullets.map((bullet) => {
          let enhanced = bullet;
          for (const [weak, replacement] of Object.entries(WEAK_PHRASE_REPLACEMENTS)) {
            const regex = new RegExp(`^${weak}\\b`, 'i');
            if (regex.test(enhanced)) {
              enhanced = enhanced.replace(regex, replacement);
              count++;
            }
          }
          // If bullet doesn't start with a capitalized action verb, give it a punchy verb
          if (!/^[A-Z][a-z]+ed\b/.test(enhanced) && !/^[A-Z]/.test(enhanced)) {
            enhanced = 'Accelerated ' + enhanced.charAt(0).toLowerCase() + enhanced.slice(1);
            count++;
          }
          return enhanced;
        });
        return { ...item, bullets: newBullets };
      });
      return { ...section, content: { ...section.content, items: newItems } };
    }
    return section;
  });

  return {
    updatedDoc: { ...doc, sections: newSections },
    enhancementsApplied: count,
  };
}
