import type { CaptionCue } from '@/types';

function timeToSeconds(time: string): number {
  const parts = time.trim().split(':');
  if (parts.length === 3) {
    const [h, m, s] = parts;
    const [sec, ms] = s.split(',');
    return (
      parseInt(h, 10) * 3600 +
      parseInt(m, 10) * 60 +
      parseInt(sec, 10) +
      (ms ? parseInt(ms, 10) / 1000 : 0)
    );
  }
  if (parts.length === 2) {
    const [m, s] = parts;
    const [sec, ms] = s.split(',');
    return (
      parseInt(m, 10) * 60 +
      parseInt(sec, 10) +
      (ms ? parseInt(ms, 10) / 1000 : 0)
    );
  }
  const [sec, ms] = time.split(',');
  return parseInt(sec, 10) + (ms ? parseInt(ms, 10) / 1000 : 0);
}

export function parseSRT(content: string): CaptionCue[] {
  const blocks = content.replace(/\r/g, '').split(/\n\n+/);
  const cues: CaptionCue[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').filter((l) => l.trim());
    if (lines.length < 2) continue;

    const timeLine = lines.find((l) => l.includes('-->'));
    if (!timeLine) continue;

    const [startStr, endStr] = timeLine.split('-->');
    const start = timeToSeconds(startStr.trim());
    const end = timeToSeconds(endStr.trim());
    const text = lines
      .filter((l) => !l.includes('-->') && !/^\d+$/.test(l.trim()))
      .join(' ')
      .trim();

    if (text) cues.push({ start, end, text });
  }

  return cues;
}

export function parseTextTranscript(content: string): CaptionCue[] {
  const lines = content.split('\n').filter((l) => l.trim());
  const cues: CaptionCue[] = [];

  const timeRegex = /(\d{1,2}:\d{2}[:.]\d{2})\s*[-–>]+\s*(\d{1,2}:\d{2}[:.]\d{2})\s*(.*)/;
  let lastEnd = 0;

  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const start = timeToSeconds(match[1].replace('.', ','));
      const end = timeToSeconds(match[2].replace('.', ','));
      const text = match[3]?.trim() || '';
      if (text) {
        cues.push({ start, end, text });
        lastEnd = end;
      }
    } else {
      if (cues.length > 0) {
        cues[cues.length - 1].text += ' ' + line.trim();
      } else {
        cues.push({ start: lastEnd, end: lastEnd + 5, text: line.trim() });
        lastEnd += 5;
      }
    }
  }

  return cues;
}

export function parseTranscriptFile(content: string, fileName: string): CaptionCue[] {
  if (fileName.toLowerCase().endsWith('.srt') || content.includes('-->')) {
    return parseSRT(content);
  }
  return parseTextTranscript(content);
}

export function cuesToSRT(cues: CaptionCue[]): string {
  function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }

  return cues
    .map((cue, i) => {
      return `${i + 1}\n${formatTime(cue.start)} --> ${formatTime(cue.end)}\n${cue.text}`;
    })
    .join('\n\n');
}
