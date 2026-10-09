import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { VideoItem } from "@/lib/types";
import { useSettings } from "./settings";

export type RepeatMode = "off" | "all" | "one";

/** Imperative bridge to the single YouTube IFrame player instance. */
export interface PlayerControls {
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  setVolume(v: number): void;
  mute(): void;
  unMute(): void;
  setRate(r: number): void;
  getRates(): number[];
  fullscreen(): void;
}

interface PlayerState {
  queue: VideoItem[];
  index: number;
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
  muted: boolean;
  rate: number;
  position: number;
  duration: number;
  miniHidden: boolean;
  miniLarge: boolean;
  loopA: number | null;
  loopB: number | null;
  sleepAt: number | null;
  sleepEndOfVideo: boolean;
  resume: Record<string, number>;
  controls: PlayerControls | null;
  queueOpen: boolean;
  setQueueOpen(o: boolean): void;
  nowPlayingOpen: boolean;
  setNowPlayingOpen(o: boolean): void;

  setControls(c: PlayerControls | null): void;
  playNow(v: VideoItem, context?: VideoItem[]): void;
  playQueue(list: VideoItem[], start?: number): void;
  addToQueue(v: VideoItem): void;
  playNext(v: VideoItem): void;
  removeAt(i: number): void;
  move(from: number, to: number): void;
  renameAt(i: number, title: string): void;
  clearQueue(): void;
  jumpTo(i: number): void;
  next(auto?: boolean): void;
  prev(): void;
  toggleShuffle(): void;
  cycleRepeat(): void;
  setPlaying(p: boolean): void;
  setProgress(position: number, duration: number): void;
  setVolume(v: number): void;
  toggleMute(): void;
  setRate(r: number): void;
  setMiniHidden(h: boolean): void;
  toggleMiniLarge(): void;
  skip(seconds: number): void;
  markLoop(): void;
  clearLoop(): void;
  setSleep(minutes: number | null, endOfVideo?: boolean): void;
  saveResume(id: string, pos: number, dur: number): void;
}

export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: [],
      index: -1,
      isPlaying: false,
      shuffle: false,
      repeat: "off",
      volume: 80,
      muted: false,
      rate: 1,
      position: 0,
      duration: 0,
      miniHidden: false,
      miniLarge: false,
      loopA: null,
      loopB: null,
      sleepAt: null,
      sleepEndOfVideo: false,
      resume: {},
      controls: null,
      queueOpen: false,
      setQueueOpen: (queueOpen) => set({ queueOpen }),
      nowPlayingOpen: false,
      setNowPlayingOpen: (nowPlayingOpen) => set({ nowPlayingOpen, ...(nowPlayingOpen ? { miniHidden: false } : {}) }),

      setControls: (controls) => set({ controls }),
      playNow: (v, context) => {
        const { queue, index } = get();
        const existing = queue.findIndex((q) => q.id === v.id);
        if (existing >= 0) return set({ index: existing, isPlaying: true, position: 0, miniHidden: false });
        if (context && context.length) {
          const list = context.some((c) => c.id === v.id) ? context : [v, ...context];
          return set({ queue: list, index: list.findIndex((c) => c.id === v.id), isPlaying: true, position: 0, miniHidden: false });
        }
        const q = [...queue];
        q.splice(index + 1, 0, v);
        set({ queue: q, index: index + 1, isPlaying: true, position: 0, miniHidden: false });
      },
      playQueue: (list, start = 0) =>
        set({ queue: list, index: list.length ? start : -1, isPlaying: list.length > 0, position: 0, miniHidden: false }),
      addToQueue: (v) => {
        const { queue, index } = get();
        if (queue.some((q) => q.id === v.id)) return;
        set({ queue: [...queue, v], index: index < 0 ? 0 : index });
      },
      playNext: (v) => {
        const { queue, index } = get();
        const q = queue.filter((x) => x.id !== v.id);
        const cur = queue[index];
        const ci = cur ? q.findIndex((x) => x.id === cur.id) : -1;
        q.splice(ci + 1, 0, v);
        set({ queue: q, index: ci < 0 ? 0 : ci });
      },
      removeAt: (i) => {
        const { queue, index } = get();
        const q = queue.filter((_, k) => k !== i);
        let ni = index;
        if (i < index) ni = index - 1;
        else if (i === index) ni = Math.min(index, q.length - 1);
        set({ queue: q, index: q.length ? ni : -1, isPlaying: q.length ? get().isPlaying : false });
      },
      move: (from, to) => {
        const { queue, index } = get();
        if (to < 0 || to >= queue.length) return;
        const q = [...queue];
        const [item] = q.splice(from, 1);
        q.splice(to, 0, item);
        const curId = queue[index]?.id;
        set({ queue: q, index: q.findIndex((x) => x.id === curId) });
      },
      renameAt: (i, title) => {
        const t = title.trim().slice(0, 200);
        if (!t) return;
        set({ queue: get().queue.map((v, k) => (k === i ? { ...v, title: t } : v)) });
      },
      clearQueue: () => set({ queue: [], index: -1, isPlaying: false, position: 0, duration: 0 }),
      jumpTo: (i) => set({ index: i, isPlaying: true, position: 0, loopA: null, loopB: null }),
      next: (auto = false) => {
        const { queue, index, shuffle, repeat, controls } = get();
        if (!queue.length) return;
        set({ loopA: null, loopB: null });
        if (auto && get().sleepEndOfVideo) return set({ isPlaying: false, sleepEndOfVideo: false });
        if (auto && repeat === "one") {
          controls?.seek(0);
          controls?.play();
          return;
        }
        if (shuffle && queue.length > 1) {
          let r = index;
          while (r === index) r = Math.floor(Math.random() * queue.length);
          return set({ index: r, position: 0, isPlaying: true });
        }
        if (auto && !useSettings.getState().autoplay) return set({ isPlaying: false });
        if (index + 1 < queue.length) return set({ index: index + 1, position: 0, isPlaying: true });
        if (repeat === "all") return set({ index: 0, position: 0, isPlaying: true });
        set({ isPlaying: false });
      },
      prev: () => {
        const { index, position, controls } = get();
        if (position > 5 || index <= 0) return controls?.seek(0);
        set({ index: index - 1, position: 0, isPlaying: true });
      },
      toggleShuffle: () => set({ shuffle: !get().shuffle }),
      cycleRepeat: () => {
        const order: RepeatMode[] = ["off", "all", "one"];
        set({ repeat: order[(order.indexOf(get().repeat) + 1) % 3] });
      },
      setPlaying: (isPlaying) => set({ isPlaying }),
      setProgress: (position, duration) => set({ position, duration }),
      setVolume: (volume) => {
        get().controls?.setVolume(volume);
        if (get().muted && volume > 0) get().controls?.unMute();
        set({ volume, muted: volume === 0 });
      },
      toggleMute: () => {
        const { muted, controls } = get();
        if (muted) controls?.unMute();
        else controls?.mute();
        set({ muted: !muted });
      },
      setRate: (rate) => {
        get().controls?.setRate(rate);
        set({ rate });
      },
      setMiniHidden: (miniHidden) => set({ miniHidden }),
      toggleMiniLarge: () => set({ miniLarge: !get().miniLarge }),
      skip: (sec) => {
        const { position, duration, controls } = get();
        const t = Math.max(0, Math.min(duration || Infinity, position + sec));
        controls?.seek(t);
        set({ position: t });
      },
      markLoop: () => {
        const { loopA, loopB, position } = get();
        if (loopA === null || loopB !== null) return set({ loopA: position, loopB: null });
        if (position <= loopA + 1) return set({ loopA: position });
        set({ loopB: position });
      },
      clearLoop: () => set({ loopA: null, loopB: null }),
      setSleep: (minutes, endOfVideo = false) =>
        set({ sleepAt: minutes ? Date.now() + minutes * 60_000 : null, sleepEndOfVideo: endOfVideo }),
      saveResume: (id, pos, dur) => {
        if (!useSettings.getState().rememberPosition) return;
        const r = { ...get().resume };
        if (dur > 0 && (pos < 15 || dur - pos < 20)) delete r[id];
        else r[id] = Math.floor(pos);
        const keys = Object.keys(r);
        if (keys.length > 100) delete r[keys[0]];
        set({ resume: r });
      },
    }),
    {
      name: "shivkaran-player",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ queue: s.queue, index: s.index, shuffle: s.shuffle, repeat: s.repeat, volume: s.volume, rate: s.rate, resume: s.resume, miniLarge: s.miniLarge }),
      skipHydration: true,
    },
  ),
);

export const currentVideo = (s: PlayerState) => (s.index >= 0 ? s.queue[s.index] : undefined);

/** Watch page registers where the big player should sit. */
interface SlotState {
  slot: HTMLElement | null;
  setSlot(el: HTMLElement | null): void;
  musicSlot: HTMLElement | null;
  setMusicSlot(el: HTMLElement | null): void;
}
export const usePlayerSlot = create<SlotState>((set) => ({ slot: null, setSlot: (slot) => set({ slot }), musicSlot: null, setMusicSlot: (musicSlot) => set({ musicSlot }) }));
