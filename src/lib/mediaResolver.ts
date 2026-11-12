import type { Platform, VideoSource } from '@/types';
import { loadApiKeys } from './settingsStore';

export interface ResolvedMedia {
  mediaUrl: string;
  fileName: string;
  mimeType: string;
  platform: Platform;
}

function resolverUrl(): string {
  const configured = loadApiKeys().mediaResolverUrl.trim();
  if (!configured) {
    throw new Error('Link processing backend is not configured. Open Settings and add the Media Resolver URL.');
  }
  return configured.replace(/\/$/, '');
}

export async function resolveVideoLink(sourceUrl: string, platform: Platform): Promise<ResolvedMedia> {
  const response = await fetch(`${resolverUrl()}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: sourceUrl, platform }),
  });

  const body = await response.text();
  let payload: Partial<ResolvedMedia> & { error?: string } = {};
  try {
    payload = JSON.parse(body) as typeof payload;
  } catch {
    // Keep the status-based error below for non-JSON backend responses.
  }

  if (!response.ok || !payload.mediaUrl) {
    throw new Error(payload.error || `The ${platform} link could not be resolved by the media backend (${response.status}).`);
  }

  return {
    mediaUrl: payload.mediaUrl,
    fileName: payload.fileName || `${platform}-video.mp4`,
    mimeType: payload.mimeType || 'video/mp4',
    platform,
  };
}

export async function resolveSourceMedia(source: VideoSource): Promise<File> {
  if (source.file) return source.file;
  if (!source.sourceUrl || !source.platform || source.platform === 'unknown') {
    throw new Error('A valid video link is required.');
  }

  const resolved = source.resolvedMediaUrl
    ? { mediaUrl: source.resolvedMediaUrl, fileName: source.fileName, mimeType: 'video/mp4', platform: source.platform }
    : await resolveVideoLink(source.sourceUrl, source.platform);

  const response = await fetch(resolved.mediaUrl);
  if (!response.ok) throw new Error('The media backend resolved the link, but the video file could not be downloaded.');
  const blob = await response.blob();
  if (!blob.size) throw new Error('The media backend returned an empty video file.');
  return new File([blob], resolved.fileName, { type: blob.type || resolved.mimeType });
}
