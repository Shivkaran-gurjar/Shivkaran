import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ListMusic, Mic2, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, VolumeX, Share2, Maximize } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { currentVideo, usePlayer, usePlayerSlot } from "@/store/player";
import { videoQuery } from "@/lib/queries";
import { descriptionLyrics } from "@/lib/music";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SleepTimer } from "./SleepTimer";
import { SaveControls } from "@/components/video/SaveControls";

export function NowPlaying() {
  const s = usePlayer();
  const video = currentVideo(s);
  const setSlot = usePlayerSlot((state) => state.setMusicSlot);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const details = useQuery({ ...videoQuery(video?.id ?? ""), enabled: !!video && s.nowPlayingOpen && lyricsOpen });
  useEffect(() => {
    if (!s.nowPlayingOpen || !video) setSlot(null);
    return () => setSlot(null);
  }, [s.nowPlayingOpen, !!video, setSlot]);
  const lyrics = descriptionLyrics(details.data?.description ?? "");
  if (!video) return null;
  const icon = (label: string, action: () => void, child: React.ReactNode, active = false) => <Button variant="ghost" size="icon" className={cn("size-11 rounded-full", active && "text-primary")} aria-label={label} title={label} onClick={action}>{child}</Button>;
  return <Dialog.Root modal={false} open={s.nowPlayingOpen} onOpenChange={s.setNowPlayingOpen}>
    <Dialog.Portal>
      <Dialog.Content className="fixed inset-0 z-50 overflow-y-auto bg-background p-3 sm:p-6" aria-describedby={undefined} onInteractOutside={(e) => e.preventDefault()}>
        <div className="mx-auto max-w-6xl">
          <header className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <Dialog.Title className="font-display text-lg font-semibold">Now playing</Dialog.Title>
            <Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Close now playing" title="Back to browsing"><ChevronDown /></Button></Dialog.Close>
          </header>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
            <div className="min-w-0">
              <div ref={setSlot} className="aspect-video min-h-[200px] w-full bg-muted" aria-label="Now playing video slot" />
              <div className="mt-4 flex h-9 items-end justify-center gap-1" role="img" aria-label="Decorative equalizer animation, not audio-reactive" title="Decorative animation — not audio-reactive">
                {Array.from({ length: 32 }, (_, i) => <span key={i} className={cn("equalizer-bar w-1.5 origin-bottom rounded-t-sm bg-primary", i % 3 === 0 && "bg-accent", i % 5 === 0 && "bg-coral", !s.isPlaying && "equalizer-paused")} />)}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="w-12 text-xs tabular-nums text-muted-foreground">{formatDuration(s.position)}</span>
                <Slider value={[s.position]} max={s.duration || 1} step={1} disabled={!s.duration} onValueChange={([v]) => s.controls?.seek(v)} aria-label="Now playing seek" />
                <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">{formatDuration(s.duration)}</span>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 sm:gap-4">
                {icon("Shuffle", s.toggleShuffle, <Shuffle />, s.shuffle)}
                {icon("Previous song", s.prev, <SkipBack />)}
                <Button className="size-14 rounded-full" size="icon" aria-label={s.isPlaying ? "Pause song" : "Play song"} onClick={() => s.setPlaying(!s.isPlaying)}>{s.isPlaying ? <Pause /> : <Play />}</Button>
                {icon("Next song", () => s.next(), <SkipForward />)}
                {icon(`Repeat ${s.repeat}`, s.cycleRepeat, s.repeat === "one" ? <Repeat1 /> : <Repeat />, s.repeat !== "off")}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {icon(s.muted ? "Unmute music" : "Mute music", s.toggleMute, s.muted ? <VolumeX /> : <Volume2 />)}
                <Slider className="w-24" value={[s.muted ? 0 : s.volume]} max={100} onValueChange={([v]) => s.setVolume(v)} aria-label="Now playing volume" />
                <SleepTimer />
                {icon("Video fullscreen", () => s.controls?.fullscreen(), <Maximize />)}
              </div>
            </div>
            <div className="min-w-0">
              <p className="mb-2 text-xs font-semibold uppercase text-primary">Shivkaran Music</p>
              <h1 className="break-words text-2xl font-semibold leading-snug">{video.title}</h1>
              <p className="mb-5 mt-2 text-sm text-muted-foreground">{video.channelTitle}</p>
              <SaveControls video={video} />
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="secondary" aria-pressed={lyricsOpen} onClick={() => setLyricsOpen(!lyricsOpen)}><Mic2 />Lyrics</Button>
                <Button variant="secondary" onClick={() => s.setQueueOpen(true)}><ListMusic />Queue · {s.queue.length}</Button>
                <Button variant="ghost" size="icon" aria-label="Share song" title="Copy song link" onClick={() => { void navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${video.id}`).then(() => toast.success("Song link copied"), () => toast.error("Couldn't copy link")); }}><Share2 /></Button>
              </div>
              {lyricsOpen && <section className="mt-6 border-t border-border pt-5">
                <h2 className="mb-3 text-lg font-semibold">Lyrics</h2>
                {details.isPending ? <p className="text-sm text-muted-foreground">Loading creator's description…</p> : details.isError ? <div><p className="text-sm text-muted-foreground">Couldn't load lyrics availability.</p><Button variant="link" onClick={() => { void details.refetch(); }}>Retry</Button></div> : lyrics ? <><p className="mb-3 text-xs text-muted-foreground">From the creator's description · not time-synced</p><p className="whitespace-pre-wrap break-words text-sm leading-7">{lyrics}</p></> : <p className="text-sm leading-6 text-muted-foreground">The creator hasn't provided lyrics in this video's description. Captions may be available in the YouTube player.</p>}
              </section>}
              <section className="mt-6 border-t border-border pt-5">
                <h2 className="mb-3 text-sm font-semibold">Up next</h2>
                {s.queue.slice(s.index + 1, s.index + 4).map((v, i) => <Button key={`${v.id}-${i}`} variant="ghost" className="mb-1 h-auto w-full justify-start whitespace-normal p-2 text-left" onClick={() => s.jumpTo(s.index + i + 1)}><img src={v.thumbnail} alt="" className="h-12 w-16 shrink-0 rounded-md object-cover" /><span className="line-clamp-2 min-w-0 text-xs">{v.title}</span></Button>)}
                {s.index >= s.queue.length - 1 && <p className="text-sm text-muted-foreground">No more songs queued.</p>}
              </section>
            </div>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}