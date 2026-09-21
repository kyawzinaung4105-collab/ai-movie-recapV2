import { useState, useEffect } from 'react';
import { X, Key, Eye, EyeOff, ExternalLink, CheckCircle2 } from 'lucide-react';
import { loadApiKeys, saveApiKeys, type ApiKeys, type AiProvider } from '@/lib/settingsStore';
import { Button } from '@/components/ui/Button';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function SettingsModal({ open, onClose, onSaved }: SettingsModalProps) {
  const [keys, setKeys] = useState<ApiKeys>(loadApiKeys());
  const [showAi, setShowAi] = useState(false);
  const [showAssembly, setShowAssembly] = useState(false);
  const [showEleven, setShowEleven] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setKeys(loadApiKeys());
      setSaved(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    saveApiKeys(keys);
    setSaved(true);
    onSaved?.();
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-bold text-slate-900">Settings</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <p className="text-sm text-slate-500">
            Select your AI provider and enter the API key below. Keys are stored locally in your browser only.
          </p>

          <div className="space-y-2 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <label className="text-sm font-semibold text-indigo-900">AssemblyAI API Key (Required for free transcript)</label>
              <a href="https://www.assemblyai.com/app/account" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-indigo-700 hover:text-indigo-900">
                Get Free Key <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="relative">
              <input
                type={showAssembly ? 'text' : 'password'}
                value={keys.assemblyAiKey}
                onChange={(e) => setKeys({ ...keys, assemblyAiKey: e.target.value })}
                placeholder="AssemblyAI API key"
                className="w-full rounded-xl border border-indigo-300 bg-white py-2.5 pl-4 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button onClick={() => setShowAssembly(!showAssembly)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showAssembly ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs leading-5 text-indigo-700">Video ထဲက English speech ကို timestamp ပါတဲ့ transcript ပြောင်းပေးပါသည်။ Key ကို server မတင်ဘဲ ဒီ browser ထဲမှာပဲ သိမ်းထားပါသည်။</p>
          </div>

          {/* AI Provider */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">AI Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'gemini', label: 'Gemini', hint: 'Google AI Studio' },
                { id: 'openai', label: 'OpenAI', hint: 'GPT models' },
                { id: 'custom', label: 'Custom', hint: 'OpenAI-compatible' },
              ] as { id: AiProvider; label: string; hint: string }[]).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setKeys({
                    ...keys,
                    aiProvider: p.id,
                    aiModel: p.id === 'gemini' ? 'gemini-3.6-flash' : p.id === 'openai' ? 'gpt-4o-mini' : keys.aiModel,
                    aiBaseUrl: p.id === 'openai' ? 'https://api.openai.com/v1' : p.id === 'gemini' ? '' : keys.aiBaseUrl,
                  })}
                  className={`rounded-xl border-2 px-3 py-2.5 text-center transition-all ${
                    keys.aiProvider === p.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-slate-200 bg-white hover:border-primary-300'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{p.label}</p>
                  <p className="text-xs text-slate-400">{p.hint}</p>
                </button>
              ))}
            </div>
          </div>

          {/* AI API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">AI API Key</label>
              {keys.aiProvider === 'gemini' && (
                <a
                  href="https://aistudio.google.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                >
                  Get Gemini Key <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {keys.aiProvider === 'openai' && (
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                >
                  Get OpenAI Key <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <div className="relative">
              <input
                type={showAi ? 'text' : 'password'}
                value={keys.aiKey}
                onChange={(e) => setKeys({ ...keys, aiKey: e.target.value })}
                placeholder={keys.aiProvider === 'gemini' ? 'AIza... or AQ...' : keys.aiProvider === 'openai' ? 'sk-...' : 'Your API key'}
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-4 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
              <button
                onClick={() => setShowAi(!showAi)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showAi ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Required. Used for video transcription, translation, and title detection.
            </p>
          </div>

          {/* API Base URL */}
          {keys.aiProvider !== 'gemini' && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">API Base URL</label>
              <input
                type="text"
                value={keys.aiBaseUrl}
                onChange={(e) => setKeys({ ...keys, aiBaseUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
              <p className="text-xs text-slate-400">Custom endpoint for OpenAI-compatible gateways, Groq, OpenRouter, etc.</p>
            </div>
          )}

          {/* AI Model Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">AI Model Name</label>
            <input
              type="text"
              value={keys.aiModel}
              onChange={(e) => setKeys({ ...keys, aiModel: e.target.value })}
              placeholder="gemini-3.6-flash, gpt-4o-mini, etc."
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
            <p className="text-xs text-slate-400">Model name to use with your provider. Default: gemini-3.6-flash</p>
          </div>

          {/* ElevenLabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">ElevenLabs API Key</label>
              <a
                href="https://elevenlabs.io/app/settings/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
              >
                Get key <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="relative">
              <input
                type={showEleven ? 'text' : 'password'}
                value={keys.elevenLabsKey}
                onChange={(e) => setKeys({ ...keys, elevenLabsKey: e.target.value })}
                placeholder="ElevenLabs API key"
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-4 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
              <button
                onClick={() => setShowEleven(!showEleven)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showEleven ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-400">Required for Burmese voice narration. Without it, subtitles still generate but no audio voiceover.</p>
          </div>

          {/* FFmpeg Backend */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">FFmpeg Backend URL (Optional)</label>
            <input
              type="text"
              value={keys.ffmpegBackendUrl}
              onChange={(e) => setKeys({ ...keys, ffmpegBackendUrl: e.target.value })}
              placeholder="https://your-ffmpeg-service.com"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
            <p className="text-xs text-slate-400">Required for MP4 export. Without it, editing still works.</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 sticky bottom-0 bg-white z-10">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-primary-600">
              <CheckCircle2 className="h-4 w-4" /> Saved
            </span>
          )}
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Keys</Button>
        </div>
      </div>
    </div>
  );
}
