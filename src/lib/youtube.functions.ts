import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().trim().min(1).max(200),
  type: z.enum(["video", "channel", "playlist"]).optional(),
  duration: z.enum(["any", "short", "medium", "long"]).optional(),
  order: z.enum(["relevance", "date", "viewCount", "rating"]).optional(),
  upload: z.enum(["any", "day", "week", "month", "year"]).optional(),
  music: z.boolean().optional(),
  pageToken: z.string().max(200).optional(),
});

export const searchYouTube = createServerFn({ method: "GET" })
  .inputValidator((d) => searchSchema.parse(d))
  .handler(async ({ data }) => {
    const { search } = await import("./youtube.server");
    return search(data);
  });

export const getVideoDetails = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().regex(/^[\w-]{11}$/) }).parse(d))
  .handler(async ({ data }) => {
    const { getVideo } = await import("./youtube.server");
    return getVideo(data.id);
  });

export const getTrending = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ category: z.enum(["music", "education", "all"]).default("all") }).parse(d))
  .handler(async ({ data }) => {
    const { trending } = await import("./youtube.server");
    return trending({ category: data.category });
  });

export const getRelated = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ id: z.string().regex(/^[\w-]{11}$/), title: z.string().max(200), music: z.boolean().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { search } = await import("./youtube.server");
    // The official API no longer offers "related videos"; approximate with a topical search.
    const q = data.title.replace(/[|#[\]()"“”]/g, " ").split(/\s+/).slice(0, 6).join(" ");
    const r = await search({ q, music: data.music });
    return r.videos.filter((v) => v.id !== data.id).slice(0, 12);
  });

export const getPlaylistVideos = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().regex(/^[\w-]{10,64}$/) }).parse(d))
  .handler(async ({ data }) => {
    const { playlistVideos } = await import("./youtube.server");
    return playlistVideos(data.id);
  });
