import { useSettings } from "@/store/settings";
/**
 * The one official YouTube IFrame player for the whole app. It stays mounted so
 * playback continues across pages: docked over the Watch page slot, otherwise a
 * visible mini player. No media is downloaded or extracted.
 */
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Expand, Grip, Maximize2, Minimize2, Move, X } from "lucide-react";
import { currentVideo, usePlayer, usePlayerSlot } from "@/store/player";
import { useAuth } from "@/hooks/use-auth";
import { recordWatch } from "@/hooks/use-library";
import { Button } from "@/components/ui/button";

type MiniFrame = { x: number; y: number; width: number };
type PointerAction = { kind: "move" | "resize"; startX: number; startY: number; frame: MiniFrame };

const MINI_ASPECT_RATIO = 16 / 9;
const MINI_MIN_WIDTH = 240;

function clampFrame(frame: MiniFrame): MiniFrame {
  const maxWidth = Math.max(MINI_MIN_WIDTH, Math.min(720, window.innerWidth - 24));
  const width = Math.min(maxWidth, Math.max(MINI_MIN_WIDTH, frame.width));
  const height = width / MINI_ASPECT_RATIO;
  return {
    width,
    x: Math.min(Math.max(12, frame.x), Math.max(12, window.innerWidth - width - 12)),
    y: Math.min(Math.max(12, frame.y), Math.max(12, window.innerHeight - height - 84)),
  };
}

interface YTPlayer {
  loadVideoById(id: string, start?: number): void;
  cueVideoById(id: string): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(s: number, allow: boolean): void;
  setVolume(v: number): void;
  mute(): void;
  unMute(): void;
  setPlaybackRate(r: number): void;
  getAvailablePlaybackRates(): number[];
  getCurrentTime(): number;
  getDuration(): number;
  getIframe(): HTMLIFrameElement;
  setPlaybackQuality?(q: string): void;
  setSize?(w: number, h: number): void;
  destroy(): void;
}

declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: unknown) => YTPlayer; PlayerState: Record<string, number> };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.getElementById("yt-iframe-api")) {
      const s = document.createElement("script");
      s.id = "yt-iframe-api";
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      document.head.appendChild(s);
    }
  });
}

export function YouTubeEngine() {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const loadedId = useRef<string | null>(null);
  const video = usePlayer(currentVideo);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const miniHidden = usePlayer((s) => s.miniHidden);
  const miniLarge = usePlayer((s) => s.miniLarge);
  const musicSlot = usePlayerSlot((s) => s.musicSlot);
  const slot = usePlayerSlot((s) => s.musicSlot ?? s.slot);
  const { user } = useAuth();
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [miniFrame, setMiniFrame] = useState<MiniFrame | null>(null);
  const [interacting, setInteracting] = useState(false);
  const pointerAction = useRef<PointerAction | null>(null);

  // Create player once.
  useEffect(() => {
    let cancelled = false;
    loadApi().then(() => {
      if (cancelled || !hostRef.current || !window.YT) return;
      const el = document.createElement("div");
      hostRef.current.appendChild(el);
      playerRef.current = new window.YT.Player(el, {
        width: "100%",
        height: "100%",
        host: "https://www.youtube.com",
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1, iv_load_policy: 3, enablejsapi: 1, vq: "hd1080", origin: window.location.origin },
        events: {
          onReady: () => {
            const p = playerRef.current;
            if (!p) return;
            const s = usePlayer.getState();
            p.setVolume(s.volume);
            const f = p.getIframe();
            f.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture; fullscreen");
            f.setAttribute("allowfullscreen", "");
            s.setControls({
              play: () => p.playVideo(),
              pause: () => p.pauseVideo(),
              seek: (t) => p.seekTo(t, true),
              setVolume: (v) => p.setVolume(v),
              mute: () => p.mute(),
              unMute: () => p.unMute(),
              setRate: (r) => p.setPlaybackRate(r),
              getRates: () => p.getAvailablePlaybackRates?.() ?? [0.5, 0.75, 1, 1.25, 1.5, 2],
              fullscreen: () => p.getIframe().requestFullscreen?.(),
            });
            setReady(true);
          },
          onStateChange: (e: { data: number }) => {
            const st = usePlayer.getState();
            if (e.data === 1) {
              st.setPlaying(true);
              playerRef.current?.setPlaybackRate(st.rate);
            } else if (e.data === 3) playerRef.current?.setPlaybackQuality?.("hd1080");
            if (e.data === 1) return;
            else if (e.data === 2) st.setPlaying(false);
            else if (e.data === 0) st.next(true);
          },
          onError: () => {
            // Unembeddable / removed video: skip to next.
            usePlayer.getState().next(true);
          },
        },
      });
    });
    return () => {
      cancelled = true;
      usePlayer.getState().setControls(null);
      playerRef.current?.destroy();
    };
  }, []);

  // Load video when current changes.
  useEffect(() => {
    const p = playerRef.current;
    if (!ready || !p) return;
    if (!video) {
      loadedId.current = null;
      p.pauseVideo();
      return;
    }
    if (loadedId.current === video.id) return;
    loadedId.current = video.id;
    const start = useSettings.getState().rememberPosition ? usePlayer.getState().resume[video.id] ?? 0 : 0;
    if (usePlayer.getState().isPlaying) p.loadVideoById(video.id, start);
    else p.cueVideoById(video.id);
  }, [ready, video]);

  // Sync play/pause intent.
  useEffect(() => {
    const p = playerRef.current;
    if (!ready || !p || !video) return;
    if (isPlaying) p.playVideo();
    else p.pauseVideo();
  }, [isPlaying, ready, video]);

  // Progress polling + history writes.
  useEffect(() => {
    if (!ready) return;
    let tick = 0;
    const iv = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      const pos = p.getCurrentTime?.() ?? 0;
      const dur = p.getDuration?.() ?? 0;
      const st = usePlayer.getState();
      st.setProgress(pos, dur);
      tick++;
      const v = currentVideo(st);
      if (st.loopA !== null && st.loopB !== null && pos >= st.loopB) p.seekTo(st.loopA, true);
      if (st.sleepAt && Date.now() >= st.sleepAt) {
        st.setPlaying(false);
        st.setSleep(null);
      }
      if (v && st.isPlaying && tick % 5 === 0) st.saveResume(v.id, pos, dur);
      if (user && v && usePlayer.getState().isPlaying && (tick === 5 || tick % 30 === 0)) {
        if (useSettings.getState().saveWatchHistory) void recordWatch(user.id, v, pos, dur);
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [ready, user, video?.id]);

  // Track watch-page slot.
  useLayoutEffect(() => {
    if (!slot) {
      setRect(null);
      return;
    }
    const update = () => {
      const r = slot.getBoundingClientRect();
      setRect({ top: r.top + (musicSlot ? 0 : window.scrollY), left: r.left + (musicSlot ? 0 : window.scrollX), width: r.width, height: r.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(slot);
    ro.observe(document.body);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [slot, musicSlot]);

  const docked = !!rect;
  const showMini = !docked && !!video && !miniHidden;

  useEffect(() => {
    if (!showMini) return;
    const placeOrClamp = () => {
      setMiniFrame((current) => {
        if (current) return clampFrame(current);
        const width = Math.min(miniLarge ? 640 : 400, window.innerWidth - 24);
        const height = width / MINI_ASPECT_RATIO;
        return clampFrame({ x: window.innerWidth - width - 16, y: window.innerHeight - height - 112, width });
      });
    };
    placeOrClamp();
    window.addEventListener("resize", placeOrClamp);
    return () => window.removeEventListener("resize", placeOrClamp);
  }, [showMini]);

  const beginPointerAction = (kind: PointerAction["kind"], event: ReactPointerEvent<HTMLElement>) => {
    if (!miniFrame) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerAction.current = { kind, startX: event.clientX, startY: event.clientY, frame: miniFrame };
    setInteracting(true);
  };

  const updatePointerAction = (event: ReactPointerEvent<HTMLElement>) => {
    const action = pointerAction.current;
    if (!action) return;
    const dx = event.clientX - action.startX;
    const dy = event.clientY - action.startY;
    if (action.kind === "move") {
      setMiniFrame(clampFrame({ ...action.frame, x: action.frame.x + dx, y: action.frame.y + dy }));
      return;
    }
    const widthDelta = Math.abs(dx) > Math.abs(dy) ? dx : dy * MINI_ASPECT_RATIO;
    setMiniFrame(clampFrame({ ...action.frame, width: action.frame.width + widthDelta }));
  };

  const endPointerAction = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    pointerAction.current = null;
    setInteracting(false);
  };

  const togglePresetSize = () => {
    const nextLarge = !miniLarge;
    usePlayer.getState().toggleMiniLarge();
    setMiniFrame((current) => {
      if (!current) return current;
      const width = Math.min(nextLarge ? 640 : 400, window.innerWidth - 24);
      return clampFrame({ ...current, width });
    });
  };

  return (
    <div
      aria-label="Video player"
      className={
        docked
          ? musicSlot ? "fixed z-[60] overflow-hidden rounded-lg" : "absolute z-20 overflow-hidden rounded-2xl"
          : showMini
            ? "fixed z-40 aspect-video overflow-hidden rounded-2xl border border-border shadow-glow"
            : "pointer-events-none fixed -left-[9999px] top-0 h-[720px] w-[1280px] opacity-0"
      }
      style={
        docked
          ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
          : showMini && miniFrame
            ? { left: miniFrame.x, top: miniFrame.y, width: miniFrame.width }
            : undefined
      }
    >
      <div ref={hostRef} className={`h-full w-full bg-background ${interacting ? "pointer-events-none" : ""}`} />
      {showMini && video && (
        <>
          <div
            className="absolute left-2 top-2 flex touch-none cursor-move items-center gap-1"
            onPointerDown={(event) => beginPointerAction("move", event)}
            onPointerMove={updatePointerAction}
            onPointerUp={endPointerAction}
            onPointerCancel={endPointerAction}
            aria-label="Move mini player"
            title="Drag to move"
          >
            <span className="grid size-7 place-items-center rounded-full glass-strong text-foreground">
              <Move className="size-3.5" />
            </span>
          </div>
          <div className="absolute right-2 top-2 flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={togglePresetSize}
            className="size-7 rounded-full glass-strong text-foreground hover:bg-surface-strong"
            aria-label={miniLarge ? "Smaller mini player" : "Larger mini player"}
            title={miniLarge ? "Smaller player" : "Larger player"}
          >
            {miniLarge ? <Minimize2 className="size-3.5" /> : <Expand className="size-3.5" />}
          </Button>
          <Link
            to="/watch/$videoId"
            params={{ videoId: video.id }}
            className="grid size-7 place-items-center rounded-full glass-strong text-foreground hover:bg-surface-strong"
            aria-label="Open full player"
          >
            <Maximize2 className="size-3.5" />
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => usePlayer.getState().setMiniHidden(true)}
            className="size-7 rounded-full glass-strong text-foreground hover:bg-surface-strong"
            aria-label="Hide mini player"
            title="Hide player"
          >
            <X className="size-3.5" />
          </Button>
          </div>
          <div
            className="absolute bottom-1 right-1 grid size-8 touch-none cursor-nwse-resize place-items-center rounded-full glass-strong text-foreground"
            onPointerDown={(event) => beginPointerAction("resize", event)}
            onPointerMove={updatePointerAction}
            onPointerUp={endPointerAction}
            onPointerCancel={endPointerAction}
            aria-label="Resize mini player"
            title="Drag to resize"
          >
            <Grip className="size-4 rotate-45" />
          </div>
        </>
      )}
    </div>
  );
}
