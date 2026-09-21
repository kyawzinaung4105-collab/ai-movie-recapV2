import { Captions, Type, AlignLeft, AlignCenter, AlignRight, ImagePlus, X } from 'lucide-react';
import type { CaptionSettings, CaptionStyle, LogoSettings } from '@/types';
import { Button } from '@/components/ui/Button';

interface CaptionEditorProps {
  settings: CaptionSettings;
  onChange: (settings: CaptionSettings) => void;
  language: 'myanmar' | 'english';
  logoSettings: LogoSettings;
  onLogoChange: (settings: LogoSettings) => void;
}

const templates: Array<{ id: CaptionStyle['template']; label: string; color: string }> = [
  { id: 'classic', label: 'Classic', color: '#ffffff' },
  { id: 'box', label: 'Box', color: '#ffffff' },
  { id: 'highlight', label: 'Highlight', color: '#ffe66d' },
  { id: 'minimal', label: 'Minimal', color: '#7dd3fc' },
];

export function CaptionEditor({ settings, onChange, language, logoSettings, onLogoChange }: CaptionEditorProps) {
  const updateStyle = (partial: Partial<CaptionStyle>) =>
    onChange({ ...settings, style: { ...settings.style, ...partial } });

  const handleLogo = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (logoSettings.url) URL.revokeObjectURL(logoSettings.url);
    onLogoChange({ ...logoSettings, url: URL.createObjectURL(file) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Captions className="h-5 w-5 text-primary-600" /><h3 className="text-sm font-semibold text-slate-700">Auto Caption {language === 'myanmar' && <span className="font-myanmar">(MM Sub)</span>}</h3></div>
        <button onClick={() => onChange({ ...settings, enabled: !settings.enabled })} className={`relative inline-flex h-6 w-11 items-center rounded-full ${settings.enabled ? 'bg-primary-600' : 'bg-slate-300'}`}>
          <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${settings.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
      {settings.enabled && <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div><span className="mb-2 block text-xs font-medium text-slate-500">Subtitle template</span><div className="grid grid-cols-2 gap-2">{templates.map((template) => <button key={template.id} onClick={() => updateStyle({ template: template.id, color: template.color })} className={`rounded-lg border px-3 py-2 text-xs font-medium ${settings.style.template === template.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 bg-white text-slate-600'}`}>{template.label}</button>)}</div></div>
        <div className="flex items-center justify-between"><label className="flex items-center gap-2 text-xs font-medium text-slate-500">Text color <input type="color" value={settings.style.color} onChange={(e) => updateStyle({ color: e.target.value })} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0" /></label><span className="font-mono text-xs text-slate-400">{settings.style.color}</span></div>
        <div><div className="mb-1 flex items-center gap-1.5"><Type className="h-4 w-4 text-slate-400" /><span className="text-xs font-medium text-slate-500">Font size: {settings.style.fontSize}px</span></div><input type="range" min="14" max="48" value={settings.style.fontSize} onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })} className="w-full" /></div>
        <div><span className="mb-2 block text-xs font-medium text-slate-500">Alignment</span><div className="flex gap-1.5"><Button size="sm" variant={settings.style.alignment === 'left' ? 'primary' : 'secondary'} onClick={() => updateStyle({ alignment: 'left' })}><AlignLeft className="h-4 w-4" /></Button><Button size="sm" variant={settings.style.alignment === 'center' ? 'primary' : 'secondary'} onClick={() => updateStyle({ alignment: 'center' })}><AlignCenter className="h-4 w-4" /></Button><Button size="sm" variant={settings.style.alignment === 'right' ? 'primary' : 'secondary'} onClick={() => updateStyle({ alignment: 'right' })}><AlignRight className="h-4 w-4" /></Button></div></div>
        <div className="flex flex-wrap gap-3"><label className="flex items-center gap-2 text-xs font-medium text-slate-600"><input type="checkbox" checked={settings.style.outline} onChange={(e) => updateStyle({ outline: e.target.checked })} /> Outline</label><label className="flex items-center gap-2 text-xs font-medium text-slate-600"><input type="checkbox" checked={settings.style.background} onChange={(e) => updateStyle({ background: e.target.checked })} /> Background</label></div>
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">Preview ထဲက subtitle စာသားကို mouse/touch နဲ့ drag ဆွဲပြီး နေရာချနိုင်ပါတယ်။</p>
      </div>}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2"><ImagePlus className="h-4 w-4 text-primary-600" /><span className="text-sm font-semibold text-slate-700">News Channel Logo</span></div><input type="file" accept="image/*" onChange={(e) => handleLogo(e.target.files?.[0])} className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-xs file:font-medium file:text-primary-700" />{logoSettings.url && <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2"><img src={logoSettings.url} alt="Channel logo" className="h-10 max-w-24 object-contain" /><button onClick={() => { URL.revokeObjectURL(logoSettings.url!); onLogoChange({ ...logoSettings, url: undefined }); }} className="rounded p-1 text-slate-400 hover:text-red-500"><X className="h-4 w-4" /></button></div>}{logoSettings.url && <><label className="block text-xs text-slate-500">Logo size: {logoSettings.size}%<input type="range" min="5" max="30" value={logoSettings.size} onChange={(e) => onLogoChange({ ...logoSettings, size: Number(e.target.value) })} className="w-full" /></label><label className="block text-xs text-slate-500">Opacity: {logoSettings.opacity}%<input type="range" min="20" max="100" value={logoSettings.opacity} onChange={(e) => onLogoChange({ ...logoSettings, opacity: Number(e.target.value) })} className="w-full" /></label><p className="text-xs text-slate-500">Preview ထဲမှာ channel logo ကို drag ဆွဲပြီး နေရာချနိုင်ပါတယ်။</p></>}</div>
    </div>
  );
}
