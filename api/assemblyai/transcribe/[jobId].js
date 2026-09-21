const ASSEMBLY_BASE = 'https://api.assemblyai.com';

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

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = String(req.query.apiKey || '').trim();
  const jobId = String(req.query.jobId || req.query.id || '').trim();
  if (!apiKey || !jobId) return res.status(400).json({ error: 'API key or job ID is missing.' });
  try {
    const response = await fetch(`${ASSEMBLY_BASE}/v2/transcript/${encodeURIComponent(jobId)}`, {
      headers: { authorization: apiKey },
    });
    const result = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: result.error || 'AssemblyAI status request failed.' });
    if (result.status === 'completed') {
      let cues = wordsToCues(result.words || []);
      if (!cues.length && result.text) cues = [{ start: 0, end: 5, text: result.text }];
      return res.status(200).json({ status: 'completed', cues });
    }
    if (result.status === 'error') return res.status(422).json({ status: 'error', error: result.error || 'AssemblyAI transcription failed.' });
    return res.status(200).json({ status: result.status || 'processing' });
  } catch (error) {
    return res.status(502).json({ error: error instanceof Error ? error.message : 'AssemblyAI status proxy failed.' });
  }
}
