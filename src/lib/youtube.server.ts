/**
 * YouTube Data API v3 client (server-only). Uses official endpoints only —
 * metadata, never media. Results are cached briefly per worker to save quota.
 */
import { decodeEntities, parseIsoDuration } from "./format";
import type {
  ChannelItem,
  PlaylistResult,
  SearchParams,
  SearchResponse,
  VideoDetails,
  VideoItem,
} from "./types";

const API = "https://www.googleapis.com/youtube/v3";
const MUSIC_CATEGORY = "10";
const cache = new Map<string, { at: number; value: unknown }>();
const TTL_MS = 10 * 60 * 1000;

interface Thumbs {
  high?: { url: string };
  medium?: { url: string };
  default?: { url: string };
  maxres?: { url: string };
}

function pickThumb(t: Thumbs | undefined): string {
  return t?.maxres?.url ?? t?.high?.url ?? t?.medium?.url ?? t?.default?.url ?? "";
}

async function yt<T>(path: string, params: Record<string, string | undefined>): Promise<T> {
  const key = process.env["YOUTUBE_API_KEY"];
  if (!key) throw new Error("YouTube is not configured yet.");
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  const cacheKey = `${path}?${qs.toString()}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as T;
  qs.set("key", key);
  const res = await fetch(`${API}/${path}?${qs.toString()}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string; errors?: { reason?: string }[] } };
    const reason = body.error?.errors?.[0]?.reason;
    console.error("YouTube API error", res.status, reason, body.error?.message);
    if (reason === "quotaExceeded") throw new Error("YouTube daily limit reached. Try again later.");
    throw new Error("YouTube request failed.");
  }
  const value = (await res.json()) as T;
  if (cache.size > 500) cache.clear();
  cache.set(cacheKey, { at: Date.now(), value });
  return value;
}

interface RawVideo {
  id: string;
  snippet: {
    title: string;
    channelTitle: string;
    channelId: string;
    publishedAt: string;
    description: string;
    thumbnails: Thumbs;
    tags?: string[];
    categoryId?: string;
    liveBroadcastContent?: string;
  };
  contentDetails?: { duration: string };
  statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
  status?: { embeddable?: boolean };
}

function toDetails(v: RawVideo): VideoDetails {
  return {
    id: v.id,
    title: decodeEntities(v.snippet.title),
    channelTitle: decodeEntities(v.snippet.channelTitle),
    channelId: v.snippet.channelId,
    thumbnail: pickThumb(v.snippet.thumbnails),
    publishedAt: v.snippet.publishedAt,
    durationSeconds: parseIsoDuration(v.contentDetails?.duration),
    viewCount: v.statistics?.viewCount ? Number(v.statistics.viewCount) : undefined,
    likeCount: v.statistics?.likeCount ? Number(v.statistics.likeCount) : undefined,
    commentCount: v.statistics?.commentCount ? Number(v.statistics.commentCount) : undefined,
    description: v.snippet.description ?? "",
    tags: v.snippet.tags ?? [],
    categoryId: v.snippet.categoryId,
    isMusic: v.snippet.categoryId === MUSIC_CATEGORY,
  };
}

function slim(d: VideoDetails): VideoItem {
  const { description: _d, tags: _t, likeCount: _l, commentCount: _c, categoryId: _cat, ...rest } = d;
  return rest;
}

export async function getVideosByIds(ids: string[]): Promise<VideoDetails[]> {
  if (ids.length === 0) return [];
  const data = await yt<{ items: RawVideo[] }>("videos", {
    part: "snippet,contentDetails,statistics,status",
    id: ids.slice(0, 50).join(","),
    maxResults: "50",
  });
  return data.items.filter((v) => v.status?.embeddable !== false).map(toDetails);
}

export async function getVideo(id: string): Promise<VideoDetails | null> {
  const [v] = await getVideosByIds([id]);
  return v ?? null;
}

const uploadWindow: Record<string, number> = { day: 1, week: 7, month: 30, year: 365 };

export async function search(p: SearchParams): Promise<SearchResponse> {
  const type = p.type ?? "video";
  const publishedAfter =
    p.upload && p.upload !== "any"
      ? new Date(Date.now() - uploadWindow[p.upload] * 86400000).toISOString()
      : undefined;
  const data = await yt<{
    nextPageToken?: string;
    items: { id: { kind: string; videoId?: string; channelId?: string; playlistId?: string }; snippet: { title: string; channelTitle: string; description: string; thumbnails: Thumbs } }[];
  }>("search", {
    part: "snippet",
    q: p.q,
    type,
    maxResults: "20",
    order: p.order && p.order !== "relevance" ? p.order : undefined,
    videoDuration: type === "video" && p.duration && p.duration !== "any" ? p.duration : undefined,
    videoEmbeddable: type === "video" ? "true" : undefined,
    videoCategoryId: type === "video" && p.music ? MUSIC_CATEGORY : undefined,
    publishedAfter,
    pageToken: p.pageToken,
    safeSearch: "moderate",
    relevanceLanguage: undefined,
  });

  const result: SearchResponse = { videos: [], channels: [], playlists: [], nextPageToken: data.nextPageToken };
  if (type === "video") {
    const ids = data.items.map((i) => i.id.videoId).filter((x): x is string => !!x);
    const details = await getVideosByIds(ids);
    const order = new Map(ids.map((id, i) => [id, i]));
    result.videos = details.map(slim).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  } else if (type === "channel") {
    result.channels = data.items
      .filter((i) => i.id.channelId)
      .map<ChannelItem>((i) => ({
        id: i.id.channelId!,
        title: decodeEntities(i.snippet.title),
        thumbnail: pickThumb(i.snippet.thumbnails),
        description: decodeEntities(i.snippet.description),
      }));
  } else {
    result.playlists = data.items
      .filter((i) => i.id.playlistId)
      .map<PlaylistResult>((i) => ({
        id: i.id.playlistId!,
        title: decodeEntities(i.snippet.title),
        channelTitle: decodeEntities(i.snippet.channelTitle),
        thumbnail: pickThumb(i.snippet.thumbnails),
      }));
  }
  return result;
}

export async function trending(opts: { category?: "music" | "education" | "all"; region?: string }): Promise<VideoItem[]> {
  const categoryId = opts.category === "music" ? MUSIC_CATEGORY : opts.category === "education" ? "27" : undefined;
  try {
    const data = await yt<{ items: RawVideo[] }>("videos", {
      part: "snippet,contentDetails,statistics,status",
      chart: "mostPopular",
      regionCode: opts.region ?? "IN",
      videoCategoryId: categoryId,
      maxResults: "16",
    });
    return data.items.filter((v) => v.status?.embeddable !== false).map((v) => slim(toDetails(v)));
  } catch (e) {
    // Some categories have no chart in some regions — fall back to a search.
    if (opts.category === "education") {
      const r = await search({ q: "learn from basics tutorial", duration: "medium", order: "viewCount" });
      return r.videos;
    }
    throw e;
  }
}

export async function playlistVideos(playlistId: string): Promise<VideoItem[]> {
  const data = await yt<{ items: { contentDetails: { videoId: string } }[] }>("playlistItems", {
    part: "contentDetails",
    playlistId,
    maxResults: "25",
  });
  const details = await getVideosByIds(data.items.map((i) => i.contentDetails.videoId));
  return details.map(slim);
}

export { slim as slimVideo };
