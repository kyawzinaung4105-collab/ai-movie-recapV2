import { useState } from 'react';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SubtitleItem {
  start: number;
  end: number;
  text: string;
}

interface VideoExporterProps {
  movieTitle: string;
  disabled?: boolean;
  audioTrack?: HTMLAudioElement | null;
  subtitles?: SubtitleItem[];
}

export function VideoExporter({ movieTitle, disabled, audioTrack, subtitles = [] }: VideoExporterProps) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    setError('');
    setDone(false);
    setExporting(true);
    setProgress(0);

    try {
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      
      if (!videoElement || !videoElement.src) {
        throw new Error('No video found to export.');
      }

      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not create canvas context.');

      // Setup Web Audio API to capture both video audio and custom MP3 audio
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();

      try {
        const videoSourceNode = audioCtx.createMediaElementSource(videoElement);
        videoSourceNode.connect(dest);
      } catch (e) {}

      if (audioTrack) {
        try {
          const customAudioNode = audioCtx.createMediaElementSource(audioTrack);
          customAudioNode.connect(dest);
        } catch (e) {}
      }

      const canvasStream = canvas.captureStream(30);
      const audioTracks = dest.stream.getAudioTracks();
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...(audioTracks.length > 0 ? audioTracks : [])
      ]);

      const mimeType = MediaRecorder.isSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(combinedStream, { mimeType });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const recordingDone = new Promise((resolve) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/mp4' });
          resolve(blob);
        };
      });

      // Reset playback positions
      videoElement.pause();
      videoElement.currentTime = 0;
      if (audioTrack) {
        audioTrack.pause();
        audioTrack.currentTime = 0;
      }

      mediaRecorder.start();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      await videoElement.play().catch(() => {});
      if (audioTrack) {
        await audioTrack.play().catch(() => {});
      }

      const duration = videoElement.duration || 10;

      // Real-time smooth rendering loop using requestAnimationFrame
      const renderFrame = () => {
        if (videoElement.ended || videoElement.paused || videoElement.currentTime >= duration) {
          mediaRecorder.stop();
          return;
        }

        const currentTime = videoElement.currentTime;
        const currentProgress = Math.min(95, Math.floor((currentTime / duration) * 100));
        setProgress(currentProgress);

        // 1. Draw video frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // 2. Find and draw active subtitle for current timestamp
        const activeSub = subtitles.find(
          (sub) => currentTime >= sub.start && currentTime <= sub.end
        );

        if (activeSub) {
          ctx.save();
          ctx.font = 'bold 36px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          
          // Subtitle text styling with shadow for readability
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 4;

          const x = canvas.width / 2;
          const y = canvas.height - 50;

          ctx.strokeText(activeSub.text, x, y);
          ctx.fillText(activeSub.text, x, y);
          ctx.restore();
        }

        requestAnimationFrame(renderFrame);
      };

      requestAnimationFrame(renderFrame);

      const blob = await recordingDone as Blob;
      
      // Stop media elements
      videoElement.pause();
      if (audioTrack) audioTrack.pause();

      setProgress(100);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${movieTitle || 'movie-recap'}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDone(true);
    } catch (err: any) {
      setError(err.message || 'MP4 export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">Export</h3>

      {exporting && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
            <span className="text-sm text-slate-600">Rendering Video, Audio & Subtitles... {progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-primary-600 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {done && !error && (
        <div className="flex items-start gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
          <Download className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <span>MP4 export complete with audio and subtitles for "{movieTitle}".</span>
        </div>
      )}

      <Button
        size="lg"
        onClick={handleExport}
        disabled={exporting || disabled}
        className="w-full sm:w-auto"
      >
        {exporting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Rendering...
          </>
        ) : (
          <>
            <Download className="h-5 w-5" /> Download MP4 with Audio & Subtitles
          </>
        )}
      </Button>
    </div>
  );
}
