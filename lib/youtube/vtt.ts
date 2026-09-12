import type { TranscriptSegment } from './transcript-provider';

const TIMESTAMP =
  /(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[.,](\d{1,3})/;

function toSeconds(h: string, m: string, s: string, ms: string): number {
  return Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(ms.padEnd(3, '0')) / 1000;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/** Convierte WebVTT (o SRT) en segmentos con tiempos; elimina etiquetas y cabeceras. */
export function parseVtt(vtt: string): TranscriptSegment[] {
  if (!vtt) return [];
  const segments: TranscriptSegment[] = [];
  const blocks = vtt.replace(/\r/g, '').split(/\n{2,}/);
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const timeIndex = lines.findIndex((l) => TIMESTAMP.test(l));
    if (timeIndex === -1) continue;
    const match = lines[timeIndex].match(TIMESTAMP);
    if (!match) continue;
    const start = toSeconds(match[1], match[2], match[3], match[4]);
    const end = toSeconds(match[5], match[6], match[7], match[8]);
    const text = decodeEntities(
      lines
        .slice(timeIndex + 1)
        .join(' ')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    );
    if (text) segments.push({ text, start, duration: Math.max(0, end - start) });
  }
  return segments;
}
