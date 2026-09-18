export type InputMethod = 'upload' | 'link';

export type Platform = 'youtube' | 'tiktok' | 'rednote' | 'unknown';

export type Language = 'myanmar' | 'english';

export type StepId =
  | 'input'
  | 'preview'
  | 'recap-select'
  | 'language'
  | 'voice'
  | 'generate'
  | 'result';

export type GenerationStage =
  | 'idle'
  | 'analyzing'
  | 'generating-recap'
  | 'creating-narration'
  | 'preparing-subtitles'
  | 'preparing-video'
  | 'complete'
  | 'error';

export interface VideoSource {
  method: InputMethod;
  fileName: string;
  platform?: Platform;
  embedUrl?: string;
  objectUrl?: string;
  duration?: number;
  isDirectFile: boolean;
}

export interface BlurSettings {
  enabled: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  strength: number;
}

export interface CaptionStyle {
  fontSize: number;
  position: 'top' | 'center' | 'bottom';
  x: number;
  y: number;
  color: string;
  template: 'classic' | 'box' | 'highlight' | 'minimal';
  alignment: 'left' | 'center' | 'right';
  outline: boolean;
  background: boolean;
}

export interface LogoSettings {
  url?: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export interface CaptionCue {
  start: number;
  end: number;
  text: string;
}

export interface CaptionSettings {
  enabled: boolean;
  style: CaptionStyle;
  cues: CaptionCue[];
}

export interface VoiceOption {
  id: string;
  label: string;
  language: Language;
  description: string;
}

export interface GenerationResult {
  movieTitle: string;
  titleConfident: boolean;
  script: string;
  narrationUrl?: string;
  generatedVideoUrl?: string;
  segments?: { start: number; end: number; text: string }[];
  cues?: { start: number; end: number; text: string }[];
}

export interface EnvConfig {
  hasAiKey: boolean;
  hasElevenLabsKey: boolean;
  hasFFmpegBackend: boolean;
  missing: string[];
}
