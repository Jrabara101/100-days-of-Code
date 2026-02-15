const SECOND_MS = 1_000;
const DAY_MS = 24 * 60 * 60 * 1_000;
const DAY_COUNT = 14;
const POINT_COUNT = (DAY_MS * DAY_COUNT) / SECOND_MS;

function createSeededRandom(seed) {
  let state = seed >>> 0;

  return function nextRandom() {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function buildDataset() {
  const endTime = Math.floor(Date.now() / SECOND_MS) * SECOND_MS;
  const startTime = endTime - (POINT_COUNT - 1) * SECOND_MS;

  const timestamps = new Float64Array(POINT_COUNT);
  const values = new Float32Array(POINT_COUNT);

  const random = createSeededRandom(20260215);

  for (let index = 0; index < POINT_COUNT; index += 1) {
    const ts = startTime + index * SECOND_MS;

    const normalizedIndex = index / POINT_COUNT;
    const trend = normalizedIndex * 35;
    const slowSeasonality = Math.sin((index / 86_400) * Math.PI * 2) * 11;
    const fastSeasonality = Math.sin((index / 900) * Math.PI * 2) * 5;
    const noise = (random() - 0.5) * 2.8;
    const spike = random() > 0.9996 ? (random() - 0.5) * 95 : 0;

    timestamps[index] = ts;
    values[index] = 80 + trend + slowSeasonality + fastSeasonality + noise + spike;
  }

  return {
    timestamps,
    values,
    sampleRateMs: SECOND_MS,
    length: POINT_COUNT,
    startTime,
    endTime
  };
}

const DATASET = buildDataset();

export function getDataset() {
  return DATASET;
}

export function getDatasetBounds() {
  return {
    startTime: DATASET.startTime,
    endTime: DATASET.endTime
  };
}

export function getDatasetSummary() {
  return {
    totalPoints: DATASET.length,
    sampleRateMs: DATASET.sampleRateMs,
    startTime: DATASET.startTime,
    endTime: DATASET.endTime
  };
}
