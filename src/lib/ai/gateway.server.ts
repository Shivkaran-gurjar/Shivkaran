/** Lovable AI Gateway access (server-only). Kept separate from YouTube logic. */
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from "./run-id.server";

export const AI_MODEL = "openai/gpt-6-astra";
const BASE_URL = "https://ai.gateway.lovable.dev/v1";

export function createAiStream(
  opts: { system: string; messages: ModelMessage[]; request?: Request; effort?: "low" | "medium" },
) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured.");
  const runIdFetch = createLovableAiGatewayRunIdFetch(opts.request ? getLovableAiGatewayRunId(opts.request) : undefined);
  const provider = createOpenAI({
    baseURL: BASE_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const result = streamText({
    model: provider.responses(AI_MODEL),
    system: opts.system,
    messages: opts.messages,
    abortSignal: opts.request?.signal,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: opts.effort ?? "medium",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  return { result, runIdFetch };
}

/** Run a one-shot prompt that must return JSON; streams server-side, parses leniently. */
export async function aiJson<T>(system: string, prompt: string): Promise<T> {
  const { result } = createAiStream({ system, messages: [{ role: "user", content: prompt }], effort: "low" });
  const text = await result.text;
  const match = /\{[\s\S]*\}/.exec(text);
  if (!match) throw new Error("AI returned an unexpected response.");
  return JSON.parse(match[0]) as T;
}

/** Map gateway failures to safe user-facing messages. */
export function aiErrorMessage(e: unknown): { status: number; message: string } {
  const err = e as { statusCode?: number; status?: number; message?: string };
  const status = err.statusCode ?? err.status ?? 500;
  if (status === 402) return { status, message: "AI credits are used up for this workspace. Add credits to continue." };
  if (status === 429) return { status, message: "Shivkaran is a bit busy. Please try again in a moment." };
  if (status === 403) return { status, message: "AI access is currently unavailable for this workspace." };
  return { status: 500, message: "The AI couldn't respond right now. Please try again." };
}
