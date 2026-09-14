import { Check } from 'lucide-react';
import type { StepId } from '@/types';

const STEPS: { id: StepId; label: string }[] = [
  { id: 'input', label: 'Input' },
  { id: 'preview', label: 'Preview' },
  { id: 'recap-select', label: 'Recap' },
  { id: 'language', label: 'Language' },
  { id: 'voice', label: 'Voice' },
  { id: 'generate', label: 'Generate' },
  { id: 'result', label: 'Result' },
];

const STEP_ORDER: StepId[] = [
  'input',
  'preview',
  'recap-select',
  'language',
  'voice',
  'generate',
  'result',
];

export function StepIndicator({ currentStep }: { currentStep: StepId }) {
  const currentIdx = STEP_ORDER.indexOf(currentStep);
  if (currentIdx === -1) return null;

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto pb-2">
      {STEPS.map((step, idx) => {
        const isComplete = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={step.id} className="flex items-center flex-shrink-0">
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
                isCurrent
                  ? 'bg-primary-600 text-white shadow-sm'
                  : isComplete
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {isComplete ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="h-4 w-4 flex items-center justify-center rounded-full text-[10px]">
                  {idx + 1}
                </span>
              )}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`mx-0.5 h-px w-4 sm:w-8 ${isComplete ? 'bg-primary-300' : 'bg-slate-200'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
