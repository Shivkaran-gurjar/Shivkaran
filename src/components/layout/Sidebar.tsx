import { Link } from "@tanstack/react-router";
import { LogoMark } from "./Logo";
import { NAV } from "./nav";
import { useAuth } from "@/hooks/use-auth";
import { UserAvatar } from "./UserAvatar";

export function Sidebar() {
  const { user } = useAuth();
  const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email?.split("@")[0];
  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col gap-6 p-4 lg:flex">
      <Link to="/" className="glass flex items-center gap-3 rounded-[26px] p-4">
        <LogoMark />
        <div>
          <div className="font-display text-[15px] font-semibold leading-none">Shivkaran</div>
          <div className="mt-1 text-[11px] text-muted-foreground">Your YouTube. Smarter.</div>
        </div>
      </Link>

      <nav className="glass flex flex-col gap-1 rounded-[26px] p-2.5" aria-label="Main">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: n.to === "/" }}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-[14px] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            activeProps={{ className: "!bg-surface-strong font-display font-semibold !text-foreground" }}
          >
            <n.icon className="size-4" />
            {n.label}
          </Link>
        ))}
      </nav>

      <Link to={user ? "/profile" : "/auth"} className="glass mt-auto flex items-center gap-3 rounded-[26px] p-4 hover:bg-surface-strong">
        <UserAvatar />
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold">{user ? name : "Sign in"}</div>
          <div className="text-[11px] text-muted-foreground">{user ? "Profile & settings" : "Save your library"}</div>
        </div>
      </Link>
    </aside>
  );
}
