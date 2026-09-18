import { useState } from 'react';
import { Download, Loader2, AlertCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import type { CaptionStyle, LogoSettings } from '@/types';

interface SubtitleItem {
  start: number;
  end: number;
  text: string;
}

interface VideoExporterProps {
  movieTitle?: string;
  disabled?: boolean;
  videoBlobUrl?: string;
  audioTrackUrl?: string;
  subtitles?: SubtitleItem[];
  captionStyle?: CaptionStyle;
  logoSettings?: LogoSettings;
}

export function VideoExporter({ 
  movieTitle, 
  disabled, 
  videoBlobUrl, 
  audioTrackUrl, 
  subtitles = [],
  captionStyle,
  logoSettings,
}: VideoExporterProps) {
  const [exporting, setExporting] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const safeTitle = (movieTitle && movieTitle.trim() !== '') ? movieTitle : 'ai-movie-recap';

  const assColor = (hex: string) => {
    const value = hex.replace('#', '').padStart(6, '0');
    return `&H00${value.slice(4, 6)}${value.slice(2, 4)}${value.slice(0, 2)}`;
  };

  const generateAssContent = (subs: SubtitleItem[]) => {
    const assTime = (seconds: number) => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const centis = Math.floor((seconds % 1) * 100);
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
    };
    const escapeAssText = (text: string) => text.replace(/\\/g, '\\\\').replace(/[{}]/g, '');
    const style = captionStyle;
    const color = assColor(style?.color || '#ffffff');
    const outline = style?.outline === false ? 0 : 2;
    const back = style?.background || style?.template === 'box' ? '&H99000000' : '&H00000000';
    const header = `[Script Info]\nScriptType: v4.00+\nPlayResX: 1280\nPlayResY: 720\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Noto Sans Myanmar,${style?.fontSize || 24},${color},${color},&H00000000,${back},0,0,1,${outline},1,2,40,40,35,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
    const events = subs.map((sub) => (
      `Dialogue: 0,${assTime(sub.start)},${assTime(sub.end)},Default,,0,0,0,,{\\pos(${Math.round(((style?.x || 50) / 100) * 1280)},${Math.round(((style?.y || 82) / 100) * 720)})}${escapeAssText(sub.text)}`
    )).join('\n');
    return header + events;
  };

  const handleFFmpegExport = async () => {
    setError('');
    setDone(false);
    setExporting(true);
    setStatusText('Loading FFmpeg engine...');

    try {
      const ffmpeg = new FFmpeg();

      ffmpeg.on('log', ({ message }: { message: string }) => {
        console.log(message);
        if (message.includes('time=')) {
          setStatusText(`Processing... (${message})`);
        }
      });

      // Keep the worker and core on the Vercel origin. A Worker cannot load the
      // package's CDN chunk from a different origin in production.
      const corePath = `${import.meta.env.BASE_URL}ffmpeg/ffmpeg-core`;
      await ffmpeg.load({
        coreURL: `${corePath}.js`,
        wasmURL: `${corePath}.wasm`,
      });

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
      
      await ffmpeg.writeFile('input.mp4', await fetchFile(targetVideoUrl));

      let hasAudio = false;
      if (audioTrackUrl) {
        try {
          await ffmpeg.writeFile('audio.mp3', await fetchFile(audioTrackUrl));
          hasAudio = true;
        } catch (e) {
          console.warn('Failed to load custom audio track:', e);
        }
      }

      let hasSubtitles = false;
      if (subtitles.length > 0) {
        const assContent = generateAssContent(subtitles);
        await ffmpeg.writeFile('subtitles.ass', new TextEncoder().encode(assContent));
        await ffmpeg.writeFile(
          'NotoSansMyanmar-Regular.ttf',
          await fetchFile(`${import.meta.env.BASE_URL}fonts/NotoSansMyanmar-Regular.ttf`),
        );
        hasSubtitles = true;
      }
      let hasLogo = false;
      if (logoSettings?.url) {
        await ffmpeg.writeFile('logo.png', await fetchFile(logoSettings.url));
        hasLogo = true;
      }

      setStatusText('Merging audio, video & subtitles...');

      let args: string[] = [];
      const subtitleFilter = 'ass=subtitles.ass:fontsdir=.';
      const logoX = Math.round(((logoSettings?.x || 88) / 100) * 1280);
      const logoY = Math.round(((logoSettings?.y || 8) / 100) * 720);
      const logoWidth = Math.round(((logoSettings?.size || 12) / 100) * 1280);

      if (hasAudio && hasSubtitles) {
        args = [
          '-i', 'input.mp4',
          '-i', 'audio.mp3',
          ...(hasLogo ? ['-i', 'logo.png'] : []),
          '-filter_complex', hasLogo
            ? `[0:v]${subtitleFilter}[captioned];[2:v]scale=${logoWidth}:-1,format=rgba,colorchannelmixer=aa=${(logoSettings?.opacity || 100) / 100}[logo];[captioned][logo]overlay=${logoX}:${logoY}[v]`
            : `[0:v]${subtitleFilter}[v]`,
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
          ...(hasLogo ? ['-i', 'logo.png', '-filter_complex', `[0:v][2:v]overlay=${logoX}:${logoY}[v]`, '-map', '[v]'] : ['-map', '0:v']),
          '-map', '1:a',
          '-c:v', 'copy',
          '-c:a', 'aac',
          '-shortest',
          'output.mp4'
        ];
      } else if (!hasAudio && hasSubtitles) {
        args = [
          '-i', 'input.mp4',
          ...(hasLogo ? ['-i', 'logo.png', '-filter_complex', `[0:v]${subtitleFilter}[captioned];[1:v]scale=${logoWidth}:-1,format=rgba,colorchannelmixer=aa=${(logoSettings?.opacity || 100) / 100}[logo];[captioned][logo]overlay=${logoX}:${logoY}[v]`, '-map', '[v]'] : ['-vf', subtitleFilter]),
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-c:a', 'copy',
          'output.mp4'
        ];
      } else {
        args = hasLogo
          ? ['-i', 'input.mp4', '-i', 'logo.png', '-filter_complex', `[0:v][1:v]overlay=${logoX}:${logoY}[v]`, '-map', '[v]', '-map', '0:a?', '-c:v', 'libx264', '-preset', 'ultrafast', 'output.mp4']
          : ['-i', 'input.mp4', '-c', 'copy', 'output.mp4'];
      }

      const exitCode = await ffmpeg.exec(args);
      if (exitCode !== 0) {
        throw new Error(`FFmpeg could not create the output video (exit code ${exitCode}).`);
      }

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
      ffmpeg.terminate();
    } catch (err: unknown) {
      console.error('Video export failed:', err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message || 'Video export failed. Please try again.');
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
