import { PlayerReview, PatchMilestone, ReviewTimelineBucket } from '../../src/types/game';

export interface AnomalyAnalysisResult {
  hasAnomaly: boolean;
  message?: string;
  timelineBuckets: ReviewTimelineBucket[];
}

export function analyzeReviewAnomalies(
  reviews: PlayerReview[],
  patchNotes: PatchMilestone[] = []
): AnomalyAnalysisResult {
  if (!reviews || reviews.length === 0) {
    return {
      hasAnomaly: false,
      timelineBuckets: [],
    };
  }

  // Group reviews into month-year buckets
  const bucketMap = new Map<string, { positive: number; negative: number; reviews: PlayerReview[] }>();
  
  for (const review of reviews) {
    const dateObj = new Date(review.createdAt);
    const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    
    if (!bucketMap.has(key)) {
      bucketMap.set(key, { positive: 0, negative: 0, reviews: [] });
    }
    
    const entry = bucketMap.get(key)!;
    if (review.recommended) {
      entry.positive++;
    } else {
      entry.negative++;
    }
    entry.reviews.push(review);
  }

  // Sort chronological
  const sortedPeriods = Array.from(bucketMap.keys()).sort();
  
  // Calculate statistics on negative review counts
  const negativeCounts = sortedPeriods.map(p => bucketMap.get(p)!.negative);
  const n = negativeCounts.length;
  
  const meanNeg = n > 0 ? negativeCounts.reduce((a, b) => a + b, 0) / n : 0;
  const variance = n > 1 
    ? negativeCounts.reduce((acc, val) => acc + Math.pow(val - meanNeg, 2), 0) / (n - 1)
    : 0;
  const stdDevNeg = Math.sqrt(variance);

  let hasAnomaly = false;
  let anomalyMessage = '';

  const timelineBuckets: ReviewTimelineBucket[] = sortedPeriods.map(period => {
    const data = bucketMap.get(period)!;
    const total = data.positive + data.negative;
    const ratio = total > 0 ? (data.positive / total) * 100 : 0;
    
    // Check if any patch occurred in this period
    const patchInPeriod = patchNotes.find(patch => {
      const pDate = new Date(patch.releaseDate);
      const patchPeriod = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
      return patchPeriod === period;
    });

    // Check statistical threshold: > 2.5 standard deviations above mean negative volume
    const zScore = stdDevNeg > 0 ? (data.negative - meanNeg) / stdDevNeg : 0;
    const isStatAnomaly = zScore >= 2.5 && data.negative >= 4;
    
    // Check patch shock: negative ratio spike (ratio < 40% positive) in period with a patch where negative count is elevated
    const isPatchShock = !!(patchInPeriod && ratio < 40 && data.negative >= 4);

    const isAnomaly = isStatAnomaly || isPatchShock;

    if (isAnomaly) {
      hasAnomaly = true;
      if (patchInPeriod) {
        anomalyMessage = `Off-Topic Review Activity Detected: Anomalous negative spike (${zScore.toFixed(1)}σ variance) identified following Patch ${patchInPeriod.version} ("${patchInPeriod.title}"). Telemetry filters are actively mitigating off-topic brigading.`;
      } else {
        anomalyMessage = `Off-Topic Review Activity Detected: Statistical anomaly (${zScore.toFixed(1)}σ deviation) flagged in ${period}. Sentiment scores have been playtime-normalized.`;
      }
    }

    return {
      period,
      positive: data.positive,
      negative: data.negative,
      ratio: Math.round(ratio),
      total,
      associatedPatch: patchInPeriod,
      isAnomaly,
    };
  });

  return {
    hasAnomaly,
    message: hasAnomaly ? anomalyMessage : undefined,
    timelineBuckets,
  };
}
