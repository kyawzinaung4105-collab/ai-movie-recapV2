import { Check } from 'lucide-react';
import type { StepId } from '@/types';

const STEPS: { label: string; ids: StepId[] }[] = [
  { label: 'Upload', ids: ['input', 'preview'] },
  { label: 'Source Text', ids: ['recap-select', 'generate'] },
  { label: 'Burmese', ids: ['language', 'voice'] },
  { label: 'Result', ids: ['result'] },
];

export function StepIndicator({ currentStep }: { currentStep: StepId }) {
  const currentIdx = Math.max(0, STEPS.findIndex((step) => step.ids.includes(currentStep)));

  return (
    <nav aria-label="Workflow progress" className="mx-auto flex w-full max-w-4xl items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-6">
      {STEPS.map((step, index) => {
        const isComplete = index < currentIdx;
        const isCurrent = index === currentIdx;
        return (
          <div key={step.label} className="flex min-w-0 flex-1 items-center">
            <div className={`flex min-w-0 items-center gap-2 ${isCurrent ? 'text-primary-700' : isComplete ? 'text-primary-600' : 'text-slate-400'}`}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isCurrent ? 'bg-primary-600 text-white shadow-sm' : isComplete ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-400'}`}>
                {isComplete ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span className={`truncate text-xs font-semibold sm:text-sm ${isCurrent ? 'text-slate-900' : ''}`}>{step.label}</span>
            </div>
            {index < STEPS.length - 1 && <div className={`mx-2 h-px flex-1 ${index < currentIdx ? 'bg-primary-300' : 'bg-slate-200'}`} />}
          </div>
        );
      })}
    </nav>
  );
}
