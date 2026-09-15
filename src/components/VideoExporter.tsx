import { useState } from 'react';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SubtitleItem {
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

interface VideoExporterProps {
  movieTitle: string;
  disabled?: boolean;
  audioTrack?: HTMLAudioElement | null; // Custom background MP3 audio
  subtitles?: SubtitleItem[];          // Parsed SRT subtitle list
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
        throw new Error('No video element found to export.');
      }

      if (typeof MediaRecorder === 'undefined') {
        throw new Error('MediaRecorder is not supported in this browser.');
      }

      // Create hidden canvas for high-quality 720p rendering
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not create canvas context.');

      // Collect MediaStreams safely
      const tracks: MediaStreamTrack[] = [];

      // 1. Capture Canvas Video Stream
      const canvasStream = canvas.captureStream(30);
      if (canvasStream.getVideoTracks().length > 0) {
        tracks.push(canvasStream.getVideoTracks()[0]);
      }

      // 2. Capture Video Element Audio Stream directly if available
      try {
        const videoAny = videoElement as any;
        const videoAudioStream = typeof videoAny.captureStream === 'function' 
          ? videoAny.captureStream() 
          : typeof videoAny.mozCaptureStream === 'function' 
          ? videoAny.mozCaptureStream() 
          : null;

        if (videoAudioStream && videoAudioStream.getAudioTracks().length > 0) {
          tracks.push(videoAudioStream.getAudioTracks()[0]);
        }
      } catch (e) {
        console.warn('Could not capture video internal audio track:', e);
      }

      // 3. Capture Custom MP3 Audio Track if provided
      if (audioTrack) {
        try {
          const audioAny = audioTrack as any;
          const audioStream = typeof audioAny.captureStream === 'function'
            ? audioAny.captureStream()
            : typeof audioAny.mozCaptureStream === 'function'
            ? audioAny.mozCaptureStream()
            : null;

          if (audioStream && audioStream.getAudioTracks().length > 0) {
            tracks.push(audioStream.getAudioTracks()[0]);
          }
        } catch (e) {
          console.warn('Could not capture custom audio track:', e);
        }
      }

      const combinedStream = new MediaStream(tracks);

      // Select best supported MIME type for WebM/MP4 container
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(combinedStream, { mimeType });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const recordingDone = new Promise((resolve) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(blob);
        };
      });

      // Reset positions
      videoElement.pause();
      videoElement.currentTime = 0;
      if (audioTrack) {
        audioTrack.pause();
        audioTrack.currentTime = 0;
      }

      mediaRecorder.start();

      // Play media elements concurrently
      await videoElement.play().catch(() => {});
      if (audioTrack) {
        await audioTrack.play().catch(() => {});
      }

      const duration = videoElement.duration || 10;

      // Real-time rendering loop drawing video frames and matching SRT subtitles onto canvas
      const renderFrame = () => {
        if (videoElement.ended || videoElement.paused || videoElement.currentTime >= duration) {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
          return;
        }

        const currentTime = videoElement.currentTime;
        const currentProgress = Math.min(95, Math.floor((currentTime / duration) * 100));
        setProgress(currentProgress);

        // Draw current video frame onto canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Find active subtitle based on current video timestamp
        const activeSub = subtitles.find(
          (sub) => currentTime >= sub.start && currentTime <= sub.end
        );

        if (activeSub && activeSub.text) {
          ctx.save();
          ctx.font = 'bold 32px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          
          // Styling subtitle text with high contrast outline
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 5;

          const x = canvas.width / 2;
          const y = canvas.height - 60;

          // Support multi-line subtitles if any
          const lines = activeSub.text.split('\n');
          for (let i = lines.length - 1; i >= 0; i--) {
            const lineY = y - (lines.length - 1 - i) * 40;
            ctx.strokeText(lines[i], x, lineY);
            ctx.fillText(lines[i], x, lineY);
          }
          ctx.restore();
        }

        requestAnimationFrame(renderFrame);
      };

      requestAnimationFrame(renderFrame);

      const blob = await recordingDone as Blob;
      
      videoElement.pause();
      if (audioTrack) audioTrack.pause();

      setProgress(100);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(movieTitle || 'movie-recap').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">Export Video</h3>

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
          <span>Export completed successfully with audio and subtitles for "{movieTitle}".</span>
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
            <Loader2 className="h-5 w-5 animate-spin" /> Processing...
          </>
        ) : (
          <>
            <Download className="h-5 w-5" /> Export Video (WebM with Audio & Subs)
          </>
        )}
      </Button>
    </div>
  );
}
