import type { CaptionCue, CaptionStyle } from '@/types';

export const DEFAULT_CAPTION_STYLE: CaptionStyle = {
  fontSize: 24,
  position: 'bottom',
  alignment: 'center',
  outline: true,
  background: false,
};

export function getDefaultCaptionStyle(): CaptionStyle {
  return { ...DEFAULT_CAPTION_STYLE };
}

// Generates dynamic caption cues based on actual script and audio duration
export function buildSampleCues(durationSec: number, language: 'myanmar' | 'english', scriptText?: string): CaptionCue[] {
  const cues: CaptionCue[] = [];
  
  // Split script text into sentences or meaningful chunks
  let texts: string[] = [];
  if (scriptText && scriptText.trim().length > 0) {
    // Split by punctuation marks common in Burmese and English
    texts = scriptText
      .split(/(?<=[။.!?])\s+|\n+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }

  // Fallback if script is empty
  if (texts.length === 0) {
    texts =
      language === 'myanmar'
        ? [
            'ဤဇာတ်ကားတွင် အဓိကကျသော ဇာတ်ဆောင်များ ပါဝင်သည်။',
            'ဇာတ်လမ်းအစတွင် အဖြစ်အပျက်တစ်ခု ဖြစ်ပေါ်သည်။',
            'ထို့နောက် ဆက်လက်ဖြစ်ပေါ်လာသော အကြောင်းအရာများကို ဖော်ပြသည်။',
            'ဇာတ်လမ်းအဆုံးသတ်တွင် အဖြေကို တွေ့ရှိရသည်။',
          ]
        : [
            'The main characters play key roles in this film.',
            'At the beginning, a significant event takes place.',
            'The story then unfolds through a series of events.',
            'In the end, the truth is revealed.',
          ];
  }

  const segmentDuration = Math.max(2, durationSec / texts.length);
  texts.forEach((text, i) => {
    cues.push({
      start: i * segmentDuration,
      end: (i + 1) * segmentDuration,
      text,
    });
  });

  return cues;
}

export function getActiveCaption(cues: CaptionCue[], currentTime: number): CaptionCue | null {
  return cues.find((c) => currentTime >= c.start && currentTime < c.end) ?? null;
}
