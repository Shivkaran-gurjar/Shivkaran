import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ListPlus, Play, Save, Shuffle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SquareRail } from "@/components/common/Rail";
import { ErrorState } from "@/components/common/States";
import { seedQuery } from "@/lib/queries";
import { musicOnly, shuffledMusic } from "@/lib/music";
import { usePlayer } from "@/store/player";
import { useVisible } from "@/store/settings";
import { useAuth } from "@/hooks/use-auth";
import { useCreatePlaylist } from "@/hooks/use-library";

export function GenreSection({ name, mixes }: { name: string; mixes: readonly string[] }) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [mix, setMix] = useState(mixes[0]);
  const { user } = useAuth();
  const create = useCreatePlaylist();
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "200px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const query = useQuery({ ...seedQuery({ q: mix, music: true }), enabled: visible });
  const videos = useVisible(musicOnly(query.data?.videos)) ?? [];
  const play = (shuffle = false) => {
    usePlayer.getState().playQueue(shuffle ? shuffledMusic(videos) : videos);
  };
  return <section ref={ref} className="min-w-0 border-t border-border pt-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold">{name}</h2>
      <div className="flex items-center gap-1">
        <Button size="sm" disabled={!videos.length} onClick={() => play()}><Play />Play mix</Button>
        <Button size="icon" variant="ghost" disabled={!videos.length} aria-label={`Shuffle ${name}`} title="Shuffle mix" onClick={() => play(true)}><Shuffle /></Button>
        <Button size="icon" variant="ghost" disabled={!videos.length} aria-label={`Add ${name} mix to queue`} title="Add mix to queue" onClick={() => { videos.forEach((v) => usePlayer.getState().addToQueue(v)); toast.success("Mix added to queue"); }}><ListPlus /></Button>
        <Button size="icon" variant="ghost" disabled={!videos.length || create.isPending} aria-label={`Save ${name} playlist`} title="Save playlist to your account" onClick={() => { if (!user) { toast.error("Sign in to save this playlist."); return; } create.mutate({ name: mix, videos }); }}><Save /></Button>
      </div>
    </div>
    <div className="mb-4 flex flex-wrap gap-2">{mixes.map((label) => <Button key={label} size="sm" variant={mix === label ? "secondary" : "ghost"} aria-pressed={mix === label} onClick={() => setMix(label)} className={mix === label ? "text-primary" : "text-muted-foreground"}>{label}</Button>)}</div>
    {query.isError ? <ErrorState message={(query.error as Error).message || "Couldn't load this mix."} onRetry={() => { void query.refetch(); }} /> : !query.isLoading && visible && !videos.length ? <p className="py-6 text-sm text-muted-foreground">No music found in this mix.</p> : <SquareRail videos={videos} loading={!visible || query.isLoading} inline />}
  </section>;
}