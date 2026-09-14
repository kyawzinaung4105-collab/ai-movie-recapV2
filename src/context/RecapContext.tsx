import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  BlurSettings,
  CaptionCue,
  CaptionSettings,
  GenerationResult,
  GenerationStage,
  Language,
  StepId,
  VideoSource,
} from '@/types';
import { getDefaultCaptionStyle } from '@/lib/captions';

interface RecapContextValue {
  step: StepId;
  setStep: (step: StepId) => void;

  videoSource: VideoSource | null;
  setVideoSource: (source: VideoSource | null) => void;

  language: Language;
  setLanguage: (lang: Language) => void;

  voiceId: string;
  setVoiceId: (id: string) => void;

  generationStage: GenerationStage;
  setGenerationStage: (stage: GenerationStage) => void;

  generationResult: GenerationResult | null;
  setGenerationResult: (result: GenerationResult | null) => void;

  movieTitle: string;
  setMovieTitle: (title: string) => void;

  blurSettings: BlurSettings;
  setBlurSettings: (settings: BlurSettings) => void;

  captionSettings: CaptionSettings;
  setCaptionSettings: (settings: CaptionSettings) => void;

  customAudioUrl: string | undefined;
  setCustomAudioUrl: (url: string | undefined) => void;

  customCues: CaptionCue[];
  setCustomCues: (cues: CaptionCue[]) => void;

  resetAll: () => void;
}

const DEFAULT_BLUR: BlurSettings = {
  enabled: false,
  x: 0.3,
  y: 0.3,
  width: 0.2,
  height: 0.2,
  strength: 50,
};

const DEFAULT_CAPTIONS: CaptionSettings = {
  enabled: false,
  style: getDefaultCaptionStyle(),
  cues: [],
};

const RecapContext = createContext<RecapContextValue | null>(null);

export function RecapProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<StepId>('input');
  const [videoSource, setVideoSource] = useState<VideoSource | null>(null);
  const [language, setLanguage] = useState<Language>('myanmar');
  const [voiceId, setVoiceId] = useState<string>('');
  const [generationStage, setGenerationStage] = useState<GenerationStage>('idle');
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [movieTitle, setMovieTitle] = useState<string>('');
  const [blurSettings, setBlurSettings] = useState<BlurSettings>(DEFAULT_BLUR);
  const [captionSettings, setCaptionSettings] = useState<CaptionSettings>(DEFAULT_CAPTIONS);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | undefined>(undefined);
  const [customCues, setCustomCues] = useState<CaptionCue[]>([]);

  const resetAll = useCallback(() => {
    if (videoSource?.objectUrl) URL.revokeObjectURL(videoSource.objectUrl);
    setStep('input');
    setVideoSource(null);
    setLanguage('myanmar');
    setVoiceId('');
    setGenerationStage('idle');
    setGenerationResult(null);
    setMovieTitle('');
    setBlurSettings(DEFAULT_BLUR);
    setCaptionSettings(DEFAULT_CAPTIONS);
    if (customAudioUrl) URL.revokeObjectURL(customAudioUrl);
    setCustomAudioUrl(undefined);
    setCustomCues([]);
  }, [videoSource, customAudioUrl]);

  return (
    <RecapContext.Provider
      value={{
        step,
        setStep,
        videoSource,
        setVideoSource,
        language,
        setLanguage,
        voiceId,
        setVoiceId,
        generationStage,
        setGenerationStage,
        generationResult,
        setGenerationResult,
        movieTitle,
        setMovieTitle,
        blurSettings,
        setBlurSettings,
        captionSettings,
        setCaptionSettings,
        customAudioUrl,
        setCustomAudioUrl,
        customCues,
        setCustomCues,
        resetAll,
      }}
    >
      {children}
    </RecapContext.Provider>
  );
}

export function useRecap() {
  const ctx = useContext(RecapContext);
  if (!ctx) throw new Error('useRecap must be used within RecapProvider');
  return ctx;
}
