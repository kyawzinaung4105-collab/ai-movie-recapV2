import { useState, useRef, useCallback } from 'react';
import { Upload, FileAudio, FileText, X, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { parseTranscriptFile } from '@/lib/transcriptParser';
import type { CaptionCue } from '@/types';

interface CustomAudioUploadProps {
  onAudioLoaded: (url: string | undefined) => void;
  onCuesLoaded: (cues: CaptionCue[]) => void;
  currentAudioUrl?: string;
  currentCues: CaptionCue[];
}

export function CustomAudioUpload({
  onAudioLoaded,
  onCuesLoaded,
  currentAudioUrl,
  currentCues,
}: CustomAudioUploadProps) {
  const [audioUrl, setAudioUrl] = useState<string | undefined>(currentAudioUrl);
  const [audioName, setAudioName] = useState<string>('');
  const [transcriptName, setTranscriptName] = useState<string>('');
  const [cueCount, setCueCount] = useState<number>(currentCues.length);
  const [error, setError] = useState<string>('');

  const audioInputRef = useRef<HTMLInputElement>(null);
  const transcriptInputRef = useRef<HTMLInputElement>(null);

  const handleAudioFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('audio/')) {
        setError('Please select an audio file (MP3, WAV, etc.)');
        return;
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setAudioName(file.name);
      setError('');
      onAudioLoaded(url);
    },
    [audioUrl, onAudioLoaded]
  );

  const handleTranscriptFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        const cues = parseTranscriptFile(content, file.name);
        if (cues.length === 0) {
          setError('Could not parse transcript. Please use SRT format or timestamped text.');
          return;
        }
        setCueCount(cues.length);
        setTranscriptName(file.name);
        setError('');
        onCuesLoaded(cues);
      };
      reader.onerror = () => setError('Failed to read transcript file.');
      reader.readAsText(file);
    },
    [onCuesLoaded]
  );

  const clearAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(undefined);
    setAudioName('');
    onAudioLoaded(undefined);
  };

  const clearTranscript = () => {
    setTranscriptName('');
    setCueCount(0);
    onCuesLoaded([]);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <Upload className="h-5 w-5 text-primary-600" />
        <h3 className="text-sm font-bold text-slate-900">Custom Audio & Transcript</h3>
      </div>

      <p className="text-xs text-slate-500">
        Upload your own narration audio and transcript file. The app will sync them with the video
        and display subtitles timed to the video playback.
      </p>

      <div className="space-y-3">
        {/* Audio upload */}
        <div>
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAudioFile(file);
              e.target.value = '';
            }}
          />
          {audioUrl ? (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileAudio className="h-4 w-4 text-primary-600 shrink-0" />
                <span className="text-sm text-slate-700 truncate">{audioName}</span>
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              </div>
              <button onClick={clearAudio} className="text-slate-400 hover:text-red-500 shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => audioInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500 transition-colors hover:border-primary-400 hover:text-primary-600"
            >
              <FileAudio className="h-5 w-5" />
              Upload narration audio (MP3, WAV)
            </button>
          )}
        </div>

        {/* Transcript upload */}
        <div>
          <input
            ref={transcriptInputRef}
            type="file"
            accept=".srt,.txt,.vtt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleTranscriptFile(file);
              e.target.value = '';
            }}
          />
          {transcriptName ? (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-primary-600 shrink-0" />
                <span className="text-sm text-slate-700 truncate">{transcriptName}</span>
                <span className="text-xs text-slate-400 shrink-0">({cueCount} cues)</span>
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              </div>
              <button
                onClick={clearTranscript}
                className="text-slate-400 hover:text-red-500 shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => transcriptInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-4 text-sm text-slate-500 transition-colors hover:border-primary-400 hover:text-primary-600"
            >
              <FileText className="h-5 w-5" />
              Upload transcript (SRT, TXT, VTT)
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-600">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          Tip: SRT format is recommended. Each subtitle block has a start/end timestamp and text.
          The app will match subtitles to the video timeline automatically.
        </span>
      </div>
    </div>
  );
}
