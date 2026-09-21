import { CheckCircle2, FileText } from 'lucide-react';
import type { CaptionCue } from '@/types';

interface BurmeseReviewPanelProps {
  cues: CaptionCue[];
  onChange: (cues: CaptionCue[]) => void;
}

export function BurmeseReviewPanel({ cues, onChange }: BurmeseReviewPanelProps) {
  return (
    <section className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><FileText className="h-5 w-5" /></div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Review Burmese Text</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">အသံမထုတ်ခင် မြန်မာစာကြောင်းတွေကို ပြန်စစ်ပြီး လိုအပ်ရင် ပြင်နိုင်ပါတယ်။</p>
        </div>
        <span className="ml-auto shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{cues.length} lines</span>
      </div>

      {cues.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">Burmese translation မရသေးပါ။ Source Text အဆင့်မှာ translation ကို Apply လုပ်ပါ။</div>
      ) : (
        <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
          {cues.map((cue, index) => (
            <label key={`${cue.start}-${index}`} className="block rounded-xl border border-slate-200 bg-slate-50 p-3">
              <span className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">{index + 1}</span> Burmese subtitle</span>
              <textarea
                value={cue.text}
                onChange={(event) => onChange(cues.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item))}
                rows={2}
                className="font-myanmar w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-7 text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          ))}
        </div>
      )}

      {cues.length > 0 && <p className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700"><CheckCircle2 className="h-4 w-4" /> စာသားကို စစ်ပြီးရင် Create Voiceover ကိုနှိပ်ပါ။</p>}
    </section>
  );
}
