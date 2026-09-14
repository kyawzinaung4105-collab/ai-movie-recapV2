import { Captions, Type, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import type { CaptionSettings, CaptionStyle } from '@/types';
import { Button } from '@/components/ui/Button';

interface CaptionEditorProps {
  settings: CaptionSettings;
  onChange: (settings: CaptionSettings) => void;
  language: 'myanmar' | 'english';
}

export function CaptionEditor({ settings, onChange, language }: CaptionEditorProps) {
  const handleToggle = () => {
    onChange({ ...settings, enabled: !settings.enabled });
  };

  const updateStyle = (partial: Partial<CaptionStyle>) => {
    onChange({ ...settings, style: { ...settings.style, ...partial } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Captions className="h-5 w-5 text-primary-600" />
          <h3 className="text-sm font-semibold text-slate-700">
            Auto Caption {language === 'myanmar' && <span className="font-myanmar">(MM Sub)</span>}
          </h3>
        </div>
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
            settings.enabled ? 'bg-primary-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
              settings.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {settings.enabled && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          {/* Font Size */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Type className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-500">Font Size</span>
            </div>
            <input
              type="range"
              min="14"
              max="48"
              value={settings.style.fontSize}
              onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Position */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-500">Position</span>
            <div className="flex gap-1.5">
              {(['top', 'center', 'bottom'] as const).map((pos) => (
                <Button
                  key={pos}
                  size="sm"
                  variant={settings.style.position === pos ? 'primary' : 'secondary'}
                  onClick={() => updateStyle({ position: pos })}
                >
                  {pos.charAt(0).toUpperCase() + pos.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Alignment */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-500">Alignment</span>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant={settings.style.alignment === 'left' ? 'primary' : 'secondary'}
                onClick={() => updateStyle({ alignment: 'left' })}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={settings.style.alignment === 'center' ? 'primary' : 'secondary'}
                onClick={() => updateStyle({ alignment: 'center' })}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={settings.style.alignment === 'right' ? 'primary' : 'secondary'}
                onClick={() => updateStyle({ alignment: 'right' })}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Outline & Background */}
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={settings.style.outline}
                onChange={(e) => updateStyle({ outline: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              Text Outline
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={settings.style.background}
                onChange={(e) => updateStyle({ background: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              Background
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
