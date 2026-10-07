import type { DiagnosticSnapshot } from '../types/telemetry';

/**
 * Formats a comprehensive Markdown Benchmark Passport suitable for GitHub issues,
 * QA defect reports, and team documentation.
 */
export function generateMarkdownPassport(snapshot: DiagnosticSnapshot): string {
  const { hardware, metrics } = snapshot;
  const statusEmoji = metrics.stabilityScore >= 95 ? '🟢' : metrics.stabilityScore >= 75 ? '🟡' : '🔴';
  const statusText = metrics.stabilityScore >= 95 ? 'OPTIMAL (STABLE)' : metrics.stabilityScore >= 75 ? 'DEGRADED' : 'CRITICAL HITCHING';

  return `### ⚡ Avionics Telemetry Benchmark Passport
> Generated at **${new Date(snapshot.timestamp).toUTCString()}** | Incident ID: \`${snapshot.id}\`
> Overall Stability Rating: **${statusEmoji} ${metrics.stabilityScore.toFixed(1)}% — ${statusText}**

#### 🎮 Framerate & Pacing Matrix
| Metric | Current | Rolling Avg | 1% Low (P99) | 0.1% Low (P99.9) |
| :--- | :--- | :--- | :--- | :--- |
| **Framerate** | \`${metrics.currentFps.toFixed(1)} FPS\` | \`${metrics.averageFps.toFixed(1)} FPS\` | \`${metrics.onePercentLowFps.toFixed(1)} FPS\` | \`${metrics.pointOnePercentLowFps.toFixed(1)} FPS\` |
| **Frame Time** | \`${metrics.currentFrameTimeMs.toFixed(2)} ms\` | \`${(1000 / (metrics.averageFps || 60)).toFixed(2)} ms\` | \`${(1000 / (metrics.onePercentLowFps || 60)).toFixed(2)} ms\` | \`${metrics.maxFrameTimeMs.toFixed(2)} ms (Max Peak)\` |

#### 🚨 Hitch & Event Summary
- **Total Monitored Frames:** \`${metrics.totalFrames.toLocaleString()}\`
- **Dropped Frame Events:** \`${metrics.droppedFrames}\`
- **Long Tasks (>50ms frame freezes):** \`${metrics.longTaskCount}\`
- **Active Memory Footprint:** \`${metrics.memoryUsedMb ? `${metrics.memoryUsedMb} MB / ${metrics.memoryLimitMb || 'N/A'} MB` : 'Browser Sandboxed'}\`

#### 🖥️ Hardware & Platform Profile
- **GPU Accelerator:** \`${hardware.gpuRenderer}\` (${hardware.gpuVendor || 'Unknown Vendor'})
- **CPU Topology:** \`${hardware.cores} Logical Cores\`
- **System Memory:** \`${hardware.deviceMemoryGb ? `${hardware.deviceMemoryGb} GB Allocated` : 'Not Reported'}\`
- **Display Refresh Rate:** \`${hardware.screenRefreshRate} Hz\` (Device Pixel Ratio: \`${hardware.dpr}x\`)
- **Graphics API:** \`${hardware.webglVersion}\` (Max Texture Size: \`${hardware.maxTextureSize}px\`)
- **Environment:** \`${hardware.userAgent.slice(0, 100)}...\`

${snapshot.incidentReason ? `> ⚠️ **Incident Trigger Reason:** ${snapshot.incidentReason}` : ''}
`;
}

/**
 * Formats a concise Discord-optimized scorecard with code blocks and emoji gauges.
 */
export function generateDiscordScorecard(snapshot: DiagnosticSnapshot): string {
  const { hardware, metrics } = snapshot;
  const statusIcon = metrics.stabilityScore >= 95 ? '⚡' : metrics.stabilityScore >= 75 ? '⚠️' : '🚨';

  return `\`\`\`asciidoc
${statusIcon} AVIONICS TELEMETRY SCORECARD [${snapshot.id.slice(0, 8)}]
==================================================
AVG FPS      :: ${metrics.averageFps.toFixed(1)} FPS (Target: ${hardware.screenRefreshRate}Hz)
1% LOW FPS   :: ${metrics.onePercentLowFps.toFixed(1)} FPS
0.1% LOW     :: ${metrics.pointOnePercentLowFps.toFixed(1)} FPS
FRAME TIME   :: ${metrics.currentFrameTimeMs.toFixed(2)}ms (Max: ${metrics.maxFrameTimeMs.toFixed(1)}ms)
STABILITY    :: ${metrics.stabilityScore.toFixed(1)}% | Dropped: ${metrics.droppedFrames} | Long Tasks: ${metrics.longTaskCount}
--------------------------------------------------
GPU          :: ${hardware.gpuRenderer.slice(0, 42)}
HARDWARE     :: ${hardware.cores} Cores | ${hardware.deviceMemoryGb || '?' }GB RAM | ${hardware.screenRefreshRate}Hz @ ${hardware.dpr}x
\`\`\``;
}

/**
 * Generates single-line copyable passport string
 */
export function generateShortBadgeString(snapshot: DiagnosticSnapshot): string {
  const { hardware, metrics } = snapshot;
  return `⚡ ${metrics.currentFps.toFixed(1)} FPS // 1% Low: ${metrics.onePercentLowFps.toFixed(1)} FPS (${(1000 / metrics.onePercentLowFps).toFixed(1)}ms) // ${metrics.droppedFrames} Drops // ${hardware.gpuRenderer.slice(0, 30)} [${hardware.screenRefreshRate}Hz]`;
}

/**
 * Prompts user download of complete JSON diagnostic payload
 */
export function exportDiagnosticJson(snapshot: DiagnosticSnapshot): void {
  const jsonStr = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `avionics-diagnostic-${snapshot.id}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
