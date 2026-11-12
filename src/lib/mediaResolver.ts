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

function resolverEndpoints(): string[] {
  const base = resolverUrl().replace(/\/(?:api\/)?transcribe$/, '');
  return [`${base}/resolve`, `${base}/api/media/resolve`, `${base}/api/resolve`];
}

export async function resolveVideoLink(sourceUrl: string, platform: Platform): Promise<ResolvedMedia> {
  let lastStatus = 0;
  let lastError = '';
  for (const endpoint of resolverEndpoints()) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: sourceUrl, platform }),
    });
    lastStatus = response.status;
    const body = await response.text();
    let payload: Partial<ResolvedMedia> & { error?: string } = {};
    try {
      payload = JSON.parse(body) as typeof payload;
    } catch {
      lastError = body || response.statusText;
    }
    if (response.ok && payload.mediaUrl) {
      return {
        mediaUrl: new URL(payload.mediaUrl, resolverUrl()).toString(),
        fileName: payload.fileName || `${platform}-video.mp4`,
        mimeType: payload.mimeType || 'video/mp4',
        platform,
      };
    }
    lastError = payload.error || lastError;
    if (response.status !== 404) break;
  }
  throw new Error(lastError || `The media backend does not expose a resolver endpoint (${lastStatus}). Set Media Resolver URL to the service root.`);
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
