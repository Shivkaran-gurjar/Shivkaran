import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Maximize, Shuffle } from "lucide-react";
import { trendingQuery, seedQuery } from "@/lib/queries";
import { rowToVideo, useHistory, useSaved } from "@/hooks/use-library";
import { topChannels } from "@/lib/recommendations";
import { usePlayer } from "@/store/player";
import { SquareRail } from "@/components/common/Rail";
import { SectionHeader } from "@/components/common/States";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GenreSection } from "@/components/music/GenreSection";
import { MUSIC_GENRES, musicOnly, shuffledMusic } from "@/lib/music";
import type { VideoItem } from "@/lib/types";
import { SleepTimer } from "@/components/player/SleepTimer";
import { currentVideo } from "@/store/player";
import { useVisible } from "@/store/settings";

const MOODS = [
  { label: "Focus", q: "lofi focus music" },
  { label: "Energetic", q: "energetic hindi songs" },
  { label: "Chill", q: "chill relaxing songs" },
  { label: "Workout", q: "workout gym music" },
  { label: "Romantic", q: "romantic bollywood songs" },
  { label: "Devotional", q: "devotional bhajan" },
];

export const Route = createFileRoute("/music")({
  head: () => ({
    meta: [
      { title: "Music — Shivkaran" },
      { name: "description", content: "Discover Bollywood, Punjabi, devotional, lo-fi and more music mixes, with full-screen playback and your favorite songs." },
      { property: "og:title", content: "Music — Shivkaran" },
      { property: "og:description", content: "Bollywood, Punjabi, devotional and lo-fi mixes with your personal music queue." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MusicPage,
});

function MusicPage() {
  const [mood, setMood] = useState(MOODS[0]);
  const moodQ = useQuery(seedQuery({ q: mood.q, music: true }));
  const trending = useQuery(trendingQuery("music"));
  const history = useHistory(50);
  const favs = useSaved("favorite");
  const playQueue = usePlayer((s) => s.playQueue);
  const playing = usePlayer(currentVideo);
  const moodVideos = useVisible(musicOnly(moodQ.data?.videos)) ?? [];

  const recent = (history.data ?? []).filter((h) => h.is_music).map(rowToVideo);
  const favSongs = (favs.data ?? []).filter((f) => f.is_music).map(rowToVideo);
  const artists = topChannels((history.data ?? []).filter((h) => h.is_music));
  const artistQ = useQuery({ ...seedQuery({ q: artists[0] ?? "", music: true }), enabled: !!artists[0] });

  // YouTube's music category is unreliable, so keep only items marked as music.
  const onlyMusic = musicOnly;

  const shuffleAll = (list?: VideoItem[]) => {
    if (!list?.length) return;
    const l = shuffledMusic(list);
    playQueue(l, 0);
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Music</h1>
        <div className="flex flex-wrap items-center gap-2"><SleepTimer />{playing?.isMusic && <Button variant="secondary" onClick={() => usePlayer.getState().setNowPlayingOpen(true)}><Maximize />Now playing</Button>}</div>
      </header>
      <section>
          <SectionHeader
          title="Mood mixes"
          sub={`Smart mix · ${mood.label}`}
          action={
            <Button disabled={!moodVideos.length} onClick={() => shuffleAll(moodVideos)} className="font-display text-[13px] font-semibold">
              <Shuffle className="size-4" /> Play mix
            </Button>
          }
        />
        <div className="mb-5 flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <Button variant="secondary" key={m.label} onClick={() => setMood(m)} aria-pressed={m === mood} className={cn("text-[13px] font-semibold", m === mood ? "bg-accent text-accent-foreground" : "text-muted-foreground")}>
              {m.label}
            </Button>
          ))}
        </div>
        <SquareRail videos={onlyMusic(moodQ.data?.videos)} loading={moodQ.isLoading} inline />
      </section>

      {MUSIC_GENRES.map((genre) => <GenreSection key={genre.name} name={genre.name} mixes={genre.mixes} />)}

      {recent.length > 0 && (
        <section>
          <SectionHeader title="Recently played" />
          <SquareRail videos={recent} inline />
        </section>
      )}
      {favSongs.length > 0 && (
        <section>
          <SectionHeader title="Favorite songs" action={<button onClick={() => shuffleAll(favSongs)} className="text-[13px] font-semibold text-primary">Shuffle</button>} />
          <SquareRail videos={favSongs} inline />
        </section>
      )}
      {artists[0] && (
        <section>
          <SectionHeader title={`More from ${artists[0]}`} sub="Artist you play most" />
          <SquareRail videos={onlyMusic(artistQ.data?.videos)} loading={artistQ.isLoading} inline />
        </section>
      )}
      <section>
        <SectionHeader title="Trending music" sub="Popular in India" />
        <SquareRail videos={onlyMusic(trending.data)} loading={trending.isLoading} inline />
      </section>
    </div>
  );
}
