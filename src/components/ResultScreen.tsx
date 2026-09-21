import { useEffect } from 'react';
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
            Upload your match narration audio and transcript below. They will be synced with your video automatically.
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
        logoSettings={logoSettings}
        onCaptionChange={setCaptionSettings}
        onLogoChange={setLogoSettings}
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
          logoSettings={logoSettings}
          onLogoChange={setLogoSettings}
        />
      </div>

      <CustomAudioUpload
        onAudioLoaded={setCustomAudioUrl}
        onCuesLoaded={setCustomCues}
        currentAudioUrl={customAudioUrl}
        currentCues={customCues}
      />

      <VideoExporter
        movieTitle={movieTitle}
        videoBlobUrl={exportVideoUrl}
        audioTrackUrl={exportAudioUrl}
        subtitles={exportSubtitles}
        captionStyle={captionSettings.style}
        logoSettings={logoSettings}
        disabled={!exportVideoUrl}
      />
      {!exportVideoUrl && (
        <p className="text-sm text-slate-500">
          MP4 export is available for uploaded video files. Embedded video links cannot be downloaded by the browser.
        </p>
      )}
    </div>
  );
}
