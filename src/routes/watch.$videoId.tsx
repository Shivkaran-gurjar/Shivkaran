import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { ExternalLink, MessageSquare, Share2 } from "lucide-react";
import { toast } from "sonner";
import { relatedQuery, videoQuery } from "@/lib/queries";
import { currentVideo, usePlayer, usePlayerSlot } from "@/store/player";
import { formatDuration, formatViews, parseChapters } from "@/lib/format";
import { SaveControls } from "@/components/video/SaveControls";
import { useSettings } from "@/store/settings";
import { AskPanel } from "@/components/ai/AskPanel";
import { VideoCard, VideoCardSkeleton } from "@/components/video/VideoCard";
import { ErrorState } from "@/components/common/States";
import type { AiAction } from "@/lib/ai/prompts";

const actions = ["summary", "keypoints", "simple", "concepts", "notes", "quiz", "flashcards", "chapters", "takeaways", "translate"] as const;

export const Route = createFileRoute("/watch/$videoId")({
  validateSearch: z.object({ ai: z.enum(actions).optional().catch(undefined) }),
  head: () => ({
    meta: [
      { title: "Watch — Shivkaran" },
      { name: "description", content: "Watch with Shivkaran: queue, save, and ask AI about this video." },
      { property: "og:title", content: "Watch on Shivkaran" },
      { property: "og:description", content: "Watch, save and understand YouTube videos with AI." },
      { property: "og:type", content: "video.other" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WatchPage,
});

function WatchPage() {
  const { videoId } = Route.useParams();
  const { ai } = Route.useSearch();
  const aiEnabled = useSettings((s) => s.aiEnabled);
  const details = useQuery(videoQuery(videoId));
  const v = details.data;
  const related = useQuery(relatedQuery(videoId, v?.title ?? "", v?.isMusic));
  const current = usePlayer(currentVideo);
  const playNow = usePlayer((s) => s.playNow);
  const seek = usePlayer((s) => s.controls?.seek);
  const setSlot = usePlayerSlot((s) => s.setSlot);
  const slotRef = useRef<HTMLDivElement>(null);
  const [showDesc, setShowDesc] = useState(false);

  useEffect(() => {
    setSlot(slotRef.current);
    return () => setSlot(null);
  }, [setSlot]);

  // Ensure this video is the one playing.
  useEffect(() => {
    if (current?.id === videoId) return;
    playNow(
      v ?? { id: videoId, title: "Loading…", channelTitle: "", thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Upgrade placeholder metadata in the queue once loaded.
  useEffect(() => {
    if (!v) return;
    usePlayer.setState((s) => ({ queue: s.queue.map((q) => (q.id === v.id ? { ...q, ...v } : q)) }));
  }, [v]);

  const chapters = v ? parseChapters(v.description) : [];
  const share = async () => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    if (navigator.share) await navigator.share({ title: v?.title, url }).catch(() => {});
    else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="min-w-0 space-y-5">
        <div ref={slotRef} className="aspect-video w-full rounded-2xl bg-surface" />
        {details.error ? (
          <ErrorState message="Couldn't load this video's details." onRetry={() => details.refetch()} />
        ) : !v ? (
          <div className="space-y-3">
            <div className="skel h-7 w-3/4 rounded" />
            <div className="skel h-4 w-1/3 rounded" />
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold leading-tight md:text-[28px]">{v.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                <Link to="/search" search={{ q: v.channelTitle, raw: true, order: "date" }} className="font-semibold text-foreground hover:text-primary">
                  {v.channelTitle}
                </Link>
                {" · "}
                {formatViews(v.viewCount)}
                {v.publishedAt && ` · ${new Date(v.publishedAt).toLocaleDateString()}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <SaveControls video={v} />
              <button onClick={share} className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 font-display text-[13px] font-semibold hover:bg-surface-strong">
                <Share2 className="size-4" /> Share
              </button>
              <a href={`https://www.youtube.com/watch?v=${videoId}#comments`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 font-display text-[13px] font-semibold hover:bg-surface-strong">
                <MessageSquare className="size-4" /> Comments {v.commentCount ? `(${v.commentCount.toLocaleString()})` : ""}
                <ExternalLink className="size-3" />
              </a>
            </div>

            {chapters.length > 0 && (
              <section className="glass rounded-2xl p-4">
                <h2 className="mb-3 font-display text-[15px] font-semibold">Chapters</h2>
                <div className="scrollbar-none flex gap-2 overflow-x-auto">
                  {chapters.map((c) => (
                    <button key={c.seconds} onClick={() => seek?.(c.seconds)} className="shrink-0 rounded-xl bg-secondary px-3 py-2 text-left text-xs hover:bg-surface-strong">
                      <span className="font-semibold text-primary">{formatDuration(c.seconds)}</span> <span className="text-muted-foreground">{c.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {v.description && (
              <section className="glass rounded-2xl p-4 text-sm">
                <p className={`whitespace-pre-line break-words text-muted-foreground ${showDesc ? "" : "line-clamp-3"}`}>{v.description}</p>
                <button onClick={() => setShowDesc(!showDesc)} className="mt-2 text-xs font-semibold text-primary">
                  {showDesc ? "Show less" : "Show more"}
                </button>
              </section>
            )}
          </>
        )}
      </div>

      <aside className="space-y-6">
        {aiEnabled && (
          <details open={!!ai} className="group glass rounded-2xl">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold">
              Ask Shiva.AI about this video
              <span className="text-xs text-muted-foreground group-open:hidden">Show</span>
              <span className="hidden text-xs text-muted-foreground group-open:inline">Hide</span>
            </summary>
            <div className="p-2 pt-0">
              <AskPanel videoId={videoId} videoTitle={v?.title} initialAction={ai as AiAction | undefined} />
            </div>
          </details>
        )}
        <section>
          <h2 className="mb-2 font-display text-[17px] font-semibold">Up next & related</h2>
          <div className="space-y-1">
            {related.isLoading
              ? Array.from({ length: 4 }).map((_, i) => <VideoCardSkeleton key={i} variant="row" />)
              : related.data?.map((r) => <VideoCard key={r.id} video={r} variant="row" />)}
          </div>
        </section>
      </aside>
    </div>
  );
}
