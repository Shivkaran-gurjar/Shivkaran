import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ThemeMode = "dark" | "light" | "system";

interface SettingsState {
  autoplay: boolean;
  rememberPosition: boolean;
  defaultVolume: number;
  defaultSpeed: number;
  saveWatchHistory: boolean;
  saveSearchHistory: boolean;
  aiEnabled: boolean;
  aiLanguage: string;
  theme: ThemeMode;
  hiddenVideos: string[];
  hiddenChannels: string[];
  set(patch: Partial<Omit<SettingsState, "set" | "hideVideo" | "hideChannel" | "resetHidden">>): void;
  hideVideo(id: string): void;
  hideChannel(name: string): void;
  resetHidden(): void;
}

/** Local, per-device preferences. Personalization signals ("not interested") live here too. */
export const useSettings = create<SettingsState>()(
  persist(
    (set, get) => ({
      autoplay: true,
      rememberPosition: true,
      defaultVolume: 80,
      defaultSpeed: 1,
      saveWatchHistory: true,
      saveSearchHistory: true,
      aiEnabled: true,
      aiLanguage: "English",
      theme: "dark",
      hiddenVideos: [],
      hiddenChannels: [],
      set: (patch) => {
        set(patch);
        if (patch.theme) applyTheme(patch.theme);
      },
      hideVideo: (id) => set({ hiddenVideos: [...get().hiddenVideos.filter((x) => x !== id), id].slice(-500) }),
      hideChannel: (name) => set({ hiddenChannels: [...get().hiddenChannels.filter((x) => x !== name), name].slice(-200) }),
      resetHidden: () => set({ hiddenVideos: [], hiddenChannels: [] }),
    }),
    { name: "shivkaran-settings", storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);

export function isHidden(v: { id: string; channelTitle: string }) {
  const s = useSettings.getState();
  return s.hiddenVideos.includes(v.id) || s.hiddenChannels.includes(v.channelTitle);
}

/** Hook version: re-renders when hidden lists change. */
export function useVisible<T extends { id: string; channelTitle: string }>(list?: T[]): T[] | undefined {
  const hv = useSettings((s) => s.hiddenVideos);
  const hc = useSettings((s) => s.hiddenChannels);
  if (!list) return list;
  return list.filter((v) => !hv.includes(v.id) && !hc.includes(v.channelTitle));
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const light = mode === "light" || (mode === "system" && window.matchMedia("(prefers-color-scheme: light)").matches);
  document.documentElement.classList.toggle("light", light);
  document.documentElement.classList.toggle("dark", !light);
}
