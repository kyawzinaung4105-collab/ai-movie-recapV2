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
  const response = await fetch(`https://api.assemblyai.com${path}`, {
    ...init,
    headers: {
      authorization: apiKey,
      ...(init.headers || {}),
    },
  });
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
    if (/[.!?]$/.test(word.text) || wordCount >= 12) flush();
  }
  flush();
  return cues;
}

export async function transcribeVideoWithAssemblyAI(videoUrl: string, onStatus?: (message: string) => void): Promise<CaptionCue[]> {
  const apiKey = loadApiKeys().assemblyAiKey;
  if (!apiKey) throw new Error('AssemblyAI API Key မရှိသေးပါ။ Settings မှာ key ထည့်ပါ။');

  onStatus?.('Uploading video audio to AssemblyAI...');
  const media = await fetch(videoUrl);
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
