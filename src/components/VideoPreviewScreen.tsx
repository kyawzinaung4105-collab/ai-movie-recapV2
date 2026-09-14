import { ArrowLeft, ArrowRight, Youtube, Music2, BookOpen, Film } from 'lucide-react';
import type { Platform, VideoSource } from '@/types';
import { getPlatformLabel } from '@/lib/platformDetector';
import { formatDuration } from '@/lib/env';
import { Button } from '@/components/ui/Button';

interface VideoPreviewScreenProps {
  videoSource: VideoSource;
  onContinue: () => void;
  onBack: () => void;
}

function PlatformIcon({ platform }: { platform?: Platform }) {
  if (platform === 'youtube') return <Youtube className="h-4 w-4 text-red-600" />;
  if (platform === 'tiktok') return <Music2 className="h-4 w-4 text-pink-600" />;
  if (platform === 'rednote') return <BookOpen className="h-4 w-4 text-orange-500" />;
  return <Film className="h-4 w-4 text-slate-500" />;
}

export function VideoPreviewScreen({ videoSource, onContinue, onBack }: VideoPreviewScreenProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold text-slate-900">Video Preview</h2>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
        {videoSource.isDirectFile ? (
          <video
            src={videoSource.objectUrl}
            controls
            className="w-full max-h-[450px]"
          />
        ) : (
          <div className="aspect-video">
            <iframe
              src={videoSource.embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video Preview"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-400">File / Title</p>
          <p className="text-sm font-medium text-slate-700 truncate">{videoSource.fileName}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-400">Platform</p>
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <PlatformIcon platform={videoSource.platform} />
            {videoSource.platform ? getPlatformLabel(videoSource.platform) : 'Local File'}
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-400">Duration</p>
          <p className="text-sm font-medium text-slate-700">
            {videoSource.duration ? formatDuration(videoSource.duration) : '—'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button size="lg" onClick={onContinue}>
          Continue to Recap <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
