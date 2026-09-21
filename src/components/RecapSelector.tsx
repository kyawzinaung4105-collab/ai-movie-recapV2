import { Trophy, Upload, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface RecapSelectorProps {
  onSelect: () => void;
  onCustomSelect: () => void;
  onBack: () => void;
}

export function RecapSelector({ onSelect, onCustomSelect, onBack }: RecapSelectorProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-900">What would you like to create?</h2>
        <p className="text-sm text-slate-500 mt-1">Select a football news format to continue</p>
      </div>

      <div className="max-w-md mx-auto space-y-3">
        <button
          onClick={onSelect}
          className="group flex w-full items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-6 transition-all duration-300 hover:border-primary-400 hover:bg-primary-50 hover:shadow-md"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 text-primary-600 transition-transform duration-300 group-hover:scale-110">
            <Trophy className="h-7 w-7" />
          </div>
          <div className="text-left">
            <p className="text-lg font-semibold text-slate-900">AI Football News</p>
            <p className="text-sm text-slate-500">AI-generated match highlights, narration and subtitles</p>
          </div>
          <ArrowRight className="ml-auto h-5 w-5 text-slate-300 group-hover:text-primary-500 transition-colors" />
        </button>

        <button
          onClick={onCustomSelect}
          className="group flex w-full items-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-6 transition-all duration-300 hover:border-primary-400 hover:bg-primary-50 hover:shadow-md"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-transform duration-300 group-hover:scale-110">
            <Upload className="h-7 w-7" />
          </div>
          <div className="text-left">
            <p className="text-lg font-semibold text-slate-900">Custom Translation Workflow</p>
            <p className="text-sm text-slate-500">Copy prompt to Gemini, paste Burmese JSON, and sync subtitles</p>
          </div>
          <ArrowRight className="ml-auto h-5 w-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
        </button>
      </div>

      <div className="flex items-center justify-start">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>
    </div>
  );
}
