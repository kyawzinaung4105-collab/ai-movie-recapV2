import { useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Clipboard, FileAudio, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { CaptionCue } from '@/types';

interface VoiceSelectorProps {
  audioUrl?: string;
  translatedCues: CaptionCue[];
  onAudioSelected: (url: string | undefined) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function VoiceSelector({ audioUrl, translatedCues, onAudioSelected, onContinue, onBack }: VoiceSelectorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [audioName, setAudioName] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const audioPrompt = useMemo(() => (
    translatedCues
      .map((cue) => cue.text.trim())
      .filter(Boolean)
      .join('\n')
  ), [translatedCues]);
  const narrationText = audioPrompt || 'ဘာသာပြန်ထားသော မြန်မာစာသားများသည် ဘာသာပြန်ပြီးနောက် ဒီနေရာတွင် ပေါ်လာပါမည်။';
  const speakingSeconds = translatedCues.reduce((total, cue) => total + Math.max(0, cue.end - cue.start), 0);
  const firstCueStart = translatedCues.length > 0 ? Math.max(0, translatedCues[0].start) : 0;
  const lastCueEnd = translatedCues.length > 0 ? Math.max(firstCueStart, translatedCues[translatedCues.length - 1].end) : 0;
  const mp3TargetSeconds = Math.max(0, lastCueEnd - firstCueStart);
  const formatDuration = (seconds: number) => {
    const rounded = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(rounded / 60);
    const remainingSeconds = rounded % 60;
    return `${minutes} မိနစ် ${remainingSeconds.toString().padStart(2, '0')} စက္ကန့်`;
  };

  const handleAudio = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('audio/') && !/\.mp3$/i.test(file.name)) {
      setError('MP3 audio file ကိုပဲ ထည့်ပါ။');
      return;
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const url = URL.createObjectURL(file);
    setAudioName(file.name);
    setError('');
    onAudioSelected(url);
  };

  const clearAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioName('');
    onAudioSelected(undefined);
  };

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(audioPrompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };


  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">Step 3</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">Upload Burmese MP3</h2>
        <p className="mt-2 text-sm text-slate-500">Voice ရွေးစရာမလိုပါ။ ကိုယ်တိုင်ပြုလုပ်ထားတဲ့ မြန်မာ MP3 ကိုထည့်ပါ။</p>
      </div>

      <section className="space-y-4 rounded-2xl border-2 border-primary-200 bg-primary-50/50 p-5">
        <div className="flex items-start gap-3">
          <FileAudio className="mt-0.5 h-6 w-6 shrink-0 text-primary-600" />
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900">MP3 ထည့်ရန်</h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">ဒီ MP3 ကို translated Burmese subtitles နဲ့အတူ နောက်ဆုံး video ထဲ ထည့်ပေးပါမယ်။</p>
          </div>
        </div>
        <input ref={inputRef} type="file" accept="audio/mpeg,audio/mp3,.mp3" className="hidden" onChange={(event) => { handleAudio(event.target.files?.[0]); event.target.value = ''; }} />
        {audioUrl ? (
          <div className="flex items-center justify-between rounded-xl border border-green-200 bg-white px-4 py-3">
            <div className="flex min-w-0 items-center gap-2"><Check className="h-5 w-5 shrink-0 text-green-600" /><span className="truncate text-sm font-medium text-slate-700">{audioName || 'MP3 audio selected'}</span></div>
            <button onClick={clearAudio} className="shrink-0 text-slate-400 hover:text-red-500" aria-label="Remove MP3"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <Button size="lg" onClick={() => inputRef.current?.click()} className="w-full"><FileAudio className="h-5 w-5" /> MP3 ထည့်ရန်</Button>
        )}
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      </section>

      <section className="space-y-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-5">
        <div className="flex items-center justify-between gap-3">
          <div><h3 className="text-sm font-bold text-slate-900">Voicertool ထဲထည့်ရန် မြန်မာစာသား</h3><p className="mt-1 text-xs text-slate-600">အောက်ကစာသားကို တစ်ခါတည်း Copy လုပ်ပြီး Voicertool ရဲ့ Text box ထဲမှာ Paste လုပ်ပါ။</p></div>
          <Button size="sm" variant="secondary" onClick={copyPrompt} disabled={!audioPrompt}><Clipboard className="h-4 w-4" />{copied ? 'Copied' : 'Copy Text'}</Button>
        </div>
        <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-3 text-xs leading-5 text-slate-700">{narrationText}</pre>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-xs font-semibold text-sky-700">တကယ်ဖတ်ရမယ့် စကားပြောချိန်</p>
          <p className="mt-1 text-xl font-bold text-sky-950">{formatDuration(speakingSeconds)}</p>
          <p className="mt-1 text-xs leading-5 text-sky-800">Subtitle စာကြောင်းများရဲ့ အသံဖတ်ချိန် စုစုပေါင်းပါ။ စာကြောင်းကြား pause မပါပါ။</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold text-emerald-700">MP3 ထုတ်ရန် Target အရှည်</p>
          <p className="mt-1 text-xl font-bold text-emerald-950">{formatDuration(mp3TargetSeconds)}</p>
          <p className="mt-1 text-xs leading-5 text-emerald-800">ပထမ Subtitle စချိန်မှ နောက်ဆုံး Subtitle ပြီးချိန်အထိပါ။ MP3 ကို ဒီအရှည်နီးပါးထားပါ။</p>
        </div>
      </section>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
        ဒီနေရာက စာသားထဲမှာ No. နံပါတ်၊ timestamp၊ prompt instruction သို့မဟုတ် အပိုရှင်းပြချက် မပါပါ။ ကိုယ်တိုင်လိုအပ်သလို ပြင်ပြီး Voicertool ထဲ paste လုပ်ပါ။
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 pt-5">
        <Button variant="secondary" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back to Source Text</Button>
        <Button size="lg" onClick={onContinue} disabled={!audioUrl}>Continue to Result <ArrowRight className="h-5 w-5" /></Button>
      </div>
    </div>
  );
}
