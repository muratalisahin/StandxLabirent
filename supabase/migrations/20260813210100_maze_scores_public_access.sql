-- Run this in project veklqzdrxtogmyxjdpib SQL Editor.

ALTER TABLE public.maze_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view maze scores" ON public.maze_scores;
CREATE POLICY "Anyone can view maze scores"
  ON public.maze_scores FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can submit maze scores" ON public.maze_scores;
CREATE POLICY "Anyone can submit maze scores"
  ON public.maze_scores FOR INSERT
  TO anon, authenticated
  WITH CHECK (char_length(name) BETWEEN 1 AND 15 AND score >= 0);
