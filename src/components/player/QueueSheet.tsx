import { useState, type ReactNode } from "react";
import { GripVertical, Loader2, Pencil, Save, Shuffle, Sparkles, Trash2, X } from "lucide-react";
import { SortableList } from "@/components/common/SortableList";
import { RenameInput } from "@/components/common/RenameInput";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { usePlayer } from "@/store/player";
import { useCreatePlaylist } from "@/hooks/use-library";
import { useAuth } from "@/hooks/use-auth";
import { generateQueue } from "@/lib/smart.functions";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SmartQueueForm({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const gen = useServerFn(generateQueue);
  const playQueue = usePlayer((s) => s.playQueue);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (value = text) => {
    if (!user) return toast.error("Sign in to build smart queues.");
    if (value.trim().length < 3) return;
    setBusy(true);
    try {
      const r = await gen({ data: { text: value } });
      if (!r.ok) return toast.error(r.error);
      if (!r.videos.length) return toast.error("No matching videos found.");
      playQueue(r.videos, 0);
      toast.success(`${r.title} · ${r.videos.length} videos queued`);
      setText("");
    } catch {
      toast.error("Couldn't build that queue. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
        className="flex items-center gap-2 rounded-2xl border border-border bg-secondary p-2 pl-3"
      >
        <Sparkles className="size-4 shrink-0 text-accent" />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="“Create a 1-hour workout music queue”"
          maxLength={300}
          className="min-w-0 flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          aria-label="Describe a queue"
        />
        <button disabled={busy} className="rounded-xl bg-primary px-3 py-1.5 font-display text-xs font-semibold text-primary-foreground disabled:opacity-60">
          {busy ? <Loader2 className="size-4 animate-spin" /> : "Build"}
        </button>
      </form>
      {!compact && (
        <div className="mt-3 flex flex-wrap gap-2">
          {["Beginner DSA learning sequence", "5 relaxing songs", "Python learning session"].map((s) => (
            <button key={s} disabled={busy} onClick={() => run(s)} className="rounded-full bg-secondary px-3 py-1.5 text-[12px] font-semibold hover:bg-surface-strong">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function QueueSheet({ children }: { children: ReactNode }) {
  const s = usePlayer();
  const create = useCreatePlaylist();
  const { user } = useAuth();
  const [editing, setEditing] = useState<string | null>(null);
  const total = s.queue.reduce((a, v) => a + (v.durationSeconds ?? 0), 0);

  const save = async () => {
    if (!user) return toast.error("Sign in to save playlists.");
    const name = window.prompt("Save queue as playlist", "My queue");
    if (name?.trim()) await create.mutateAsync({ name, videos: s.queue });
  };

  return (
    <Sheet open={s.queueOpen} onOpenChange={s.setQueueOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="glass-strong flex w-full flex-col gap-0 border-border p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border p-5">
          <SheetTitle className="font-display">Up next</SheetTitle>
          <div className="flex gap-2 pt-2">
            <button onClick={s.toggleShuffle} className={cn("flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold", s.shuffle && "text-primary")}>
              <Shuffle className="size-3.5" /> Shuffle
            </button>
            <button onClick={save} disabled={!s.queue.length} className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold disabled:opacity-50">
              <Save className="size-3.5" /> Save as playlist
            </button>
            <button onClick={s.clearQueue} disabled={!s.queue.length} className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive disabled:opacity-50">
              <Trash2 className="size-3.5" /> Clear
            </button>
          </div>
        </SheetHeader>
        <div className="p-4">
          <SmartQueueForm compact />
          {s.queue.length > 0 && (
            <p className="mt-3 text-[11px] text-muted-foreground">
              {s.queue.length} {s.queue.length === 1 ? "item" : "items"}{total ? ` · ${formatDuration(total)} total` : ""} · drag <GripVertical className="inline size-3" /> to reorder
            </p>
          )}
        </div>
        {s.queue.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">Your queue is empty. Add videos or describe one above.</p>
        ) : (
          <SortableList
            items={s.queue}
            getId={(v) => v.id}
            onMove={s.move}
            className="flex-1 space-y-1 overflow-y-auto px-2 pb-6 sm:px-3"
            renderItem={(v, i, handle) => (
              <div className={cn("group flex items-center gap-2 rounded-2xl p-2", i === s.index ? "bg-surface-strong" : "hover:bg-surface")}>
                {handle}
                {editing === v.id ? (
                  <RenameInput initial={v.title} onCancel={() => setEditing(null)} onSave={(t) => { s.renameAt(i, t); setEditing(null); }} />
                ) : (
                  <>
                    <button onClick={() => s.jumpTo(i)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <img src={v.thumbnail} alt="" loading="lazy" className="aspect-video w-20 shrink-0 rounded-lg object-cover sm:w-24" />
                      <div className="min-w-0">
                        <p className={cn("line-clamp-2 text-[13px] font-semibold leading-snug", i === s.index && "text-primary")}>{v.title}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {v.channelTitle}
                          {v.durationSeconds ? ` · ${formatDuration(v.durationSeconds)}` : ""}
                        </p>
                      </div>
                    </button>
                    <div className="flex shrink-0 items-center sm:opacity-60 sm:group-hover:opacity-100">
                      <button onClick={() => setEditing(v.id)} aria-label="Rename" className="rounded-full p-1.5 text-muted-foreground hover:bg-surface-strong hover:text-foreground">
                        <Pencil className="size-3.5" />
                      </button>
                      <button onClick={() => s.removeAt(i)} aria-label="Remove" className="rounded-full p-1.5 text-muted-foreground hover:bg-surface-strong hover:text-destructive">
                        <X className="size-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
