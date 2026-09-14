import { RotateCcw } from 'lucide-react';
import { useRecap } from '@/context/RecapContext';
import { MovieTitleEditor } from '@/components/MovieTitleEditor';
import { BlurEditor } from '@/components/BlurEditor';
import { CaptionEditor } from '@/components/CaptionEditor';
import { FinalPreview } from '@/components/FinalPreview';
import { VideoExporter } from '@/components/VideoExporter';
import { CustomAudioUpload } from '@/components/CustomAudioUpload';
import { Button } from '@/components/ui/Button';

export function ResultScreen() {
  const {
    videoSource,
    generationResult,
    movieTitle,
    setMovieTitle,
    blurSettings,
    setBlurSettings,
    captionSettings,
    setCaptionSettings,
    language,
    customAudioUrl,
    setCustomAudioUrl,
    customCues,
    setCustomCues,
    resetAll,
  } = useRecap();

  if (!videoSource) return null;

  const isCustomMode = !generationResult;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">
          {isCustomMode ? 'Custom Audio & Subtitles' : 'Generated Result'}
        </h2>
        <Button variant="ghost" size="sm" onClick={resetAll}>
          <RotateCcw className="h-4 w-4" /> Start New
        </Button>
      </div>

      {isCustomMode && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm text-emerald-700">
            Upload your narration audio and transcript file below. They will be synced with your video automatically.
          </p>
        </div>
      )}

      <MovieTitleEditor
        title={movieTitle}
        titleConfident={generationResult?.titleConfident}
        onChange={setMovieTitle}
      />

      <FinalPreview
        videoSource={videoSource}
        blurSettings={blurSettings}
        captionSettings={captionSettings}
        movieTitle={movieTitle}
        generationResult={generationResult}
        customAudioUrl={customAudioUrl}
        customCues={customCues}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BlurEditor
          settings={blurSettings}
          onChange={setBlurSettings}
          videoSource={videoSource}
        />
        <CaptionEditor
          settings={captionSettings}
          onChange={setCaptionSettings}
          language={language}
        />
      </div>

      <CustomAudioUpload
        onAudioLoaded={setCustomAudioUrl}
        onCuesLoaded={setCustomCues}
        currentAudioUrl={customAudioUrl}
        currentCues={customCues}
      />

      <VideoExporter movieTitle={movieTitle} />
    </div>
  );
}
