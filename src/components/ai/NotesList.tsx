import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Copy, NotebookPen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/common/States";
import { Markdown } from "./Markdown";

/** Saved "Ask Shiva.AI" answers. RLS scopes rows to the signed-in user. */
export function NotesList() {
  const qc = useQueryClient();
  const notes = useQuery({
    queryKey: ["ai_notes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_notes").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ai_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai_notes"] }),
    onError: () => toast.error("Couldn't delete note"),
  });

  if (notes.isLoading) return <div className="skeleton h-40 rounded-[22px]" />;
  if (!notes.data?.length)
    return <EmptyState icon={<NotebookPen className="size-5" />} title="No AI notes yet" body="Press “Save note” under any answer in the AI panel on a video." />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {notes.data.map((n) => (
        <article key={n.id} className="glass flex flex-col rounded-[22px] p-5">
          <div className="flex items-start gap-3">
            <img src={`https://i.ytimg.com/vi/${n.video_id}/mqdefault.jpg`} alt="" loading="lazy" className="aspect-video w-24 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <Link to="/watch/$videoId" params={{ videoId: n.video_id }} className="line-clamp-2 font-display text-[14px] font-semibold hover:text-primary">
                {n.video_title || "Video"}
              </Link>
              <p className="mt-1 text-[11px] text-muted-foreground">{n.label ? `${n.label} · ` : ""}{new Date(n.created_at).toLocaleDateString()}</p>
            </div>
            <button onClick={() => { navigator.clipboard?.writeText(n.content); toast.success("Copied"); }} aria-label="Copy note" className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-surface-strong hover:text-foreground"><Copy className="size-3.5" /></button>
            <button onClick={() => del.mutate(n.id)} aria-label="Delete note" className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-surface-strong hover:text-destructive"><Trash2 className="size-3.5" /></button>
          </div>
          <div className="mt-3 max-h-72 overflow-y-auto text-[13px] leading-relaxed"><Markdown text={n.content} /></div>
        </article>
      ))}
    </div>
  );
}
