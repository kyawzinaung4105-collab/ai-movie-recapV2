import { useEffect, useState } from 'react';
import { Pencil, Check, X, Film, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface MovieTitleEditorProps {
  title: string;
  titleConfident?: boolean;
  onChange: (title: string) => void;
}

export function MovieTitleEditor({ title, titleConfident, onChange }: MovieTitleEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  useEffect(() => {
    if (!isEditing) setDraft(title);
  }, [title, isEditing]);

  const handleSave = () => {
    onChange(draft.trim() || 'Untitled');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(title);
    setIsEditing(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Film className="h-5 w-5 text-primary-600" />
        <h3 className="text-sm font-semibold text-slate-700">Movie Title</h3>
      </div>

      {!titleConfident && !isEditing && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>Movie title could not be confidently identified. Please enter it manually.</span>
        </div>
      )}

      {isEditing ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            autoFocus
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
          <Button size="sm" onClick={handleSave}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3">
          <p className="flex-1 text-base font-semibold text-slate-900">{title}</p>
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        </div>
      )}
    </div>
  );
}
