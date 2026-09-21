import { useState, useCallback } from 'react';
import { Sparkles, AlertCircle, ArrowLeft, Loader2, Settings } from 'lucide-react';
import { useRecap } from '@/context/RecapContext';
import { getEnvConfig } from '@/lib/env';
import { runGenerationPipeline, getStageInfo } from '@/lib/generationPipeline';
import { buildSampleCues } from '@/lib/captions';
import { Button, ErrorBanner } from '@/components/ui/Button';

interface RecapGeneratorProps {
  onOpenSettings: () => void;
}

export function RecapGenerator({ onOpenSettings }: RecapGeneratorProps) {
  const {
    videoSource,
    language,
    voiceId,
    setGenerationStage,
    generationStage,
    setGenerationResult,
    setMovieTitle,
    setCaptionSettings,
    captionSettings,
    setStep,
  } = useRecap();

  const [error, setError] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const envConfig = getEnvConfig();

  const handleGenerate = useCallback(async () => {
    setError('');

    if (!videoSource) {
      setError('No video found. Please go back and select a video.');
      return;
    }
    if (!language) {
      setError('Please select a language.');
      return;
    }
    if (!voiceId) {
      setError('Please select a voice.');
      return;
    }

    setGenerationStage('analyzing');

    try {
      const result = await runGenerationPipeline(
        { videoSource, language, voiceId },
        (stage) => setGenerationStage(stage as any)
      );

      setGenerationResult(result);
      setMovieTitle(result.movieTitle);

      const finalCues = result.cues.length > 0
        ? result.cues
        : buildSampleCues(videoSource.duration || 120, language);

      setCaptionSettings({
        ...captionSettings,
        cues: finalCues,
      });

      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Football news generation failed. Please try again.');
      setGenerationStage('error');
    }
  }, [
    videoSource,
    language,
    voiceId,
    setGenerationStage,
    setGenerationResult,
    setMovieTitle,
    setCaptionSettings,
    captionSettings,
    setStep,
  ]);

  const stageInfo = getStageInfo(generationStage);
  const isGenerating = generationStage !== 'idle' && generationStage !== 'error' && generationStage !== 'complete';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900">Generate Football News</h2>
        <p className="text-sm text-slate-500 mt-1">Review your settings and generate</p>
      </div>

      <div className="max-w-md mx-auto space-y-3">
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-500">Video</span>
          <span className="text-sm font-medium text-slate-700 truncate ml-4">{videoSource?.fileName}</span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-500">Language</span>
          <span className={`text-sm font-medium text-slate-700 ${language === 'myanmar' ? 'font-myanmar' : ''}`}>
            {language === 'myanmar' ? 'မြန်မာ' : 'English'}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-500">Voice</span>
          <span className="text-sm font-medium text-slate-700">{voiceId}</span>
        </div>
      </div>

      {envConfig.missing.length > 0 && (
        <div className="max-w-md mx-auto">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700"
          >
            <Settings className="h-4 w-4" />
            Configuration required ({envConfig.missing.length} missing)
          </button>
          {showConfig && (
            <div className="mt-3 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold text-amber-700">Missing configuration:</p>
              {envConfig.missing.map((m) => (
                <div key={m} className="text-xs text-amber-600">
                  · {m}
                </div>
              ))}
              <Button size="sm" onClick={onOpenSettings} className="mt-2">
                <Settings className="h-3.5 w-3.5" /> Open Settings
              </Button>
            </div>
          )}
        </div>
      )}

      {error && <ErrorBanner message={error} />}

      {isGenerating && (
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
            <span className="text-sm font-medium text-slate-700">{stageInfo.label}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-primary-600 transition-all duration-500"
              style={{ width: `${stageInfo.progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between max-w-md mx-auto">
        <Button variant="ghost" onClick={() => setStep('voice')} disabled={isGenerating}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button size="lg" onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" /> Generate Football News
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
