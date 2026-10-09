import type { ReactNode } from "react";
import type { VideoItem } from "@/lib/types";
import { VideoCard, VideoCardSkeleton } from "@/components/video/VideoCard";
import { useVisible } from "@/store/settings";
import { ErrorState, SectionHeader } from "./States";

export function VideoGrid({
  title,
  sub,
  videos,
  loading,
  error,
  onRetry,
  limit = 6,
  aiLabel,
  action,
}: {
  title: string;
  sub?: string;
  videos?: VideoItem[];
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  limit?: number;
  aiLabel?: string;
  action?: ReactNode;
}) {
  const visible = useVisible(videos);
  const list = visible?.slice(0, limit) ?? [];
  if (!loading && !error && list.length === 0) return null;
  return (
    <section>
      <SectionHeader title={title} sub={sub} action={action} />
      {error ? (
        <ErrorState message={(error as Error).message ?? "Couldn't load videos."} onRetry={onRetry} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? Array.from({ length: 3 }).map((_, i) => <VideoCardSkeleton key={i} />) : list.map((v) => <VideoCard key={v.id} video={v} context={list} aiLabel={aiLabel} />)}
        </div>
      )}
    </section>
  );
}

export function SquareRail({ videos: all, loading, inline }: { videos?: VideoItem[]; loading?: boolean; inline?: boolean }) {
  const videos = useVisible(all);
  return (
    <div className="scrollbar-none -mx-1 flex gap-4 overflow-x-auto px-1 pb-1">
      {loading ? Array.from({ length: 6 }).map((_, i) => <VideoCardSkeleton key={i} variant="square" />) : videos?.map((v) => <VideoCard key={v.id} video={v} context={videos} variant="square" inline={inline} />)}
    </div>
  );
}
