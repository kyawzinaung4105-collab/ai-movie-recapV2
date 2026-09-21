import { loadApiKeys } from './settingsStore';
import type { CaptionCue } from '@/types';

interface AssemblyWord {
  text?: string;
  start?: number;
  end?: number;
}

interface AssemblyTranscript {
  id?: string;
  status?: 'queued' | 'processing' | 'completed' | 'error';
  error?: string;
  text?: string;
  words?: AssemblyWord[];
}

async function readError(response: Response): Promise<string> {
  const body = await response.text();
  try {
    const parsed = JSON.parse(body) as { error?: string };
    return parsed.error || body;
  } catch {
    return body || response.statusText;
  }
}

async function assemblyFetch(path: string, init: RequestInit, apiKey: string): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`https://api.assemblyai.com${path}`, {
      ...init,
      headers: {
        authorization: apiKey,
        ...(init.headers || {}),
      },
    });
  } catch {
    throw new Error(`AssemblyAI ကို ဆက်သွယ်မရပါ (${path})။ Internet, API key, သို့မဟုတ် browser CORS ပြဿနာ ဖြစ်နိုင်ပါတယ်။`);
  }
  if (!response.ok) throw new Error(`AssemblyAI error ${response.status}: ${await readError(response)}`);
  return response;
}

function wordsToCues(words: AssemblyWord[]): CaptionCue[] {
  const cues: CaptionCue[] = [];
  let current: AssemblyWord[] = [];
  const flush = () => {
    if (current.length === 0) return;
    const first = current[0];
    const last = current[current.length - 1];
    const text = current.map((word) => word.text || '').join(' ').trim();
    if (text && first.start != null && last.end != null) {
      cues.push({ start: first.start / 1000, end: last.end / 1000, text });
    }
    current = [];
  };

  for (const word of words) {
    if (!word.text || word.start == null || word.end == null) continue;
    current.push(word);
    const wordCount = current.length;
    // Prefer punctuation boundaries so Burmese translation receives complete thoughts.
    // Keep a high safety limit only for transcripts that contain no punctuation at all.
    if (/[.!?။！？]$/.test(word.text) || wordCount >= 30) flush();
  }
  flush();
  return cues;
}

async function transcribeDirectly(videoUrl: string, onStatus?: (message: string) => void): Promise<CaptionCue[]> {
  const apiKey = loadApiKeys().assemblyAiKey;
  if (!apiKey) throw new Error('AssemblyAI API Key မရှိသေးပါ။ Settings မှာ key ထည့်ပါ။');

  onStatus?.('Uploading video audio to AssemblyAI...');
  let media: Response;
  try {
    media = await fetch(videoUrl);
  } catch {
    throw new Error('Video file ကို browser မှ ဖတ်မရပါ။ Video ကို ပြန်ရွေးပြီး Transcribe ကို ထပ်နှိပ်ပါ။');
  }
  if (!media.ok) throw new Error('Uploaded video ကို ဖတ်မရပါ။');
  const upload = await assemblyFetch('/v2/upload', { method: 'POST', body: await media.blob() }, apiKey);
  const { upload_url: uploadUrl } = await upload.json() as { upload_url?: string };
  if (!uploadUrl) throw new Error('AssemblyAI upload URL မရပါ။');

  onStatus?.('AssemblyAI is transcribing English speech...');
  const create = await assemblyFetch('/v2/transcript', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ audio_url: uploadUrl, language_code: 'en', punctuate: true, format_text: true }),
  }, apiKey);
  const created = await create.json() as AssemblyTranscript;
  if (!created.id) throw new Error('AssemblyAI transcript ID မရပါ။');

  for (let attempt = 0; attempt < 120; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 2500));
    const poll = await assemblyFetch(`/v2/transcript/${created.id}`, { method: 'GET' }, apiKey);
    const result = await poll.json() as AssemblyTranscript;
    if (result.status === 'completed') {
      const cues = wordsToCues(result.words || []);
      if (cues.length > 0) return cues;
      if (result.text) return [{ start: 0, end: 5, text: result.text }];
      throw new Error('AssemblyAI transcript ထဲမှာ စာသားမရှိပါ။');
    }
    if (result.status === 'error') throw new Error(result.error || 'AssemblyAI transcription failed.');
    onStatus?.(`Transcribing... ${Math.round(((attempt + 1) / 120) * 100)}%`);
  }
  throw new Error('AssemblyAI transcription timeout ဖြစ်သွားပါတယ်။');
}

async function transcribeThroughLocalProxy(videoUrl: string, apiKey: string, onStatus?: (message: string) => void): Promise<CaptionCue[]> {
  onStatus?.('Online AssemblyAI proxy ကို စမ်းနေပါတယ်...');
  const media = await fetch(videoUrl);
  if (!media.ok) throw new Error('Video file ကို online proxy ဆီပို့မရပါ။');
  const form = new FormData();
  form.append('apiKey', apiKey);
  form.append('video', await media.blob(), 'video.mp4');
  const onlineProxy = 'https://3000-iarmrhy4pa7v7i6d86j2f-8f72b23c.us4.manus.computer/api/assemblyai/transcribe';
  const response = await fetch(onlineProxy, { method: 'POST', body: form });
  const payload = await response.json() as { cues?: CaptionCue[]; error?: string };
  if (!response.ok || !payload.cues) throw new Error(payload.error || 'Online AssemblyAI proxy မရပါ။');
  return payload.cues;
}

export async function transcribeVideoWithAssemblyAI(videoUrl: string, onStatus?: (message: string) => void): Promise<CaptionCue[]> {
  try {
    return await transcribeDirectly(videoUrl, onStatus);
  } catch (directError) {
    try {
      const apiKey = loadApiKeys().assemblyAiKey;
      return await transcribeThroughLocalProxy(videoUrl, apiKey, onStatus);
    } catch (proxyError) {
      const directMessage = directError instanceof Error ? directError.message : 'AssemblyAI direct request failed.';
      const proxyMessage = proxyError instanceof Error ? proxyError.message : 'Local proxy is not running.';
      throw new Error(`${directMessage}\n\nOnline proxy fallback: ${proxyMessage}`);
    }
  }
}
