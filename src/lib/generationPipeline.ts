import { loadApiKeys } from './settingsStore';
import {
  analyzeVideoAndGenerateScript,
  type TranscriptSegment,
} from './aiClient';
import { generateElevenLabsVoiceover } from './elevenlabsClient';
import type { CaptionCue } from '@/types';

export interface GenerationOptions {
  videoSource: {
    method: 'upload' | 'link';
    fileName: string;
    objectUrl?: string;
    embedUrl?: string;
    platform?: string;
    duration?: number;
    isDirectFile: boolean;
  };
  language: 'myanmar' | 'english';
  voiceId: string;
}

export interface GenerationResult {
  success: boolean;
  movieTitle: string;
  titleConfident: boolean;
  script: string;
  narrationUrl?: string;
  segments: TranscriptSegment[];
  cues: CaptionCue[];
}

async function fileToBase64(
  file: File
): Promise<{ mimeType: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ mimeType: file.type || 'video/mp4', data: base64 });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function fetchUrlToBase64(
  url: string
): Promise<{ mimeType: string; data: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve({ mimeType: blob.type || 'video/mp4', data: base64 });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function runGenerationPipeline(
  options: GenerationOptions,
  onProgress?: (stage: string) => void
): Promise<GenerationResult> {
  const { videoSource, language, voiceId } = options;
  const keys = loadApiKeys();

  if (!keys.aiKey) {
    throw new Error('AI API key is missing. Please add your key in Settings.');
  }

  // ---- Stage 1: Analyze video ----
  if (onProgress) onProgress('analyzing');

  let videoBase64: { mimeType: string; data: string } | null = null;

  if (videoSource.method === 'upload' && videoSource.objectUrl) {
    try {
      const res = await fetch(videoSource.objectUrl);
      const blob = await res.blob();
      const file = new File([blob], videoSource.fileName, { type: blob.type });
      videoBase64 = await fileToBase64(file);
    } catch {
      throw new Error('Failed to read uploaded video file.');
    }
  } else if (videoSource.method === 'link' && videoSource.embedUrl) {
    videoBase64 = await fetchUrlToBase64(videoSource.embedUrl);
  }

  if (!videoBase64) {
    throw new Error(
      'Could not access the video data. For link-based videos, the platform may block direct access. ' +
        'Try uploading the video file directly instead.'
    );
  }

  // ---- Stage 2: Transcribe + Translate ----
  if (onProgress) onProgress('translating');

  const analysis = await analyzeVideoAndGenerateScript(videoBase64, language);

  // ---- Stage 3: Generate voiceover ----
  if (onProgress) onProgress('synthesizing');

  let narrationUrl: string | undefined;
  const fullScript = analysis.segments.map((s) => s.text).join(' ');

  if (keys.elevenLabsKey && voiceId && fullScript) {
    try {
      narrationUrl = await generateElevenLabsVoiceover(fullScript, voiceId);
    } catch (err) {
      console.error('Voiceover generation failed:', err);
    }
  }

  // ---- Stage 4: Build caption cues ----
  if (onProgress) onProgress('preparing-subtitles');

  const cues: CaptionCue[] = analysis.segments.map((s) => ({
    start: s.start,
    end: s.end,
    text: s.text,
  }));

  if (onProgress) onProgress('complete');

  return {
    success: true,
    movieTitle: analysis.movieTitle,
    titleConfident: analysis.titleConfident,
    script: fullScript,
    narrationUrl,
    segments: analysis.segments,
    cues,
  };
}

export function getStageInfo(stage: string): {
  label: string;
  progress: number;
} {
  switch (stage) {
    case 'analyzing':
      return { label: 'Analyzing video content...', progress: 20 };
    case 'translating':
      return {
        label: 'Transcribing and translating to Burmese...',
        progress: 50,
      };
    case 'synthesizing':
      return { label: 'Generating Burmese voiceover...', progress: 75 };
    case 'preparing-subtitles':
      return { label: 'Preparing subtitles...', progress: 90 };
    case 'complete':
      return { label: 'Complete!', progress: 100 };
    default:
      return { label: 'Processing...', progress: 10 };
  }
}
