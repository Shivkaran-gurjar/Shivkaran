import { queryOptions } from "@tanstack/react-query";
import { getTrending, getVideoDetails, getRelated, searchYouTube } from "./youtube.functions";
import type { SearchParams } from "./types";

export const trendingQuery = (category: "all" | "music" | "education") =>
  queryOptions({
    queryKey: ["trending", category],
    queryFn: () => getTrending({ data: { category } }),
    staleTime: 30 * 60 * 1000,
  });

export const videoQuery = (id: string) =>
  queryOptions({ queryKey: ["video", id], queryFn: () => getVideoDetails({ data: { id } }), staleTime: 30 * 60 * 1000 });

export const relatedQuery = (id: string, title: string, music?: boolean) =>
  queryOptions({
    queryKey: ["related", id],
    queryFn: () => getRelated({ data: { id, title, music } }),
    enabled: !!title,
    staleTime: 30 * 60 * 1000,
  });

export const seedQuery = (p: SearchParams) =>
  queryOptions({ queryKey: ["search", p], queryFn: () => searchYouTube({ data: p }), staleTime: 30 * 60 * 1000 });
