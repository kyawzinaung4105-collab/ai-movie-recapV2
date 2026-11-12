import type { ApiKeys } from './settingsStore';

export type ApiKeyKind = 'assembly' | 'ai' | 'eleven';

async function getError(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text) as { error?: { message?: string } | string; detail?: string; message?: string };
    if (typeof parsed.error === 'string') return parsed.error;
    if (parsed.error && typeof parsed.error === 'object') return parsed.error.message || 'Provider rejected the request.';
    return parsed.message || parsed.detail || text || response.statusText;
  } catch {
    return text || response.statusText;
  }
}

async function check(response: Response): Promise<void> {
  if (!response.ok) {
    const detail = await getError(response);
    if (/user location|location is not supported|not supported for the api/i.test(detail)) {
      throw new Error('This Gemini API key is not available in the current region.');
    }
    throw new Error(`${response.status}: ${detail}`);
  }
}

export async function testApiKey(kind: ApiKeyKind, keys: ApiKeys): Promise<string> {
  if (kind === 'assembly') {
    if (!keys.assemblyAiKey.trim()) throw new Error('Enter an AssemblyAI API key first.');
    await check(await fetch('https://api.assemblyai.com/v2/user', { headers: { authorization: keys.assemblyAiKey.trim() } }));
    return 'AssemblyAI key is valid.';
  }

  if (kind === 'eleven') {
    if (!keys.elevenLabsKey.trim()) throw new Error('Enter an ElevenLabs API key first.');
    await check(await fetch('https://api.elevenlabs.io/v1/user', { headers: { 'xi-api-key': keys.elevenLabsKey.trim() } }));
    return 'ElevenLabs key is valid.';
  }

  if (!keys.aiKey.trim()) throw new Error('Enter an AI API key first.');
  if (keys.aiProvider === 'gemini') {
    await check(await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(keys.aiKey.trim())}`));
    return 'Gemini key is valid and available in this region.';
  }

  const baseUrl = (keys.aiBaseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
  await check(await fetch(`${baseUrl}/models`, { headers: { authorization: `Bearer ${keys.aiKey.trim()}` } }));
  return `${keys.aiProvider === 'custom' ? 'Custom AI' : 'OpenAI'} key is valid.`;
}
