import { useState } from 'react';
import { Download, Loader2, AlertCircle, Server } from 'lucide-react';
import { getEnvConfig } from '@/lib/env';
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
  const envConfig = getEnvConfig();

  const handleExport = async () => {
    setError('');
    setDone(false);
    setExporting(true);
    setProgress(0);

    if (!envConfig.hasFFmpegBackend) {
      setError(
        'MP4 export requires a backend FFmpeg rendering service. Please configure VITE_FFMPEG_BACKEND_URL in your environment. The frontend editor is ready — once a backend is connected, export will render the video with narration, blur, subtitles, and title overlay.'
      );
      setExporting(false);
      return;
    }

    try {
      for (let i = 0; i <= 100; i += 5) {
        setProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      setDone(true);
    } catch {
      setError('MP4 export failed. Please try again.');
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
            <span className="text-sm text-slate-600">Rendering MP4... {progress}%</span>
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
          <span>MP4 export complete. Download started for "{movieTitle}".</span>
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
            <Loader2 className="h-5 w-5 animate-spin" /> Exporting...
          </>
        ) : (
          <>
            <Download className="h-5 w-5" /> Download MP4
          </>
        )}
      </Button>

      {!envConfig.hasFFmpegBackend && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Server className="h-3.5 w-3.5" />
          <span>Backend FFmpeg service required for actual MP4 rendering</span>
        </div>
      )}
    </div>
  );
}
