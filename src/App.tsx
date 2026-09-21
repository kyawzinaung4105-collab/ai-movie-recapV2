import { useState } from 'react';
import { Settings, ArrowLeft } from 'lucide-react';
import { RecapProvider, useRecap } from '@/context/RecapContext';
import { StepIndicator } from '@/components/StepIndicator';
import { VideoInput } from '@/components/VideoInput';
import { VideoUpload } from '@/components/VideoUpload';
import { VideoLinkInput } from '@/components/VideoLinkInput';
import { VoiceSelector } from '@/components/VoiceSelector';
import { SourceTextScreen } from '@/components/SourceTextScreen';
import { ResultScreen } from '@/components/ResultScreen';
import { SettingsModal } from '@/components/SettingsModal';
import { Button } from '@/components/ui/Button';
import { getEnvConfig } from '@/lib/env';
import type { InputMethod, VideoSource } from '@/types';

function AppContent() {
  const { step, setStep, videoSource, setVideoSource, language, voiceId, setVoiceId } = useRecap();
  const [inputMethod, setInputMethod] = useState<InputMethod | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const envConfig = getEnvConfig();

  const handleVideoSelected = (source: VideoSource) => setVideoSource(source);
  const handleVideoLoaded = (source: VideoSource) => setVideoSource(source);
  const startOver = () => {
    setInputMethod(null);
    setStep('input');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg newsroom-accent text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </div>
              <span className="text-base font-bold text-slate-900">AI Movie Recap V2</span>
            </div>
            <div className="flex items-center gap-2">
              {step !== 'input' && <Button variant="ghost" size="sm" onClick={startOver}>New Project</Button>}
              <button onClick={() => setSettingsOpen(true)} className={`relative rounded-lg p-2 transition-colors ${envConfig.hasAiKey ? 'text-slate-500 hover:bg-slate-100' : 'text-amber-600 hover:bg-amber-50'}`} title="API Settings">
                <Settings className="h-5 w-5" />
                {!envConfig.hasAiKey && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-8"><StepIndicator currentStep={step} /></div>

        {step === 'input' && !inputMethod && <VideoInput onSelect={setInputMethod} />}

        {step === 'input' && inputMethod === 'upload' && (
          <div className="mx-auto max-w-4xl space-y-5">
            <VideoUpload onVideoSelected={handleVideoSelected} />
            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <Button variant="secondary" onClick={() => setInputMethod(null)}><ArrowLeft className="h-4 w-4" /> Back to Upload Options</Button>
              {videoSource && <Button size="lg" onClick={() => setStep('recap-select')}>Get Source Text</Button>}
            </div>
          </div>
        )}

        {step === 'input' && inputMethod === 'link' && (
          <div className="mx-auto max-w-4xl space-y-5">
            <VideoLinkInput onVideoLoaded={handleVideoLoaded} />
            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <Button variant="secondary" onClick={() => setInputMethod(null)}><ArrowLeft className="h-4 w-4" /> Back to Upload Options</Button>
              {videoSource && <Button size="lg" onClick={() => setStep('recap-select')}>Get Source Text</Button>}
            </div>
          </div>
        )}

        {step === 'recap-select' && videoSource && <SourceTextScreen onContinue={() => setStep('voice')} onBack={startOver} />}

        {step === 'voice' && (
          <VoiceSelector
            language={language}
            voiceId={voiceId}
            onSelect={setVoiceId}
            onContinue={() => setStep('result')}
            onBack={() => setStep('recap-select')}
          />
        )}

        {step === 'result' && <ResultScreen />}
      </main>

      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-slate-400 sm:px-6">AI AI Movie Recap V2</div></footer>
    </div>
  );
}

function App() {
  return <RecapProvider><AppContent /></RecapProvider>;
}

export default App;
