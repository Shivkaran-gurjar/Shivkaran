import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { UserAvatar } from "@/components/layout/UserAvatar";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Shivkaran" },
      { name: "description", content: "Manage your Shivkaran account, history and personalization." },
      { property: "og:title", content: "Profile — Shivkaran" },
      { property: "og:description", content: "Account and personalization settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const clear = async (table: "watch_history" | "search_history", label: string) => {
    if (!user || !window.confirm(`Clear your ${label}? This resets recommendations based on it.`)) return;
    const { error } = await supabase.from(table).delete().eq("user_id", user.id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries();
    toast.success(`${label[0].toUpperCase()}${label.slice(1)} cleared`);
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const row = "flex items-center justify-between gap-4 border-t border-border py-4 first:border-t-0";
  const btn = "shrink-0 rounded-full bg-secondary px-4 py-2 text-[13px] font-semibold hover:bg-surface-strong";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="glass flex items-center gap-4 rounded-[26px] p-6">
        <UserAvatar large />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold">{(user?.user_metadata?.full_name as string) ?? user?.email}</h1>
          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>
      <section className="glass rounded-[26px] px-6 py-2">
        <h2 className="pt-4 font-display font-semibold">Personalization</h2>
        <div className={row}>
          <div><p className="text-sm font-semibold">Watch history</p><p className="text-xs text-muted-foreground">Powers Continue Watching and “Because you watched”.</p></div>
          <button className={btn} onClick={() => clear("watch_history", "watch history")}>Clear</button>
        </div>
        <div className={row}>
          <div><p className="text-sm font-semibold">Search history</p><p className="text-xs text-muted-foreground">Shown as suggestions in the search bar.</p></div>
          <button className={btn} onClick={() => clear("search_history", "search history")}>Clear</button>
        </div>
      </section>
      <section className="glass rounded-[26px] px-6 py-2">
        <h2 className="pt-4 font-display font-semibold">Keyboard shortcuts</h2>
        <div className="grid grid-cols-2 gap-2 py-4 text-sm text-muted-foreground">
          {[["Space / K", "Play / pause"], ["J / L", "Back / forward 10s"], ["Shift + N / P", "Next / previous"], ["← / →", "Back / forward 5s"], ["↑ / ↓", "Volume"], ["< / >", "Speed"], ["0–9", "Jump to 0–90%"], ["A", "Set A-B loop"], ["S / R", "Shuffle / repeat"], ["M", "Mute"], ["F", "Full screen"], ["/", "Search"]].map(([k, d]) => (
            <p key={k}><kbd className="rounded-md border border-border px-1.5 text-xs text-foreground">{k}</kbd> {d}</p>
          ))}
        </div>
      </section>
      <button onClick={signOut} className="w-full rounded-full border border-border bg-secondary py-3 font-display text-sm font-semibold text-destructive hover:bg-surface-strong">
        Sign out
      </button>
    </div>
  );
}
