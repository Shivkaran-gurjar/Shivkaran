import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({
  videoId: z.string().regex(/^[\w-]{11}$/),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(8000) }))
    .min(1)
    .max(20),
});

async function verifyUser(request: Request): Promise<boolean> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.auth.getUser(auth.slice(7));
  return !error && !!data.user;
}

export const Route = createFileRoute("/api/ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await verifyUser(request))) {
          return Response.json({ error: "Sign in to use Ask Shivkaran." }, { status: 401 });
        }
        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });

        const { getVideo } = await import("@/lib/youtube.server");
        const { buildVideoContext, systemPromptFor } = await import("@/lib/ai/prompts");
        const { createAiStream, aiErrorMessage } = await import("@/lib/ai/gateway.server");
        const { withLovableAiGatewayRunIdHeader } = await import("@/lib/ai/run-id.server");

        try {
          // Context is fetched server-side from YouTube — never trusted from the client.
          const video = await getVideo(parsed.data.videoId);
          if (!video) return Response.json({ error: "Video not found." }, { status: 404 });
          const ctx = buildVideoContext(video);
          const { result, runIdFetch } = createAiStream({
            system: systemPromptFor(ctx),
            messages: parsed.data.messages,
            request,
          });
          return withLovableAiGatewayRunIdHeader(result.toTextStreamResponse(), runIdFetch);
        } catch (e) {
          console.error("AI route failed", e);
          const { status, message } = aiErrorMessage(e);
          return Response.json({ error: message }, { status });
        }
      },
    },
  },
});
