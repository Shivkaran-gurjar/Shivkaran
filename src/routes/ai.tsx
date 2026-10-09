import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { extractVideoId } from "@/lib/format";
import { SmartQueueForm } from "@/components/player/QueueSheet";
import { useHistory, rowToVideo } from "@/hooks/use-library";
import { VideoCard } from "@/components/video/VideoCard";
import { SectionHeader } from "@/components/common/States";
import { LogoMark } from "@/components/layout/Logo";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "Ask Shivkaran — AI for YouTube" },
      { name: "description", content: "Summaries, notes, quizzes and smart queues for any YouTube video." },
      { property: "og:title", content: "Ask Shivkaran — AI for YouTube" },
      { property: "og:description", content: "Understand any YouTube video with AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AiPage,
});

function AiPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const history = useHistory(6);

  const open = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractVideoId(url);
    if (!id) return toast.error("Paste a valid YouTube link or video ID.");
    navigate({ to: "/watch/$videoId", params: { videoId: id }, search: { ai: "summary" } });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <section className="glass relative overflow-hidden rounded-[28px] p-6 md:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 size-64 rounded-full bg-accent/25 blur-[90px]" />
        <div className="relative">
          <LogoMark />
          <h1 className="mt-4 text-3xl font-bold md:text-4xl">Ask Shivkaran</h1>
          <p className="mt-2 text-muted-foreground">Content → AI → Action. Paste any video to summarize, take notes, or quiz yourself.</p>
          <form onSubmit={open} className="mt-6 flex items-center gap-2 rounded-2xl border border-border bg-secondary p-2 pl-4">
            <Link2 className="size-4 text-muted-foreground" />
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/watch?v=…" className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none" aria-label="YouTube link" />
            <button className="rounded-xl bg-primary px-4 py-2 font-display text-[13px] font-semibold text-primary-foreground">Summarize</button>
          </form>
        </div>
      </section>

      <section className="glass rounded-[26px] p-6">
        <SectionHeader title="Smart queue" sub="Describe a session; Shivkaran builds it from real YouTube results." />
        <SmartQueueForm />
      </section>

      {!!history.data?.length && (
        <section>
          <SectionHeader title="Ask about something you watched" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {history.data.slice(0, 6).map((h) => <VideoCard key={h.id} video={rowToVideo(h)} aiLabel="Ask AI" />)}
          </div>
        </section>
      )}
    </div>
  );
}
