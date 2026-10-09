import { describe, expect, it } from "vitest";
import { buildSeeds, keywords, topChannels } from "@/lib/recommendations";
import { parseChapters, parseIsoDuration, extractVideoId } from "@/lib/format";

describe("recommendations", () => {
  it("strips stop words", () => {
    expect(keywords("How to learn Python for Beginners (Full Course)")).toBe("learn python beginners course");
  });
  it("dedupes seeds and explains why", () => {
    const h = [
      { video_id: "a", title: "Python Tutorial", channel_title: "X", is_music: false },
      { video_id: "b", title: "python tutorial", channel_title: "X", is_music: false },
    ];
    const s = buildSeeds(h, 2);
    expect(s).toHaveLength(1);
    expect(s[0].reason).toContain("Because you watched");
    expect(topChannels(h)).toEqual(["X"]);
  });
});

describe("format", () => {
  it("parses ISO durations", () => expect(parseIsoDuration("PT1H2M3S")).toBe(3723));
  it("parses chapters only when valid", () => {
    expect(parseChapters("0:00 Intro\n1:30 Setup\n10:05 Deploy")).toHaveLength(3);
    expect(parseChapters("2:00 Something")).toHaveLength(0);
  });
  it("extracts video ids", () => {
    expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(extractVideoId("nope")).toBeNull();
  });
});
