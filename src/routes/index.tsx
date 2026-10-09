import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Play } from "lucide-react";
import { trendingQuery, seedQuery } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";
import { rowToVideo, useHistory, useSaved } from "@/hooks/use-library";
import { buildSeeds } from "@/lib/recommendations";
import { usePlayer } from "@/store/player";
import { formatDuration } from "@/lib/format";
import { VideoGrid, SquareRail } from "@/components/common/Rail";
import { SectionHeader } from "@/components/common/States";
import { VideoCard } from "@/components/video/VideoCard";
import { SmartQueueForm } from "@/components/player/QueueSheet";
import { LogoMark } from "@/components/layout/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shivkaran — Your YouTube. Smarter." },
      { name: "description", content: "Your personalized YouTube home: continue watching, smart recommendations, music and AI summaries." },
      { property: "og:title", content: "Shivkaran — Your YouTube. Smarter." },
      { property: "og:description", content: "Discover, watch, listen, and understand YouTube with AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { user } = useAuth();
  const history = useHistory(30);
  const saved = useSaved();
  const trending = useQuery(trendingQuery("all"));
  const music = useQuery(trendingQuery("music"));
  const learning = useQuery(trendingQuery("education"));
  const playNow = usePlayer((s) => s.playNow);
  const addToQueue = usePlayer((s) => s.addToQueue);

  const rows = history.data ?? [];
  const inProgress = rows.filter((r) => r.duration_seconds > 0 && r.progress_seconds > 20 && r.progress_seconds / r.duration_seconds < 0.92);
  const hero = inProgress[0];
  const seed = useMemo(() => buildSeeds(rows.filter((r) => !r.is_music), 1)[0], [rows]);
  const recommended = useQuery({ ...seedQuery({ q: seed?.query ?? "" }), enabled: !!seed });
  const recentMusic = rows.filter((r) => r.is_music).slice(0, 10).map(rowToVideo);
  const recentlySaved = (saved.data ?? []).slice(0, 3).map(rowToVideo);

  return (
    <div className="space-y-12">
      {hero ? (
        <section className="glass relative overflow-hidden rounded-[28px] p-5">
          <div className="pointer-events-none absolute -right-10 -top-16 size-64 rounded-full bg-primary/25 blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-16 left-10 size-56 rounded-full bg-accent/20 blur-[90px]" />
          <div className="relative grid items-center gap-6 md:grid-cols-[1.1fr_1fr]">
            <div>
              <span className="inline-flex rounded-full border border-border bg-secondary px-3 py-1.5 text-[11px] font-semibold tracking-wide text-primary">CONTINUE WATCHING</span>
              <h1 className="mt-4 line-clamp-3 text-3xl font-bold leading-[1.05] md:text-[40px]">{hero.title}</h1>
              <p className="mt-3 max-w-md text-[15px] text-muted-foreground">{hero.channel_title}</p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link to="/watch/$videoId" params={{ videoId: hero.video_id }} onClick={() => playNow(rowToVideo(hero))} className="rounded-full bg-primary px-5 py-2.5 font-display text-[13px] font-semibold text-primary-foreground">
                  Resume · {formatDuration(hero.progress_seconds)}
                </Link>
                <button onClick={() => addToQueue(rowToVideo(hero))} className="rounded-full border border-border bg-secondary px-5 py-2.5 font-display text-[13px] font-semibold hover:bg-surface-strong">
                  Add to queue
                </button>
                <Link to="/watch/$videoId" params={{ videoId: hero.video_id }} search={{ ai: "summary" }} onClick={() => playNow(rowToVideo(hero))} className="rounded-full border border-border bg-secondary px-5 py-2.5 font-display text-[13px] font-semibold text-accent hover:bg-surface-strong">
                  Summarize
                </Link>
              </div>
            </div>
            <img src={rowToVideo(hero).thumbnail} alt="" className="aspect-video w-full rounded-2xl object-cover" />
          </div>
        </section>
      ) : (
        <section className="glass relative overflow-hidden rounded-[28px] p-6 md:p-10">
          <div className="pointer-events-none absolute -right-10 -top-16 size-72 rounded-full bg-primary/25 blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-20 left-10 size-64 rounded-full bg-accent/20 blur-[90px]" />
          <div className="relative max-w-2xl">
            <span className="inline-flex rounded-full border border-border bg-secondary px-3 py-1.5 text-[11px] font-semibold tracking-wide text-primary">YOUR YOUTUBE. SMARTER.</span>
            <h1 className="mt-4 text-4xl font-bold leading-[1.05] md:text-5xl">Discover, watch, listen, and understand.</h1>
            <p className="mt-4 text-[15px] text-muted-foreground">Search in plain words, build queues with AI, and get summaries, notes and quizzes for any video.</p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link to="/search" search={{ q: "beginner Python tutorials around 30 minutes" }} className="rounded-full bg-primary px-5 py-2.5 font-display text-[13px] font-semibold text-primary-foreground">
                Try a smart search
              </Link>
              {!user && (
                <Link to="/auth" className="rounded-full border border-border bg-secondary px-5 py-2.5 font-display text-[13px] font-semibold hover:bg-surface-strong">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {inProgress.length > 1 && (
        <section>
          <SectionHeader title="Continue watching" sub={`${inProgress.length} in progress`} />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {inProgress.slice(1, 4).map((r) => (
              <VideoCard key={r.id} video={rowToVideo(r)} progress={r.progress_seconds / r.duration_seconds} />
            ))}
          </div>
        </section>
      )}

      {seed && (
        <VideoGrid title="Recommended for you" sub={seed.reason} videos={recommended.data?.videos} loading={recommended.isLoading} error={recommended.error} onRetry={() => recommended.refetch()} />
      )}

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="glass min-w-0 rounded-[26px] p-5">
          <h2 className="font-display text-[19px] font-semibold">Music for you</h2>
          <p className="mb-4 mt-1 text-[13px] text-muted-foreground">{recentMusic.length ? "Recently played" : "Trending in India"}</p>
          <SquareRail videos={recentMusic.length ? recentMusic : music.data} loading={!recentMusic.length && music.isLoading} />
        </div>
        <div className="glass flex flex-col rounded-[26px] p-5">
          <div className="flex items-center gap-2">
            <LogoMark size="sm" />
            <h2 className="font-display text-[15px] font-semibold">Quick AI</h2>
          </div>
          <p className="mb-4 mt-3 text-[13px] text-muted-foreground">Describe a session and Shivkaran builds the queue from real YouTube results.</p>
          <SmartQueueForm />
          <Link to="/ai" className="mt-auto flex items-center gap-2 pt-4 text-[13px] font-semibold text-primary">
            <Play className="size-3.5" /> Ask about any video
          </Link>
        </div>
      </section>

      <VideoGrid title="Trending" sub="Most popular in India right now" videos={trending.data} loading={trending.isLoading} error={trending.error} onRetry={() => trending.refetch()} />

      <VideoGrid title="Learn something" sub="Educational picks" videos={learning.data} loading={learning.isLoading} error={learning.error} aiLabel="Key points" limit={3} />

      {recentlySaved.length > 0 && (
        <VideoGrid title="Recently saved" videos={recentlySaved} action={<Link to="/library" className="text-[13px] font-semibold text-primary">Library</Link>} />
      )}
    </div>
  );
}
