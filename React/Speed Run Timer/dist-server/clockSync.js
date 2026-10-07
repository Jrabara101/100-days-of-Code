// Monotonic Clock Authority
// Immune to wall-clock manipulation, cheat-engine spoofing, and NTP drift
const processStartHrTime = process.hrtime.bigint();
const processStartUtc = Date.now();
/**
 * Returns monotonic millisecond timestamp since server start with sub-millisecond precision.
 */
export function getMonotonicTimeMs() {
    const currentHrTime = process.hrtime.bigint();
    const diffNs = currentHrTime - processStartHrTime;
    return Number(diffNs) / 1_000_000;
}
/**
 * Returns authoritative UTC timestamp synchronized to the monotonic baseline.
 */
export function getAuthoritativeUtcMs() {
    return processStartUtc + getMonotonicTimeMs();
}
