import { loadApiKeys } from './settingsStore';

export async function generateElevenLabsVoiceover(
  text: string,
  voiceId: string
): Promise<string> {
  const keys = loadApiKeys();
  const apiKey = keys.elevenLabsKey;

  if (!apiKey) {
    throw new Error('ElevenLabs API key is missing. Please add your key in settings.');
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to generate voiceover from ElevenLabs.');
  }

  const audioBlob = await response.blob();
  return URL.createObjectURL(audioBlob);
}
