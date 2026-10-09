/**
 * Recommendation seeds (pure + testable). V1 derives a few gentle search seeds
 * from recent behavior; future versions can swap in embeddings without touching UI.
 */
export interface HistorySignal {
  video_id: string;
  title: string;
  channel_title: string | null;
  is_music: boolean;
}

export interface RecommendationSeed {
  query: string;
  reason: string;
  music: boolean;
}

const STOP = new Set(
  "the a an and or of to in on for with how what why is are vs your you my i full official video lyrics song hd 4k part episode new latest 2024 2025 2026 ft feat".split(" "),
);

export function keywords(title: string, max = 4): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .slice(0, max)
    .join(" ");
}

export function buildSeeds(history: HistorySignal[], max = 2): RecommendationSeed[] {
  const seeds: RecommendationSeed[] = [];
  const seen = new Set<string>();
  for (const h of history) {
    if (seeds.length >= max) break;
    const q = keywords(h.title);
    if (!q || seen.has(q)) continue;
    seen.add(q);
    seeds.push({ query: q, reason: `Because you watched “${h.title}”`, music: h.is_music });
  }
  return seeds;
}

export function topChannels(history: HistorySignal[], max = 3): string[] {
  const counts = new Map<string, number>();
  for (const h of history) if (h.channel_title) counts.set(h.channel_title, (counts.get(h.channel_title) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, max).map(([c]) => c);
}
