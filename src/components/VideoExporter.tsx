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
  const [progress, setProgress] = useState(0);
  const [outputSize, setOutputSize] = useState<'original' | 'youtube' | 'tiktok'>('original');

  const safeTitle = movieTitle && movieTitle.trim() !== '' ? movieTitle : 'movie-recap';

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
    // 24px was too small after export, especially on 1080p/portrait videos.
    // ASS uses a 1280x720 design canvas, so use a readable minimum and stronger outline.
    const fontSize = Math.max(42, Math.min(72, Math.round((style?.fontSize || 24) * 1.6)));
    const outline = style?.outline === false ? 1 : 3;
    const back = style?.background || style?.template === 'box' ? '&H99000000' : '&H00000000';
    const header = `[Script Info]\nScriptType: v4.00+\nPlayResX: 1280\nPlayResY: 720\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Noto Sans Myanmar,${fontSize},${color},${color},&H00000000,${back},1,0,1,${outline},1,2,40,40,35,1\n\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;
    const events = subs.map((sub) => (
      `Dialogue: 0,${assTime(sub.start)},${assTime(sub.end)},Default,,0,0,0,,{\\pos(${Math.round(((style?.x || 50) / 100) * 1280)},${Math.round(((style?.y || 82) / 100) * 720)})}${escapeAssText(sub.text)}`
    )).join('\n');
    return header + events;
  };

  const handleFFmpegExport = async () => {
    setError('');
    setDone(false);
    setProgress(0);
    setExporting(true);
    setStatusText('Loading FFmpeg engine...');
    let ffmpeg: FFmpeg | undefined;

    try {
      ffmpeg = new FFmpeg();
      ffmpeg.on('log', ({ message }: { message: string }) => {
        if (message.includes('time=')) setStatusText(`Processing... (${message})`);
      });
      ffmpeg.on('progress', ({ progress: current }: { progress: number }) => {
        setProgress((value) => Math.max(value, Math.min(99, Math.round(10 + current * (outputSize === 'original' ? 88 : 70)))));
      });

      const corePath = `${import.meta.env.BASE_URL}ffmpeg/ffmpeg-core`;
      await ffmpeg.load({ coreURL: `${corePath}.js`, wasmURL: `${corePath}.wasm` });
      setProgress(10);

      let targetVideoUrl = videoBlobUrl;
      if (!targetVideoUrl) {
        const videoElement = document.querySelector('video') as HTMLVideoElement;
        targetVideoUrl = videoElement?.src;
      }
      if (!targetVideoUrl) throw new Error('No video source found to export.');

      setStatusText('Downloading media into memory...');
      await ffmpeg.writeFile('input.mp4', await fetchFile(targetVideoUrl));

      let hasAudio = false;
      if (audioTrackUrl) {
        try {
          await ffmpeg.writeFile('audio.mp3', await fetchFile(audioTrackUrl));
          hasAudio = true;
        } catch (audioError) {
          console.warn('Failed to load narration track:', audioError);
        }
      }

      let hasSubtitles = false;
      if (subtitles.length > 0) {
        await ffmpeg.writeFile('subtitles.ass', new TextEncoder().encode(generateAssContent(subtitles)));
        await ffmpeg.writeFile('NotoSansMyanmar-Regular.ttf', await fetchFile(`${import.meta.env.BASE_URL}fonts/NotoSansMyanmar-Regular.ttf`));
        hasSubtitles = true;
      }

      let hasLogo = false;
      if (logoSettings?.url) {
        await ffmpeg.writeFile('logo.png', await fetchFile(logoSettings.url));
        hasLogo = true;
      }

      const filters: string[] = [];
      let videoLabel = '[0:v]';
      if (hasSubtitles) {
        filters.push(`${videoLabel}ass=subtitles.ass:fontsdir=.[captioned]`);
        videoLabel = '[captioned]';
      }
      if (hasLogo) {
        // Preview positions are the logo centre; convert to a top-left overlay position.
        const logoWidth = Math.max(32, Math.round(((logoSettings?.size || 12) / 100) * 1280));
        const logoX = Math.max(0, Math.round(((logoSettings?.x || 88) / 100) * 1280 - logoWidth / 2));
        const logoY = Math.max(0, Math.round(((logoSettings?.y || 8) / 100) * 720 - logoWidth / 2));
        const opacity = Math.max(0.2, Math.min(1, (logoSettings?.opacity || 100) / 100));
        const logoInputIndex = hasAudio ? 2 : 1;
        filters.push(`[${logoInputIndex}:v]scale=${logoWidth}:-1,format=rgba,colorchannelmixer=aa=${opacity}[logo]`);
        filters.push(`${videoLabel}[logo]overlay=${logoX}:${logoY}:eof_action=repeat:format=auto[vout]`);
        videoLabel = '[vout]';
      }

      const args: string[] = ['-i', 'input.mp4'];
      if (hasAudio) args.push('-i', 'audio.mp3');
      if (hasLogo) args.push('-loop', '1', '-i', 'logo.png');
      if (filters.length > 0) {
        args.push('-filter_complex', filters.join(';'), '-map', videoLabel);
      } else {
        args.push('-map', '0:v');
      }
      if (hasAudio) args.push('-map', '1:a');
      args.push('-c:v', filters.length > 0 ? 'libx264' : 'copy');
      if (filters.length > 0) args.push('-preset', 'ultrafast', '-crf', '28', '-threads', '0');
      if (hasAudio) {
        // VoiceTool often exports narration from 00:00 even when the first
        // subtitle cue starts later. Add the leading cue gap automatically.
        const firstCueStart = subtitles.length > 0 ? Math.max(0, subtitles[0].start) : 0;
        const delayMs = Math.round(firstCueStart * 1000);
        const audioFilter = delayMs > 0 ? `adelay=${delayMs}:all=1,apad` : 'apad';
        args.push('-c:a', 'aac', '-af', audioFilter);
      }
      else if (filters.length > 0) args.push('-c:a', 'copy');
      args.push('-shortest', 'output.mp4');

      setStatusText('Rendering movie recap video...');
      let exitCode = await ffmpeg.exec(args);
      if (exitCode !== 0) throw new Error(`FFmpeg could not create the output video (exit code ${exitCode}).`);
      setProgress(outputSize === 'original' ? 98 : 80);

      let outputFile = 'output.mp4';
      if (outputSize !== 'original') {
        const dimensions = outputSize === 'youtube' ? '1280:720' : '720:1280';
        setStatusText(`Preparing ${outputSize === 'youtube' ? 'YouTube' : 'TikTok'} video...`);
        exitCode = await ffmpeg.exec([
          '-i', 'output.mp4', '-vf', `scale=${dimensions}:force_original_aspect_ratio=decrease,pad=${dimensions}:(ow-iw)/2:(oh-ih)/2:color=black`,
          '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '28', '-threads', '0', '-c:a', 'copy', '-movflags', '+faststart', 'resized.mp4',
        ]);
        if (exitCode !== 0) throw new Error(`Could not resize video (exit code ${exitCode}).`);
        outputFile = 'resized.mp4';
        setProgress(98);
      }

      setStatusText('Preparing download...');
      const data = await ffmpeg.readFile(outputFile);
      const url = URL.createObjectURL(new Blob([data], { type: 'video/mp4' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${safeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mp4`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setDone(true);
      setProgress(100);
    } catch (err: unknown) {
      console.error('Video export failed:', err);
      setError(err instanceof Error ? err.message : 'Video export failed. Please try again.');
    } finally {
      ffmpeg?.terminate();
      setExporting(false);
      setStatusText('');
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-700">Export Football News Video</h3>
      {exporting && <div className="space-y-2 rounded-xl border border-primary-200 bg-primary-50 p-4"><div className="flex items-center gap-3"><Loader2 className="h-5 w-5 animate-spin text-primary-600" /><div className="flex-1 truncate text-sm font-medium text-primary-700">{statusText}</div><span className="text-sm font-bold text-primary-700">{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-primary-100"><div className="h-full rounded-full bg-primary-600 transition-all duration-300" style={{ width: `${progress}%` }} /></div></div>}
      {error && <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"><AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" /><span>{error}</span></div>}
      {done && !error && <div className="flex items-start gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700"><Download className="mt-0.5 h-5 w-5 flex-shrink-0" /><span>Movie recap video exported successfully with logo, audio and subtitles.</span></div>}
      <label className="block max-w-xs space-y-1"><span className="text-xs font-medium text-slate-500">Video size</span><select value={outputSize} onChange={(event) => setOutputSize(event.target.value as 'original' | 'youtube' | 'tiktok')} disabled={exporting} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"><option value="original">Original size</option><option value="youtube">YouTube — 16:9 (1280×720)</option><option value="tiktok">TikTok — 9:16 (720×1280)</option></select></label>
      <Button size="lg" onClick={handleFFmpegExport} disabled={exporting || disabled} className="w-full sm:w-auto">{exporting ? <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</> : <><Zap className="h-5 w-5 text-amber-300" /> Export MP4</>}</Button>
    </div>
  );
}
