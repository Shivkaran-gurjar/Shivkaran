import { useEffect } from "react";
import { usePlayer } from "@/store/player";

/** Space/K play-pause, J/L ±10s, ←/→ ±5s, N next, P previous, Q queue, / search, M mute, F fullscreen, ↑/↓ volume, </> speed, 0-9 jump, A loop A-B, S shuffle, R repeat. */
export function usePlayerShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable=true]")) return;
      if (e.key === " " && t.closest("button, a, [role=slider]")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const s = usePlayer.getState();
      const k = e.key.toLowerCase();
      if (e.key === "/") {
        e.preventDefault();
        (document.getElementById("global-search") as HTMLInputElement | null)?.focus();
        return;
      }
      if (k === "q" && !e.shiftKey) return s.setQueueOpen(!s.queueOpen);
      if (s.index < 0) return;
      if (k === " " || k === "k") {
        e.preventDefault();
        s.setPlaying(!s.isPlaying);
      } else if (k === "j") s.controls?.seek(Math.max(0, s.position - 10));
      else if (k === "l") s.controls?.seek(s.position + 10);
      else if (e.key === "ArrowLeft") s.controls?.seek(Math.max(0, s.position - 5));
      else if (e.key === "ArrowRight") s.controls?.seek(s.position + 5);
      else if (k === "n") s.next();
      else if (k === "p") s.prev();
      else if (k === "m") s.toggleMute();
      else if (k === "f") s.controls?.fullscreen();
      else if (e.key === "ArrowUp") { e.preventDefault(); s.setVolume(Math.min(100, s.volume + 5)); }
      else if (e.key === "ArrowDown") { e.preventDefault(); s.setVolume(Math.max(0, s.volume - 5)); }
      else if (e.key === ">" ) s.setRate(Math.min(2, +(s.rate + 0.25).toFixed(2)));
      else if (e.key === "<") s.setRate(Math.max(0.25, +(s.rate - 0.25).toFixed(2)));
      else if (/^[0-9]$/.test(e.key) && s.duration) s.controls?.seek((Number(e.key) / 10) * s.duration);
      else if (k === "a") s.markLoop();
      else if (k === "s" && !e.shiftKey) s.toggleShuffle();
      else if (k === "r") s.cycleRepeat();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
