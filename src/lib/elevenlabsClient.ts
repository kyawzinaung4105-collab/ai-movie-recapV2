import { loadApiKeys } from './settingsStore';
import type { CaptionCue } from '@/types';

async function requestVoiceBlob(text: string, voiceId: string): Promise<Blob> {
  const keys = loadApiKeys();
  const apiKey = keys.elevenLabsKey;
  if (!apiKey) throw new Error('ElevenLabs API key is missing. Please add your key in settings.');

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': apiKey },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!response.ok) throw new Error('Failed to generate voiceover from ElevenLabs.');
  return response.blob();
}

export async function generateElevenLabsVoiceover(text: string, voiceId: string): Promise<string> {
  return URL.createObjectURL(await requestVoiceBlob(text, voiceId));
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const channels = buffer.numberOfChannels;
  const frameCount = buffer.length;
  const bytesPerSample = 2;
  const dataLength = frameCount * channels * bytesPerSample;
  const output = new ArrayBuffer(44 + dataLength);
  const view = new DataView(output);
  const writeString = (offset: number, value: string) => [...value].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
  const writeUint32 = (offset: number, value: number) => view.setUint32(offset, value, true);
  const writeUint16 = (offset: number, value: number) => view.setUint16(offset, value, true);

  writeString(0, 'RIFF'); writeUint32(4, 36 + dataLength); writeString(8, 'WAVE');
  writeString(12, 'fmt '); writeUint32(16, 16); writeUint16(20, 1); writeUint16(22, channels);
  writeUint32(24, buffer.sampleRate); writeUint32(28, buffer.sampleRate * channels * bytesPerSample);
  writeUint16(32, channels * bytesPerSample); writeUint16(34, 16); writeString(36, 'data'); writeUint32(40, dataLength);

  let offset = 44;
  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[frame]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([output], { type: 'audio/wav' });
}

export async function generateTimedElevenLabsVoiceover(
  cues: CaptionCue[],
  voiceId: string,
  onProgress?: (message: string) => void,
): Promise<string> {
  if (cues.length === 0) throw new Error('Burmese subtitle cues မရှိသေးပါ။');
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) throw new Error('ဒီ browser မှာ timed audio မပံ့ပိုးပါ။');
  const context = new AudioContextClass();
  const decoded: { cue: CaptionCue; buffer: AudioBuffer }[] = [];

  try {
    for (let index = 0; index < cues.length; index += 1) {
      onProgress?.(`Voice segment ${index + 1}/${cues.length} ပြုလုပ်နေပါတယ်...`);
      const blob = await requestVoiceBlob(cues[index].text, voiceId);
      const buffer = await context.decodeAudioData(await blob.arrayBuffer());
      decoded.push({ cue: cues[index], buffer });
    }
  } finally {
    await context.close();
  }

  const sampleRate = decoded[0].buffer.sampleRate;
  const endTime = Math.max(...decoded.map(({ cue, buffer }) => cue.end + Math.min(buffer.duration, Math.max(0.2, cue.end - cue.start))));
  const offline = new OfflineAudioContext(2, Math.ceil((endTime + 0.25) * sampleRate), sampleRate);
  for (const { cue, buffer } of decoded) {
    const source = offline.createBufferSource();
    source.buffer = buffer;
    const slotDuration = Math.max(0.2, cue.end - cue.start);
    source.playbackRate.value = Math.max(0.5, Math.min(3, buffer.duration / slotDuration));
    source.connect(offline.destination);
    source.start(Math.max(0, cue.start));
  }
  onProgress?.('Timestamp နဲ့ audio segments တွေကို စုစည်းနေပါတယ်...');
  const rendered = await offline.startRendering();
  return URL.createObjectURL(audioBufferToWav(rendered));
}
