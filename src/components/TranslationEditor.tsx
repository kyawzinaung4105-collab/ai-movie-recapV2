import { useMemo, useState } from 'react';
import { CheckCircle2, Clipboard, Languages, Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { generateElevenLabsVoiceover } from '@/lib/elevenlabsClient';
import type { CaptionCue } from '@/types';

interface TranslationEditorProps {
  sourceCues: CaptionCue[];
  voiceId: string;
  onTranslationApplied: (cues: CaptionCue[]) => void;
  onAudioGenerated: (url: string) => void;
}

export function TranslationEditor({ sourceCues, voiceId, onTranslationApplied, onAudioGenerated }: TranslationEditorProps) {
  const [translation, setTranslation] = useState('');
  const [copied, setCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const [generatingVoice, setGeneratingVoice] = useState(false);
  const [error, setError] = useState('');

  const sourceText = useMemo(() => sourceCues.map((cue) => cue.text).join('\n'), [sourceCues]);
  const translationPrompt = useMemo(() => `Translate the following English movie recap transcript into natural Burmese for narration and subtitles. Keep the same number of non-empty lines, keep the original order, do not add numbering or explanations, and return only the Burmese lines.\n\n${sourceText}`, [sourceText]);
  const translatedLines = translation.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const isLineCountMatch = translatedLines.length === sourceCues.length;

  const copyEnglishTranscript = async () => {
    try {
      await navigator.clipboard.writeText(sourceText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Could not copy automatically. Select the English transcript and copy it manually.');
    }
  };

  const copyTranslationPrompt = async () => {
    try {
      await navigator.clipboard.writeText(translationPrompt);
      setPromptCopied(true);
      window.setTimeout(() => setPromptCopied(false), 1800);
    } catch {
      setError('Could not copy the prompt automatically. Please copy the English transcript manually.');
    }
  };

  const applyTranslation = () => {
    setError('');
    if (sourceCues.length === 0) {
      setError('No timestamped English transcript is available.');
      return;
    }
    if (!isLineCountMatch) {
      setError(`Please provide one Burmese line for each English segment (${sourceCues.length} lines expected, ${translatedLines.length} received).`);
      return;
    }
    onTranslationApplied(sourceCues.map((cue, index) => ({ ...cue, text: translatedLines[index] })));
    setApplied(true);
  };

  const generateBurmeseVoice = async () => {
    setError('');
    if (!isLineCountMatch) {
      setError('Apply a Burmese translation with one line per timestamp before generating voice.');
      return;
    }
    if (!voiceId) {
      setError('Please choose a voice before generating Burmese narration.');
      return;
    }
    setGeneratingVoice(true);
    try {
      const url = await generateElevenLabsVoiceover(translatedLines.join(' '), voiceId);
      onAudioGenerated(url);
      setApplied(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Burmese narration generation failed.');
    } finally {
      setGeneratingVoice(false);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl border border-teal-200 bg-teal-50/60 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white">
          <Languages className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">English Transcript → Burmese News</h3>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Copy the English transcript, translate it with your preferred AI, then paste one Burmese line per English segment below.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-semibold text-slate-700">English timestamped transcript ({sourceCues.length} segments)</label>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={copyEnglishTranscript} disabled={!sourceText}>
              {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Clipboard className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy English'}
            </Button>
            <Button size="sm" variant="secondary" onClick={copyTranslationPrompt} disabled={!sourceText}>
              {promptCopied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Clipboard className="h-4 w-4" />}
              {promptCopied ? 'Prompt copied' : 'Copy AI Prompt'}
            </Button>
          </div>
        </div>
        <textarea
          readOnly
          value={sourceText}
          rows={5}
          className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 font-sans text-xs leading-5 text-slate-600"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="burmese-translation" className="text-xs font-semibold text-slate-700">Paste Burmese translation</label>
          <span className={`text-xs ${isLineCountMatch ? 'text-emerald-600' : 'text-slate-400'}`}>
            {translatedLines.length}/{sourceCues.length} lines
          </span>
        </div>
        <textarea
          id="burmese-translation"
          value={translation}
          onChange={(event) => { setTranslation(event.target.value); setApplied(false); setError(''); }}
          rows={7}
          placeholder="အင်္ဂလိပ်စာကြောင်းတစ်ကြောင်းစီအတွက် မြန်မာစာကြောင်းတစ်ကြောင်းစီ ထည့်ပါ..."
          className="font-myanmar w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm leading-7 text-slate-800 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100"
        />
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
      {applied && <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Burmese subtitles are synced to the English timestamps.</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={applyTranslation} disabled={!translation.trim() || sourceCues.length === 0}>
          <CheckCircle2 className="h-4 w-4" /> Apply Burmese Subtitles
        </Button>
        <Button variant="secondary" onClick={generateBurmeseVoice} disabled={generatingVoice || !translation.trim() || sourceCues.length === 0}>
          {generatingVoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
          {generatingVoice ? 'Generating voice...' : 'Generate Burmese Voice'}
        </Button>
      </div>
      <p className="text-[11px] leading-5 text-slate-500">Tip: Keep the same number of non-empty lines as the English transcript so every Burmese sentence stays aligned with its original timestamp.</p>
    </section>
  );
}
