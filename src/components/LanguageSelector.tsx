import { ArrowLeft, ArrowRight, Globe } from 'lucide-react';
import type { Language } from '@/types';
import { Button } from '@/components/ui/Button';

interface LanguageSelectorProps {
  language: Language;
  onSelect: (lang: Language) => void;
  onContinue: () => void;
  onBack: () => void;
}

const LANGUAGES: { id: Language; label: string; nativeLabel: string }[] = [
  { id: 'myanmar', label: 'Myanmar', nativeLabel: 'မြန်မာ' },
  { id: 'english', label: 'English', nativeLabel: 'English' },
];

export function LanguageSelector({ language, onSelect, onContinue, onBack }: LanguageSelectorProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900">Select Language</h2>
        <p className="text-sm text-slate-500 mt-1">Choose Burmese for automatic dubbing, or English to translate the transcript manually</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            onClick={() => onSelect(lang.id)}
            className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-8 transition-all duration-300 ${
              language === lang.id
                ? 'border-primary-500 bg-primary-50 shadow-md'
                : 'border-slate-200 bg-white hover:border-primary-300'
            }`}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                language === lang.id ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <Globe className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className={`text-lg font-semibold ${lang.id === 'myanmar' ? 'font-myanmar' : ''} text-slate-900`}>
                {lang.nativeLabel}
              </p>
              <p className="text-sm text-slate-500">{lang.label}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between max-w-lg mx-auto">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button onClick={onContinue} disabled={!language}>
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
