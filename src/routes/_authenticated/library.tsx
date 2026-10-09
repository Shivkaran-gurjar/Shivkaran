import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Clock, Heart, ListVideo, Music2, Plus } from "lucide-react";
import { NotesList } from "@/components/ai/NotesList";
import { rowToVideo, useCreatePlaylist, useHistory, usePlaylists, useSaved } from "@/hooks/use-library";
import { VideoCard, VideoCardSkeleton } from "@/components/video/VideoCard";
import { EmptyState } from "@/components/common/States";
import { cn } from "@/lib/utils";

const tabs = ["favorites", "later", "music", "playlists", "notes", "recent"] as const;

export const Route = createFileRoute("/_authenticated/library")({
  validateSearch: z.object({ tab: z.enum(tabs).optional().catch(undefined) }),
  head: () => ({
    meta: [
      { title: "Library — Shivkaran" },
      { name: "description", content: "Your favorites, watch later, playlists and saved music." },
      { property: "og:title", content: "Library — Shivkaran" },
      { property: "og:description", content: "Your personal YouTube library." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Library,
});

const LABELS: Record<(typeof tabs)[number], string> = { favorites: "Favorites", later: "Watch Later", music: "Saved music", playlists: "Playlists", notes: "AI notes", recent: "Recently watched" };

function Library() {
  const { tab = "favorites" } = Route.useSearch();
  const saved = useSaved();
  const history = useHistory(24);
  const playlists = usePlaylists();
  const create = useCreatePlaylist();

  const rows = saved.data ?? [];
  const list =
    tab === "favorites" ? rows.filter((r) => r.list === "favorite") : tab === "later" ? rows.filter((r) => r.list === "watch_later") : tab === "music" ? rows.filter((r) => r.is_music) : [];
  const videos = list.map(rowToVideo);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Library</h1>
      <div className="scrollbar-none flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <Link key={t} to="/library" search={{ tab: t }} className={cn("shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold", t === tab ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
            {LABELS[t]}
          </Link>
        ))}
      </div>

      {tab === "playlists" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <button
            onClick={() => {
              const name = window.prompt("Playlist name");
              if (name?.trim()) create.mutate({ name });
            }}
            className="glass flex min-h-32 flex-col items-center justify-center gap-2 rounded-[22px] border-dashed text-muted-foreground hover:text-foreground"
          >
            <Plus className="size-5" /> New playlist
          </button>
          {playlists.data?.map((p) => (
            <Link key={p.id} to="/playlist/$playlistId" params={{ playlistId: p.id }} className="glass flex items-center gap-4 rounded-[22px] p-5 hover:bg-surface-strong">
              <div className="grid size-14 place-items-center rounded-2xl bg-brand-gradient text-primary-foreground"><ListVideo className="size-6" /></div>
              <div className="min-w-0">
                <p className="truncate font-display font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.playlist_items?.[0]?.count ?? 0} videos</p>
              </div>
            </Link>
          ))}
        </div>
      ) : tab === "notes" ? (
        <NotesList />
      ) : tab === "recent" ? (
        history.isLoading ? <Skeletons /> : history.data?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {history.data.map((h) => <VideoCard key={h.id} video={rowToVideo(h)} progress={h.duration_seconds ? h.progress_seconds / h.duration_seconds : 0} />)}
          </div>
        ) : <EmptyState icon={<Clock className="size-5" />} title="Nothing watched yet" />
      ) : saved.isLoading ? (
        <Skeletons />
      ) : videos.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{videos.map((v) => <VideoCard key={v.id} video={v} context={videos} />)}</div>
      ) : (
        <EmptyState
          icon={tab === "music" ? <Music2 className="size-5" /> : tab === "later" ? <Clock className="size-5" /> : <Heart className="size-5" />}
          title={`No ${LABELS[tab].toLowerCase()} yet`}
          body="Use the Favorite and Watch later buttons on any video."
        />
      )}
    </div>
  );
}

function Skeletons() {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <VideoCardSkeleton key={i} />)}</div>;
}
