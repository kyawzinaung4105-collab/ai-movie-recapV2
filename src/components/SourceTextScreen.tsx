import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useRecap } from '@/context/RecapContext';
import { CustomTranslationWorkflow } from '@/components/CustomTranslationWorkflow';
import { BurmeseReviewPanel } from '@/components/BurmeseReviewPanel';
import { TranslationEditor } from '@/components/TranslationEditor';
import { Button } from '@/components/ui/Button';

interface SourceTextScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

export function SourceTextScreen({ onContinue, onBack }: SourceTextScreenProps) {
  const {
    videoSource,
    customCues,
    setCustomCues,
    generationResult,
    language,
    voiceId,
    setCustomAudioUrl,
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
        videoFile={videoSource.file}
        onTranslationApplied={setCustomCues}
      />

      {language === 'english' && generationResult && (
        <TranslationEditor
          sourceCues={generationResult.cues || []}
          voiceId={voiceId}
          onTranslationApplied={setCustomCues}
          onAudioGenerated={setCustomAudioUrl}
        />
      )}

      <BurmeseReviewPanel cues={customCues} onChange={setCustomCues} />

      <div className="flex items-center justify-between border-t border-slate-200 pt-5">
        <Button variant="secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back to Upload</Button>
        <Button size="lg" onClick={onContinue}>Continue to Voice <ArrowRight className="h-5 w-5" /></Button>
      </div>
    </div>
  );
}
