import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { useRecap } from '@/context/RecapContext';
import { MovieTitleEditor } from '@/components/MovieTitleEditor';
import { FinalPreview } from '@/components/FinalPreview';
import { VideoExporter } from '@/components/VideoExporter';
import { TranslationEditor } from '@/components/TranslationEditor';
import { BurmeseReviewPanel } from '@/components/BurmeseReviewPanel';
import { Button } from '@/components/ui/Button';

export function ResultScreen() {
  const {
    videoSource,
    setStep,
    generationResult,
    movieTitle,
    setMovieTitle,
    blurSettings,
    captionSettings,
    setCaptionSettings,
    language,
    voiceId,
    customAudioUrl,
    setCustomAudioUrl,
    customCues,
    setCustomCues,
    logoSettings,
    setLogoSettings,
    resetAll,
  } = useRecap();

  useEffect(() => {
    if (!videoSource || movieTitle.trim()) return;
    const generatedTitle = generationResult?.movieTitle?.trim();
    const fileTitle = videoSource.fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
    setMovieTitle(generatedTitle && generatedTitle !== 'Unknown Video' ? generatedTitle : (fileTitle || 'Football News'));
  }, [movieTitle, generationResult?.movieTitle, videoSource, setMovieTitle]);

  if (!videoSource) return null;

  const isCustomMode = !generationResult;
  const exportVideoUrl = videoSource.isDirectFile ? videoSource.objectUrl : undefined;
  const exportAudioUrl = customAudioUrl || generationResult?.narrationUrl;
  const exportSubtitles = customCues.length > 0
    ? customCues
    : (generationResult?.cues || captionSettings.cues);

  return (
    <div className="mx-auto max-w-5xl space-y-10 animate-fade-in">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">AI Movie Recap V2</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
          {isCustomMode ? 'Custom Audio & Subtitles' : 'Generated Result'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">Review your video, Burmese subtitles, logo, and export settings.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setStep('voice')}>Back to Voice</Button>
          <Button variant="ghost" size="sm" onClick={resetAll}><RotateCcw className="h-4 w-4" /> Start New</Button>
        </div>
      </div>

      {isCustomMode && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm text-emerald-700">
            Upload your match narration audio and transcript below. They will be synced with your video automatically.
          </p>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <MovieTitleEditor
          title={movieTitle}
          titleConfident={generationResult?.titleConfident}
          onChange={setMovieTitle}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <FinalPreview
          videoSource={videoSource}
          blurSettings={blurSettings}
          captionSettings={captionSettings}
          movieTitle={movieTitle}
          generationResult={generationResult}
          customAudioUrl={customAudioUrl}
          customCues={customCues}
          logoSettings={logoSettings}
          onCaptionChange={setCaptionSettings}
          onLogoChange={setLogoSettings}
        />
      </section>

      {language === 'english' && generationResult && (
        <TranslationEditor
          sourceCues={generationResult.cues || []}
          voiceId={voiceId}
          onTranslationApplied={setCustomCues}
          onAudioGenerated={setCustomAudioUrl}
        />
      )}

      {isCustomMode && <BurmeseReviewPanel cues={customCues} onChange={setCustomCues} />}

      <section className="rounded-2xl border border-primary-200 bg-primary-50/40 p-5 shadow-sm sm:p-6">
        <VideoExporter
          movieTitle={movieTitle}
          videoBlobUrl={exportVideoUrl}
          audioTrackUrl={exportAudioUrl}
          subtitles={exportSubtitles}
          captionStyle={captionSettings.style}
          logoSettings={logoSettings}
          disabled={!exportVideoUrl}
        />
      </section>
      {!exportVideoUrl && (
        <p className="text-sm text-slate-500">
          MP4 export is available for uploaded video files. Embedded video links cannot be downloaded by the browser.
        </p>
      )}
    </div>
  );
}
