import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { EyeOff, ListPlus, Play } from "lucide-react";
import { useSettings } from "@/store/settings";
import type { VideoItem } from "@/lib/types";
import { formatDuration, formatViews } from "@/lib/format";
import { usePlayer } from "@/store/player";
import { toast } from "sonner";


interface Props {
  video: VideoItem;
  context?: VideoItem[];
  progress?: number; // 0..1
  reason?: string;
  aiLabel?: string;
  variant?: "card" | "square" | "row";
  /** Play in the mini player instead of opening the watch page (music-style playback). */
  inline?: boolean;
}

function VideoCardBase({ video, context, progress, reason, aiLabel = "Summarize", variant = "card", inline = false }: Props) {
  const addToQueue = usePlayer((s) => s.addToQueue);
  const playNow = usePlayer((s) => s.playNow);

  const queue = (e: React.MouseEvent) => {
    e.preventDefault();
    addToQueue(video);
    toast.success("Added to queue");
  };

  if (variant === "row") {
    return (
      <div className="group flex items-center gap-3 rounded-2xl p-2 hover:bg-surface">
        <Link to="/watch/$videoId" params={{ videoId: video.id }} onClick={() => playNow(video, context)} className="relative w-40 shrink-0 overflow-hidden rounded-xl">
          <img src={video.thumbnail} alt="" loading="lazy" className="aspect-video w-full object-cover" />
          {!!video.durationSeconds && <Duration s={video.durationSeconds} />}
        </Link>
        <div className="min-w-0 flex-1">
          <Link to="/watch/$videoId" params={{ videoId: video.id }} onClick={() => playNow(video, context)} className="line-clamp-2 font-display text-sm font-semibold leading-snug hover:text-primary">
            {video.title}
          </Link>
          <p className="mt-1 truncate text-xs text-muted-foreground">{video.channelTitle}</p>
        </div>
        <button onClick={queue} aria-label="Add to queue" className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground opacity-0 hover:bg-surface-strong hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100">
          <ListPlus className="size-4" />
        </button>
      </div>
    );
  }

  if (variant === "square") {
    const playInline = () => {
      usePlayer.getState().setMiniHidden(false);
      playNow(video, context);
    };
    return (
      <div className="group w-40 shrink-0 sm:w-44">
        {inline ? (
          <button onClick={playInline} aria-label={`Play ${video.title}`} className="relative block w-full overflow-hidden rounded-2xl text-left">
            <img src={video.thumbnail} alt="" loading="lazy" className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <span className="absolute bottom-2 right-2 grid size-9 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-glow transition-opacity group-hover:opacity-100">
              <Play className="size-4 fill-current" />
            </span>
          </button>
        ) : (
          <Link to="/watch/$videoId" params={{ videoId: video.id }} onClick={() => playNow(video, context)} className="relative block overflow-hidden rounded-2xl">
            <img src={video.thumbnail} alt="" loading="lazy" className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <span className="absolute bottom-2 right-2 grid size-9 place-items-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-glow transition-opacity group-hover:opacity-100">
              <Play className="size-4 fill-current" />
            </span>
          </Link>
        )}
        <p className="mt-2 truncate text-[13px] font-semibold">{video.title}</p>
        <p className="truncate text-[11px] text-muted-foreground">{video.channelTitle}</p>
      </div>
    );
  }

  return (
    <article className="group glass rounded-[22px] p-3 transition-colors hover:bg-surface-strong">
      <Link to="/watch/$videoId" params={{ videoId: video.id }} onClick={() => playNow(video, context)} className="relative block overflow-hidden rounded-xl">
        <img src={video.thumbnail} alt="" loading="lazy" className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        {!!video.durationSeconds && <Duration s={video.durationSeconds} />}
        {progress != null && progress > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-surface-strong">
            <div className="h-full bg-primary" style={{ width: `${Math.min(100, progress * 100)}%` }} />
          </div>
        )}
      </Link>
      <div className="px-1 pb-1 pt-3">
        {reason && <p className="mb-1 truncate text-[11px] font-semibold text-accent">{reason}</p>}
        <Link to="/watch/$videoId" params={{ videoId: video.id }} onClick={() => playNow(video, context)} className="line-clamp-2 font-display text-[15px] font-semibold leading-snug hover:text-primary">
          {video.title}
        </Link>
        <p className="mt-1 truncate text-[13px] text-muted-foreground">
          {[video.channelTitle, video.viewCount != null ? formatViews(video.viewCount) : null].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-3 flex gap-2">
          <Link
            to="/watch/$videoId"
            params={{ videoId: video.id }}
            search={{ ai: "summary" }}
            onClick={() => playNow(video, context)}
            className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/25"
          >
            {aiLabel}
          </Link>
          <button onClick={queue} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
            Queue
          </button>
          <button onClick={() => { usePlayer.getState().playNext(video); toast.success("Plays next"); }} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
            Play next
          </button>
          <button
            aria-label="Not interested"
            title="Not interested"
            onClick={() => {
              useSettings.getState().hideVideo(video.id);
              toast("Hidden — we'll show less like this", {
                action: { label: "Hide channel", onClick: () => useSettings.getState().hideChannel(video.channelTitle) },
              });
            }}
            className="ml-auto grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <EyeOff className="size-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

function Duration({ s }: { s: number }) {
  return (
    <span className="absolute bottom-2 right-2 rounded-md bg-background/80 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
      {formatDuration(s)}
    </span>
  );
}

export const VideoCard = memo(VideoCardBase);

export function VideoCardSkeleton({ variant = "card" }: { variant?: "card" | "square" | "row" }) {
  if (variant === "square")
    return (
      <div className="w-40 shrink-0 sm:w-44">
        <div className="skel aspect-square rounded-2xl" />
        <div className="skel mt-2 h-3 w-3/4 rounded" />
      </div>
    );
  if (variant === "row")
    return (
      <div className="flex gap-3 p-2">
        <div className="skel aspect-video w-40 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skel h-3 w-full rounded" />
          <div className="skel h-3 w-1/2 rounded" />
        </div>
      </div>
    );
  return (
    <div className="glass rounded-[22px] p-3">
      <div className="skel aspect-video rounded-xl" />
      <div className="skel mt-3 h-4 w-4/5 rounded" />
      <div className="skel mt-2 h-3 w-1/2 rounded" />
    </div>
  );
}
