import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUp, BookmarkPlus, Copy, Info, Loader2, Square } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AI_ACTIONS, type AiAction } from "@/lib/ai/prompts";
import { LogoMark } from "@/components/layout/Logo";
import { Markdown } from "./Markdown";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
  label?: string;
}

const QUICK: { key: AiAction; label: string }[] = [
  { key: "summary", label: "Summarize" },
  { key: "keypoints", label: "Key points" },
  { key: "simple", label: "Explain simply" },
  { key: "concepts", label: "Hard concepts" },
  { key: "notes", label: "Notes" },
  { key: "quiz", label: "Quiz me" },
  { key: "flashcards", label: "Flashcards" },
  { key: "chapters", label: "Topics" },
  { key: "takeaways", label: "Takeaways" },
  { key: "translate", label: "In Hindi" },
];

export function AskPanel({ videoId, videoTitle, initialAction, className }: { videoId: string; videoTitle?: string; initialAction?: AiAction; className?: string }) {
  const { user, loading } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    setMsgs([]);
    abortRef.current?.abort();
  }, [videoId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [msgs]);

  const send = async (content: string, label?: string) => {
    if (busy || !content.trim()) return;
    const history = [...msgs, { role: "user" as const, content, label }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
        body: JSON.stringify({ videoId, messages: history.slice(-12).map(({ role, content: c }) => ({ role, content: c })) }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Something went wrong.");
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: acc }]);
      }
      if (!acc.trim()) throw new Error("No answer was returned for this request.");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      const message = (e as Error).message;
      setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: `⚠️ ${message}` }]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!user || !initialAction || firedRef.current === videoId + initialAction) return;
    firedRef.current = videoId + initialAction;
    const q = QUICK.find((x) => x.key === initialAction);
    void send(AI_ACTIONS[initialAction], q?.label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, initialAction, videoId]);

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    toast.success("Copied");
  };
  const saveNote = async (text: string, label?: string) => {
    if (!user) return;
    const { error } = await supabase.from("ai_notes").insert({ user_id: user.id, video_id: videoId, video_title: (videoTitle ?? "").slice(0, 300), label: label ?? null, content: text.slice(0, 20000) });
    if (error) toast.error("Couldn't save note");
    else toast.success("Saved to Library → Notes");
  };

  return (
    <section className={cn("glass flex flex-col rounded-[26px] p-5", className)} aria-label="Ask Shivkaran">
      <div className="flex items-center gap-2">
        <LogoMark size="sm" />
        <h2 className="font-display text-[15px] font-semibold">Ask Shivkaran</h2>
      </div>
      <p className="mt-3 flex items-start gap-2 rounded-xl bg-secondary px-3 py-2 text-[12px] text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Transcript unavailable — answers use the title, description and chapters.
      </p>

      {!loading && !user ? (
        <div className="mt-4 rounded-2xl border border-border bg-secondary p-4 text-sm text-muted-foreground">
          <Link to="/auth" className="font-semibold text-primary">Sign in</Link> to summarize, quiz and ask questions about this video.
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button key={q.key} disabled={busy} onClick={() => send(AI_ACTIONS[q.key], q.label)} className="rounded-full bg-secondary px-3 py-1.5 text-[12px] font-semibold transition-colors hover:bg-surface-strong disabled:opacity-50">
                {q.label}
              </button>
            ))}
          </div>

          <div className="mt-4 max-h-[52vh] min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="ml-8 rounded-2xl bg-primary px-4 py-2.5 text-[13px] font-medium text-primary-foreground">
                  {m.label ?? m.content}
                </div>
              ) : (
                <div key={i} className="group text-[13px] leading-relaxed">
                  {m.content ? <Markdown text={m.content} /> : <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-3.5 animate-spin" /> Thinking…</span>}
                  {m.content && !(busy && i === msgs.length - 1) && (
                    <div className="mt-2 flex gap-2 opacity-60 transition-opacity group-hover:opacity-100">
                      <button onClick={() => copy(m.content)} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                        <Copy className="size-3" /> Copy
                      </button>
                      <button onClick={() => saveNote(m.content, msgs[i - 1]?.label ?? msgs[i - 1]?.content.slice(0, 80))} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
                        <BookmarkPlus className="size-3" /> Save note
                      </button>
                    </div>
                  )}
                </div>
              ),
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="mt-4 flex items-center gap-2 rounded-2xl border border-border bg-secondary p-2 pl-3"
          >
            <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={2000} placeholder="Ask anything about this video…" className="min-w-0 flex-1 bg-transparent text-[13px] placeholder:text-muted-foreground focus:outline-none" aria-label="Ask a question" />
            {busy ? (
              <button type="button" onClick={() => abortRef.current?.abort()} aria-label="Stop" className="grid size-8 place-items-center rounded-full bg-surface-strong">
                <Square className="size-3 fill-current" />
              </button>
            ) : (
              <button aria-label="Send" disabled={!input.trim()} className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50">
                <ArrowUp className="size-4" />
              </button>
            )}
          </form>
        </>
      )}
    </section>
  );
}
