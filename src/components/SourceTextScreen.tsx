import { ArrowLeft, ArrowRight, Type } from 'lucide-react';
import { useRecap } from '@/context/RecapContext';
import { CustomTranslationWorkflow } from '@/components/CustomTranslationWorkflow';
import { BlurEditor } from '@/components/BlurEditor';
import { CaptionEditor } from '@/components/CaptionEditor';
import { FinalPreview } from '@/components/FinalPreview';
import { Button } from '@/components/ui/Button';

interface SourceTextScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

export function SourceTextScreen({ onContinue, onBack }: SourceTextScreenProps) {
  const {
    videoSource,
    blurSettings,
    setBlurSettings,
    captionSettings,
    setCaptionSettings,
    customCues,
    setCustomCues,
    customAudioUrl,
    generationResult,
    movieTitle,
    logoSettings,
    setLogoSettings,
  } = useRecap();

  if (!videoSource) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-fade-in">
      <div className="border-b border-slate-200 pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">Step 2</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Source Text</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Preview your video, create the English source transcript, paste the Burmese translation, and prepare the subtitle style before choosing a voice.</p>
      </div>

      <CustomTranslationWorkflow
        duration={videoSource.duration}
        videoUrl={videoSource.objectUrl}
        onTranslationApplied={setCustomCues}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700"><Type className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Preview & subtitle style</h2>
            <p className="mt-1 text-sm text-slate-500">Adjust Burmese font size, position, caption template, logo, and blur area.</p>
          </div>
        </div>
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

      <div className="flex items-center justify-between border-t border-slate-200 pt-5">
        <Button variant="secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back to Upload</Button>
        <Button size="lg" onClick={onContinue}>Continue to Voice <ArrowRight className="h-5 w-5" /></Button>
      </div>
    </div>
  );
}
