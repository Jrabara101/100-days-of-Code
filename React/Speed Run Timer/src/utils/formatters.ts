import { MultiplayerRaceState, RaceParticipant } from '../types/race';

/**
 * Format milliseconds into standard speedrun timer strings (MM:SS.ms or HH:MM:SS.ms)
 */
export function formatTime(ms: number, showMs = true, msDigits = 2): string {
  if (ms < 0 || isNaN(ms)) ms = 0;

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const factor = Math.pow(10, msDigits);
  const milliseconds = Math.floor((ms % 1000) / (1000 / factor));

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');

  let timeStr = '';
  if (hours > 0) {
    timeStr = `${hours}:${pad(minutes)}:${pad(seconds)}`;
  } else {
    timeStr = `${pad(minutes)}:${pad(seconds)}`;
  }

  if (showMs) {
    timeStr += `.${pad(milliseconds, msDigits)}`;
  }

  return timeStr;
}

/**
 * Split time into main part and millisecond part for high-contrast decoupled styling
 */
export function splitTimeParts(ms: number): { main: string; ms: string } {
  if (ms < 0 || isNaN(ms)) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milli = Math.floor((ms % 1000) / 10); // 2 digits

  const pad = (n: number) => String(n).padStart(2, '0');

  const main = hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
  return {
    main,
    ms: pad(milli),
  };
}

/**
 * Format split delta in +/- format (+01.84s / -00.42s)
 */
export function formatDelta(deltaMs: number | undefined): { text: string; isAhead: boolean; isBehind: boolean } {
  if (deltaMs === undefined || isNaN(deltaMs)) {
    return { text: '-:--.--', isAhead: false, isBehind: false };
  }

  const isAhead = deltaMs < 0;
  const isBehind = deltaMs > 0;
  const absMs = Math.abs(deltaMs);

  const totalSeconds = Math.floor(absMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hundredths = Math.floor((absMs % 1000) / 10);

  const pad = (n: number) => String(n).padStart(2, '0');
  const sign = isAhead ? '-' : '+';

  let deltaStr = '';
  if (minutes > 0) {
    deltaStr = `${sign}${minutes}:${pad(seconds)}.${pad(hundredths)}`;
  } else {
    deltaStr = `${sign}${pad(seconds)}.${pad(hundredths)}`;
  }

  return {
    text: deltaStr,
    isAhead,
    isBehind,
  };
}

/**
 * Generate Discord & Social ready text scorecard with emojis
 */
export function generateShareableScorecard(
  state: MultiplayerRaceState,
  participant?: RaceParticipant
): string {
  const runner = participant || state.participants[0];
  const finalTimeStr = runner?.finalTimeMs ? formatTime(runner.finalTimeMs) : 'DNF';
  const goldCount = runner?.completedSplits.filter(s => s.isGold).length || 0;

  const header = `⏱️ ⚡ 🥇 [SPEEDSYNC MATCH SCORECARD] 🥇 ⚡ ⏱️`;
  const game = `🎮 Game: ${state.gameTitle} (${state.categoryName})`;
  const runnerInfo = `👤 Runner: ${runner?.username || 'Anonymous'}`;
  const time = `⚡ Final Time: ${finalTimeStr}`;
  const golds = `✨ Gold Splits Crushed: ${goldCount} / ${state.segments.length}`;
  const code = `🏷️ Room Code: ${state.roomCode}`;
  const link = `🔗 Join the race at SpeedSync Live: ${window.location.origin}/?room=${state.roomCode}`;

  return [header, game, runnerInfo, time, golds, code, link].join('\n');
}
