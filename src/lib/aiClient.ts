import { loadApiKeys, isGeminiProvider, type ApiKeys, type AiProvider } from './settingsStore';

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranslationResult {
  translatedText: string;
  segments: TranscriptSegment[];
  movieTitle: string;
  titleConfident: boolean;
}

function getKeys(): ApiKeys {
  return loadApiKeys();
}

function getModel(keys: ApiKeys): string {
  if (keys.aiModel) return keys.aiModel;
  return isGeminiProvider(keys) ? 'gemini-3.6-flash' : 'gpt-4o-mini';
}

function getBaseUrl(keys: ApiKeys): string {
  if (keys.aiBaseUrl) return keys.aiBaseUrl;
  if (isGeminiProvider(keys)) return 'https://generativelanguage.googleapis.com/v1beta';
  return 'https://api.openai.com/v1';
}

// ---- Gemini native API ----

async function geminiGenerate(
  keys: ApiKeys,
  prompt: string,
  systemInstruction?: string,
  videoBase64?: { mimeType: string; data: string }
): Promise<string> {
  const model = getModel(keys);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keys.aiKey}`;

  const parts: any[] = [{ text: prompt }];
  if (videoBase64) {
    parts.unshift({
      inlineData: { mimeType: videoBase64.mimeType, data: videoBase64.data },
    });
  }

  const body: any = {
    contents: [{ role: 'user', parts }],
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ---- OpenAI-compatible API ----

async function openaiChat(
  keys: ApiKeys,
  prompt: string,
  systemPrompt?: string,
  videoBase64?: { mimeType: string; data: string }
): Promise<string> {
  const baseUrl = getBaseUrl(keys);
  const model = getModel(keys);
  const url = `${baseUrl}/chat/completions`;

  const messages: any[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  if (videoBase64) {
    messages.push({
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: `data:${videoBase64.mimeType};base64,${videoBase64.data}`,
          },
        },
        { type: 'text', text: prompt },
      ],
    });
  } else {
    messages.push({ role: 'user', content: prompt });
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${keys.aiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature: 0.3 }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ---- Unified entry point ----

async function aiGenerate(
  prompt: string,
  systemInstruction?: string,
  videoBase64?: { mimeType: string; data: string }
): Promise<string> {
  const keys = getKeys();
  if (!keys.aiKey) {
    throw new Error('AI API key is missing. Please add your key in settings.');
  }
  if (isGeminiProvider(keys)) {
    return geminiGenerate(keys, prompt, systemInstruction, videoBase64);
  }
  return openaiChat(keys, prompt, systemInstruction, videoBase64);
}

// ---- Public API ----

export async function analyzeVideoAndGenerateScript(
  videoBase64: { mimeType: string; data: string },
  language: 'myanmar' | 'english'
): Promise<TranslationResult> {
  const systemPrompt =
    'You are a professional video analyst and translator. ' +
    'You analyze football video content, identify the match, teams, competition or news topic, ' +
    'transcribe the dialogue, and translate it into natural ' +
    (language === 'myanmar' ? 'Burmese (Myanmar) language' : 'English') +
    '. You return results as JSON only.';

  const prompt = `Analyze this video and provide:
1. A concise movie recap headline or match title (best guess)
2. A complete transcription of all dialogue/voiceover
3. A ${language === 'myanmar' ? 'Burmese' : 'English'} translation of the dialogue

Return ONLY valid JSON in this exact format:
{
  "movieTitle": "the movie recap headline",
  "titleConfident": true,
  "segments": [
    { "start": 0.0, "end": 5.0, "text": "translated dialogue segment" },
    { "start": 5.0, "end": 10.0, "text": "another segment" }
  ]
}

Rules:
- Each segment should be 3-8 seconds long
- "text" must be the ${language === 'myanmar' ? 'Burmese' : 'English'} translation
- Use natural, fluent ${language === 'myanmar' ? 'Burmese' : 'English'}
- Cover the entire video duration
- If you cannot identify the match or news topic, use "Football News" and set titleConfident to false`;

  const raw = await aiGenerate(prompt, systemPrompt, videoBase64);

  let parsed: any;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch {
    throw new Error('Failed to parse AI response. Please try again.');
  }

  return {
    translatedText: (parsed.segments || []).map((s: TranscriptSegment) => s.text).join(' '),
    segments: (parsed.segments || []).map((s: any, i: number) => ({
      start: Number(s.start) || i * 5,
      end: Number(s.end) || (i + 1) * 5,
      text: String(s.text || ''),
    })),
    movieTitle: String(parsed.movieTitle || 'Football News'),
    titleConfident: Boolean(parsed.titleConfident),
  };
}

export async function translateText(
  text: string,
  language: 'myanmar' | 'english'
): Promise<string> {
  const systemPrompt =
    'You are a professional translator. Translate the given text into natural ' +
    (language === 'myanmar' ? 'Burmese (Myanmar language)' : 'English') +
    '. Return only the translation.';

  return aiGenerate(text, systemPrompt);
}

export async function detectMovieTitle(
  videoBase64: { mimeType: string; data: string }
): Promise<{ title: string; confident: boolean }> {
  const prompt =
    'What football match, teams, competition, or news topic is shown in this video? Return ONLY JSON: {"title": "the title", "confident": true/false}';

  const raw = await aiGenerate(prompt, undefined, videoBase64);

  try {
    const jsonMatch = raw.match(/\{[\s\S]*}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    return {
      title: String(parsed.title || 'Football News'),
      confident: Boolean(parsed.confident),
    };
  } catch {
    return { title: 'Football News', confident: false };
  }
}
