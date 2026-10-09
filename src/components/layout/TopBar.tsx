import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { History, Search, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSearchHistory } from "@/hooks/use-library";
import { UserAvatar } from "./UserAvatar";
import { LogoMark } from "./Logo";

const SUGGESTIONS = [
  "I want beginner Python tutorials around 30 minutes",
  "Find energetic Hindi songs",
  "Videos to learn DBMS from basics",
  "Interviews about artificial intelligence",
];

export function TopBar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const search = useRouterState({ select: (s) => s.location.search as { q?: string } });
  const [q, setQ] = useState(search.q ?? "");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: history = [] } = useSearchHistory();

  useEffect(() => {
    setQ(search.q ?? "");
  }, [search.q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target as HTMLElement).closest("input,textarea")) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submit = (value: string) => {
    const v = value.trim();
    if (!v) return;
    setOpen(false);
    inputRef.current?.blur();
    navigate({ to: "/search", search: { q: v } });
  };

  const filtered = (q ? history.filter((h) => h.query.toLowerCase().includes(q.toLowerCase())) : history).slice(0, 5);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-4 sm:px-5">
      <Link to="/" className="lg:hidden" aria-label="Shivkaran home">
        <LogoMark size="sm" />
      </Link>
      <form
        className="relative max-w-2xl flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          submit(q);
        }}
        role="search"
      >
        <div className="glass flex h-12 items-center gap-3 rounded-full px-4 focus-within:ring-2 focus-within:ring-ring">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            id="global-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Search or ask — “beginner Python tutorials around 30 min”"
            className="h-full w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            aria-label="Search YouTube"
            maxLength={200}
          />
          <kbd className="hidden rounded-md border border-border px-1.5 text-[10px] text-muted-foreground sm:block">/</kbd>
        </div>
        {open && (
          <div className="glass-strong absolute inset-x-0 top-14 overflow-hidden rounded-2xl p-2 shadow-glow">
            {filtered.length > 0 && (
              <>
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Recent</p>
                {filtered.map((h) => (
                  <button key={h.id} type="button" onMouseDown={() => submit(h.query)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-strong">
                    <History className="size-4 text-muted-foreground" /> {h.query}
                  </button>
                ))}
              </>
            )}
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Try asking</p>
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onMouseDown={() => submit(s)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-strong">
                <Sparkles className="size-4 text-accent" /> {s}
              </button>
            ))}
          </div>
        )}
      </form>
      <Link to="/ai" className="glass hidden h-12 items-center rounded-full px-5 font-display text-[13px] font-semibold text-accent hover:bg-surface-strong md:flex">
        Ask Shiva.AI
      </Link>
      <Link to={user ? "/profile" : "/auth"} aria-label={user ? "Profile" : "Sign in"} className="shrink-0">
        {user ? (
          <UserAvatar large />
        ) : (
          <span className="rounded-full bg-primary px-4 py-2.5 font-display text-[13px] font-semibold text-primary-foreground">Sign in</span>
        )}
      </Link>
    </header>
  );
}
