import Busboy from 'busboy';

const ASSEMBLY_BASE = 'https://api.assemblyai.com';

async function assemblyRequest(path, apiKey, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('authorization', apiKey);
  const response = await fetch(`${ASSEMBLY_BASE}${path}`, { ...init, headers });
  if (!response.ok) {
    const text = await response.text();
    let detail = text;
    try { detail = JSON.parse(text).error || text; } catch { /* keep text */ }
    throw new Error(`AssemblyAI error ${response.status}: ${detail}`);
  }
  return response;
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const fields = {};
    const chunks = [];
    let fileName = 'video.mp4';
    let fileType = 'video/mp4';
    const busboy = Busboy({ headers: req.headers });
    busboy.on('field', (name, value) => { fields[name] = value; });
    busboy.on('file', (_name, stream, info) => {
      fileName = info.filename || fileName;
      fileType = info.mimeType || fileType;
      stream.on('data', (chunk) => chunks.push(chunk));
    });
    busboy.on('error', reject);
    busboy.on('finish', () => resolve({ fields, buffer: Buffer.concat(chunks), fileName, fileType }));
    req.pipe(busboy);
  });
}

function wordsToCues(words = []) {
  const cues = [];
  let current = [];
  const flush = () => {
    if (!current.length) return;
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
    if (/[.!?။！？]$/.test(word.text) || current.length >= 30) flush();
  }
  flush();
  return cues;
}

export const config = { api: { bodyParser: false, responseLimit: '10mb' } };

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { fields, buffer, fileType } = await parseMultipart(req);
    const apiKey = String(fields.apiKey || '').trim();
    if (!apiKey) return res.status(400).json({ error: 'AssemblyAI API key is missing.' });
    if (!buffer.length) return res.status(400).json({ error: 'Video file is missing.' });

    const upload = await assemblyRequest('/v2/upload', apiKey, {
      method: 'POST',
      headers: { 'content-type': fileType },
      body: buffer,
    });
    const { upload_url: uploadUrl } = await upload.json();
    if (!uploadUrl) throw new Error('AssemblyAI upload URL မရပါ။');

    const created = await assemblyRequest('/v2/transcript', apiKey, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ audio_url: uploadUrl, language_code: 'en', punctuate: true, format_text: true }),
    });
    const transcript = await created.json();
    if (!transcript.id) throw new Error('AssemblyAI transcript ID မရပါ။');
    return res.status(202).json({ jobId: transcript.id });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : 'AssemblyAI proxy failed.' });
  }
}
