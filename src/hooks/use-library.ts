/** Personal library data (favorites, watch later, history, playlists). RLS scopes all rows to the user. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import type { VideoItem } from "@/lib/types";

export type SavedList = "favorite" | "watch_later";

export interface SavedRow {
  id: string;
  list: SavedList;
  video_id: string;
  title: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  is_music: boolean;
  created_at: string;
}

export interface HistoryRow {
  id: string;
  video_id: string;
  title: string;
  channel_title: string | null;
  thumbnail_url: string | null;
  is_music: boolean;
  progress_seconds: number;
  duration_seconds: number;
  watched_at: string;
}

export interface PlaylistRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  playlist_items: { count: number }[];
}

export const rowToVideo = (r: { video_id: string; title: string; channel_title: string | null; thumbnail_url: string | null; is_music?: boolean }): VideoItem => ({
  id: r.video_id,
  title: r.title,
  channelTitle: r.channel_title ?? "",
  thumbnail: r.thumbnail_url ?? `https://i.ytimg.com/vi/${r.video_id}/hqdefault.jpg`,
  isMusic: r.is_music,
});

export function useSaved(list?: SavedList) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["saved", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_items").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data as SavedRow[];
    },
    select: (rows) => (list ? rows.filter((r) => r.list === list) : rows),
  });
}

export function useToggleSaved() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ video, list, saved }: { video: VideoItem; list: SavedList; saved: boolean }) => {
      if (!user) throw new Error("Sign in to save videos.");
      if (saved) {
        const { error } = await supabase.from("saved_items").delete().eq("list", list).eq("video_id", video.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("saved_items").insert({
          user_id: user.id,
          list,
          video_id: video.id,
          title: video.title,
          channel_title: video.channelTitle,
          thumbnail_url: video.thumbnail,
          is_music: !!video.isMusic,
        });
        if (error) throw error;
      }
      return !saved;
    },
    onSuccess: (nowSaved, { list }) => {
      qc.invalidateQueries({ queryKey: ["saved"] });
      const label = list === "favorite" ? "Favorites" : "Watch Later";
      toast.success(nowSaved ? `Added to ${label}` : `Removed from ${label}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useHistory(limit = 50) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["history", user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("watch_history").select("*").order("watched_at", { ascending: false }).limit(limit);
      if (error) throw error;
      return data as HistoryRow[];
    },
  });
}

export async function recordWatch(userId: string, v: VideoItem, progress: number, duration: number) {
  await supabase.from("watch_history").upsert(
    {
      user_id: userId,
      video_id: v.id,
      title: v.title,
      channel_title: v.channelTitle,
      thumbnail_url: v.thumbnail,
      is_music: !!v.isMusic,
      progress_seconds: Math.floor(progress),
      duration_seconds: Math.floor(duration),
      watched_at: new Date().toISOString(),
    },
    { onConflict: "user_id,video_id" },
  );
}

export function useSearchHistory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["search-history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("search_history").select("id, query, created_at").order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      const seen = new Set<string>();
      return data.filter((r) => (seen.has(r.query.toLowerCase()) ? false : seen.add(r.query.toLowerCase())));
    },
  });
}

export function usePlaylists() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["playlists", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("playlists").select("id, name, description, created_at, playlist_items(count)").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PlaylistRow[];
    },
  });
}

export function useCreatePlaylist() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ name, videos = [] }: { name: string; videos?: VideoItem[] }) => {
      if (!user) throw new Error("Sign in to create playlists.");
      const { data, error } = await supabase.from("playlists").insert({ user_id: user.id, name: name.trim().slice(0, 100) }).select("id").single();
      if (error) throw error;
      if (videos.length) await addVideosToPlaylist(user.id, data.id, videos, 0);
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playlists"] });
      toast.success("Playlist saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export async function addVideosToPlaylist(userId: string, playlistId: string, videos: VideoItem[], startPos: number) {
  const { error } = await supabase.from("playlist_items").insert(
    videos.map((v, i) => ({
      user_id: userId,
      playlist_id: playlistId,
      video_id: v.id,
      title: v.title,
      channel_title: v.channelTitle,
      thumbnail_url: v.thumbnail,
      position: startPos + i,
    })),
  );
  if (error) throw error;
}

export function useAddToPlaylist() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ playlistId, video }: { playlistId: string; video: VideoItem }) => {
      if (!user) throw new Error("Sign in first.");
      const { count } = await supabase.from("playlist_items").select("id", { count: "exact", head: true }).eq("playlist_id", playlistId);
      await addVideosToPlaylist(user.id, playlistId, [video], count ?? 0);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playlists"] });
      qc.invalidateQueries({ queryKey: ["playlist"] });
      toast.success("Added to playlist");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
