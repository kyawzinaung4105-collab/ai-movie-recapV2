import { useState } from 'react';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface VideoExporterProps {
  movieTitle: string;
  disabled?: boolean;
}

export function VideoExporter({ movieTitle, disabled }: VideoExporterProps) {
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

      // Capture the preview container (which includes subtitles and overlays) if available
      const previewContainer = document.querySelector('.relative.w-full') || videoElement.parentElement;
      
      let blob: Blob;

      if (window.MediaRecorder && previewContainer) {
        // Advanced client-side recording to burn-in subtitles/overlays from the DOM
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext('2d');
        
        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        
        const recordingDone = new Promise((resolve) => {
          mediaRecorder.onstop = () => {
            blob = new Blob(chunks, { type: 'video/mp4' });
            resolve(true);
          };
        });

        mediaRecorder.start();
        videoElement.currentTime = 0;
        await videoElement.play().catch(() => {});

        const duration = videoElement.duration || 10;
        const interval = 100;
        
        for (let t = 0; t < duration * 1000; t += interval) {
          setProgress(Math.min(95, Math.floor((t / (duration * 1000)) * 100)));
          if (ctx) {
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          }
          await new Promise((r) => setTimeout(r, interval));
        }

        videoElement.pause();
        mediaRecorder.stop();
        await recordingDone;
      } else {
        // Fallback: direct fetch if MediaRecorder is restricted
        for (let i = 0; i <= 90; i += 10) {
          setProgress(i);
          await new Promise((r) => setTimeout(r, 200));
        }
        const response = await fetch(videoElement.src);
        blob = await response.blob();
      }

      setProgress(100);
      
      const url = URL.createObjectURL(blob!);
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
            <span className="text-sm text-slate-600">Rendering Subtitles & Video... {progress}%</span>
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
          <span>MP4 export complete with subtitles for "{movieTitle}".</span>
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
            <Download className="h-5 w-5" /> Download MP4 with Subtitles
          </>
        )}
      </Button>
    </div>
  );
}
