import type { Platform } from '@/types';

interface PlatformMatch {
  platform: Platform;
  hosts: string[];
}

const PLATFORM_MATCHERS: PlatformMatch[] = [
  {
    platform: 'youtube',
    hosts: ['youtube.com', 'youtu.be', 'm.youtube.com', 'music.youtube.com'],
  },
  {
    platform: 'tiktok',
    hosts: ['tiktok.com', 'www.tiktok.com', 'm.tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'],
  },
  {
    platform: 'rednote',
    hosts: ['xiaohongshu.com', 'www.xiaohongshu.com', 'xhslink.com'],
  },
];

export function detectPlatform(url: string): Platform {
  if (!url) return 'unknown';
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase();
    for (const matcher of PLATFORM_MATCHERS) {
      if (matcher.hosts.some((h) => host === h || host.endsWith('.' + h))) {
        return matcher.platform;
      }
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

export function isValidVideoUrl(url: string): boolean {
  if (!url || !url.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase();

    // youtu.be/<id>
    if (host === 'youtu.be' || host.endsWith('.youtu.be')) {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      if (id && id.length >= 11) return `https://www.youtube.com/embed/${id.substring(0, 11)}?rel=0&modestbranding=1`;
    }

    // youtube.com/watch?v=<id>
    if (parsed.searchParams.get('v')) {
      const id = parsed.searchParams.get('v')!;
      if (id.length >= 11) return `https://www.youtube.com/embed/${id.substring(0, 11)}?rel=0&modestbranding=1`;
    }

    // youtube.com/embed/<id>, youtube.com/shorts/<id>, youtube.com/live/<id>
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 2) {
      const section = pathParts[0];
      const id = pathParts[1];
      if (['embed', 'shorts', 'live', 'v'].includes(section) && id && id.length >= 11) {
        return `https://www.youtube.com/embed/${id.substring(0, 11)}?rel=0&modestbranding=1`;
      }
    }

    // youtube.com/<id> (just the ID as path)
    if (pathParts.length === 1 && pathParts[0].length >= 11 && /^[a-zA-Z0-9_-]+$/.test(pathParts[0])) {
      return `https://www.youtube.com/embed/${pathParts[0].substring(0, 11)}?rel=0&modestbranding=1`;
    }

    return null;
  } catch {
    return null;
  }
}

export function getTikTokEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const pathParts = parsed.pathname.split('/').filter(Boolean);

    // tiktok.com/@user/video/<id> — extract numeric video ID for /embed/v2/
    if (pathParts.length >= 3) {
      for (let i = 0; i < pathParts.length; i++) {
        if (/^\d+$/.test(pathParts[i]) && pathParts[i].length >= 8) {
          return `https://www.tiktok.com/embed/v2/${pathParts[i]}`;
        }
      }
    }

    // tiktok.com/v/<id> or tiktok.com/t/<id> — numeric ID
    if (pathParts.length >= 2) {
      const section = pathParts[0];
      if (['v', 't', 'video'].includes(section)) {
        const id = pathParts[1];
        if (id && /^\d+$/.test(id) && id.length >= 8) {
          return `https://www.tiktok.com/embed/v2/${id}`;
        }
      }
    }

    // Short links (vm.tiktok.com/<code>) and other non-numeric URLs
    // cannot use /embed/v2/. Return null — the UI will use TikTok's
    // official embed script (blockquote approach) instead.
    return null;
  } catch {
    return null;
  }
}

export function isTikTokShortLink(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase();
    return (host.startsWith('vm.') || host.startsWith('vt.')) && host.includes('tiktok.com');
  } catch {
    return false;
  }
}

export function getRednoteEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase();
    if (host.includes('xiaohongshu.com') || host.includes('xhslink.com')) {
      return url.trim();
    }
  } catch {
    // ignore
  }
  return null;
}

export function getEmbedUrl(url: string, platform: Platform): string | null {
  switch (platform) {
    case 'youtube':
      return getYouTubeEmbedUrl(url);
    case 'tiktok':
      return getTikTokEmbedUrl(url);
    case 'rednote':
      return getRednoteEmbedUrl(url);
    default:
      return null;
  }
}

export function getPlatformLabel(platform: Platform): string {
  switch (platform) {
    case 'youtube':
      return 'YouTube';
    case 'tiktok':
      return 'TikTok';
    case 'rednote':
      return 'Rednote / Xiaohongshu';
    default:
      return 'Unknown';
  }
}

export function getPlatformColor(platform: Platform): string {
  switch (platform) {
    case 'youtube':
      return 'text-red-600';
    case 'tiktok':
      return 'text-pink-600';
    case 'rednote':
      return 'text-orange-500';
    default:
      return 'text-slate-500';
  }
}
