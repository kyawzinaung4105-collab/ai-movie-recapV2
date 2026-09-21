import { Upload, Link2 } from 'lucide-react';
import type { InputMethod } from '@/types';

interface VideoInputProps {
  onSelect: (method: InputMethod) => void;
}

export function VideoInput({ onSelect }: VideoInputProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Football News Studio</h1>
        <p className="mt-2 text-slate-500 text-sm sm:text-base">
          Upload a match clip or paste a link to create a football news report with narration and subtitles.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        <button
          onClick={() => onSelect('upload')}
          className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-8 transition-all duration-300 hover:border-primary-400 hover:bg-primary-50 hover:shadow-md"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600 transition-transform duration-300 group-hover:scale-110">
            <Upload className="h-8 w-8" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-900">Upload Video</p>
            <p className="text-sm text-slate-500 mt-1">Select MP4, MOV, or WebM from your device</p>
          </div>
        </button>

        <button
          onClick={() => onSelect('link')}
          className="group flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-slate-200 bg-white p-8 transition-all duration-300 hover:border-primary-400 hover:bg-primary-50 hover:shadow-md"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600 transition-transform duration-300 group-hover:scale-110">
            <Link2 className="h-8 w-8" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-900">Paste Video Link</p>
            <p className="text-sm text-slate-500 mt-1">YouTube, TikTok, or Rednote URL</p>
          </div>
        </button>
      </div>
    </div>
  );
}
