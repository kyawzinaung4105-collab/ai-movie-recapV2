import { loadApiKeys, getMissingConfig } from './settingsStore';
import type { EnvConfig } from '@/types';

export function getEnvConfig(): EnvConfig {
  const keys = loadApiKeys();
  return {
    hasAiKey: Boolean(keys.aiKey),
    hasAssemblyAiKey: Boolean(keys.assemblyAiKey),
    hasElevenLabsKey: Boolean(keys.elevenLabsKey),
    hasFFmpegBackend: Boolean(keys.ffmpegBackendUrl),
    missing: getMissingConfig(),
  };
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
