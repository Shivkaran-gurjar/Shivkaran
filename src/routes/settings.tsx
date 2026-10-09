import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useSettings, type ThemeMode } from "@/store/settings";
import { usePlayer } from "@/store/player";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Shivkaran" },
      { name: "description", content: "Playback, appearance, privacy and AI preferences for Shivkaran." },
      { property: "og:title", content: "Settings — Shivkaran" },
      { property: "og:description", content: "Tune playback, theme, privacy and AI in Shivkaran." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="mb-3 font-display text-base font-semibold">{title}</h2>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ k, label, hint }: { k: "autoplay" | "rememberPosition" | "saveWatchHistory" | "saveSearchHistory" | "aiEnabled"; label: string; hint?: string }) {
  const v = useSettings((s) => s[k]);
  const set = useSettings((s) => s.set);
  return (
    <Row label={label} hint={hint}>
      <Switch checked={v} onCheckedChange={(c) => set({ [k]: c })} aria-label={label} />
    </Row>
  );
}

function SettingsPage() {
  const s = useSettings();
  const { user } = useAuth();

  const clear = async (table: "watch_history" | "search_history") => {
    if (!user) return toast.error("Sign in to manage history.");
    if (!window.confirm("Clear this history? This can't be undone.")) return;
    const { error } = await supabase.from(table).delete().eq("user_id", user.id);
    if (error) toast.error(error.message);
    else toast.success("History cleared");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-10">
      <h1 className="font-display text-2xl font-semibold">Settings</h1>

      <Section title="Playback">
        <Toggle k="autoplay" label="Autoplay" hint="Play the next item in the queue automatically" />
        <Toggle k="rememberPosition" label="Remember playback position" hint="Resume videos where you left off" />
        <Row label="Default volume" hint={`${s.defaultVolume}%`}>
          <Slider
            className="w-36"
            value={[s.defaultVolume]}
            max={100}
            step={5}
            onValueChange={([v]) => s.set({ defaultVolume: v })}
            onValueCommit={([v]) => usePlayer.getState().setVolume(v)}
            aria-label="Default volume"
          />
        </Row>
        <Row label="Default speed">
          <select
            value={s.defaultSpeed}
            onChange={(e) => { const r = Number(e.target.value); s.set({ defaultSpeed: r }); usePlayer.getState().setRate(r); }}
            className="rounded-lg border border-border bg-secondary px-2 py-1.5 text-sm"
          >
            {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((r) => <option key={r} value={r}>{r}x</option>)}
          </select>
        </Row>
      </Section>

      <Section title="Appearance">
        <Row label="Theme">
          <div className="flex rounded-full bg-secondary p-1">
            {(["dark", "light", "system"] as ThemeMode[]).map((t) => (
              <button key={t} onClick={() => s.set({ theme: t })} className={cn("rounded-full px-3 py-1 text-xs font-semibold capitalize", s.theme === t ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                {t}
              </button>
            ))}
          </div>
        </Row>
      </Section>

      <Section title="Privacy">
        <Toggle k="saveWatchHistory" label="Save watch history" />
        <Toggle k="saveSearchHistory" label="Save search history" />
        <Row label="Clear watch history"><button onClick={() => clear("watch_history")} className="text-sm font-semibold text-destructive">Clear</button></Row>
        <Row label="Clear search history"><button onClick={() => clear("search_history")} className="text-sm font-semibold text-destructive">Clear</button></Row>
        <Row label="Reset hidden videos & channels" hint={`${s.hiddenVideos.length} videos · ${s.hiddenChannels.length} channels hidden`}>
          <button onClick={() => { s.resetHidden(); toast.success("Recommendations reset"); }} className="text-sm font-semibold text-primary">Reset</button>
        </Row>
      </Section>

      <Section title="Shiva.AI">
        <Toggle k="aiEnabled" label="Show AI tools" hint="Turn off to hide the AI panel on video pages" />
        <Row label="Preferred language">
          <select value={s.aiLanguage} onChange={(e) => s.set({ aiLanguage: e.target.value })} className="rounded-lg border border-border bg-secondary px-2 py-1.5 text-sm">
            {["English", "Hindi", "Hinglish", "Punjabi", "Bengali", "Tamil", "Telugu", "Marathi"].map((l) => <option key={l}>{l}</option>)}
          </select>
        </Row>
      </Section>

      <Section title="Account">
        {user ? (
          <>
            <Row label={user.email ?? "Signed in"}><Link to="/profile" className="text-sm font-semibold text-primary">Profile</Link></Row>
            <Row label="Sign out"><button onClick={() => supabase.auth.signOut()} className="text-sm font-semibold text-destructive">Sign out</button></Row>
          </>
        ) : (
          <Row label="Not signed in"><Link to="/auth" className="text-sm font-semibold text-primary">Sign in</Link></Row>
        )}
      </Section>
    </div>
  );
}
