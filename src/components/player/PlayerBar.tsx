import { Link } from "@tanstack/react-router";
import { ListMusic, Maximize, MoreHorizontal, RotateCcw, RotateCw, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { currentVideo, usePlayer } from "@/store/player";
import { formatDuration } from "@/lib/format";
import { Slider } from "@/components/ui/slider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { QueueSheet } from "./QueueSheet";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const iconBtn = "grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-surface-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function PlayerBar() {
  const video = usePlayer(currentVideo);
  const s = usePlayer();
  if (!video) return null;
  const pct = s.duration ? (s.position / s.duration) * 100 : 0;

  const toggle = () => {
    if (!s.isPlaying) s.setMiniHidden(false);
    s.setPlaying(!s.isPlaying);
  };

  return (
    <div className="fixed inset-x-3 bottom-[68px] z-40 lg:bottom-4 lg:left-[264px] lg:right-4">
      <div className="glass-strong mx-auto max-w-[1100px] rounded-[22px] p-2.5 sm:p-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/watch/$videoId" params={{ videoId: video.id }} className="flex min-w-0 items-center gap-3 sm:w-56">
            <img src={video.thumbnail} alt="" className="size-11 shrink-0 rounded-xl object-cover sm:size-12" />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold">{video.title}</div>
              <div className="truncate text-[11px] text-muted-foreground">{video.channelTitle}</div>
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-1 sm:ml-0">
            <button className={cn(iconBtn, "hidden sm:grid", s.shuffle && "text-primary")} onClick={s.toggleShuffle} aria-label="Shuffle" aria-pressed={s.shuffle}>
              <Shuffle className="size-4" />
            </button>
            <button className={iconBtn} onClick={s.prev} aria-label="Previous">
              <SkipBack className="size-4 fill-current" />
            </button>
            <button className={cn(iconBtn, "hidden sm:grid")} onClick={() => s.skip(-10)} aria-label="Back 10 seconds">
              <RotateCcw className="size-4" />
            </button>
            <button onClick={toggle} aria-label={s.isPlaying ? "Pause" : "Play"} className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition-transform hover:scale-105">
              {s.isPlaying ? <Pause className="size-4 fill-current" /> : <Play className="size-4 translate-x-px fill-current" />}
            </button>
            <button className={cn(iconBtn, "hidden sm:grid")} onClick={() => s.skip(10)} aria-label="Forward 10 seconds">
              <RotateCw className="size-4" />
            </button>
            <button className={iconBtn} onClick={() => s.next()} aria-label="Next">
              <SkipForward className="size-4 fill-current" />
            </button>
            <button className={cn(iconBtn, "hidden sm:grid", s.repeat !== "off" && "text-primary")} onClick={s.cycleRepeat} aria-label={`Repeat: ${s.repeat}`}>
              {s.repeat === "one" ? <Repeat1 className="size-4" /> : <Repeat className="size-4" />}
            </button>
          </div>

          <div className="hidden min-w-[160px] flex-1 items-center gap-3 md:flex">
            <span className="w-12 text-right text-[11px] tabular-nums text-muted-foreground">{formatDuration(s.position)}</span>
            <Slider
              value={[pct]}
              max={100}
              step={0.1}
              onValueChange={([v]) => s.controls?.seek((v / 100) * s.duration)}
              aria-label="Seek"
              className="flex-1"
            />
            <span className="w-12 text-[11px] tabular-nums text-muted-foreground">{formatDuration(s.duration)}</span>
          </div>

          <div className="hidden items-center gap-1 lg:flex">
            <button className={iconBtn} onClick={s.toggleMute} aria-label={s.muted ? "Unmute" : "Mute"}>
              {s.muted || s.volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
            <Slider value={[s.muted ? 0 : s.volume]} max={100} onValueChange={([v]) => s.setVolume(v)} aria-label="Volume" className="w-20" />
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(iconBtn, "w-auto px-2 text-[11px] font-semibold")} aria-label="Playback speed">
                {s.rate}x
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Speed</DropdownMenuLabel>
                {(s.controls?.getRates() ?? [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]).map((r) => (
                  <DropdownMenuItem key={r} onSelect={() => s.setRate(r)}>
                    {r}x {r === s.rate && "✓"}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <button className={iconBtn} onClick={() => s.controls?.fullscreen()} aria-label="Full screen">
              <Maximize className="size-4" />
            </button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className={cn(iconBtn, (s.loopA !== null || s.sleepAt || s.sleepEndOfVideo) && "text-primary")} aria-label="More playback options">
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>A-B loop</DropdownMenuLabel>
              {video.isMusic && <DropdownMenuItem onSelect={() => s.setNowPlayingOpen(true)}>Music now playing</DropdownMenuItem>}
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); s.markLoop(); }}>
                {s.loopA === null || s.loopB !== null ? "Set start (A) here" : "Set end (B) here"}
              </DropdownMenuItem>
              {s.loopA !== null && (
                <DropdownMenuItem onSelect={s.clearLoop}>
                  Clear loop · {formatDuration(s.loopA)}{s.loopB !== null ? ` → ${formatDuration(s.loopB)}` : " → …"}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Sleep timer{s.sleepAt ? ` · ${Math.max(1, Math.round((s.sleepAt - Date.now()) / 60000))} min left` : s.sleepEndOfVideo ? " · end of video" : ""}</DropdownMenuLabel>
              {[15, 30, 45, 60].map((m) => (
                <DropdownMenuItem key={m} onSelect={() => s.setSleep(m)}>{m} minutes</DropdownMenuItem>
              ))}
              <DropdownMenuItem onSelect={() => s.setSleep(null, true)}>End of this video</DropdownMenuItem>
              {(s.sleepAt || s.sleepEndOfVideo) && <DropdownMenuItem onSelect={() => s.setSleep(null)}>Turn off timer</DropdownMenuItem>}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => s.setRate(1)}>Reset speed (1x)</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => { s.setMiniHidden(false); s.toggleMiniLarge(); }}>{s.miniLarge ? "Smaller" : "Larger"} mini player</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {video.isMusic && <Button variant="ghost" size="icon" className="shrink-0" onClick={() => s.setNowPlayingOpen(true)} aria-label="Open music now playing" title="Music now playing"><Maximize className="size-4" /></Button>}
          <QueueSheet>
            <button className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-[12px] font-semibold text-accent hover:bg-surface-strong" aria-label="Open queue">
              <ListMusic className="size-4" />
              <span className="hidden whitespace-nowrap xl:inline">Queue · {s.queue.length}</span>
            </button>
          </QueueSheet>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-strong md:hidden">
          <div className="h-full bg-brand-gradient" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
