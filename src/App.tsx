import { useState } from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { RecapProvider, useRecap } from '@/context/RecapContext';
import { StepIndicator } from '@/components/StepIndicator';
import { VideoInput } from '@/components/VideoInput';
import { VideoUpload } from '@/components/VideoUpload';
import { VideoLinkInput } from '@/components/VideoLinkInput';
import { VideoPreviewScreen } from '@/components/VideoPreviewScreen';
import { RecapSelector } from '@/components/RecapSelector';
import { LanguageSelector } from '@/components/LanguageSelector';
import { VoiceSelector } from '@/components/VoiceSelector';
import { RecapGenerator } from '@/components/RecapGenerator';
import { ResultScreen } from '@/components/ResultScreen';
import { SettingsModal } from '@/components/SettingsModal';
import { Button } from '@/components/ui/Button';
import { getEnvConfig } from '@/lib/env';
import type { InputMethod, VideoSource } from '@/types';

function AppContent() {
  const {
    step,
    setStep,
    videoSource,
    setVideoSource,
    language,
    setLanguage,
    voiceId,
    setVoiceId,
  } = useRecap();

  const [inputMethod, setInputMethod] = useState<InputMethod | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [configVersion, setConfigVersion] = useState(0);
  const envConfig = getEnvConfig();

  const handleVideoSelected = (source: VideoSource) => {
    setVideoSource(source);
  };

  const handleVideoLoaded = (source: VideoSource) => {
    setVideoSource(source);
  };

  const handleBackToInput = () => {
    setInputMethod(null);
    setStep('input');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={() => setConfigVersion((v) => v + 1)}
      />

      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg newsroom-accent text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-base font-bold text-slate-900">Football News Studio</span>
            </div>
            <div className="flex items-center gap-2">
              {step !== 'input' && inputMethod !== null && (
                <Button variant="ghost" size="sm" onClick={handleBackToInput}>
                  <ArrowLeft className="h-4 w-4" /> New
                </Button>
              )}
              <button
                onClick={() => setSettingsOpen(true)}
                className={`relative rounded-lg p-2 transition-colors ${
                  envConfig.hasAiKey
                    ? 'text-slate-500 hover:bg-slate-100'
                    : 'text-amber-600 hover:bg-amber-50'
                }`}
                title="API Settings"
              >
                <Settings className="h-5 w-5" />
                {!envConfig.hasAiKey && (
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {step !== 'result' && <div className="mb-6"><StepIndicator currentStep={step} /></div>}

        {step === 'input' && !inputMethod && (
          <VideoInput onSelect={(method) => setInputMethod(method)} />
        )}

        {step === 'input' && inputMethod === 'upload' && (
          <div className="space-y-4">
            <VideoUpload onVideoSelected={handleVideoSelected} />
            {videoSource && (
              <div className="flex justify-end">
                <Button onClick={() => setStep('preview')}>
                  Continue to Preview
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 'input' && inputMethod === 'link' && (
          <div className="space-y-4">
            <VideoLinkInput onVideoLoaded={handleVideoLoaded} />
            {videoSource && (
              <div className="flex justify-end">
                <Button onClick={() => setStep('preview')}>
                  Continue to Preview
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 'preview' && videoSource && (
          <VideoPreviewScreen
            videoSource={videoSource}
            onContinue={() => setStep('recap-select')}
            onBack={() => {
              setStep('input');
              setInputMethod(null);
            }}
          />
        )}

        {step === 'recap-select' && (
          <RecapSelector
            onSelect={() => setStep('language')}
            onCustomSelect={() => setStep('result')}
            onBack={() => setStep('preview')}
          />
        )}

        {step === 'language' && (
          <LanguageSelector
            language={language}
            onSelect={setLanguage}
            onContinue={() => setStep('voice')}
            onBack={() => setStep('recap-select')}
          />
        )}

        {step === 'voice' && (
          <VoiceSelector
            language={language}
            voiceId={voiceId}
            onSelect={setVoiceId}
            onContinue={() => setStep('generate')}
            onBack={() => setStep('language')}
          />
        )}

        {step === 'generate' && <RecapGenerator onOpenSettings={() => setSettingsOpen(true)} />}

        {step === 'result' && <ResultScreen />}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-3 text-center text-xs text-slate-400">
          AI Football News Studio
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <RecapProvider>
      <AppContent />
    </RecapProvider>
  );
}

export default App;
