import { useEffect, useState } from 'react';
import { Check, Copy, Download, Film, Hash, MessageSquareText, RotateCcw, Sparkles } from 'lucide-react';
import { useRecap } from '@/context/RecapContext';
import { MovieTitleEditor } from '@/components/MovieTitleEditor';
import { FinalPreview } from '@/components/FinalPreview';
import { VideoExporter } from '@/components/VideoExporter';
import { BlurEditor } from '@/components/BlurEditor';
import { CaptionEditor } from '@/components/CaptionEditor';
import { Button } from '@/components/ui/Button';

export function ResultScreen() {
  const [copiedAll, setCopiedAll] = useState(false);
  const {
    videoSource,
    setStep,
    generationResult,
    movieTitle,
    setMovieTitle,
    blurSettings,
    setBlurSettings,
    captionSettings,
    setCaptionSettings,
    customAudioUrl,
    customCues,
    logoSettings,
    setLogoSettings,
    resetAll,
  } = useRecap();

  useEffect(() => {
    if (!videoSource || movieTitle.trim()) return;
    const generatedTitle = generationResult?.movieTitle?.trim();
    const fileTitle = videoSource.fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
    setMovieTitle(generatedTitle && generatedTitle !== 'Unknown Video' ? generatedTitle : (fileTitle || 'AI Movie Recap V2'));
  }, [movieTitle, generationResult?.movieTitle, videoSource, setMovieTitle]);

  if (!videoSource) return null;

  const isCustomMode = !generationResult;
  const exportVideoUrl = videoSource.isDirectFile ? videoSource.objectUrl : undefined;
  const exportAudioUrl = customAudioUrl || generationResult?.narrationUrl;
  const exportSubtitles = customCues.length > 0
    ? customCues
    : (generationResult?.cues || captionSettings.cues);
  const postCaption = generationResult?.caption || 'ဒီဇာတ်လမ်းရဲ့ နောက်ဆုံးအဖြစ်အပျက်ကို ခန့်မှန်းနိုင်မလား? 😳';
  const postHashtags = generationResult?.hashtags?.length === 5
    ? generationResult.hashtags
    : ['#ဇာတ်လမ်း', '#အချစ်ဇာတ်လမ်း', '#ဒရာမာ', '#မြန်မာစာတန်းထိုး', '#ရုပ်ရှင်'];
  const copyAll = async () => {
    await navigator.clipboard.writeText(`${movieTitle}\n\n${postCaption}\n\n${postHashtags.join(' ')}`);
    setCopiedAll(true);
    window.setTimeout(() => setCopiedAll(false), 1800);
  };

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

      <section className="grid gap-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:grid-cols-[290px_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="relative flex aspect-[9/16] items-center justify-center overflow-hidden rounded-2xl bg-slate-950">
            {videoSource.objectUrl ? (
              <video src={videoSource.objectUrl} className="h-full w-full object-cover" muted playsInline controls />
            ) : (
              <div className="text-center text-slate-400"><Film className="mx-auto h-10 w-10" /><p className="mt-2 text-xs">Video preview</p></div>
            )}
          </div>
          <Button size="lg" className="w-full" onClick={() => document.getElementById('video-export')?.scrollIntoView({ behavior: 'smooth' })}>
            <Download className="h-4 w-4" /> Download video
          </Button>
          <div className="grid grid-cols-2 gap-2"><Button variant="secondary" size="sm" onClick={() => setStep('input')}>Edit again</Button><Button variant="ghost" size="sm" onClick={resetAll}>New video</Button></div>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 font-bold text-slate-900"><Sparkles className="h-4 w-4 text-indigo-600" />Thumbnail</h3><span className="rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-600">AI</span></div>
            <div className="mt-3 flex min-h-24 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 via-indigo-950 to-rose-900 px-4 text-center text-lg font-black text-white">{movieTitle}</div>
            <p className="mt-2 text-xs text-slate-400">One thumbnail per platform · edit and download below</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 font-bold text-slate-900"><MessageSquareText className="h-4 w-4 text-indigo-600" />Caption</h3><button onClick={() => navigator.clipboard.writeText(postCaption)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">Copy</button></div>
            <p className="mt-3 text-sm leading-6 text-slate-700">{postCaption}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 font-bold text-slate-900"><Hash className="h-4 w-4 text-indigo-600" />Hashtags</h3><button onClick={copyAll} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{copiedAll ? 'Copied' : 'Copy'}</button></div>
            <div className="mt-3 flex flex-wrap gap-2">{postHashtags.map((tag) => <span key={tag} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{tag}</span>)}</div>
            <p className="mt-2 text-xs text-slate-400">Tap a hashtag to remove it</p>
          </div>
          <button onClick={copyAll} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">{copiedAll ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />} {copiedAll ? 'Copied all' : 'Copy all'}</button>
        </div>
      </section>

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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <BlurEditor settings={blurSettings} onChange={setBlurSettings} videoSource={videoSource} />
        <CaptionEditor
          settings={captionSettings}
          onChange={setCaptionSettings}
          language="myanmar"
          logoSettings={logoSettings}
          onLogoChange={setLogoSettings}
        />
      </div>

      <section id="video-export" className="rounded-2xl border border-primary-200 bg-primary-50/40 p-5 shadow-sm sm:p-6">
        <VideoExporter
          movieTitle={movieTitle}
          videoBlobUrl={exportVideoUrl}
          videoFile={videoSource.file}
          audioTrackUrl={exportAudioUrl}
          subtitles={exportSubtitles}
          captionStyle={captionSettings.style}
          blurSettings={blurSettings}
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
