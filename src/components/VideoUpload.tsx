import { useRef, useState, useCallback } from 'react';
import { Upload, Film, RefreshCw, CheckCircle2 } from 'lucide-react';
import type { VideoSource } from '@/types';
import { Button } from '@/components/ui/Button';
import { formatDuration } from '@/lib/env';

interface VideoUploadProps {
  onVideoSelected: (source: VideoSource) => void;
}

const ACCEPTED_FORMATS = 'video/mp4,video/quicktime,video/webm,video/x-matroska,.mp4,.mov,.webm,.mkv';

export function VideoUpload({ onVideoSelected }: VideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [error, setError] = useState<string>('');

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('video/') && !/\.(mp4|mov|webm|mkv)$/i.test(file.name)) {
        setError('This file format is not supported. Please select an MP4, MOV, or WebM file.');
        return;
      }
      setError('');
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      const url = URL.createObjectURL(file);
      setObjectUrl(url);
      setSelectedFile(file);
      setDuration(0);
    },
    [objectUrl]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const dur = e.currentTarget.duration;
    setDuration(dur);
      onVideoSelected({
        method: 'upload',
        fileName: selectedFile!.name,
        file: selectedFile!,
        objectUrl,
      duration: dur,
      isDirectFile: true,
    });
  };

  const handleReplace = () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl('');
    setSelectedFile(null);
    setDuration(0);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Upload Video</h2>
        {selectedFile && (
          <Button variant="ghost" size="sm" onClick={handleReplace}>
            <RefreshCw className="h-4 w-4" /> Replace
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FORMATS}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {!selectedFile ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 transition-all duration-300 hover:border-primary-400 hover:bg-primary-50"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600">
            <Upload className="h-8 w-8" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-slate-700">Browse for a video</p>
            <p className="text-sm text-slate-400 mt-1">MP4, MOV, WebM supported</p>
          </div>
        </button>
      ) : (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
            <video
              src={objectUrl}
              controls
              onLoadedMetadata={handleLoadedMetadata}
              className="w-full max-h-[400px]"
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-primary-50 px-4 py-3 text-sm">
            <CheckCircle2 className="h-5 w-5 text-primary-600 flex-shrink-0" />
            <span className="font-medium text-slate-700">{selectedFile.name}</span>
            {duration > 0 && <span className="text-slate-500">· {formatDuration(duration)}</span>}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <Film className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
