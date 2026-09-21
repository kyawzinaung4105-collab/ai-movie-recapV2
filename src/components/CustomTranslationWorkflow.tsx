import { useMemo, useState } from 'react';
import { CheckCircle2, Clipboard, FileText, Languages } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { CaptionCue } from '@/types';
import { transcribeVideoWithAssemblyAI } from '@/lib/assemblyAiClient';

interface CustomTranslationWorkflowProps {
  duration?: number;
  videoUrl?: string;
  onTranslationApplied: (cues: CaptionCue[]) => void;
}

function buildCues(lines: string[], duration?: number): CaptionCue[] {
  const totalDuration = Math.max(duration || lines.length * 5, lines.length * 2);
  const segmentDuration = totalDuration / lines.length;
  return lines.map((text, index) => ({
    start: index * segmentDuration,
    end: index === lines.length - 1 ? totalDuration : (index + 1) * segmentDuration,
    text,
  }));
}

export function CustomTranslationWorkflow({ duration, videoUrl, onTranslationApplied }: CustomTranslationWorkflowProps) {
  const [englishTranscript, setEnglishTranscript] = useState('');
  const [sourceCues, setSourceCues] = useState<CaptionCue[]>([]);
  const [jsonOutput, setJsonOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState('');
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState('');

  const englishLines = useMemo(() => englishTranscript.split(/\r?\n/).map((line) => line.trim()).filter(Boolean), [englishTranscript]);
  const timestampCues = useMemo(() => sourceCues.length === englishLines.length && englishLines.length > 0 ? sourceCues : buildCues(englishLines, duration), [sourceCues, englishLines, duration]);
  const numberedTranscript = useMemo(() => englishLines.map((line, index) => `[${index + 1}] ${line}`).join('\n'), [englishLines]);
  const prompt = useMemo(() => `You are a professional football news translator. Translate every numbered English line into natural, accurate Burmese for narration and subtitles. Preserve the exact spoken meaning, names, teams, scores, dates, places, and football terms. Do not summarize, shorten, add facts, guess missing information, or invent anything. Keep the exact order and return ONLY valid JSON in this format: {"translations":["Burmese line 1","Burmese line 2"]}. The number of translations must exactly match the number of numbered English lines. Do not merge lines, split lines, skip lines, add explanations, markdown, or code fences.\n\nNumbered English transcript:\n${numberedTranscript}`, [numberedTranscript]);

  const copyFullPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Prompt copy မရပါ။ စာသားကို manually select လုပ်ပြီး copy လုပ်ပါ။');
    }
  };

  const applyJsonTranslation = () => {
    setError('');
    try {
      const match = jsonOutput.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(match ? match[0] : jsonOutput) as { translations?: unknown };
      if (!Array.isArray(parsed.translations)) throw new Error('JSON ထဲမှာ translations array မတွေ့ပါ။');
      const translatedLines = parsed.translations.map((line) => String(line).trim()).filter(Boolean);
      if (englishLines.length === 0) throw new Error('English transcript ကို အရင်ထည့်ပါ။');
      if (translatedLines.length !== englishLines.length) {
        throw new Error(`English line ${englishLines.length} ကြောင်းရှိပါတယ်။ Burmese translation က ${translatedLines.length} ကြောင်းပဲရှိပါတယ်။`);
      }
      onTranslationApplied(timestampCues.map((cue, index) => ({ ...cue, text: translatedLines[index] })));
      setApplied(true);
    } catch (err) {
      setApplied(false);
      setError(err instanceof Error ? err.message : 'Translation JSON ကို ဖတ်မရပါ။');
    }
  };

  const transcribeSourceVideo = async () => {
    if (!videoUrl) {
      setError('Uploaded video source မတွေ့ပါ။');
      return;
    }
    setError('');
    setTranscribing(true);
    try {
      const cues = await transcribeVideoWithAssemblyAI(videoUrl, setTranscriptionStatus);
      setSourceCues(cues);
      setEnglishTranscript(cues.map((cue) => cue.text).join('\n'));
      setTranscriptionStatus(`${cues.length} English timestamp segments ရပါပြီ`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'English transcription failed.');
    } finally {
      setTranscribing(false);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border-2 border-indigo-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white"><Languages className="h-5 w-5" /></div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Custom Football Translation Workflow</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">English transcript ကိုထည့်ပြီး prompt copy လုပ်ပါ။ ChatGPT, Claude, Gemini, DeepSeek သို့မဟုတ် မည်သည့် AI မှ JSON result ရလာရင် အောက်မှာ paste လုပ်ပြီး subtitle timing အဖြစ်သုံးနိုင်ပါတယ်။</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700"><FileText className="h-4 w-4 text-indigo-600" /> English transcript</label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{englishLines.length} lines</span>
            <Button size="sm" variant="secondary" onClick={transcribeSourceVideo} disabled={transcribing || !videoUrl}>
              {transcribing ? 'Transcribing...' : 'Transcribe with AssemblyAI'}
            </Button>
          </div>
        </div>
        <textarea value={englishTranscript} onChange={(event) => { setEnglishTranscript(event.target.value); setSourceCues([]); setApplied(false); setError(''); }} rows={7} placeholder="English transcript text will appear here..." className="w-full resize-y rounded-xl border border-indigo-300 px-3 py-3 text-sm leading-6 text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
        {transcriptionStatus && <p className="text-xs text-indigo-700">{transcriptionStatus}</p>}
      </div>

      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-sm font-bold text-indigo-900">Any AI ဖြင့် ဆက်လက်ဘာသာပြန်ရန်</p><p className="mt-1 text-xs text-indigo-700">Video ထဲက ပြောထားတဲ့အဓိပ္ပါယ်ကို မချန်၊ မထည့်၊ မချုံ့ဘဲ ဘာသာပြန်ရန် prompt ပါ။ Line number အတိုင်း JSON output ပြန်ယူပါ။</p></div>
          <Button size="sm" onClick={copyFullPrompt} disabled={!englishTranscript.trim()}>{copied ? <CheckCircle2 className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}{copied ? 'Copied' : 'Copy Full Prompt'}</Button>
        </div>
        <pre className="mt-3 max-h-24 overflow-auto whitespace-pre-wrap rounded-lg bg-white px-3 py-2 text-[11px] leading-5 text-slate-600">{prompt}</pre>
      </div>

      <div className="space-y-2">
        <label htmlFor="custom-translation-json" className="text-xs font-semibold text-slate-700">Any AI JSON output paste here</label>
        <textarea id="custom-translation-json" value={jsonOutput} onChange={(event) => { setJsonOutput(event.target.value); setApplied(false); setError(''); }} rows={5} placeholder={'{"translations":["မြန်မာစာကြောင်း ၁","မြန်မာစာကြောင်း ၂"]}'} className="font-myanmar w-full resize-y rounded-xl border border-slate-300 px-3 py-3 text-sm leading-7 text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      {applied && <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Burmese translation ကို subtitle timing နဲ့ ချိတ်ပြီးပါပြီ။</p>}
      <Button onClick={applyJsonTranslation} disabled={!englishTranscript.trim() || !jsonOutput.trim()} className="w-full"><CheckCircle2 className="h-4 w-4" /> Step 2: ဘာသာပြန်ထားတာ ထည့်မယ် (Next)</Button>
    </section>
  );
}
