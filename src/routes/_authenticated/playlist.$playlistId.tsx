import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Play, Shuffle, Trash2, X } from "lucide-react";
import { SortableList } from "@/components/common/SortableList";
import { RenameInput } from "@/components/common/RenameInput";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { rowToVideo } from "@/hooks/use-library";
import { usePlayer } from "@/store/player";
import { VideoCardSkeleton } from "@/components/video/VideoCard";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/States";

export const Route = createFileRoute("/_authenticated/playlist/$playlistId")({
  head: () => ({
    meta: [
      { title: "Playlist — Shivkaran" },
      { name: "description", content: "Your Shivkaran playlist." },
      { property: "og:title", content: "Playlist — Shivkaran" },
      { property: "og:description", content: "A personal YouTube playlist." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlaylistPage,
});

function PlaylistPage() {
  const { playlistId } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const playQueue = usePlayer((s) => s.playQueue);
  const q = useQuery({
    queryKey: ["playlist", playlistId],
    queryFn: async () => {
      const { data, error } = await supabase.from("playlists").select("id, name, playlist_items(*)").eq("id", playlistId).single();
      if (error) throw error;
      return { ...data, playlist_items: [...data.playlist_items].sort((a, b) => a.position - b.position) };
    },
  });

  const videos = q.data?.playlist_items.map(rowToVideo) ?? [];

  const removeItem = async (id: string) => {
    qc.setQueryData<NonNullable<typeof q.data>>(["playlist", playlistId], (d) => d && { ...d, playlist_items: d.playlist_items.filter((x) => x.id !== id) });
    await supabase.from("playlist_items").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["playlist", playlistId] });
    qc.invalidateQueries({ queryKey: ["playlists"] });
  };
  const [editing, setEditing] = useState<string | null>(null);
  const [renamingList, setRenamingList] = useState(false);
  const key = ["playlist", playlistId];
  type Data = NonNullable<typeof q.data>;

  const renameItem = async (id: string, title: string) => {
    setEditing(null);
    qc.setQueryData<Data>(key, (d) => d && { ...d, playlist_items: d.playlist_items.map((x) => (x.id === id ? { ...x, title } : x)) });
    const { error } = await supabase.from("playlist_items").update({ title }).eq("id", id);
    if (error) { toast.error("Couldn't rename"); qc.invalidateQueries({ queryKey: key }); } else toast.success("Renamed");
  };
  const renameList = async (name: string) => {
    setRenamingList(false);
    const { error } = await supabase.from("playlists").update({ name: name.slice(0, 100) }).eq("id", playlistId);
    if (error) return toast.error("Couldn't rename playlist");
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: ["playlists"] });
  };
  const moveItem = async (from: number, to: number) => {
    const items = [...(q.data?.playlist_items ?? [])];
    const [it] = items.splice(from, 1);
    items.splice(to, 0, it);
    const next = items.map((x, i) => ({ ...x, position: i }));
    qc.setQueryData<Data>(key, (d) => d && { ...d, playlist_items: next });
    const changed = next.filter((x, i) => x.id !== q.data!.playlist_items[i]?.id);
    const res = await Promise.all(changed.map((x) => supabase.from("playlist_items").update({ position: x.position }).eq("id", x.id)));
    if (res.some((r) => r.error)) { toast.error("Couldn't save new order"); qc.invalidateQueries({ queryKey: key }); }
  };

  const deleteList = async () => {
    if (!window.confirm("Delete this playlist?")) return;
    await supabase.from("playlists").delete().eq("id", playlistId);
    qc.invalidateQueries({ queryKey: ["playlists"] });
    toast.success("Playlist deleted");
    navigate({ to: "/library", search: { tab: "playlists" } });
  };

  if (q.error) return <EmptyState title="Playlist not found" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-auto flex min-w-0 max-w-full items-center gap-2">
          {renamingList ? (
            <RenameInput initial={q.data?.name ?? ""} onSave={renameList} onCancel={() => setRenamingList(false)} />
          ) : (
            <>
              <h1 className="truncate text-2xl font-bold sm:text-3xl">{q.data?.name ?? "…"}</h1>
              <button onClick={() => setRenamingList(true)} aria-label="Rename playlist" className="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><Pencil className="size-4" /></button>
            </>
          )}
        </div>
        <button disabled={!videos.length} onClick={() => playQueue(videos, 0)} className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-[13px] font-semibold text-primary-foreground disabled:opacity-50">
          <Play className="size-4 fill-current" /> Play all
        </button>
        <button disabled={!videos.length} onClick={() => playQueue([...videos].sort(() => Math.random() - 0.5), 0)} className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-[13px] font-semibold disabled:opacity-50">
          <Shuffle className="size-4" /> Shuffle
        </button>
        <button onClick={deleteList} className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-[13px] font-semibold text-muted-foreground hover:text-destructive">
          <Trash2 className="size-4" /> Delete
        </button>
      </div>
      {q.isLoading ? (
        <VideoCardSkeleton variant="row" />
      ) : videos.length ? (
        <SortableList
          items={q.data!.playlist_items}
          getId={(it) => it.id}
          onMove={moveItem}
          className="max-w-3xl space-y-1"
          renderItem={(it, i, handle) => (
            <div className="group flex items-center gap-2 rounded-2xl p-2 hover:bg-surface">
              {handle}
              <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">{i + 1}</span>
              {editing === it.id ? (
                <RenameInput initial={it.title} onSave={(t) => renameItem(it.id, t)} onCancel={() => setEditing(null)} />
              ) : (
                <>
                  <button onClick={() => playQueue(videos, i)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <img src={videos[i]?.thumbnail} alt="" loading="lazy" className="aspect-video w-24 shrink-0 rounded-lg object-cover sm:w-32" />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-semibold leading-snug">{it.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{it.channel_title}{videos[i]?.durationSeconds ? ` · ${formatDuration(videos[i].durationSeconds!)}` : ""}</p>
                    </div>
                  </button>
                  <div className={cn("flex shrink-0 items-center sm:opacity-60 sm:group-hover:opacity-100")}>
                    <button onClick={() => setEditing(it.id)} aria-label="Rename" className="rounded-full p-2 text-muted-foreground hover:text-foreground"><Pencil className="size-4" /></button>
                    <button onClick={() => removeItem(it.id)} aria-label="Delete" className="rounded-full p-2 text-muted-foreground hover:text-destructive"><X className="size-4" /></button>
                  </div>
                </>
              )}
            </div>
          )}
        />
      ) : (
        <EmptyState title="This playlist is empty" body="Add videos from any watch page." />
      )}
    </div>
  );
}
