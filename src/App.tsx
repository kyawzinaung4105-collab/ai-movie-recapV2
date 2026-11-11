import { useState } from 'react';
import { BookOpen, Check, Clock3, Film, History, LayoutDashboard, Link2, Loader2, Menu, Play, Settings, SlidersHorizontal, Sparkles, Upload, UserRound, Video, WalletCards, X, Zap } from 'lucide-react';
import { RecapProvider, useRecap } from '@/context/RecapContext';
import { VideoUpload } from '@/components/VideoUpload';
import { VideoLinkInput } from '@/components/VideoLinkInput';
import { ResultScreen } from '@/components/ResultScreen';
import { SettingsModal } from '@/components/SettingsModal';
import { Button } from '@/components/ui/Button';
import { getEnvConfig } from '@/lib/env';
import { runGenerationPipeline } from '@/lib/generationPipeline';
import type { GenerationStage } from '@/types';
import type { InputMethod, Language, VideoSource } from '@/types';

type StudioMode = 'auto' | 'pro' | 'subtitle';
type Ratio = 'original' | '9:16' | '3:4' | '16:9' | '1:1';
type NavItem = 'auto' | 'manual' | 'history' | 'usage';
const languageLabels: Record<Language, string> = { myanmar: 'မြန်မာ', english: 'English' };

function StudioUpload({ onSource }: { onSource: (source: VideoSource) => void }) {
  const [method, setMethod] = useState<InputMethod>('upload');
  return <div className="space-y-5"><div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Input video</p><h2 className="mt-1 text-xl font-bold text-slate-900">Choose a video source</h2></div><div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold"><button className={`rounded-lg px-3 py-2 ${method === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`} onClick={() => setMethod('upload')}><Upload className="mr-1 inline h-3.5 w-3.5" />File</button><button className={`rounded-lg px-3 py-2 ${method === 'link' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`} onClick={() => setMethod('link')}><Link2 className="mr-1 inline h-3.5 w-3.5" />Link</button></div></div>{method === 'upload' ? <VideoUpload onVideoSelected={onSource} /> : <VideoLinkInput onVideoLoaded={onSource} />}</div><div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500"><span className="flex items-center gap-1"><Film className="h-3.5 w-3.5" /> MP4, MOV, MKV</span><span>·</span><span>Up to 15 minutes</span><span>·</span><span>YouTube and TikTok links</span></div></div>;
}

function ControlPanel({ mode, setMode, ratio, setRatio, language, setLanguage, mirror, setMirror, zoom, setZoom, sourceLanguage, setSourceLanguage }: { mode: StudioMode; setMode: (value: StudioMode) => void; ratio: Ratio; setRatio: (value: Ratio) => void; language: Language; setLanguage: (value: Language) => void; mirror: boolean; setMirror: (value: boolean) => void; zoom: number; setZoom: (value: number) => void; sourceLanguage: string; setSourceLanguage: (value: string) => void }) {
  const modes: { id: StudioMode; title: string; description: string; premium?: boolean }[] = [{ id: 'auto', title: 'AI Recap', description: 'Narrates only where people talk' }, { id: 'pro', title: 'Pro AI Recap', description: 'Skips silent scenes, narrates nonstop', premium: true }, { id: 'subtitle', title: 'Subtitle Mode', description: 'Faithful translation with captions' }];
  return <aside className="space-y-5 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center gap-2 border-b border-slate-100 pb-4"><SlidersHorizontal className="h-4 w-4 text-indigo-600" /><h2 className="font-bold text-slate-900">Render settings</h2></div><section><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Mode</p><div className="space-y-2">{modes.map((item) => <button key={item.id} onClick={() => setMode(item.id)} className={`w-full rounded-2xl border p-3 text-left transition ${mode === item.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200' : 'border-slate-200 hover:border-indigo-300'}`}><div className="flex items-start gap-2"><span className={`mt-0.5 h-4 w-4 rounded-full border-2 ${mode === item.id ? 'border-indigo-600 bg-indigo-600 ring-2 ring-white' : 'border-slate-300'}`} /><span><span className="block text-sm font-semibold text-slate-900">{item.title} {item.premium && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-700">PRO</span>}</span><span className="mt-0.5 block text-xs leading-4 text-slate-500">{item.description}</span></span></div></button>)}</div></section><section><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Ratio</p><div className="grid grid-cols-5 gap-1 rounded-xl bg-slate-100 p-1">{(['original', '9:16', '3:4', '16:9', '1:1'] as Ratio[]).map((item) => <button key={item} onClick={() => setRatio(item)} className={`rounded-lg px-1 py-2 text-[11px] font-semibold ${ratio === item ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-white'}`}>{item === 'original' ? 'Orig.' : item}</button>)}</div><div className="mt-2 grid grid-cols-2 gap-2 text-xs"><button className="rounded-xl bg-indigo-600 px-3 py-2 font-semibold text-white">Crop (fill)</button><button className="rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-600">Pad (blur)</button></div></section><section><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Output language</p><div className="grid grid-cols-2 gap-2">{(['myanmar', 'english'] as Language[]).map((item) => <button key={item} onClick={() => setLanguage(item)} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${language === item ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500'}`}>{languageLabels[item]}</button>)}</div></section><label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700"><span>Mirror (flip left/right)</span><input type="checkbox" checked={mirror} onChange={(event) => setMirror(event.target.checked)} className="h-4 w-4 accent-indigo-600" /></label><section><div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500"><span>Zoom</span><span>{zoom}%</span></div><input aria-label="Zoom" type="range" min="80" max="140" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-full accent-indigo-600" /></section><section><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Source language</label><select value={sourceLanguage} onChange={(event) => setSourceLanguage(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"><option value="auto">Auto detect</option><option value="zh">Chinese</option><option value="en">English</option><option value="es">Spanish</option><option value="ru">Russian</option><option value="hi">Hindi</option><option value="th">Thai</option><option value="ko">Korean</option><option value="ja">Japanese</option><option value="vi">Vietnamese</option></select></section></aside>;
}

function Dashboard() {
  const {
    step, setStep, videoSource, setVideoSource, language, setLanguage,
    setGenerationStage, setGenerationResult, setMovieTitle, setCaptionSettings, captionSettings,
  } = useRecap();
  const [mode, setMode] = useState<StudioMode>('auto');
  const [ratio, setRatio] = useState<Ratio>('original');
  const [mirror, setMirror] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [sourceLanguage, setSourceLanguage] = useState('auto');
  const [notice, setNotice] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (step === 'result') return <ResultScreen />;

  const startRender = async () => {
    if (!videoSource) {
      setNotice('အရင်ဆုံး video ဖိုင် သို့မဟုတ် link တစ်ခု ရွေးပါ။');
      return;
    }
    setIsGenerating(true);
    setNotice('Video ကို စစ်ဆေးပြီး မြန်မာစာတန်းထိုးနဲ့ voice ပြင်ဆင်နေပါတယ်...');
    setGenerationStage('analyzing');
    try {
      const result = await runGenerationPipeline(
        { videoSource, language, voiceId: '21m00Tcm4TlvDq8ikWAM' },
        (stage) => {
          setGenerationStage(stage as GenerationStage);
          const labels: Record<string, string> = {
            analyzing: 'Video ကို AI က ခွဲခြမ်းစိတ်ဖြာနေပါတယ်...',
            translating: 'မြန်မာဘာသာပြန်နဲ့ စာတန်းထိုး ပြင်ဆင်နေပါတယ်...',
            synthesizing: 'မြန်မာ voice ထုတ်နေပါတယ်...',
            'preparing-subtitles': 'စာတန်းထိုးနဲ့ final video ပြင်ဆင်နေပါတယ်...',
            complete: 'ပြီးပါပြီ။ Video ကို review/export လုပ်နိုင်ပါပြီ။',
          };
          setNotice(labels[stage] || 'Video ကို ပြင်ဆင်နေပါတယ်...');
        },
      );
      setGenerationResult(result);
      setMovieTitle(result.movieTitle);
      setCaptionSettings({ ...captionSettings, enabled: true, cues: result.cues });
      setGenerationStage('complete');
      setNotice('ပြီးပါပြီ။ မြန်မာ voice နဲ့ စာတန်းထိုးပါပြီးသား result ကို ပြင်ဆင်ထားပါတယ်။');
      setStep('result');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Video generation မအောင်မြင်ပါ။';
      setGenerationStage('error');
      setNotice(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]"><section className="min-w-0"><div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Studio / Auto Recap</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Turn a clip into a story</h1><p className="mt-2 max-w-xl text-sm text-slate-500">Upload a clip or paste a social video link, then create a Burmese movie recap with captions and narration.</p></div><div className="hidden rounded-2xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-right sm:block"><p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Mode</p><p className="text-sm font-bold text-indigo-900">{mode === 'subtitle' ? 'Subtitle Mode' : mode === 'pro' ? 'Pro AI Recap' : 'AI Recap'}</p></div></div><StudioUpload onSource={(source) => { setVideoSource(source); setNotice('Video ready. Start render နှိပ်လိုက်ရင် မြန်မာ voice နဲ့ စာတန်းထိုးကို တစ်ခါတည်း ပြုလုပ်ပါမယ်။'); }} /><div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"><div className="flex flex-wrap items-center gap-2 text-xs text-slate-500"><span className="rounded-lg bg-slate-100 px-2 py-1">{ratio === 'original' ? 'Original ratio' : ratio}</span><span className="rounded-lg bg-slate-100 px-2 py-1">{languageLabels[language]}</span><span className={`rounded-lg px-2 py-1 ${videoSource ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100'}`}>{videoSource ? <><Check className="mr-1 inline h-3 w-3" />Video ready</> : 'No video selected'}</span></div><Button size="lg" onClick={startRender} disabled={isGenerating}>{isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" />Processing...</> : <><Play className="h-4 w-4 fill-current" />Start render</>}</Button></div>{notice && <p className="mt-3 flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700">{isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}{notice}</p>}</section><ControlPanel mode={mode} setMode={setMode} ratio={ratio} setRatio={setRatio} language={language} setLanguage={setLanguage} mirror={mirror} setMirror={setMirror} zoom={zoom} setZoom={setZoom} sourceLanguage={sourceLanguage} setSourceLanguage={setSourceLanguage} /></div>;
}
function AppContent() {
  const [activeNav, setActiveNav] = useState<NavItem>('auto'); const [settingsOpen, setSettingsOpen] = useState(false); const [mobileOpen, setMobileOpen] = useState(false); const envConfig = getEnvConfig();
  const navItems: { id: NavItem; label: string; hint: string; icon: typeof LayoutDashboard }[] = [{ id: 'manual', label: 'Manual Editor', hint: 'Free · translate with Gemini', icon: SlidersHorizontal }, { id: 'auto', label: 'Auto Recap', hint: '1-Click Premium Auto Mode', icon: Sparkles }, { id: 'history', label: 'Job History', hint: 'Saved Videos', icon: History }, { id: 'usage', label: 'Usage', hint: 'Videos, minutes, credits', icon: WalletCards }];
  const selectNav = (id: NavItem) => { setActiveNav(id); setMobileOpen(false); };
  return <div className="min-h-screen bg-[#f6f7fb] text-slate-900"><SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} /><button className="fixed left-4 top-4 z-30 rounded-xl border border-slate-200 bg-white p-2 shadow-sm lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button><aside className={`fixed inset-y-0 left-0 z-20 w-72 transform border-r border-slate-200 bg-white p-4 transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}><div className="flex items-center gap-3 border-b border-slate-100 px-2 pb-5"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white"><Video className="h-5 w-5" /></div><div><p className="font-black tracking-tight">DeepClip</p><p className="text-[11px] text-slate-400">by DeepLearn AI</p></div></div><p className="px-2 pb-2 pt-7 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Navigation</p><nav className="space-y-1">{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => selectNav(item.id)} className={`flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition ${activeNav === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}><Icon className="mt-0.5 h-4 w-4 shrink-0" /><span><span className="block text-sm font-semibold">{item.label}</span><span className="block text-[11px] text-slate-400">{item.hint}</span></span></button>; })}</nav><button onClick={() => setSettingsOpen(true)} className="mt-2 flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left text-slate-700 hover:bg-slate-50"><Settings className="mt-0.5 h-4 w-4" /><span><span className="block text-sm font-semibold">Settings</span><span className="block text-[11px] text-slate-400">Defaults · Brand · API Keys</span></span></button><div className="absolute inset-x-4 bottom-4 space-y-3"><div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-center justify-between"><span className="text-xs text-slate-500">Credits left</span><Zap className="h-4 w-4 text-amber-500" /></div><p className="mt-1 text-2xl font-black">0</p><p className="text-[11px] text-slate-400">≈ 0 min of Auto video</p><button className="mt-3 w-full rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white">Upgrade</button></div><a href="https://t.me/+PqzaO-18Ks4xNWRl" target="_blank" rel="noreferrer" className="block text-center text-xs font-semibold text-indigo-600">Help / Support</a><div className="flex items-center gap-2 border-t border-slate-100 pt-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">K</div><div className="min-w-0"><p className="truncate text-xs font-semibold">Kyaw Zin Aung</p><p className="truncate text-[10px] text-slate-400">{envConfig.hasAiKey ? 'API ready' : 'Set up API keys'}</p></div><UserRound className="ml-auto h-4 w-4 text-slate-300" /></div></div></aside><main className="min-h-screen lg:pl-72"><header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur-md sm:px-8"><div className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4 text-indigo-600" /><span className="text-sm font-bold text-slate-700">{activeNav === 'auto' ? 'Auto Recap' : activeNav === 'manual' ? 'Manual Editor' : activeNav === 'history' ? 'Job History' : 'Usage'}</span></div><div className="flex items-center gap-2"><button className="hidden rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 sm:block"><BookOpen className="mr-1 inline h-3.5 w-3.5" />Docs</button><button onClick={() => setSettingsOpen(true)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><Settings className="h-4 w-4" /></button></div></header><div className="mx-auto max-w-[1480px] p-5 sm:p-8">{activeNav === 'auto' || activeNav === 'manual' ? <Dashboard /> : <section className="rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm"><Clock3 className="mx-auto h-10 w-10 text-indigo-500" /><h1 className="mt-4 text-2xl font-bold">{activeNav === 'history' ? 'Job History' : 'Usage'}</h1><p className="mx-auto mt-2 max-w-md text-sm text-slate-500">ဒီအပိုင်းကို login account data နဲ့ ချိတ်ဆက်ပြီး generated videos, render jobs နဲ့ usage credits တွေကို ပြသနိုင်အောင် နောက်တစ်ဆင့်မှာ ဆက်ချိတ်မယ်။</p></section>}</div></main></div>;
}

function App() { return <RecapProvider><AppContent /></RecapProvider>; }
export default App;
