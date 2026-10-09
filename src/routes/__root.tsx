import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MobileNav } from "@/components/layout/MobileNav";
import { PlayerBar } from "@/components/player/PlayerBar";
import { YouTubeEngine } from "@/components/player/YouTubeEngine";
import { NowPlaying } from "@/components/player/NowPlaying";
import { useSettings, applyTheme } from "@/store/settings";
import { usePlayerShortcuts } from "@/hooks/use-shortcuts";
import { usePlayer } from "@/store/player";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong on our end. You can try refreshing or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Try again
          </button>
          <a href="/" className="rounded-full border border-border bg-secondary px-5 py-2.5 text-sm font-semibold">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0b0f1c" },
      { title: "Shivkaran — Your YouTube. Smarter." },
      { name: "description", content: "Discover, watch, listen, and understand YouTube with AI summaries, smart queues and a personal library." },
      { property: "og:title", content: "Shivkaran — Your YouTube. Smarter." },
      { property: "og:description", content: "Discover, watch, listen, and understand YouTube with AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://i.ytimg.com" },
      { rel: "preconnect", href: "https://www.youtube.com" },
      { rel: "preconnect", href: "https://www.google.com" },
      { rel: "preload", href: "https://www.youtube.com/iframe_api", as: "script" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function Aurora() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="animate-orb absolute -left-32 -top-40 h-[520px] w-[520px] rounded-full bg-primary/20 blur-[120px]" />
      <div className="animate-orb-reverse absolute -right-40 top-1/3 h-[560px] w-[560px] rounded-full bg-accent/15 blur-[130px]" />
      <div className="animate-orb absolute bottom-0 left-1/4 h-[440px] w-[440px] rounded-full bg-coral/10 blur-[130px]" />
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  usePlayerShortcuts();

  useEffect(() => {
    void usePlayer.persist.rehydrate();
    void Promise.resolve(useSettings.persist.rehydrate()).then(() => applyTheme(useSettings.getState().theme));
    const unsubTheme = useSettings.subscribe((st, prev) => { if (st.theme !== prev.theme) applyTheme(st.theme); });
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => { data.subscription.unsubscribe(); unsubTheme(); };
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Aurora />
        <div className="flex">
          <Sidebar />
          <div className="min-w-0 flex-1">
            <TopBar />
            <main className="px-4 pb-48 sm:px-5">
              <Outlet />
            </main>
          </div>
        </div>
        <YouTubeEngine />
        <NowPlaying />
        <PlayerBar />
        <MobileNav />
        <Toaster position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
