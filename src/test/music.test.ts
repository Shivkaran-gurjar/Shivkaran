import { describe, expect, it } from "vitest";
import { descriptionLyrics, musicOnly, shuffledMusic, MUSIC_GENRES } from "@/lib/music";
import type { VideoItem } from "@/lib/types";

const songs: VideoItem[] = [1, 2, 3].map((id) => ({ id: String(id), title: `Song ${id}`, thumbnail: "", channelTitle: "Artist", isMusic: true }));
describe("Music discovery", () => {
  it("only includes music", () => { expect(musicOnly([...songs, { ...songs[0], id: "other", isMusic: false }])).toEqual(songs); });
  it("shuffles without changing the source or losing songs", () => { expect(shuffledMusic(songs).map((v) => v.id).sort()).toEqual(["1", "2", "3"]); expect(songs[0].id).toBe("1"); });
  it("contains the requested genres", () => { expect(MUSIC_GENRES.map((g) => g.name)).toEqual(expect.arrayContaining(["Bollywood", "Punjabi", "Devotional", "Lo-fi"])); });
});
describe("Creator lyrics", () => {
  it("does not invent lyrics from unrelated descriptions", () => { expect(descriptionLyrics("Official music video. Subscribe today!")).toBeNull(); expect(descriptionLyrics("Lyrics:\nhttps://example.com")).toBeNull(); });
  it("extracts labeled verses and excludes credits", () => { expect(descriptionLyrics("Official song\nLyrics:\nFirst line\nSecond line\nThird line\nCredits:\nSinger")).toBe("First line\nSecond line\nThird line"); });
});