import { useRef, useState, useEffect } from 'react';
import { Square, Move } from 'lucide-react';
import type { BlurSettings, VideoSource } from '@/types';

interface BlurEditorProps {
  settings: BlurSettings;
  onChange: (settings: BlurSettings) => void;
  videoSource: VideoSource;
}

export function BlurEditor({ settings, onChange, videoSource }: BlurEditorProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dragMode, setDragMode] = useState<'move' | 'resize' | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, bx: 0, by: 0, bw: 0, bh: 0 });

  const handleToggle = () => {
    onChange({ ...settings, enabled: !settings.enabled });
  };

  const handleStrengthChange = (val: number) => {
    onChange({ ...settings, strength: val });
  };

  // Mouse / Touch Start handler (PC နဲ့ Phone နှစ်ခုလုံးအတွက်)
  const handleStart = (clientX: number, clientY: number, mode: 'move' | 'resize') => {
    setDragMode(mode);
    setDragStart({
      x: clientX,
      y: clientY,
      bx: settings.x,
      by: settings.y,
      bw: settings.width,
      bh: settings.height,
    });
  };

  useEffect(() => {
    if (!dragMode) return;

    const handleMove = (clientX: number, clientY: number) => {
      const overlay = overlayRef.current;
      if (!overlay) return;
      const rect = overlay.getBoundingClientRect();
      const dx = (clientX - dragStart.x) / rect.width;
      const dy = (clientY - dragStart.y) / rect.height;

      if (dragMode === 'move') {
        onChange({
          ...settings,
          x: Math.max(0, Math.min(1 - settings.width, dragStart.bx + dx)),
          y: Math.max(0, Math.min(1 - settings.height, dragStart.by + dy)),
        });
      } else if (dragMode === 'resize') {
        const newW = Math.max(0.05, Math.min(1 - settings.x, dragStart.bw + dx));
        const newH = Math.max(0.05, Math.min(1 - settings.y, dragStart.bh + dy));
        onChange({ ...settings, width: newW, height: newH });
      }
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleEnd = () => {
      setDragMode(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [dragMode, dragStart, settings, onChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Square className="h-5 w-5 text-primary-600" />
          <h3 className="text-sm font-semibold text-slate-700">Blur Tool</h3>
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
        <>
          {videoSource.isDirectFile ? (
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-black touch-none" ref={overlayRef}>
              <video
                src={videoSource.objectUrl}
                controls
                className="w-full max-h-[400px]"
              />
              <div
                className="absolute border-2 border-primary-400 cursor-move"
                style={{
                  left: `${settings.x * 100}%`,
                  top: `${settings.y * 100}%`,
                  width: `${settings.width * 100}%`,
                  height: `${settings.height * 100}%`,
                  backdropFilter: `blur(${settings.strength / 10}px)`,
                  WebkitBackdropFilter: `blur(${settings.strength / 10}px)`,
                  background: 'rgba(0,0,0,0.1)',
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleStart(e.clientX, e.clientY, 'move');
                }}
                onTouchStart={(e) => {
                  if (e.touches.length > 0) {
                    handleStart(e.touches[0].clientX, e.touches[0].clientY, 'move');
                  }
                }}
              >
                <div
                  className="absolute -bottom-1 -right-1 h-5 w-5 cursor-nwse-resize rounded-bl-md border-l-2 border-b-2 border-primary-400 bg-primary-200 flex items-center justify-center"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleStart(e.clientX, e.clientY, 'resize');
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    if (e.touches.length > 0) {
                      handleStart(e.touches[0].clientX, e.touches[0].clientY, 'resize');
                    }
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Move className="h-4 w-4 text-white/70" />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Blur positioning is available for uploaded videos. Embedded platform videos cannot be blurred in-browser.
            </div>
          )}

          {videoSource.isDirectFile && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Blur Strength</span>
                <span className="text-sm font-medium text-slate-700">{settings.strength}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={settings.strength}
                onChange={(e) => handleStrengthChange(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
