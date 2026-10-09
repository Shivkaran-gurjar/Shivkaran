import { useSettings } from "@/store/settings";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { z } from "zod";
import { Loader2, Sparkles, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { searchYouTube } from "@/lib/youtube.functions";
import { interpretSearch } from "@/lib/smart.functions";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { VideoCard, VideoCardSkeleton } from "@/components/video/VideoCard";
import { EmptyState, ErrorState } from "@/components/common/States";
import { usePlayer } from "@/store/player";
import { useCreatePlaylist } from "@/hooks/use-library";
import { getPlaylistVideos } from "@/lib/youtube.functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DurationFilter, SearchParams, SortOrder, UploadFilter } from "@/lib/types";

const schema = z.object({
  q: z.string().max(300).optional().catch(undefined),
  type: z.enum(["video", "channel", "playlist"]).optional().catch(undefined),
  duration: z.enum(["any", "short", "medium", "long"]).optional().catch(undefined),
  order: z.enum(["relevance", "date", "viewCount", "rating"]).optional().catch(undefined),
  upload: z.enum(["any", "day", "week", "month", "year"]).optional().catch(undefined),
  music: z.boolean().optional().catch(undefined),
  raw: z.boolean().optional().catch(undefined),
});

export const Route = createFileRoute("/search")({
  validateSearch: schema,
  head: () => ({
    meta: [
      { title: "Discover — Shivkaran" },
      { name: "description", content: "Smart YouTube search: ask in plain words and filter by duration, upload date and more." },
      { property: "og:title", content: "Discover — Shivkaran" },
      { property: "og:description", content: "Smart, natural-language YouTube search." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SearchPage,
});

const looksNatural = (q: string) => q.trim().split(/\s+/).length >= 4;

function Chip<T extends string>({ value, current, onClick, children }: { value: T; current?: T; onClick: (v: T) => void; children: React.ReactNode }) {
  const active = (current ?? "any") === value || (current == null && (value === "relevance" || value === "video"));
  return (
    <button onClick={() => onClick(value)} aria-pressed={active} className={cn("rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors", active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground")}>
      {children}
    </button>
  );
}

function SearchPage() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const { user } = useAuth();
  const qc = useQueryClient();
  const interpret = useServerFn(interpretSearch);
  const q = s.q?.trim() ?? "";
  const smart = !!user && !s.raw && looksNatural(q) && !s.duration && !s.order && !s.upload && !s.type;

  // Save search history.
  useEffect(() => {
    if (!user || !q) return;
    if (useSettings.getState().saveSearchHistory) void supabase.from("search_history").insert({ user_id: user.id, query: q.slice(0, 300) }).then(() => qc.invalidateQueries({ queryKey: ["search-history"] }));
  }, [q, user, qc]);

  const intent = useQuery({
    queryKey: ["intent", q],
    queryFn: () => interpret({ data: { text: q } }),
    enabled: smart,
    staleTime: Infinity,
  });

  const params: SearchParams | null = !q
    ? null
    : smart
      ? intent.data?.ok
        ? { q: intent.data.params.q, duration: intent.data.params.duration, order: intent.data.params.order, upload: intent.data.params.upload, music: intent.data.params.music }
        : intent.isLoading
          ? null
          : { q: q.slice(0, 200) }
      : { q: q.slice(0, 200), type: s.type, duration: s.duration, order: s.order, upload: s.upload, music: s.music };

  const results = useInfiniteQuery({
    queryKey: ["search-results", params],
    enabled: !!params,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => searchYouTube({ data: { ...params!, pageToken: pageParam } }),
    getNextPageParam: (last) => last.nextPageToken,
  });

  const type = params?.type ?? "video";
  const videos = results.data?.pages.flatMap((p) => p.videos) ?? [];
  const channels = results.data?.pages.flatMap((p) => p.channels) ?? [];
  const playlists = results.data?.pages.flatMap((p) => p.playlists) ?? [];
  const playQueue = usePlayer((st) => st.playQueue);
  const create = useCreatePlaylist();

  const setFilter = (patch: Partial<z.infer<typeof schema>>) => navigate({ search: (prev) => ({ ...prev, ...patch, raw: true }) });

  if (!q) {
    return (
      <div className="mx-auto max-w-2xl pt-10">
        <EmptyState icon={<Sparkles className="size-5" />} title="Search YouTube, smarter" body="Type a topic or ask in plain words — like “energetic Hindi songs” or “DBMS from basics”." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {smart && (
        <div className="glass flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 text-[13px]">
          <Sparkles className="size-4 text-accent" />
          {intent.isLoading ? (
            <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-3.5 animate-spin" /> Understanding your request…</span>
          ) : intent.data?.ok ? (
            <>
              <span className="text-muted-foreground">{intent.data.params.explanation || "Interpreted as"}</span>
              <span className="rounded-full bg-secondary px-2.5 py-1 font-semibold">“{intent.data.params.q}”</span>
              {intent.data.params.duration !== "any" && <span className="rounded-full bg-secondary px-2.5 py-1">{intent.data.params.duration}</span>}
              {intent.data.params.music && <span className="rounded-full bg-secondary px-2.5 py-1">music</span>}
            </>
          ) : (
            <span className="text-muted-foreground">Smart search unavailable — showing standard results.</span>
          )}
          <button onClick={() => navigate({ search: (p) => ({ ...p, raw: true }) })} className="ml-auto flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <X className="size-3.5" /> Exact search
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <FilterGroup label="Type">
          {(["video", "channel", "playlist"] as const).map((t) => (
            <Chip key={t} value={t} current={s.type} onClick={(v) => setFilter({ type: v })}>{t === "video" ? "Videos" : t === "channel" ? "Channels" : "Playlists"}</Chip>
          ))}
        </FilterGroup>
        {type === "video" && (
          <>
            <FilterGroup label="Length">
              {(["any", "short", "medium", "long"] as DurationFilter[]).map((d) => (
                <Chip key={d} value={d} current={s.duration} onClick={(v) => setFilter({ duration: v })}>{{ any: "Any", short: "< 4 min", medium: "4–20 min", long: "> 20 min" }[d]}</Chip>
              ))}
            </FilterGroup>
            <FilterGroup label="Uploaded">
              {(["any", "week", "month", "year"] as UploadFilter[]).map((d) => (
                <Chip key={d} value={d} current={s.upload} onClick={(v) => setFilter({ upload: v })}>{{ any: "Any time", day: "Today", week: "This week", month: "This month", year: "This year" }[d]}</Chip>
              ))}
            </FilterGroup>
            <FilterGroup label="Sort">
              {(["relevance", "date", "viewCount", "rating"] as SortOrder[]).map((d) => (
                <Chip key={d} value={d} current={s.order} onClick={(v) => setFilter({ order: v })}>{{ relevance: "Relevance", date: "Newest", viewCount: "Most viewed", rating: "Top rated" }[d]}</Chip>
              ))}
            </FilterGroup>
            <button onClick={() => setFilter({ music: !s.music })} aria-pressed={!!s.music} className={cn("rounded-full px-3 py-1.5 text-[12px] font-semibold", s.music ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground")}>
              Music only
            </button>
          </>
        )}
      </div>

      {videos.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { playQueue(videos, 0); toast.success(`Playing ${videos.length} results`); }} className="rounded-full bg-primary px-4 py-2 font-display text-[13px] font-semibold text-primary-foreground">
            Play all as queue
          </button>
          {user && (
            <button onClick={() => create.mutate({ name: q.slice(0, 60), videos: videos.slice(0, 20) })} className="rounded-full border border-border bg-secondary px-4 py-2 font-display text-[13px] font-semibold hover:bg-surface-strong">
              Save as playlist
            </button>
          )}
        </div>
      )}

      {results.error ? (
        <ErrorState message={(results.error as Error).message} onRetry={() => results.refetch()} />
      ) : !params || results.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <VideoCardSkeleton key={i} />)}</div>
      ) : type === "video" ? (
        videos.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{videos.map((v) => <VideoCard key={v.id} video={v} context={videos} />)}</div>
        ) : (
          <EmptyState title="No videos found" body="Try fewer words or different filters." />
        )
      ) : type === "channel" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {channels.map((c) => (
            <Link key={c.id} to="/search" search={{ q: c.title, raw: true, order: "date" }} className="glass flex items-center gap-4 rounded-2xl p-4 hover:bg-surface-strong">
              <img src={c.thumbnail} alt="" loading="lazy" className="size-14 rounded-full object-cover" />
              <div className="min-w-0">
                <p className="truncate font-display font-semibold">{c.title}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
              </div>
            </Link>
          ))}
          {!channels.length && <EmptyState title="No channels found" />}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {playlists.map((p) => (
            <button
              key={p.id}
              onClick={async () => {
                try {
                  const vids = await getPlaylistVideos({ data: { id: p.id } });
                  if (!vids.length) return toast.error("This playlist has no playable videos.");
                  playQueue(vids, 0);
                  toast.success(`Queued ${vids.length} videos`);
                } catch {
                  toast.error("Couldn't load this playlist.");
                }
              }}
              className="glass rounded-[22px] p-3 text-left hover:bg-surface-strong"
            >
              <img src={p.thumbnail} alt="" loading="lazy" className="aspect-video w-full rounded-xl object-cover" />
              <p className="mt-3 line-clamp-2 font-display text-[15px] font-semibold">{p.title}</p>
              <p className="text-[13px] text-muted-foreground">{p.channelTitle} · Play as queue</p>
            </button>
          ))}
          {!playlists.length && <EmptyState title="No playlists found" />}
        </div>
      )}

      {results.hasNextPage && (
        <div className="flex justify-center">
          <button onClick={() => results.fetchNextPage()} disabled={results.isFetchingNextPage} className="rounded-full border border-border bg-secondary px-5 py-2.5 text-sm font-semibold hover:bg-surface-strong">
            {results.isFetchingNextPage ? <Loader2 className="size-4 animate-spin" /> : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
