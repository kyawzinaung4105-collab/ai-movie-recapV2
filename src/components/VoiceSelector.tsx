import { ArrowLeft, ArrowRight, Volume2, Check } from 'lucide-react';
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900">Select Voice</h2>
        <p className="text-sm text-slate-500 mt-1">
          {language === 'myanmar' ? 'Myanmar narration voice' : 'English narration voice'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
        {voices.map((voice) => (
          <button
            key={voice.id}
            onClick={() => onSelect(voice.id)}
            className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all duration-300 ${
              voiceId === voice.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-slate-200 bg-white hover:border-primary-300'
            }`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 ${
                voiceId === voice.id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {voiceId === voice.id ? <Check className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </div>
            <div className="text-left">
              <p className={`text-base font-semibold text-slate-900 ${language === 'myanmar' ? 'font-myanmar' : ''}`}>
                {voice.label}
              </p>
              <p className="text-xs text-slate-500">{voice.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between max-w-lg mx-auto">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={onContinue} disabled={!voiceId}>
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
