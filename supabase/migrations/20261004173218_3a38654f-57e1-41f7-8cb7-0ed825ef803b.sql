CREATE TABLE public.ai_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  video_title TEXT NOT NULL DEFAULT '',
  label TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_notes TO authenticated;
GRANT ALL ON public.ai_notes TO service_role;
ALTER TABLE public.ai_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notes" ON public.ai_notes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX ai_notes_user_idx ON public.ai_notes(user_id, created_at DESC);