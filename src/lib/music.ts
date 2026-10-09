import type { VideoItem } from "./types";

export const MUSIC_GENRES = [
  { name: "Bollywood", mixes: ["Bollywood hits", "Bollywood romantic songs", "Bollywood classics"] },
  { name: "Punjabi", mixes: ["Punjabi hits", "Punjabi party songs", "Punjabi folk songs"] },
  { name: "Devotional", mixes: ["Devotional bhajan", "Morning devotional songs", "Shabad kirtan"] },
  { name: "Lo-fi", mixes: ["Lo-fi chill music", "Lo-fi study music", "Hindi lo-fi songs"] },
  { name: "Indie", mixes: ["Indian indie music", "Indie acoustic songs", "Indie pop songs"] },
  { name: "Pop", mixes: ["Pop hits music", "Pop acoustic songs", "Pop dance music"] },
  { name: "Instrumental", mixes: ["Piano instrumental music", "Indian classical instrumental music", "Ambient instrumental music"] },
  { name: "South Indian", mixes: ["Tamil hit songs", "Telugu hit songs", "Malayalam hit songs"] },
] as const;

export function musicOnly(list: VideoItem[] = []): VideoItem[] {
  return list.filter((v) => v.isMusic === true);
}

export function shuffledMusic(list: VideoItem[]): VideoItem[] {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Only display lyrics explicitly provided in the creator's description. */
export function descriptionLyrics(description: string): string | null {
  const marker = /(?:^|\n)\s*(?:lyrics|song lyrics)\s*[:：]?\s*\n/i.exec(description);
  if (!marker || marker.index === undefined) return null;
  const text = description.slice(marker.index + marker[0].length).split(/\n\s*(?:credits|follow|subscribe|listen|stream|copyright|©|https?:\/\/|#)/i)[0].trim();
  return text.split("\n").filter((line) => line.trim()).length >= 3 ? text : null;
}