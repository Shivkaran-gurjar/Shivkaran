import { Bookmark, Check, Clock, Heart, ListPlus, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { VideoItem } from "@/lib/types";
import { useAddToPlaylist, useCreatePlaylist, usePlaylists, useSaved, useToggleSaved } from "@/hooks/use-library";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const pill = "inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 font-display text-[13px] font-semibold transition-colors hover:bg-surface-strong";

export function SaveControls({ video }: { video: VideoItem }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: saved = [] } = useSaved();
  const toggle = useToggleSaved();
  const { data: playlists = [] } = usePlaylists();
  const addTo = useAddToPlaylist();
  const create = useCreatePlaylist();
  const [creating, setCreating] = useState(false);

  const isFav = saved.some((s) => s.list === "favorite" && s.video_id === video.id);
  const isLater = saved.some((s) => s.list === "watch_later" && s.video_id === video.id);

  const guard = (fn: () => void) => () => (user ? fn() : navigate({ to: "/auth" }));

  return (
    <div className="flex flex-wrap gap-2">
      <button className={cn(pill, isFav && "border-coral/40 text-coral")} onClick={guard(() => toggle.mutate({ video, list: "favorite", saved: isFav }))} aria-pressed={isFav}>
        <Heart className={cn("size-4", isFav && "fill-current")} /> {isFav ? "Favorited" : "Favorite"}
      </button>
      <button className={cn(pill, isLater && "text-primary")} onClick={guard(() => toggle.mutate({ video, list: "watch_later", saved: isLater }))} aria-pressed={isLater}>
        {isLater ? <Check className="size-4" /> : <Clock className="size-4" />} Watch later
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={pill} onClick={(e) => !user && (e.preventDefault(), navigate({ to: "/auth" }))}>
            <ListPlus className="size-4" /> Playlist
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60">
          <DropdownMenuLabel>Add to playlist</DropdownMenuLabel>
          {playlists.map((p) => (
            <DropdownMenuItem key={p.id} onSelect={() => addTo.mutate({ playlistId: p.id, video })}>
              <Bookmark className="size-4" /> {p.name}
            </DropdownMenuItem>
          ))}
          {playlists.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem
            disabled={creating}
            onSelect={async () => {
              const name = window.prompt("Playlist name");
              if (!name?.trim()) return;
              setCreating(true);
              await create.mutateAsync({ name, videos: [video] }).finally(() => setCreating(false));
            }}
          >
            <Plus className="size-4" /> New playlist
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
