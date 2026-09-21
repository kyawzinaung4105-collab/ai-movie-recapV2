import { loadApiKeys } from './settingsStore';
import type { CaptionCue } from '@/types';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

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

async function extractAudioForTranscription(videoFile: File, onStatus?: (message: string) => void): Promise<File> {
  onStatus?.('Video ထဲက audio ကို ခွဲထုတ်နေပါတယ်...');
  const ffmpeg = new FFmpeg();
  const corePath = `${import.meta.env.BASE_URL}ffmpeg/ffmpeg-core`;
  await ffmpeg.load({ coreURL: `${corePath}.js`, wasmURL: `${corePath}.wasm` });
  await ffmpeg.writeFile('input.mp4', await fetchFile(videoFile));
  await ffmpeg.exec(['-i', 'input.mp4', '-vn', '-ac', '1', '-ar', '16000', '-b:a', '32k', 'speech.mp3']);
  const audio = await ffmpeg.readFile('speech.mp3');
  if (typeof audio === 'string') throw new Error('Audio track ကို ဖတ်မရပါ။');
  return new File([audio], 'speech.mp3', { type: 'audio/mpeg' });
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

async function transcribeDirectly(videoUrl: string | undefined, onStatus?: (message: string) => void, videoFile?: File): Promise<CaptionCue[]> {
  const apiKey = loadApiKeys().assemblyAiKey;
  if (!apiKey) throw new Error('AssemblyAI API Key မရှိသေးပါ။ Settings မှာ key ထည့်ပါ။');

  onStatus?.('Uploading video audio to AssemblyAI...');
  let mediaBody: Blob | File;
  if (videoFile) {
    mediaBody = await extractAudioForTranscription(videoFile, onStatus);
  } else {
    if (!videoUrl) throw new Error('Video source မတွေ့ပါ။ Video ကို ပြန်ရွေးပါ။');
    let media: Response;
    try {
      media = await fetch(videoUrl);
    } catch {
      throw new Error('Video file ကို browser မှ ဖတ်မရပါ။ Video ကို ပြန်ရွေးပြီး Transcribe ကို ထပ်နှိပ်ပါ။');
    }
    if (!media.ok) throw new Error('Uploaded video ကို ဖတ်မရပါ။');
    mediaBody = await media.blob();
  }
  onStatus?.('AssemblyAI upload connection ချိတ်နေပါတယ်...');
  const uploadController = new AbortController();
  const uploadTimeout = window.setTimeout(() => uploadController.abort(), 90000);
  let upload: Response;
  try {
    upload = await assemblyFetch('/v2/upload', { method: 'POST', body: mediaBody, signal: uploadController.signal }, apiKey);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('AssemblyAI direct upload အချိန်ကျော်သွားပါတယ်။ Proxy fallback သို့ ပြောင်းနေပါတယ်...');
    }
    throw error;
  } finally {
    window.clearTimeout(uploadTimeout);
  }
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

async function transcribeThroughLocalProxy(videoUrl: string | undefined, apiKey: string, onStatus?: (message: string) => void, videoFile?: File): Promise<CaptionCue[]> {
  onStatus?.('Video ကို AssemblyAI သို့ upload လုပ်နေပါတယ်...');
  const form = new FormData();
  form.append('apiKey', apiKey);
  if (videoFile) {
    form.append('video', videoFile, videoFile.name);
  } else {
    if (!videoUrl) throw new Error('Video source မတွေ့ပါ။ Video ကို ပြန်ရွေးပါ။');
    let media: Response;
    try {
      media = await fetch(videoUrl);
    } catch {
      throw new Error('Video file ကို browser မှ ဖတ်မရပါ။ Video ကို ပြန်ရွေးပြီး ထပ်စမ်းပါ။');
    }
    if (!media.ok) throw new Error('Video file ကို online proxy ဆီပို့မရပါ။');
    form.append('video', await media.blob(), 'video.mp4');
  }
  const onlineProxy = '/api/assemblyai/transcribe';
  const payload = await new Promise<{ cues?: CaptionCue[]; jobId?: string; error?: string }>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', onlineProxy);
    // Large videos can upload slowly on mobile networks; allow up to 10 minutes.
    request.timeout = 600000;
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onStatus?.(`Video ကို upload လုပ်နေပါတယ်... ${Math.round((event.loaded / event.total) * 100)}%`);
    };
    request.onerror = () => reject(new Error('Video upload မအောင်မြင်ပါ။ Internet connection ကို စစ်ပြီး ပြန်စမ်းပါ။'));
    request.ontimeout = () => reject(new Error('Video upload ၁၀ မိနစ်အတွင်း မပြီးပါ။ Video file ကို compress လုပ်ပြီး ပြန်စမ်းပါ။'));
    request.onload = () => {
      let result: { cues?: CaptionCue[]; jobId?: string; error?: string } = {};
      try { result = JSON.parse(request.responseText) as typeof result; } catch { /* handled below */ }
      if (request.status < 200 || request.status >= 300 || (!result.cues && !result.jobId)) {
        reject(new Error(result.error || `AssemblyAI proxy error (${request.status}).`));
        return;
      }
      resolve(result);
    };
    request.send(form);
  });
  if (payload.cues) return payload.cues;
  onStatus?.('AssemblyAI က audio ကို စစ်ဆေးနေပါတယ်... 0%');
  for (let attempt = 0; attempt < 120; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 2500));
    onStatus?.(`Transcribing... ${Math.min(99, Math.round(((attempt + 1) / 120) * 100))}%`);
    const statusResponse = await fetch(`${onlineProxy}/${payload.jobId}?apiKey=${encodeURIComponent(apiKey)}`);
    const status = await statusResponse.json() as { status?: string; cues?: CaptionCue[]; error?: string };
    if (status.status === 'completed' && status.cues) return status.cues;
    if (!statusResponse.ok) throw new Error(status.error || 'Online transcription failed.');
  }
  throw new Error('Online transcription timeout ဖြစ်သွားပါတယ်။');
}

export async function transcribeVideoWithAssemblyAI(videoUrl?: string, onStatus?: (message: string) => void, videoFile?: File): Promise<CaptionCue[]> {
  try {
    const apiKey = loadApiKeys().assemblyAiKey;
    if (!apiKey) throw new Error('AssemblyAI API Key မရှိသေးပါ။ Settings မှာ key ထည့်ပါ။');
    return await transcribeDirectly(videoUrl, onStatus, videoFile);
  } catch (directError) {
    try {
      const apiKey = loadApiKeys().assemblyAiKey;
      return await transcribeThroughLocalProxy(videoUrl, apiKey, onStatus, videoFile);
    } catch (proxyError) {
      const directMessage = directError instanceof Error ? directError.message : 'AssemblyAI direct request failed.';
      const proxyMessage = proxyError instanceof Error ? proxyError.message : 'AssemblyAI proxy request failed.';
      throw new Error(`${directMessage}\n\nProxy fallback: ${proxyMessage}`);
    }
  }
}
