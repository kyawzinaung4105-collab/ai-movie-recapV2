import { loadApiKeys } from './settingsStore';
import { generatePostKit, translateText, type TranscriptSegment } from './aiClient';
import { generateElevenLabsVoiceover } from './elevenlabsClient';
import type { CaptionCue, VideoSource } from '@/types';
import { transcribeVideoWithAssemblyAI } from './assemblyAiClient';
import { resolveSourceMedia } from './mediaResolver';

export interface GenerationOptions {
  videoSource: VideoSource;
  language: 'myanmar' | 'english';
  voiceId: string;
}

export interface GenerationResult {
  success: boolean;
  movieTitle: string;
  titleConfident: boolean;
  script: string;
  caption?: string;
  hashtags?: string[];
  narrationUrl?: string;
  segments: TranscriptSegment[];
  cues: CaptionCue[];
}

function splitTranslatedText(text: string): string[] {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

export async function runGenerationPipeline(
  options: GenerationOptions,
  onProgress?: (stage: string) => void,
): Promise<GenerationResult> {
  const { videoSource, language, voiceId } = options;
  const keys = loadApiKeys();

  if (!keys.aiKey) throw new Error('AI API key is missing. Open Settings and add the AI key before generating.');
  if (!keys.assemblyAiKey) throw new Error('AssemblyAI API key is required. Add it in Settings to transcribe the source audio.');
  if (!keys.elevenLabsKey) throw new Error('ElevenLabs API key is required. Add it in Settings to generate Burmese voice.');
  if (videoSource.method === 'link' && !keys.mediaResolverUrl) {
    throw new Error('Link processing backend is not configured. Open Settings and add the Media Resolver URL before generating.');
  }

  onProgress?.('analyzing');
  const mediaFile = videoSource.method === 'upload'
    ? videoSource.file
    : await resolveSourceMedia(videoSource);
  if (!mediaFile) throw new Error('The selected video file is not available. Please select it again.');

  // One reliable path for every source: extract audio in the browser, then AssemblyAI.
  const sourceCues = await transcribeVideoWithAssemblyAI(undefined, undefined, mediaFile);
  if (!sourceCues.length) throw new Error('No spoken dialogue was detected in this video.');

  onProgress?.('translating');
  const sourceText = sourceCues.map((cue) => cue.text).join('\n');
  const translatedText = await translateText(sourceText, language);
  const translatedLines = splitTranslatedText(translatedText);
  const segments: TranscriptSegment[] = sourceCues.map((cue, index) => ({
    start: cue.start,
    end: cue.end,
    text: translatedLines[index] || translatedLines[translatedLines.length - 1] || translatedText.trim(),
  }));
  const fullScript = segments.map((segment) => segment.text).join(' ').trim();
  if (!fullScript) throw new Error('Translation returned no usable script. Please try again.');

  onProgress?.('synthesizing');
  const narrationUrl = await generateElevenLabsVoiceover(fullScript, voiceId);
  const postKit = await generatePostKit(fullScript);

  onProgress?.('preparing-subtitles');
  onProgress?.('complete');
  return {
    success: true,
    movieTitle: postKit.title,
    titleConfident: true,
    script: fullScript,
    caption: postKit.caption,
    hashtags: postKit.hashtags,
    narrationUrl,
    segments,
    cues: segments,
  };
}

export function getStageInfo(stage: string): { label: string; progress: number } {
  switch (stage) {
    case 'analyzing': return { label: 'Preparing audio for transcription...', progress: 20 };
    case 'translating': return { label: 'Transcribing and translating to Burmese...', progress: 50 };
    case 'synthesizing': return { label: 'Generating Burmese voiceover...', progress: 75 };
    case 'preparing-subtitles': return { label: 'Preparing subtitles...', progress: 90 };
    case 'complete': return { label: 'Complete!', progress: 100 };
    default: return { label: 'Processing...', progress: 10 };
  }
}
