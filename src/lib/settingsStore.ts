export type AiProvider = 'gemini' | 'openai' | 'custom';

export interface ApiKeys {
  aiKey: string;
  aiProvider: AiProvider;
  aiBaseUrl: string;
  aiModel: string;
  elevenLabsKey: string;
  ffmpegBackendUrl: string;
}

const STORAGE_KEY = 'ai_movie_recap_keys';

export function loadApiKeys(): ApiKeys {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const key = parsed.aiKey || parsed.geminiKey || parsed.openAIKey || '';
      let provider: AiProvider = parsed.aiProvider;
      if (!provider) {
        if (key.startsWith('AIza') || key.startsWith('AQ.')) provider = 'gemini';
        else if (key.startsWith('sk-')) provider = 'openai';
        else provider = 'custom';
      }
      return {
        aiKey: key,
        aiProvider: provider,
        aiBaseUrl: parsed.aiBaseUrl || parsed.apiBaseUrl || '',
        aiModel: parsed.aiModel || (provider === 'gemini' ? 'gemini-3.6-flash' : 'gpt-4o-mini'),
        elevenLabsKey: parsed.elevenLabsKey || '',
        ffmpegBackendUrl: parsed.ffmpegBackendUrl || '',
      };
    }
  } catch {
    // default fallback
  }
  return {
    aiKey: '',
    aiProvider: 'gemini',
    aiBaseUrl: '',
    aiModel: 'gemini-3.6-flash',
    elevenLabsKey: '',
    ffmpegBackendUrl: '',
  };
}

export function saveApiKeys(keys: ApiKeys): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function isGeminiProvider(keys: ApiKeys): boolean {
  return keys.aiProvider === 'gemini';
}

export function getMissingConfig(): string[] {
  const keys = loadApiKeys();
  const missing: string[] = [];
  if (!keys.aiKey) {
    missing.push('AI API Key (Gemini / OpenAI / Custom)');
  }
  if (!keys.elevenLabsKey) {
    missing.push('ElevenLabs API Key');
  }
  return missing;
}
