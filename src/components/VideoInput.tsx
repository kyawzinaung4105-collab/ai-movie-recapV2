import { Upload, Link2 } from 'lucide-react';
import type { InputMethod } from '@/types';

interface VideoInputProps {
  onSelect: (method: InputMethod) => void;
}

export function VideoInput({ onSelect }: VideoInputProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-10 animate-fade-in">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary-600">AI AI Movie Recap V2</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">AI Movie Recap V2</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
          Upload a video clip or paste a link to create a movie recap report with narration and subtitles.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <button
          onClick={() => onSelect('upload')}
          className="group flex min-h-56 flex-col items-center justify-center gap-5 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-400 hover:bg-primary-50 hover:shadow-md"
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
          className="group flex min-h-56 flex-col items-center justify-center gap-5 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-400 hover:bg-primary-50 hover:shadow-md"
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
