import { useState, useEffect, useRef } from 'react';
import { Link2, AlertCircle, Youtube, Music2, BookOpen } from 'lucide-react';
import type { Platform, VideoSource } from '@/types';
import {
  detectPlatform,
  isValidVideoUrl,
  getEmbedUrl,
  getPlatformLabel,
  getPlatformColor,
  isTikTokShortLink,
} from '@/lib/platformDetector';
import { Button } from '@/components/ui/Button';

interface VideoLinkInputProps {
  onVideoLoaded: (source: VideoSource) => void;
}

export function VideoLinkInput({ onVideoLoaded }: VideoLinkInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadedSource, setLoadedSource] = useState<VideoSource | null>(null);
  const [tikTokShortUrl, setTikTokShortUrl] = useState<string | null>(null);
  const tiktokContainerRef = useRef<HTMLDivElement>(null);

  // Load TikTok embed script when a short link is detected
  useEffect(() => {
    if (!tikTokShortUrl || !tiktokContainerRef.current) return;

    const container = tiktokContainerRef.current;
    container.innerHTML = '';

    const blockquote = document.createElement('blockquote');
    blockquote.className = 'tiktok-embed';
    blockquote.setAttribute('cite', tikTokShortUrl);
    blockquote.style.maxWidth = '605px';
    blockquote.style.minWidth = '325px';
    container.appendChild(blockquote);

    // Remove any previously loaded TikTok embed scripts
    const existingScripts = document.querySelectorAll('script[src*="tiktok.com/embed.js"]');
    existingScripts.forEach((s) => s.remove());

    const script = document.createElement('script');
    script.src = 'https://www.tiktok.com/embed.js';
    script.async = true;
    container.appendChild(script);

    return () => {
      const scripts = document.querySelectorAll('script[src*="tiktok.com/embed.js"]');
      scripts.forEach((s) => s.remove());
    };
  }, [tikTokShortUrl]);

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setError('');
    setEmbedUrl(null);
    setLoadedSource(null);
    setTikTokShortUrl(null);
    if (!value.trim()) {
      setPlatform('unknown');
      return;
    }
    const detected = detectPlatform(value);
    setPlatform(detected);
  };

  const handleLoad = () => {
    setError('');
    setEmbedUrl(null);
    setLoadedSource(null);
    setTikTokShortUrl(null);

    if (!url.trim()) {
      setError('Please enter a video link.');
      return;
    }

    if (!isValidVideoUrl(url)) {
      setError('Invalid video link');
      return;
    }

    const detected = detectPlatform(url);
    if (detected === 'unknown') {
      setError('Please enter a valid YouTube, TikTok, or Rednote video link.');
      return;
    }

    setLoading(true);
    const embed = getEmbedUrl(url, detected);

    setTimeout(() => {
      setLoading(false);
      const source: VideoSource = {
        method: 'link',
        fileName: getPlatformLabel(detected) + ' Video',
        platform: detected,
        embedUrl: embed || undefined,
        isDirectFile: false,
      };
      setLoadedSource(source);
      onVideoLoaded(source);

      if (embed) {
        setEmbedUrl(embed);
      } else if (detected === 'tiktok' && isTikTokShortLink(url)) {
        // TikTok short link — use official embed script
        setTikTokShortUrl(url.trim());
      } else {
        setError('Video unavailable or cannot be accessed.');
      }
    }, 400);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl font-bold text-slate-900">Paste Video Link</h2>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="flex items-center gap-1"><Youtube className="h-4 w-4 text-red-600" /> YouTube</span>
        <span className="flex items-center gap-1"><Music2 className="h-4 w-4 text-pink-600" /> TikTok</span>
        <span className="flex items-center gap-1"><BookOpen className="h-4 w-4 text-orange-500" /> Rednote</span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
            placeholder="Paste YouTube / TikTok / Rednote URL"
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <Button onClick={handleLoad} disabled={loading || !url.trim()}>
          {loading ? 'Loading...' : 'Load'}
        </Button>
      </div>

      {platform !== 'unknown' && !error && !loadedSource && (
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm">
          <span className="text-slate-500">Detected:</span>
          <span className={`font-semibold ${getPlatformColor(platform)}`}>
            {getPlatformLabel(platform)}
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <div>
            <span>{error}</span>
            {loadedSource && !embedUrl && !tikTokShortUrl && (
              <p className="mt-1 text-amber-600">
                You can still proceed to recap — the video will be processed via a backend adapter.
              </p>
            )}
          </div>
        </div>
      )}

      {embedUrl && (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black aspect-video">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video Preview"
            />
          </div>
          {loadedSource && (
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <span className={`font-semibold ${getPlatformColor(platform)}`}>
                  {getPlatformLabel(platform)}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">Link loaded</span>
              </div>
            </div>
          )}
        </div>
      )}

      {tikTokShortUrl && (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 flex justify-center">
            <div ref={tiktokContainerRef} className="min-h-[400px] w-full flex justify-center" />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <span className={`font-semibold ${getPlatformColor(platform)}`}>
                {getPlatformLabel(platform)}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">Short link loaded</span>
            </div>
          </div>
        </div>
      )}

      {loadedSource && !embedUrl && !tikTokShortUrl && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          This video cannot be embedded in-browser, but you can still proceed to recap. A backend video-processing adapter will handle the actual video processing.
        </div>
      )}
    </div>
  );
}
