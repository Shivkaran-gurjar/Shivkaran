import { Link } from "@tanstack/react-router";
import { NAV } from "./nav";

export function MobileNav() {
  return (
    <nav aria-label="Main" className="glass-strong fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-border px-2 pb-[env(safe-area-inset-bottom)] lg:hidden">
      {NAV.filter((n) => n.to !== "/history").map((n) => (
        <Link
          key={n.to}
          to={n.to}
          activeOptions={{ exact: n.to === "/" }}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] text-muted-foreground"
          activeProps={{ className: "!text-primary" }}
        >
          <n.icon className="size-5" />
          {n.label}
        </Link>
      ))}
    </nav>
  );
}
