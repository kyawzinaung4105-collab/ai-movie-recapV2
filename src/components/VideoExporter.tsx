import { useState } from 'react';
import { Download, Loader2, AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SubtitleItem {
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

interface VideoExporterProps {
  movieTitle?: string;
  disabled?: boolean;
  videoBlobUrl?: string;
  audioTrackUrl?: string;
  subtitles?: SubtitleItem[];
}

export function VideoExporter({ 
  movieTitle, 
  disabled, 
  videoBlobUrl, 
  audioTrackUrl, 
  subtitles = [] 
}: VideoExporterProps) {
  const [exporting, setExporting] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const safeTitle = (movieTitle && movieTitle.trim() !== '') ? movieTitle : 'ai-movie-recap';

  // Helper to convert seconds to SRT timestamp format (00:00:00,000)
  const formatSrtTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`;
  };

  const generateSrtContent = (subs: SubtitleItem[]) => {
    return subs.map((sub, index) => {
      const startStr = formatSrtTime(sub.start);
      const endStr = formatSrtTime(sub.end);
      return `${index + 1}\n${startStr} --> ${endStr}\n${sub.text}\n`;
    }).join('\n');
  };

  // Dynamically load FFmpeg script from CDN if not already loaded
  const loadFFmpegScript = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).FFmpegWASM) {
        resolve((window as any).FFmpegWASM);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.js';
      script.async = true;
      script.onload = () => {
        resolve((window as any).FFmpegWASM);
      };
      script.onerror = () => reject(new Error('Failed to load FFmpeg CDN script.'));
      document.body.appendChild(script);
    });
  };

  const handleFFmpegExport = async () => {
    setError('');
    setDone(false);
    setExporting(true);
    setStatusText('Loading FFmpeg engine...');

    try {
      const FFmpegModule = await loadFFmpegScript();
      if (!FFmpegModule) throw new Error('FFmpeg module not found.');

      const { FFmpeg } = FFmpegModule;
      const { fetchFile, toBlobURL } = (window as any).FFmpegUtil || {};

      const ffmpeg = new FFmpeg();

      ffmpeg.on('log', ({ message }: { message: string }) => {
        console.log(message);
        if (message.includes('time=')) {
          setStatusText(`Processing... (${message})`);
        }
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      
      // If fetchFile/toBlobURL aren't globally bound, use CDN fetch directly
      const coreURL = await (toBlobURL ? toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript') : `${baseURL}/ffmpeg-core.js`);
      const wasmURL = await (toBlobURL ? toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm') : `${baseURL}/ffmpeg-core.wasm`);

      await ffmpeg.load({ coreURL, wasmURL });

      let targetVideoUrl = videoBlobUrl;
      if (!targetVideoUrl) {
        const videoElement = document.querySelector('video') as HTMLVideoElement;
        if (videoElement && videoElement.src) {
          targetVideoUrl = videoElement.src;
        }
      }

      if (!targetVideoUrl) {
        throw new Error('No video source found to export.');
      }

      setStatusText('Downloading media into memory...');
      
      const videoData = fetchFile ? await fetchFile(targetVideoUrl) : await (await fetch(targetVideoUrl)).arrayBuffer();
      await ffmpeg.writeFile('input.mp4', videoData);

      let hasAudio = false;
      if (audioTrackUrl) {
        try {
          const audioData = fetchFile ? await fetchFile(audioTrackUrl) : await (await fetch(audioTrackUrl)).arrayBuffer();
          await ffmpeg.writeFile('audio.mp3', audioData);
          hasAudio = true;
        } catch (e) {
          console.warn('Failed to load custom audio track:', e);
        }
      }

      let hasSubtitles = false;
      if (subtitles.length > 0) {
        const srtContent = generateSrtContent(subtitles);
        await ffmpeg.writeFile('subtitles.srt', srtContent);
        hasSubtitles = true;
      }

      setStatusText('Merging audio, video & subtitles...');

      let args: string[] = [];

      if (hasAudio && hasSubtitles) {
        args = [
          '-i', 'input.mp4',
          '-i', 'audio.mp3',
          '-filter_complex', '[0:v]subtitles=subtitles.srt[v]',
          '-map', '[v]',
          '-map', '1:a',
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-c:a', 'aac',
          '-shortest',
          'output.mp4'
        ];
      } else if (hasAudio && !hasSubtitles) {
        args = [
          '-i', 'input.mp4',
          '-i', 'audio.mp3',
          '-map', '0:v',
          '-map', '1:a',
          '-c:v', 'copy',
          '-c:a', 'aac',
          '-shortest',
          'output.mp4'
        ];
      } else if (!hasAudio && hasSubtitles) {
        args = [
          '-i', 'input.mp4',
          '-vf', 'subtitles=subtitles.srt',
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-c:a', 'copy',
          'output.mp4'
        ];
      } else {
        args = ['-i', 'input.mp4', '-c', 'copy', 'output.mp4'];
      }

      await ffmpeg.exec(args);

      setStatusText('Preparing download...');
      
      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data], { type: 'video/mp4' });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDone(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Export failed. Please check console.');
    } finally {
      setExporting(false);
      setStatusText('');
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">Export Video (Fast Render)</h3>

      {exporting && (
        <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 p-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary-600 flex-shrink-0" />
          <div className="text-sm text-primary-700 font-medium truncate">
            {statusText}
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
          <span>Export completed successfully in MP4 format with audio & subtitles for "{safeTitle}".</span>
        </div>
      )}

      <Button
        size="lg"
        onClick={handleFFmpegExport}
        disabled={exporting || disabled}
        className="w-full sm:w-auto"
      >
        {exporting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" /> Processing Fast...
          </>
        ) : (
          <>
            <Zap className="h-5 w-5 text-amber-300" /> Export MP4 (Fast Render)
          </>
        )}
      </Button>
    </div>
  );
}
