import { useRef, useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { getActiveCaption } from '@/lib/captions';
import type { BlurSettings, CaptionCue, CaptionSettings, VideoSource, GenerationResult, LogoSettings } from '@/types';

interface FinalPreviewProps {
  videoSource: VideoSource;
  blurSettings: BlurSettings;
  captionSettings: CaptionSettings;
  movieTitle: string;
  generationResult?: GenerationResult | null;
  customAudioUrl?: string;
  customCues?: CaptionCue[];
  logoSettings: LogoSettings;
  onCaptionChange: (settings: CaptionSettings) => void;
  onLogoChange: (settings: LogoSettings) => void;
}

export function FinalPreview({ videoSource, blurSettings, captionSettings, movieTitle, generationResult, customAudioUrl, customCues, logoSettings, onCaptionChange, onLogoChange }: FinalPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);

  const effectiveAudioUrl = customAudioUrl || generationResult?.narrationUrl;
  const effectiveCues = (customCues && customCues.length > 0)
    ? customCues
    : (generationResult?.cues || captionSettings.cues);
  const activeCaption = getActiveCaption(effectiveCues, currentTime);
  const isEmbedded = !videoSource.isDirectFile;

  // For direct file: sync video time → audio + captions
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || isEmbedded) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handlePlay = () => audio?.play().catch(() => {});
    const handlePause = () => audio?.pause();
    const handleSeeking = () => {
      if (audio) audio.currentTime = video.currentTime;
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeking', handleSeeking);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeking', handleSeeking);
    };
  }, [effectiveAudioUrl, isEmbedded]);

  // For embedded videos: use audio's currentTime for caption sync
  useEffect(() => {
    if (!isEmbedded) return;
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setAudioPlaying(true);
    const handlePause = () => setAudioPlaying(false);
    const handleEnded = () => setAudioPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [effectiveAudioUrl, isEmbedded]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const toggleAudioPlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audioPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  };

  const toggleAudioMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setAudioMuted(audio.muted);
  };

  const captionAlignClass =
    captionSettings.style.alignment === 'left'
      ? 'text-left'
      : captionSettings.style.alignment === 'right'
      ? 'text-right'
      : 'text-center';

  const dragOverlay = (event: React.PointerEvent<HTMLElement>, kind: 'caption' | 'logo') => {
    if (event.type === 'pointermove' && event.buttons === 0) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(3, Math.min(97, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(3, Math.min(97, ((event.clientY - rect.top) / rect.height) * 100));
    if (kind === 'caption') onCaptionChange({ ...captionSettings, style: { ...captionSettings.style, x, y } });
    else onLogoChange({ ...logoSettings, x, y });
  };

  const renderVideo = useCallback(() => {
    if (videoSource.isDirectFile) {
      return (
        <>
          <video
            ref={videoRef}
            src={videoSource.objectUrl}
            controls
            muted
            className="w-full max-h-[450px]"
          />
          {effectiveAudioUrl && (
            <audio ref={audioRef} src={effectiveAudioUrl} preload="auto" />
          )}
        </>
      );
    }
    return (
      <>
        <div className="aspect-video">
          <iframe
            src={videoSource.embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Football News Preview"
          />
        </div>
        {effectiveAudioUrl && (
          <audio ref={audioRef} src={effectiveAudioUrl} preload="auto" />
        )}
      </>
    );
  }, [videoSource, effectiveAudioUrl]);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">Football News Preview</h3>

      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl border border-slate-200 bg-black"
      >
        {renderVideo()}

        {/* Blur overlay */}
        {blurSettings.enabled && dimensions.width > 0 && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${blurSettings.x * 100}%`,
              top: `${blurSettings.y * 100}%`,
              width: `${blurSettings.width * 100}%`,
              height: `${blurSettings.height * 100}%`,
              backdropFilter: `blur(${blurSettings.strength / 10}px)`,
              WebkitBackdropFilter: `blur(${blurSettings.strength / 10}px)`,
              background: 'rgba(0,0,0,0.1)',
            }}
          />
        )}

        {/* Caption overlay */}
        {(captionSettings.enabled || effectiveCues.length > 0) && activeCaption && (
          <div className="absolute inset-0 pointer-events-none">
            <p
              onPointerDown={(event) => dragOverlay(event, 'caption')}
              onPointerMove={(event) => dragOverlay(event, 'caption')}
              className={`absolute max-w-[92%] cursor-move pointer-events-auto px-3 py-1 ${captionAlignClass} ${captionSettings.style.template === 'box' || captionSettings.style.background ? 'rounded bg-black/70' : ''} ${captionSettings.style.template === 'highlight' ? 'rounded bg-amber-300/90' : ''} ${captionSettings.style.template === 'minimal' ? 'font-normal' : 'font-semibold'} ${
                    captionSettings.style.outline ? '[text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000]' : ''
                  }`}
              style={{ left: `${captionSettings.style.x}%`, top: `${captionSettings.style.y}%`, transform: 'translate(-50%, -50%)', fontSize: `${captionSettings.style.fontSize}px`, color: captionSettings.style.color }}
            >
              {activeCaption.text}
            </p>
          </div>
        )}

        {logoSettings.url && (
          <img
            src={logoSettings.url}
            alt="Channel logo"
            onPointerDown={(event) => dragOverlay(event, 'logo')}
            onPointerMove={(event) => dragOverlay(event, 'logo')}
            className="absolute cursor-move object-contain"
            style={{ left: `${logoSettings.x}%`, top: `${logoSettings.y}%`, width: `${logoSettings.size}%`, transform: 'translate(-50%, -50%)', opacity: logoSettings.opacity / 100 }}
          />
        )}

        {/* Title overlay */}
        {movieTitle && (
          <div className="absolute top-3 left-3 pointer-events-none">
            <span className="rounded-lg bg-black/60 px-3 py-1 text-xs font-medium text-white">
              {movieTitle}
            </span>
          </div>
        )}
      </div>

      {/* Custom audio controls for embedded videos */}
      {isEmbedded && effectiveAudioUrl && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <button
            onClick={toggleAudioPlay}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white transition-colors hover:bg-primary-700"
          >
            {audioPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-600">Narration Audio</p>
            <p className="text-xs text-slate-400">
              {audioPlaying ? 'Playing — captions sync to audio' : 'Press play to start narration'}
            </p>
          </div>
          <button
            onClick={toggleAudioMute}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
          >
            {audioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      )}

      {isEmbedded && !effectiveAudioUrl && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
          Upload narration audio below to sync custom audio and subtitles with this embedded video.
        </div>
      )}
    </div>
  );
}
