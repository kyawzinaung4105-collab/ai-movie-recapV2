import { normalizeApiKey, type ApiKeys } from './settingsStore';

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
    if (/api key not valid|invalid api key|incorrect api key|unauthorized/i.test(detail)) {
      throw new Error('The provider rejected this value. Check that the selected provider matches this key and paste only the key text, without a provider name or Bearer prefix.');
    }
    throw new Error(`${response.status}: ${detail}`);
  }
}

export async function testApiKey(kind: ApiKeyKind, keys: ApiKeys): Promise<string> {
  const assemblyKey = normalizeApiKey(keys.assemblyAiKey);
  const aiKey = normalizeApiKey(keys.aiKey);
  const elevenKey = normalizeApiKey(keys.elevenLabsKey);
  if (kind === 'assembly') {
    if (!assemblyKey) throw new Error('Enter an AssemblyAI API key first.');
    await check(await fetch('https://api.assemblyai.com/v2/user', { headers: { authorization: assemblyKey } }));
    return 'AssemblyAI key is valid.';
  }

  if (kind === 'eleven') {
    if (!elevenKey) throw new Error('Enter an ElevenLabs API key first.');
    await check(await fetch('https://api.elevenlabs.io/v1/user', { headers: { 'xi-api-key': elevenKey } }));
    return 'ElevenLabs key is valid.';
  }

  if (!aiKey) throw new Error('Enter an AI API key first.');
  if (keys.aiProvider === 'gemini') {
    await check(await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(aiKey)}`));
    return 'Gemini key is valid and available in this region.';
  }

  const baseUrl = (keys.aiBaseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
  await check(await fetch(`${baseUrl}/models`, { headers: { authorization: `Bearer ${aiKey}` } }));
  return `${keys.aiProvider === 'custom' ? 'Custom AI' : 'OpenAI'} key is valid.`;
}
