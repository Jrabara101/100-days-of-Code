import { SplitSegmentDefinition } from '../types/race';

/**
 * Convert LiveSplit time string (e.g. "00:01:42.1000000" or "01:42.10") to milliseconds
 */
export function parseTimeStringToMs(timeStr: string | null | undefined): number | undefined {
  if (!timeStr || timeStr.trim() === '' || timeStr === '-') return undefined;

  const parts = timeStr.trim().split(':');
  if (parts.length === 1) {
    const s = parseFloat(parts[0]);
    return isNaN(s) ? undefined : Math.round(s * 1000);
  }

  if (parts.length === 2) {
    const m = parseInt(parts[0], 10);
    const s = parseFloat(parts[1]);
    return isNaN(m) || isNaN(s) ? undefined : Math.round((m * 60 + s) * 1000);
  }

  if (parts.length === 3) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const s = parseFloat(parts[2]);
    return isNaN(h) || isNaN(m) || isNaN(s) ? undefined : Math.round((h * 3600 + m * 60 + s) * 1000);
  }

  return undefined;
}

/**
 * Convert ms to LiveSplit XML time string format (HH:MM:SS.xxxxxxx)
 */
export function formatMsToLssTime(ms: number | undefined): string {
  if (ms === undefined || isNaN(ms)) return '';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milli = ms % 1000;

  const pad = (n: number, d = 2) => String(n).padStart(d, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milli, 3)}0000`;
}

/**
 * Parse standard LiveSplit .lss XML string
 */
export function parseLiveSplitLss(xmlContent: string): {
  gameTitle: string;
  categoryName: string;
  segments: SplitSegmentDefinition[];
} {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');

  const gameNameElem = xmlDoc.querySelector('GameName');
  const categoryElem = xmlDoc.querySelector('CategoryName');

  const gameTitle = gameNameElem?.textContent?.trim() || 'Custom Speedrun';
  const categoryName = categoryElem?.textContent?.trim() || 'Any%';

  const segmentNodes = xmlDoc.querySelectorAll('Segments > Segment');
  const segments: SplitSegmentDefinition[] = [];

  let index = 1;
  segmentNodes.forEach((node) => {
    const name = node.querySelector('Name')?.textContent?.trim() || `Segment ${index}`;
    
    // Look for Personal Best time in SplitTimes > SplitTime[name="Personal Best"]
    let pbMs: number | undefined;
    const pbElem = node.querySelector('SplitTimes > SplitTime[name="Personal Best"] > RealTime')
      || node.querySelector('SplitTimes > SplitTime > RealTime');
    if (pbElem?.textContent) {
      pbMs = parseTimeStringToMs(pbElem.textContent);
    }

    // Look for Best Segment Time (Gold)
    let goldMs: number | undefined;
    const goldElem = node.querySelector('BestSegmentTime > RealTime');
    if (goldElem?.textContent) {
      goldMs = parseTimeStringToMs(goldElem.textContent);
    }

    segments.push({
      id: `seg-${index}-${Date.now().toString(36)}`,
      name,
      personalBestSplitMs: pbMs,
      goldSegmentDurationMs: goldMs,
      targetDurationMs: goldMs || 60000,
    });
    index++;
  });

  return {
    gameTitle,
    categoryName,
    segments: segments.length > 0 ? segments : [
      { id: 'seg-1', name: 'Start to Finish', targetDurationMs: 60000 }
    ],
  };
}

/**
 * Export segments to LiveSplit .lss XML format
 */
export function exportToLiveSplitLss(
  gameTitle: string,
  categoryName: string,
  segments: SplitSegmentDefinition[]
): string {
  const segmentsXml = segments.map(seg => `
    <Segment>
      <Name>${escapeXml(seg.name)}</Name>
      <Icon />
      <SplitTimes>
        <SplitTime name="Personal Best">
          <RealTime>${formatMsToLssTime(seg.personalBestSplitMs)}</RealTime>
        </SplitTime>
      </SplitTimes>
      <BestSegmentTime>
        <RealTime>${formatMsToLssTime(seg.goldSegmentDurationMs)}</RealTime>
      </BestSegmentTime>
      <SegmentHistory />
    </Segment>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<Run version="1.7.0">
  <GameIcon />
  <GameName>${escapeXml(gameTitle)}</GameName>
  <CategoryName>${escapeXml(categoryName)}</CategoryName>
  <Metadata>
    <Run id="" />
    <Platform usesEmulator="False" />
    <Region />
    <Variables />
  </Metadata>
  <Offset>00:00:00</Offset>
  <AttemptCount>1</AttemptCount>
  <AttemptHistory />
  <Segments>${segmentsXml}
  </Segments>
  <AutoSplitterSettings />
</Run>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
