import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clipboard, FileText, Languages } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { CaptionCue } from '@/types';
import { transcribeVideoWithAssemblyAI } from '@/lib/assemblyAiClient';

interface CustomTranslationWorkflowProps {
  duration?: number;
  videoUrl?: string;
  videoFile?: File;
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

export function CustomTranslationWorkflow({ duration, videoUrl, videoFile, onTranslationApplied }: CustomTranslationWorkflowProps) {
  const [englishTranscript, setEnglishTranscript] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [correctionCopied, setCorrectionCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState('');
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState('');
  const [sourceCues, setSourceCues] = useState<CaptionCue[]>([]);

  useEffect(() => {
    const handleOffline = () => {
      if (transcribing) setTranscriptionStatus('Internet ခဏပြတ်သွားပါတယ်။ ပြန်ရလာရင် အလိုအလျောက် ဆက်လုပ်ပါမယ်...');
    };
    const handleOnline = () => {
      if (transcribing) setTranscriptionStatus('Internet ပြန်ရပါပြီ။ ဆက်လုပ်နေပါတယ်...');
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [transcribing]);

  const englishLines = useMemo(() => englishTranscript.split(/\r?\n/).map((line) => line.trim()).filter(Boolean), [englishTranscript]);
  const numberedTranscript = useMemo(() => englishLines.map((line, index) => `[${index + 1}] ${line}`).join('\n'), [englishLines]);
  const durationSeconds = Math.max(1, duration || 0);
  const durationText = durationSeconds >= 60 ? `${Math.floor(durationSeconds / 60)} minutes ${Math.round(durationSeconds % 60)} seconds` : `${Math.round(durationSeconds)} seconds`;
  const perLineSeconds = englishLines.length > 0 ? Math.max(1, durationSeconds / englishLines.length) : 0;
  const prompt = useMemo(() => `You are a professional movie recap subtitle writer and Burmese sports-news narrator. Rewrite each numbered English line as concise, natural, conversational Burmese that sounds like a real Myanmar football commentator speaking. Do NOT translate word-for-word or preserve English grammar. Use natural Burmese sentence order, particles, connectors, and movie-recap expressions. Preserve the story's narrative flow: the opening context, who did what, cause and effect, turning points, emotional tone, important reactions, and the logical connection between one line and the next. Do not shorten by deleting the context that makes the story understandable. Preserve the essential meaning and every important fact: character names, locations, dates, places, and important story terms. Remove only repetition, filler words, unnecessary explanations, and awkward literal wording so each line is shorter but still feels like part of the same story. Do not add facts, guess missing information, invent events, or make the narration sound like disconnected headlines. The video is ${durationText} long, but subtitles and narration MUST appear ONLY during the original spoken timestamp intervals. Do not create subtitles or voice during silent/non-speaking parts. Each line MUST be short enough to fit its own spoken interval, and the total narration MUST NOT run beyond the video end. Do not create extra content just to fill silent parts. Keep each numbered line as one subtitle unit. Every text value must contain a non-empty Burmese translation; never return an empty string. Return ONLY valid JSON in this exact format: {"translations":[{"line":1,"text":"ဇာတ်လမ်းအဆက်အစပ်မပျက်တဲ့ တိုတောင်းပြီး သဘာဝကျတဲ့ မြန်မာစာကြောင်း"},{"line":2,"text":"နောက်ထပ် ဆက်စပ်မှုရှိတဲ့ စာကြောင်း"}]}. You MUST return exactly one object for every line number from 1 to ${englishLines.length}; do not skip, duplicate, reorder, or invent line numbers. Do not add explanations, markdown, or code fences.\n\nNumbered English transcript:\n${numberedTranscript}`, [numberedTranscript, englishLines.length, durationText, perLineSeconds]);
  const translationCount = useMemo(() => {
    try {
      const match = jsonOutput.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(match ? match[0] : jsonOutput) as { translations?: unknown };
      return Array.isArray(parsed.translations) ? parsed.translations.filter((line) => {
        if (typeof line === 'string') return line.trim().length > 0;
        if (line && typeof line === 'object' && 'line' in line && 'text' in line) return String((line as { text?: unknown }).text || '').trim().length > 0;
        return false;
      }).length : 0;
    } catch {
      return 0;
    }
  }, [jsonOutput]);

  const extractTranslations = (value: unknown): string[] => {
    if (!Array.isArray(value)) throw new Error('JSON ထဲမှာ translations array မတွေ့ပါ။');
    const items = value.map((item, index) => {
      if (typeof item === 'string') return { line: index + 1, text: item.trim() };
      if (item && typeof item === 'object' && 'line' in item && 'text' in item) {
        const row = item as { line: unknown; text: unknown };
        return { line: Number(row.line), text: String(row.text).trim() };
      }
      throw new Error(`Translation item ${index + 1} က line/text format မဟုတ်ပါ။`);
    });
    const expected = Array.from({ length: englishLines.length }, (_, index) => index + 1);
    const actual = items.map((item) => item.line);
    if (actual.some((line) => !Number.isInteger(line)) || new Set(actual).size !== actual.length || actual.some((line, index) => line !== expected[index])) {
      throw new Error(`Line number မကိုက်ပါ။ 1 မှ ${englishLines.length} အထိ line number တစ်ခုစီပါရမယ်။`);
    }
    const emptyLine = items.find((item) => !item.text);
    if (emptyLine) throw new Error(`Burmese translation line ${emptyLine.line || '?'} မှာ အလွတ်စာကြောင်းရှိပါတယ်။`);
    return items.map((item) => item.text);
  };
  const correctionPrompt = useMemo(() => `The previous Burmese subtitle output is incomplete, too long, or has a wrong line mapping. Regenerate the COMPLETE result in concise, natural, conversational Burmese movie-recap style, not word-for-word Burmese. Subtitles and narration MUST appear ONLY during the original spoken timestamp intervals; do not fill silent/non-speaking parts. The narration must not run beyond the video end. Shorten only repetition, filler, and awkward wording; preserve the story's opening context, cause-and-effect, turning points, reactions, emotional tone, and logical connection between lines. The result must still feel like one complete movie story, not disconnected short headlines. Compare the numbered English source with the current output. Restore missing lines, but do not add facts, merge lines, split lines, reorder, invent, or change character names, locations, dates, or places. Each line must be short enough for its assigned subtitle interval. Return ONLY valid JSON in this exact format: {"translations":[{"line":1,"text":"ဇာတ်လမ်းအဆက်အစပ်မပျက်တဲ့ တိုတောင်းပြီး သဘာဝကျတဲ့ စာကြောင်း"},{"line":2,"text":"နောက်ထပ် ဆက်စပ်မှုရှိတဲ့ စာကြောင်း"}]}. Return exactly one non-empty object for EVERY line number from 1 to ${englishLines.length}, in numeric order. Never return a plain string array.\n\nNumbered English source:\n${numberedTranscript}\n\nCurrent incomplete or overlong output:\n${jsonOutput}`, [englishLines.length, numberedTranscript, jsonOutput, durationText]);

  const copyFullPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Prompt copy မရပါ။ စာသားကို manually select လုပ်ပြီး copy လုပ်ပါ။');
    }
  };

  const copyCorrectionPrompt = async () => {
    try {
      await navigator.clipboard.writeText(correctionPrompt);
      setCorrectionCopied(true);
      window.setTimeout(() => setCorrectionCopied(false), 1800);
    } catch {
      setError('Correction prompt copy မရပါ။ စာသားကို manually select လုပ်ပြီး copy လုပ်ပါ။');
    }
  };

  const applyJsonTranslation = () => {
    setError('');
    try {
      const match = jsonOutput.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(match ? match[0] : jsonOutput) as { translations?: unknown };
      if (englishLines.length === 0) throw new Error('English transcript ကို အရင်ထည့်ပါ။');
      const translatedLines = extractTranslations(parsed.translations);
      if (translatedLines.length !== englishLines.length) {
        throw new Error(`English line ${englishLines.length} ကြောင်းရှိပါတယ်။ Burmese translation က ${translatedLines.length} ကြောင်းပဲရှိပါတယ်။`);
      }
      const timedCues = sourceCues.length === translatedLines.length
        ? sourceCues.map((cue, index) => ({ ...cue, text: translatedLines[index] }))
        : buildCues(translatedLines, duration);
      onTranslationApplied(timedCues);
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
      let cues: CaptionCue[] | undefined;
      let lastError: unknown;
      for (let attempt = 1; attempt <= 2 && !cues; attempt += 1) {
        try {
          setTranscriptionStatus(attempt === 1 ? 'အသံကို ပြင်ဆင်ပြီး Transcribe လုပ်နေပါတယ်...' : 'ပထမအကြိမ် မအောင်မြင်သေးပါ။ အလိုအလျောက် ပြန်စမ်းနေပါတယ်...');
          cues = await transcribeVideoWithAssemblyAI(videoUrl, setTranscriptionStatus, videoFile);
        } catch (err) {
          lastError = err;
          if (attempt < 2) await new Promise((resolve) => window.setTimeout(resolve, 1200));
        }
      }
      if (!cues) throw lastError instanceof Error ? lastError : new Error('transcription failed');
      setSourceCues(cues);
      setEnglishTranscript(cues.map((cue) => cue.text).join('\n'));
      setTranscriptionStatus(`${cues.length} English timestamp segments ရပါပြီ`);
    } catch {
      setError('Transcribe မအောင်မြင်သေးပါ။ Video ကို မပြောင်းဘဲ ခဏစောင့်ပြီး Transcribe ကို တစ်ကြိမ်ထပ်နှိပ်ပါ။');
      setTranscriptionStatus('Transcribe ပြန်စမ်းရန် အသင့်ဖြစ်ပါပြီ။');
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
          <p className="mt-1 text-xs leading-5 text-slate-500">English transcript ကိုထည့်ပြီး prompt copy လုပ်ပါ။ AI မှ JSON result ရလာရင် အောက်မှာ paste လုပ်ပြီး video duration မကျော်တဲ့ subtitle timing အဖြစ်သုံးနိုင်ပါတယ်။</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700"><FileText className="h-4 w-4 text-indigo-600" /> English transcript</label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{englishLines.length} lines</span>
            <Button size="sm" variant="secondary" onClick={transcribeSourceVideo} disabled={transcribing || !videoUrl}>
              {transcribing ? (transcriptionStatus || 'Uploading video...') : 'Transcribe with AssemblyAI'}
            </Button>
          </div>
        </div>
        <textarea value={englishTranscript} onChange={(event) => { setEnglishTranscript(event.target.value); setSourceCues([]); setApplied(false); setError(''); }} rows={7} placeholder="English transcript text will appear here..." className="w-full resize-y rounded-xl border border-indigo-300 px-3 py-3 text-sm leading-6 text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
        {(transcriptionStatus || transcribing) && <p className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700">{transcriptionStatus || 'Transcribing... 0%'}</p>}
      </div>

      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-sm font-bold text-indigo-900">Any AI ဖြင့် ဆက်လက်ဘာသာပြန်ရန်</p><p className="mt-1 text-xs text-indigo-700">Video ထဲက အဓိပ္ပါယ်နဲ့ အရေးကြီးတဲ့အချက်တွေ မလွဲဘဲ တိုတောင်း၊ သဘာဝကျတဲ့ Burmese subtitle ရရန် prompt ပါ။ Video duration မကျော်အောင် JSON output ပြန်ယူပါ။</p></div>
          <Button size="sm" onClick={copyFullPrompt} disabled={!englishTranscript.trim()}>{copied ? <CheckCircle2 className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}{copied ? 'Copied' : 'Copy Full Prompt'}</Button>
        </div>
        <pre className="mt-3 max-h-24 overflow-auto whitespace-pre-wrap rounded-lg bg-white px-3 py-2 text-[11px] leading-5 text-slate-600">{prompt}</pre>
      </div>

      <div className="space-y-2">
        <label htmlFor="custom-translation-json" className="text-xs font-semibold text-slate-700">Any AI JSON output paste here</label>
        <textarea id="custom-translation-json" value={jsonOutput} onChange={(event) => { setJsonOutput(event.target.value); setApplied(false); setError(''); }} rows={5} placeholder={'{"translations":[{"line":1,"text":"မြန်မာစာကြောင်း ၁"},{"line":2,"text":"မြန်မာစာကြောင်း ၂"}]}' } className="font-myanmar w-full resize-y rounded-xl border border-slate-300 px-3 py-3 text-sm leading-7 text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100" />
        {jsonOutput.trim() && translationCount !== englishLines.length && (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-amber-800">လိုအပ်တာ {englishLines.length} ကြောင်း၊ ရထားတာ {translationCount} ကြောင်းပါ။ AI က line ကျော်/ပေါင်းထားနိုင်ပါတယ်။ Correction Prompt နဲ့ ပြန်တောင်းပါ။</p>
            <Button size="sm" variant="secondary" onClick={copyCorrectionPrompt}>{correctionCopied ? 'Copied' : 'Copy Correction Prompt'}</Button>
          </div>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      {applied && <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Burmese translation ကို subtitle timing နဲ့ ချိတ်ပြီးပါပြီ။</p>}
      <Button onClick={applyJsonTranslation} disabled={!englishTranscript.trim() || !jsonOutput.trim()} className="w-full"><CheckCircle2 className="h-4 w-4" /> Step 2: ဘာသာပြန်ထားတာ ထည့်မယ် (Next)</Button>
    </section>
  );
}
