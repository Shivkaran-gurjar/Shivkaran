import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { History, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { rowToVideo, useHistory } from "@/hooks/use-library";
import { VideoCard, VideoCardSkeleton } from "@/components/video/VideoCard";
import { EmptyState } from "@/components/common/States";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "History — Shivkaran" },
      { name: "description", content: "Everything you've watched on Shivkaran." },
      { property: "og:title", content: "History — Shivkaran" },
      { property: "og:description", content: "Your watch history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const history = useHistory(100);
  const qc = useQueryClient();

  const remove = async (id: string) => {
    await supabase.from("watch_history").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["history"] });
    toast.success("Removed from history");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">History</h1>
      {history.isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <VideoCardSkeleton key={i} variant="row" />)}</div>
      ) : history.data?.length ? (
        <div className="max-w-3xl space-y-1">
          {history.data.map((h) => (
            <div key={h.id} className="group flex items-center">
              <div className="min-w-0 flex-1"><VideoCard video={rowToVideo(h)} variant="row" /></div>
              <span className="hidden w-24 text-right text-xs text-muted-foreground sm:block">{new Date(h.watched_at).toLocaleDateString()}</span>
              <button onClick={() => remove(h.id)} aria-label="Remove from history" className="ml-2 rounded-full p-2 text-muted-foreground hover:text-destructive">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<History className="size-5" />} title="No history yet" body="Videos you watch will appear here." />
      )}
    </div>
  );
}
