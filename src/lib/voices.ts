import type { VoiceOption } from '@/types';

export const MYANMAR_VOICES: VoiceOption[] = [
  { id: '21m00Tcm4TlvDq8ikWAM', label: 'Voice 1', language: 'myanmar', description: 'Female - Natural (Rachel)' },
  { id: 'AZnzlk1XvdvUeBnXmlld', label: 'Voice 2', language: 'myanmar', description: 'Male - Deep (Domi)' },
  { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Voice 3', language: 'myanmar', description: 'Female - Warm (Bella)' },
  { id: 'ErXwobaYiN019PkySvjV', label: 'Voice 4', language: 'myanmar', description: 'Male - Clear (Antoni)' },
];

export const ENGLISH_VOICES: VoiceOption[] = [
  { id: 'AZnzlk1XvdvUeBnXmlld', label: 'Voice 1', language: 'english', description: 'Male - Narrator' },
  { id: '21m00Tcm4TlvDq8ikWAM', label: 'Voice 2', language: 'english', description: 'Female - Natural' },
  { id: 'EXAVITQu4vr4xnSDxMaL', label: 'Voice 3', language: 'english', description: 'Female - Deep' },
  { id: 'ErXwobaYiN019PkySvjV', label: 'Voice 4', language: 'english', description: 'Female - Warm' },
];

export function getVoicesForLanguage(language: 'myanmar' | 'english'): VoiceOption[] {
  return language === 'myanmar' ? MYANMAR_VOICES : ENGLISH_VOICES;
}
