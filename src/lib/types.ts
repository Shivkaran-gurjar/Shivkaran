/** Minimal YouTube metadata Shivkaran stores/display. Never media files. */
export interface VideoItem {
  id: string;
  title: string;
  channelTitle: string;
  channelId?: string;
  thumbnail: string;
  publishedAt?: string;
  durationSeconds?: number;
  viewCount?: number;
  isMusic?: boolean;
}

export interface ChannelItem {
  id: string;
  title: string;
  thumbnail: string;
  description?: string;
}

export interface PlaylistResult {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
}

export interface VideoDetails extends VideoItem {
  description: string;
  tags: string[];
  categoryId?: string;
  likeCount?: number;
  commentCount?: number;
}

export interface Chapter {
  seconds: number;
  label: string;
}

export type SearchType = "video" | "channel" | "playlist";
export type DurationFilter = "any" | "short" | "medium" | "long";
export type SortOrder = "relevance" | "date" | "viewCount" | "rating";
export type UploadFilter = "any" | "day" | "week" | "month" | "year";

export interface SearchParams {
  q: string;
  type?: SearchType;
  duration?: DurationFilter;
  order?: SortOrder;
  upload?: UploadFilter;
  music?: boolean;
  pageToken?: string;
}

export interface SearchResponse {
  videos: VideoItem[];
  channels: ChannelItem[];
  playlists: PlaylistResult[];
  nextPageToken?: string;
}
