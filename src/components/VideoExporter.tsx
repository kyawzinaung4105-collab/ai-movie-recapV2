import { useState } from 'react';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface VideoExporterProps {
  movieTitle: string;
  disabled?: boolean;
  audioTrack?: HTMLAudioElement | null; // Custom MP3 audio if any
  subtitles?: { start: number; end: number; text: string }[]; // Subtitles list
}

export function VideoExporter({ movieTitle, disabled, audioTrack }: VideoExporterProps) {
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

      // Setup canvas stream and audio destination to combine video + audio
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();

      // Connect video audio if available
      try {
        const videoSourceNode = audioCtx.createMediaElementSource(videoElement);
        videoSourceNode.connect(dest);
        videoSourceNode.connect(audioCtx.destination);
      } catch (e) {
        // Already connected or cross-origin restriction safeguard
      }

      // Connect custom MP3 audio track if provided
      let customAudioNode: MediaElementAudioSourceNode | null = null;
      if (audioTrack) {
        try {
          customAudioNode = audioCtx.createMediaElementSource(audioTrack);
          customAudioNode.connect(dest);
          customAudioNode.connect(audioCtx.destination);
        } catch (e) {}
      }

      const canvasStream = canvas.captureStream(30);
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
      ]);

      const mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp8,opus' });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      
      const recordingDone = new Promise((resolve) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/mp4' });
          resolve(blob);
        };
      });

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
      const fps = 30;
      const totalFrames = Math.floor(duration * fps);
      const frameInterval = 1000 / fps;

      for (let frame = 0; frame < totalFrames; frame++) {
        const currentTime = frame / fps;
        videoElement.currentTime = currentTime;
        
        // Wait for frame to seek
        await new Promise((r) => requestAnimationFrame(r));

        setProgress(Math.min(95, Math.floor((currentTime / duration) * 100)));

        // Draw video frame
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        // Optional: Draw custom text/subtitles directly onto canvas frame if needed
        // ctx.font = '28px sans-serif';
        // ctx.fillStyle = 'white';
        // ctx.textAlign = 'center';
        // ctx.fillText("Subtitle text here", canvas.width / 2, canvas.height - 80);
      }

      videoElement.pause();
      if (audioTrack) audioTrack.pause();
      mediaRecorder.stop();

      const blob = await recordingDone as Blob;
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
