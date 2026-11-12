import { useState } from 'react';
import { ClipboardPaste, Loader2, Sparkles } from 'lucide-react';
import { useRecap } from '@/context/RecapContext';
import { generatePostKit } from '@/lib/aiClient';
import { generateElevenLabsVoiceover } from '@/lib/elevenlabsClient';
import { loadApiKeys } from '@/lib/settingsStore';
import { Button } from '@/components/ui/Button';
import type { CaptionCue, GenerationStage } from '@/types';

const DEFAULT_VOICE = '21m00Tcm4TlvDq8ikWAM';

function cuesFromScript(script: string): CaptionCue[] {
  const lines = script.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.map((text, index) => ({ start: index * 4, end: (index + 1) * 4, text }));
}

export function ScriptToVideoPanel() {
  const { videoSource, language, captionSettings, setCaptionSettings, setGenerationResult, setMovieTitle, setGenerationStage, setStep } = useRecap();
  const [script, setScript] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    const cleanScript = script.trim();
    if (!cleanScript) return setStatus('မြန်မာ script ကို အရင် paste လုပ်ပါ။');
    if (!videoSource) return setStatus('Background video ကို အရင် upload လုပ်ပါ။');
    if (language !== 'myanmar') return setStatus('ဒီ mode အတွက် Output language ကို မြန်မာ ရွေးပါ။');
    if (!loadApiKeys().elevenLabsKey) return setStatus('Settings ထဲမှာ ElevenLabs API key ထည့်ပါ။');
    setBusy(true);
    setGenerationStage('synthesizing' as GenerationStage);
    try {
      setStatus('မြန်မာ voice ထုတ်နေပါတယ်...');
      const cues = cuesFromScript(cleanScript);
      const voiceUrl = await generateElevenLabsVoiceover(cleanScript, DEFAULT_VOICE);
      setStatus('Caption, title, caption text နဲ့ hashtags ထုတ်နေပါတယ်...');
      const postKit = await generatePostKit(cleanScript);
      setGenerationResult({ movieTitle: postKit.title, titleConfident: true, script: cleanScript, caption: postKit.caption, hashtags: postKit.hashtags, narrationUrl: voiceUrl, segments: cues, cues });
      setMovieTitle(postKit.title);
      setCaptionSettings({ ...captionSettings, enabled: true, cues });
      setGenerationStage('complete');
      setStatus('ပြီးပါပြီ။ Voice, captions, thumbnail title, caption နဲ့ hashtags အားလုံး ready ဖြစ်ပါပြီ။');
      setStep('result');
    } catch (error) {
      setGenerationStage('error');
      setStatus(error instanceof Error ? error.message : 'Script video generation မအောင်မြင်ပါ။');
    } finally {
      setBusy(false);
    }
  };

  return <section className="rounded-[28px] border border-indigo-200 bg-indigo-50/60 p-4 shadow-sm sm:p-5"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white"><ClipboardPaste className="h-5 w-5" /></div><div><h2 className="font-bold text-slate-900">Paste Burmese Script</h2><p className="mt-1 text-xs leading-5 text-slate-600">ပြီးသား မြန်မာ script ကို paste လုပ်ပြီး voice, captions, thumbnail title, caption နဲ့ hashtags ကို တစ်ခါတည်း ထုတ်ပါ။</p></div></div><textarea value={script} onChange={(event) => setScript(event.target.value)} rows={7} placeholder="မြန်မာ script ကို ဒီမှာ paste လုပ်ပါ... စာကြောင်းတစ်ကြောင်းစီခွဲထားရင် caption timing ပိုကောင်းပါမယ်။" className="mt-4 w-full resize-y rounded-2xl border border-indigo-200 bg-white px-4 py-3 text-sm leading-7 text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-slate-500">{script.trim() ? `${script.trim().split(/\s+/).length} words · ${cuesFromScript(script).length} caption lines` : 'No script pasted'}</span><Button onClick={generate} disabled={busy || !script.trim()}>{busy ? <><Loader2 className="h-4 w-4 animate-spin" />Generating...</> : <><Sparkles className="h-4 w-4" />Generate all</>}</Button></div>{status && <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-indigo-700">{busy && <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />}{status}</p>}</section>;
}
