import { useState } from "react";
import { Check, X } from "lucide-react";

/** Inline title editor: Enter saves, Escape cancels. */
export function RenameInput({ initial, onSave, onCancel }: { initial: string; onSave: (v: string) => void; onCancel: () => void }) {
  const [v, setV] = useState(initial);
  const save = () => (v.trim() ? onSave(v.trim()) : onCancel());
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="flex min-w-0 flex-1 items-center gap-1"
    >
      <input
        autoFocus
        value={v}
        maxLength={200}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Escape") onCancel();
        }}
        aria-label="New title"
        className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <button type="submit" aria-label="Save title" className="shrink-0 rounded-full p-1.5 text-primary hover:bg-surface-strong"><Check className="size-4" /></button>
      <button type="button" onClick={onCancel} aria-label="Cancel" className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-surface-strong"><X className="size-4" /></button>
    </form>
  );
}
