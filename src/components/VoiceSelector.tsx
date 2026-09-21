import { useState } from 'react';
import { ArrowLeft, ArrowRight, Volume2, Check, Play, Square } from 'lucide-react';
import { getVoicesForLanguage } from '@/lib/voices';
import { Button } from '@/components/ui/Button';

interface VoiceSelectorProps {
  language: 'myanmar' | 'english';
  voiceId: string;
  onSelect: (id: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function VoiceSelector({ language, voiceId, onSelect, onContinue, onBack }: VoiceSelectorProps) {
  const voices = getVoicesForLanguage(language);
  const [previewing, setPreviewing] = useState(false);

  const previewVoice = () => {
    if (!voiceId || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (previewing) {
      setPreviewing(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(language === 'myanmar'
      ? 'ဒီနေ့ ဘောလုံးသတင်းနဲ့ ပွဲရလဒ်များကို တင်ဆက်ပေးပါမယ်။'
      : 'Here are today’s football headlines and match results.');
    utterance.lang = language === 'myanmar' ? 'my-MM' : 'en-US';
    utterance.rate = 0.92;
    utterance.onend = () => setPreviewing(false);
    utterance.onerror = () => setPreviewing(false);
    window.speechSynthesis.speak(utterance);
    setPreviewing(true);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">Step 3</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">Choose Voice</h2>
        <p className="mt-2 text-sm text-slate-500">{language === 'myanmar' ? 'Myanmar narration voice' : 'English narration voice'}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {voices.map((voice) => (
          <button
            key={voice.id}
            onClick={() => onSelect(voice.id)}
            className={`flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all duration-200 ${voiceId === voice.id ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-slate-200 bg-white hover:border-primary-300'}`}
          >
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${voiceId === voice.id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {voiceId === voice.id ? <Check className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </div>
            <div>
              <p className={`text-base font-semibold text-slate-900 ${language === 'myanmar' ? 'font-myanmar' : ''}`}>{voice.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{voice.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-2xl border border-primary-200 bg-primary-50/60 p-5 text-center">
        <p className="text-sm font-semibold text-slate-800">Listen before continuing</p>
        <p className="text-xs leading-5 text-slate-500">ရွေးထားတဲ့ voice နဲ့ sample အသံကို အရင်နားထောင်နိုင်ပါတယ်။</p>
        <Button variant="secondary" onClick={previewVoice} disabled={!voiceId}>
          {previewing ? <><Square className="h-4 w-4" /> Stop Preview</> : <><Play className="h-4 w-4" /> Preview Voice</>}
        </Button>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 pt-5">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back to Source Text</Button>
        <Button size="lg" onClick={onContinue} disabled={!voiceId}>Continue to Result <ArrowRight className="h-5 w-5" /></Button>
      </div>
    </div>
  );
}
