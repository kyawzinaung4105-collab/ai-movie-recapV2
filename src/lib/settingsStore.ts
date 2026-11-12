export type AiProvider = 'gemini' | 'openai' | 'custom';

export interface ApiKeys {
  aiKey: string;
  aiProvider: AiProvider;
  aiBaseUrl: string;
  aiModel: string;
  assemblyAiKey: string;
  elevenLabsKey: string;
  ffmpegBackendUrl: string;
  mediaResolverUrl: string;
}

const STORAGE_KEY = 'ai_movie_recap_keys';

export function normalizeApiKey(value: unknown): string {
  return String(value || '').trim().replace(/^['"]|['"]$/g, '').replace(/^Bearer\s+/i, '').trim();
}

export function loadApiKeys(): ApiKeys {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const key = normalizeApiKey(parsed.aiKey || parsed.geminiKey || parsed.openAIKey || '');
      let provider: AiProvider = parsed.aiProvider;
      if (!provider) {
        if (key.startsWith('AIza') || key.startsWith('AQ.')) provider = 'gemini';
        else if (key.startsWith('sk-')) provider = 'openai';
        else provider = 'custom';
      }
      return {
        aiKey: key,
        aiProvider: provider,
        aiBaseUrl: String(parsed.aiBaseUrl || parsed.apiBaseUrl || '').trim().replace(/\/$/, ''),
        aiModel: parsed.aiModel || (provider === 'gemini' ? 'gemini-3.6-flash' : 'gpt-4o-mini'),
        assemblyAiKey: normalizeApiKey(parsed.assemblyAiKey),
        elevenLabsKey: normalizeApiKey(parsed.elevenLabsKey),
        ffmpegBackendUrl: String(parsed.ffmpegBackendUrl || '').trim(),
        mediaResolverUrl: String(parsed.mediaResolverUrl || parsed.ffmpegBackendUrl || '').trim(),
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
    assemblyAiKey: '',
    elevenLabsKey: '',
    ffmpegBackendUrl: '',
    mediaResolverUrl: '',
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
  if (!keys.assemblyAiKey) {
    missing.push('AssemblyAI API Key (English transcript)');
  }
  if (!keys.elevenLabsKey) {
    // Voiceover is optional: without it, the source audio and translated subtitles still render.
  }
  return missing;
}
